const idle_ms = 90000
const hard_cap_ms = 600000

let idleTimer: NodeJS.Timeout | null = null;
let hardCapTimer: NodeJS.Timeout | null = null;

let isFlushing: boolean = false;
let batchOpen: boolean = false;
let batchStartedAt = 0;

let moviesByKey = new Map<string, {ratingKey: string, title: string, type: "movie"}>();
let episodesByKey = new Map<string, {ratingKey: string, title: string, type: "episode", showTitle: string, seasonNumber: number, episodeNumber: number}>();
let showsByKey = new Map<string, { ratingKey: string, title: string, type: "show", leafCount: number}>();

let sendFn: ((msg: string) => Promise<void>) | null = null;

export function setBatchSender(fn: (msg: string) => Promise<void>) {
    sendFn = fn;
}

export function onLibraryNew(metadata: any) {

    console.log("Running onLibraryNew Function");

    console.log("[onLibraryNew] received:", "type=", metadata?.type, "| ratingKey=", metadata?.ratingKey, "| title=", metadata?.title);

   if (!metadata.ratingKey) {
    return;
   }

   if ((metadata.type !== "movie") && (metadata.type !== "episode") && (metadata.type !== "show")) {
     console.log("[onLibraryNew] ignored type ->", metadata.type);
    return;
   }

       startBatchIfNeeded();

   if (metadata.type === "movie") {
    const ratingKey = metadata.ratingKey;
        
    if (moviesByKey.has(ratingKey)) {
        console.log("[onLibraryNew] Found same Movie Rating Key");
        resetIdleTimer();
        return;
    }

     moviesByKey.set(ratingKey, {
        ratingKey,
        title: metadata.title,
        type: "movie"
    });

    console.log("[onLibraryNew] Movie size: " + moviesByKey.size);
   } 
   
   if (metadata.type === "episode") {
    const ratingKey = metadata.ratingKey;

    if (episodesByKey.has(ratingKey)) {
        console.log("[onLibraryNew] Found same Episode Rating Key");
        resetIdleTimer();
        return;
    }

    episodesByKey.set(ratingKey, {
        ratingKey,
        title: metadata.title,
        type: "episode",
        showTitle: metadata.grandparentTitle,
        seasonNumber: metadata.parentIndex,
        episodeNumber: metadata.index
    });

    console.log("[onLibraryNew] Episode size: " + episodesByKey.size);
   }

   if (metadata.type === "show") {
    const ratingKey = metadata.ratingKey;

    if (showsByKey.has(ratingKey)) {
        console.log("[onLibraryNew] duplicate SHOW ratingKey ->", ratingKey);
        resetIdleTimer();
        return;
    }

    showsByKey.set(ratingKey, {
        ratingKey,
        title: metadata.title,
        type: "show",
        leafCount: metadata.leafCount
    });

    console.log("[onLibraryNew] Show size: ", showsByKey.size);
   }

   resetIdleTimer();

}

function startBatchIfNeeded() {

    if (batchOpen) {
        return;
    }

    batchOpen = true;
    batchStartedAt = Date.now();

    hardCapTimer = setTimeout(onHardCapTimerFinished, hard_cap_ms)

    console.log("[batch] opened. hard cap scheduled for", hard_cap_ms, "ms");

}

function resetIdleTimer() {

    if (idleTimer != null) {
        clearTimeout(idleTimer);
        idleTimer = null;
        console.log("[timer] idle timer cleared/reset");
    }

    idleTimer = setTimeout(onIdleTimerFinished, idle_ms);
    console.log("[timer] idle timer scheduled for", idle_ms, "ms");
}

function onIdleTimerFinished() {

    console.log("[timer] idle timer fired");

        idleTimer = null;
        flush();

}

function onHardCapTimerFinished() {

    hardCapTimer = null;
    flush();
}

async function flush() {

    if ((!batchOpen) || (isFlushing)) {
        return;
    }

    console.log("[flush] FLUSH CALLED");

    isFlushing = true;

    try {
        if (idleTimer != null) {
        clearTimeout(idleTimer);
    }

    if (hardCapTimer != null) {
        clearTimeout(hardCapTimer);
    }

    console.log("[flush] Movies flushed:", moviesByKey.size, "Episodes flushed:", episodesByKey.size, "Shows flushed:", showsByKey.size);

    const msg = createMessage();
    if (sendFn && msg.trim()) {
        await sendFn(msg);
    }

    } catch (err) {
        console.log(err);

    } finally {
        hardCapTimer = null;
        idleTimer = null;
        batchOpen = false;
        batchStartedAt = 0;
        moviesByKey.clear();
        episodesByKey.clear();
        showsByKey.clear();
        isFlushing = false;
    }
}

function createMessage() {

    let finalMessage: string = "Added the following to Plex:\n"
    let finalShowMsg: string = ""
    let finalMovieMsg: string = ""

    if (moviesByKey.size > 0) {

        let movieMessage: string = ("\nMovies:\n")
        
        moviesByKey.forEach((movie, ratingKey) => {
            movieMessage = (movieMessage + movie.title + "\n")
        })

        finalMovieMsg = movieMessage;

        }

    if ((episodesByKey.size > 0) || (showsByKey.size > 0)) {

        let showMessage: string = "\nShows:\n"

        if (showsByKey.size > 0) {

            showsByKey.forEach((show, ratingKey) => {
                showMessage = (showMessage + show.title + " (Total Episode Count: " + show.leafCount + ")\n");
            })
        }

        if (episodesByKey.size > 0) {

            episodesByKey.forEach((episode, ratingKey) => {

                showMessage = showMessage + "Added S" + String(episode.seasonNumber).padStart(2, "0") + "E" + String(episode.episodeNumber).padStart(2, "0") + " of " + episode.showTitle + "\n";
            })
        }

        finalShowMsg = showMessage;

    }

    finalMessage = (finalMessage + finalMovieMsg + finalShowMsg);

    return finalMessage;

    }