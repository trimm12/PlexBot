import type { Message } from "discord.js";
import { getRequestById, updateRequestStatus } from "../../requests.js";
import { buildRequestReviewedEmbed } from "../../embeds.js";

export const name = "deny";
export const help = "!deny <requestId> [reason] — deny a pending Plex request, optionally with a reason";
export const ownerOnly = true;

export async function run(
    msg: Message,
    args: string[],
    ownerIds: string[]
) {
    const [id, ...reasonParts] = args;
    const reason = reasonParts.join(" ").trim() || undefined;

    if (!id) {
        await msg.reply("Usage: `!deny <requestId> [reason]`");
        return;
    }

    const existing = await getRequestById(id);
    if (!existing) {
        await msg.reply("Couldn't find a request with that ID.");
        return;
    }

    const updated = await updateRequestStatus(id, "denied", msg.author.id, reason);
    if (!updated) {
        await msg.reply("Failed to update that request.");
        return;
    }

    await msg.reply(`Denied **${updated.title}**${reason ? ` — ${reason}` : ""}.`);

    try {
        const requester = await msg.client.users.fetch(updated.requestedBy);
        await requester.send({ embeds: [buildRequestReviewedEmbed(updated)] });
    } catch (err) {
        console.error("[deny] Failed to DM requester:", err);
    }
}