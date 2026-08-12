import { EmbedBuilder } from "discord.js";
import type { PlexRequest } from "./requests.js";

const COLOR_SUCCESS = 0x57F287; // green
const COLOR_FAILURE = 0xED4245; // red
const COLOR_APPROVED = 0x5865F2; // blurple
const COLOR_DENIED = 0xED4245; // red
const COLOR_ADDED = 0x57F287; // green

export function buildRequestSubmittedEmbed(request: PlexRequest): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setTitle("Request submitted")
        .setDescription(`**${request.title}** was sent to the server owner.`)
        .setFooter({ text: `ID: ${request._id?.toString() ?? "unknown"}` })
        .setTimestamp();
}

export function buildRequestFailedEmbed(title: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLOR_FAILURE)
        .setTitle("Request failed")
        .setDescription(`Something went wrong submitting **${title}**. Try again in a bit.`)
        .setTimestamp();
}

export function buildOwnerNotificationEmbed(request: PlexRequest): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setTitle("New Plex request")
        .addFields(
            { name: "Title", value: request.title },
            { name: "Requested by", value: request.requestedByTag }
        )
        .setFooter({ text: `ID: ${request._id?.toString() ?? "unknown"}` })
        .setTimestamp();
}

export function buildRequestReviewedEmbed(request: PlexRequest): EmbedBuilder {
    const approved = request.status === "approved";

    const embed = new EmbedBuilder()
        .setColor(approved ? COLOR_APPROVED : COLOR_DENIED)
        .setTitle(approved ? "Request approved" : "Request denied")
        .setDescription(`Your request for **${request.title}** was ${approved ? "approved" : "denied"}.`)
        .setTimestamp();

    if (request.reason) {
        embed.addFields({ name: "Reason", value: request.reason });
    }

    return embed;
}

export function buildRequestCompletedEmbed(request: PlexRequest): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(COLOR_ADDED)
        .setTitle("Request added to Plex")
        .setDescription(`**${request.title}** is now available on Plex 🎬`)
        .setTimestamp();

    if (request.reason) {
        embed.addFields({ name: "Note", value: request.reason });
    }

    return embed;
}