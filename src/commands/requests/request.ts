import type { Message } from "discord.js";
import { createRequest } from "../../requests.js";
import { buildRequestSubmittedEmbed, buildRequestFailedEmbed, buildOwnerNotificationEmbed } from "../../embeds.js";

export const name = "request";
export const help = "!request <title> — request a film or show to be added to Plex";
export const ownerOnly = false;

export async function run(
    msg: Message,
    args: string[],
    ownerIds: string[]
) {
    if (msg.author.bot) return;

    const title = args.join(" ").trim();

    if (!title) {
        await msg.reply("Usage: `!request <title>` — e.g. `!request Dune Part Two`");
        return;
    }

    try {
        const request = await createRequest(title, msg.author.id, msg.author.tag);

        await msg.reply({ embeds: [buildRequestSubmittedEmbed(request)] });

        await Promise.all(ownerIds.map(async (ownerId) => {
            try {
                const owner = await msg.client.users.fetch(ownerId);
                await owner.send({ embeds: [buildOwnerNotificationEmbed(request)] });
            } catch (err) {
                console.error(`[request] Failed to DM owner ${ownerId}:`, err);
            }
        }));
    } catch (err) {
        console.error("[request] Failed to save request:", err);
        await msg.reply({ embeds: [buildRequestFailedEmbed(title)] });
    }
}