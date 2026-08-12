import type { Message } from "discord.js";
import { getRequestById, updateRequestStatus } from "../../requests.js";
import { buildRequestReviewedEmbed } from "../../embeds.js";

export const name = "approve";
export const help = "!approve <requestId> — approve a pending Plex request";
export const ownerOnly = true;

export async function run(
    msg: Message,
    args: string[],
    ownerIds: string[]
) {
    const id = args[0];

    if (!id) {
        await msg.reply("Usage: `!approve <requestId>`");
        return;
    }

    const existing = await getRequestById(id);
    if (!existing) {
        await msg.reply("Couldn't find a request with that ID.");
        return;
    }

    const updated = await updateRequestStatus(id, "approved", msg.author.id);
    if (!updated) {
        await msg.reply("Failed to update that request.");
        return;
    }

    await msg.reply(`Approved **${updated.title}**.`);

    try {
        const requester = await msg.client.users.fetch(updated.requestedBy);
        await requester.send({ embeds: [buildRequestReviewedEmbed(updated)] });
    } catch (err) {
        console.error("[approve] Failed to DM requester:", err);
    }
}