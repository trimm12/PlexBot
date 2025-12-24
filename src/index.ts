import 'dotenv/config';
import { Client, GatewayIntentBits, type SendableChannels, type SendableChannelTypes, type TextBasedChannel } from "discord.js";
import { startWebhookListener } from "./webhookListener"

// console.log("DISCORD_TOKEN set:", process.env.DISCORD_TOKEN ? "yes" : "no");
// console.log("DISCORD_CHANNEL_ID set:", process.env.DISCORD_CHANNEL_ID ? "yes" : "no");
// console.log("PLEX_URL:", process.env.PLEX_URL);
// console.log("POLL_INTERVAL_SECONDS:", process.env.POLL_INTERVAL_SECONDS);

    let isChecking: boolean = false;
    let successesInARow = 0;
    let failuresInARow = 0;
    type State = "ONLINE" | "OFFLINE" | null;
    let lastState: State = null;

async function main() {
    const token = process.env.DISCORD_TOKEN;
    const channelID = process.env.DISCORD_CHANNEL_ID;

    if (!token) throw new Error("DISCORD_TOKEN is missing in .env");
    if (!channelID) throw new Error("DISCORD_CHANNEL_ID is missing in .env");

    startWebhookListener();


    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    client.once("clientReady", async () => {
        try {
            console.log("Logged in as:", client.user?.tag);

            const channel = await client.channels.fetch(channelID);

            if (!channel) throw new Error("Channel not found. Check DISCORD_CHANNEL_ID.");
            if (!channel.isTextBased()) throw new Error("That channel is not a text-based channel.");

            if (!("send" in channel)) throw new Error("Channel cannot receive messages.");

            await compareStates(channel);
            setInterval(async () => {
                await compareStates(channel);
            }, 30000);

        }   catch(err) {
            console.error("Failed to send message:", err);
            await client.destroy();
            process.exit(1);
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

    let num_ms = num * 1000;

    return num_ms;
}

async function checkPlex() {

    const url = (process.env.PLEX_URL + "/identity");
    const signal = AbortSignal.timeout(5000);

    try {
        const response = await fetch(url, {signal});
        return true;

    } catch(err) {
        if (err instanceof Error) {
            console.log(err);
            if (err.name === "TimeoutError") {
                console.log("ERROR! -> Timeout Error.");
                return false;
            } else {
                console.log("ERROR! -> Could not reach Plex.");
                return false;
            }
        }
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
        await channel.send(lastState);

    }

    return lastState;

}



