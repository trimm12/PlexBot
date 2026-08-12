import 'dotenv/config';
import { Client, GatewayIntentBits, type SendableChannels } from "discord.js";
import { registerEvents } from "./events.js";
import { loadConfig } from "./config.js";

let isChecking: boolean = false;
let successesInARow = 0;
let failuresInARow = 0;
type State = "ONLINE" | "OFFLINE" | null;
let lastState: State = null;

const PREFIX = "!";
const OWNER_IDS = (process.env.OWNER_IDS ?? process.env.OWNER_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

async function main() {
    const token = process.env.DISCORD_TOKEN;
    const channelID = process.env.DISCORD_CHANNEL_ID;

    if (!token) throw new Error("DISCORD_TOKEN is missing in .env");
    if (!channelID) throw new Error("DISCORD_CHANNEL_ID is missing in .env");

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    registerEvents({
        client,
        channelId: channelID,
        prefix: PREFIX,
        ownerIds: OWNER_IDS,
        onReady: async (sendChannel: SendableChannels) => {
            await compareStates(sendChannel);
            setInterval(async () => {
                await compareStates(sendChannel);
            }, getPollingValue());
        }
    });

    await client.login(token);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

function getPollingValue() {
    let num = Number(process.env.POLL_INTERVAL_SECONDS);

    if ((num === undefined) || (!num)) {
        num = 30;
    }

    return num * 1000;
}

async function checkPlex(): Promise<boolean> {
    const url = (process.env.PLEX_URL + "/identity");
    const signal = AbortSignal.timeout(5000);

    try {
        await fetch(url, { signal });
        return true;
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === "TimeoutError") {
                console.log("ERROR! -> Timeout Error.");
            } else {
                console.log("ERROR! -> Could not reach Plex.");
            }
        }
        return false;
    }
}

async function pollPlex() {
    let declared: State = null;

    if (isChecking) {
        return declared;
    }

    try {
        isChecking = true;
        let result = await checkPlex();

        if (result) {
            successesInARow += 1;
            failuresInARow = 0;
        } else {
            successesInARow = 0;
            failuresInARow += 1;
        }

        if (successesInARow >= 1) declared = "ONLINE";
        if (failuresInARow >= 2) declared = "OFFLINE";

        return declared;
    } finally {
        isChecking = false;
    }
}

async function compareStates(channel: SendableChannels): Promise<State> {
    let result = await pollPlex();

    if (result === null) {
        return lastState;
    }

    if (result !== lastState) {
        lastState = result;

        const cfg = loadConfig();
        if (!cfg.statusPingsEnabled) return lastState;

        await channel.send("Plex Server is " + lastState);
    }

    return lastState;
}