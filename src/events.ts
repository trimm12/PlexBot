import type { Client, SendableChannels } from "discord.js";
import { handleCommand } from "./commands/index.js";
import { setBatchSender } from "./batch.js";
import { startWebhookListener } from "./webhookListener.js";

type RegisterEventsOptions = {
    client: Client;
    channelId: string;
    prefix: string;
    ownerIds: string[];
    onReady: (channel: SendableChannels) => Promise<void>;
};

export function registerEvents(opts: RegisterEventsOptions) {
    const { client, channelId, prefix, ownerIds, onReady } = opts;

    client.once("clientReady", async () => {
        try {
            console.log("Logged in as:", client.user?.tag);

            const channel = await client.channels.fetch(channelId);

            if (!channel) throw new Error("Channel not found. Check DISCORD_CHANNEL_ID.");
            if (!channel.isTextBased()) throw new Error("That channel is not a text-based channel.");
            if (!("send" in channel)) throw new Error("Channel cannot receive messages.");

            const sendChannel = channel as SendableChannels;

            client.on("messageCreate", async (msg) => {
                await handleCommand(msg, prefix, ownerIds);
            });

            setBatchSender(async (msg: string) => {
                await sendChannel.send(msg);
            });

            startWebhookListener();

            await onReady(sendChannel);
        } catch (err) {
            console.error("Failed to initialise bot:", err);
            await client.destroy();
            process.exit(1);
        }
    });
}