import type { Message } from "discord.js";
import { getRequestById, updateRequestStatus } from "../../requests.js";
import { buildRequestCompletedEmbed } from "../../embeds.js";

export const name = "complete";
export const help = "!complete <requestId> [note] — mark a request as added to Plex";
export const ownerOnly = true;

export async function run(
    msg: Message,
    args: string[],
    ownerIds: string[]
) {
    const [id, ...noteParts] = args;
    const reason = noteParts.join(" ").trim() || undefined;

    if (!id) {
        await msg.reply("Usage: `!complete <requestId> [note]`");
        return;
    }

    const existing = await getRequestById(id);
    if (!existing) {
        await msg.reply("Couldn't find a request with that ID.");
        return;
    }

    const updated = await updateRequestStatus(id, "added", msg.author.id, reason);
    if (!updated) {
        await msg.reply("Failed to update that request.");
        return;
    }

    await msg.reply(`Marked **${updated.title}** as added.`);

    try {
        const requester = await msg.client.users.fetch(updated.requestedBy);
        await requester.send({ embeds: [buildRequestCompletedEmbed(updated)] });
    } catch (err) {
        console.error("[complete] Failed to DM requester:", err);
    }
}