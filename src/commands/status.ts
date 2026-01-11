import type { Message } from "discord.js";
import { loadConfig, saveConfig } from "../config.js";

export const name = "status";
export const help = "!status [on | off]";

export async function run(
    msg: Message,
    args: string[],
    ownerId: string
) {
    if (msg.author.bot) return;

    if (msg.author.id !== ownerId) {
        await msg.reply("You don't have permissions to use this command.");
        return;
    }

    const cfg = loadConfig();
    const arg = (args[0] ?? "status").toLowerCase();

    if (arg === "on") {
        cfg.statusPingsEnabled = true;
        saveConfig(cfg);
        await msg.reply("Status pings are now ON.");
        return;
    }

    if (arg === "off") {
        cfg.statusPingsEnabled = false;
        saveConfig(cfg);
        await msg.reply("Status pings are now OFF.")
        return;
    }

    await msg.reply("Status pings are currently " + (cfg.statusPingsEnabled ? "ON" : "OFF") + ".");
}