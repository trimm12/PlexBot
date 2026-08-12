import type { Message } from "discord.js";
import { loadConfig, saveConfig } from "../config.js";

export const name = "status";
export const help = "!status [on | off]";
export const ownerOnly = true;

export async function run(
    msg: Message,
    args: string[],
    ownerIds: string[]
) {
    if (msg.author.bot) return;

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