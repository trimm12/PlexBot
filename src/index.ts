import 'dotenv/config';
import { Client, GatewayIntentBits } from "discord.js";

// console.log("DISCORD_TOKEN set:", process.env.DISCORD_TOKEN ? "yes" : "no");
// console.log("DISCORD_CHANNEL_ID set:", process.env.DISCORD_CHANNEL_ID ? "yes" : "no");
// console.log("PLEX_URL:", process.env.PLEX_URL);
// console.log("POLL_INTERVAL_SECONDS:", process.env.POLL_INTERVAL_SECONDS);

async function main() {
    const token = process.env.DISCORD_TOKEN;
    const channelID = process.env.DISCORD_CHANNEL_ID;

    if (!token) throw new Error("DISCORD_TOKEN is missing in .env");
    if (!channelID) throw new Error("DISCORD_CHANNEL_ID is missing in .env");


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

            await channel.send("✅ Bot test message: I’m online and can send messages!");
            console.log("Message sent successfully.");


        }   catch(err) {
            console.error("Failed to send message:", err);
            await client.destroy();
            process.exit(1);
        }
        });

        await client.login(token);

        await checkPlex();
        }

main().catch((err) => {
    console.error(err);
    process.exit(1);
});


function getPollingValue() {
    var num = Number(process.env.POLL_INTERVAL_SECONDS);

    if ((num == undefined) || (!num)) {
        num = 30;
    }

    var num_ms = num * 1000;

    return num_ms;
}

async function checkPlex() {

    const url = (process.env.PLEX_URL + "/identity");

    try {
        await fetch(url);
        console.log("reached this line");
        return true;
    } catch {
        console.log("didbnt work");
        return false;
    }

}

