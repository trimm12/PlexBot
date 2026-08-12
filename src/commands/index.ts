import type { Message } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Command = {
    name: string;
    help: string;
    ownerOnly?: boolean;
    run: (msg: Message, args: string[], ownerIds: string[]) => Promise<void>;
};

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

let commands: Record<string, Command> | null = null;

async function loadCommands(): Promise<Record<string, Command>> {
    const loaded: Record<string, Command> = {};

    async function scan(currentDir: string, importPrefix: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                await scan(path.join(currentDir, entry.name), `${importPrefix}${entry.name}/`);
                continue;
            }

            const file = entry.name;

            if (path.join(currentDir, file) === filename) continue;
            if (file.endsWith(".d.ts")) continue;
            if (!(file.endsWith(".ts") || file.endsWith(".js"))) continue;

            const mod = await import(`./${importPrefix}${file}`) as Partial<Command>;

            if (!mod.name || !mod.run) {
                console.warn(`[commands] Skipping ${importPrefix}${file} — missing "name" or "run" export.`);
                continue;
            }

            loaded[mod.name] = mod as Command;
        }
    }

    await scan(dirname, "");

    return loaded;
}

export async function handleCommand(
    msg: Message,
    prefix: string,
    ownerIds: string[]
) {
    if (!msg.content.startsWith(prefix)) return;

    if (!commands) commands = await loadCommands();

    const withoutPrefix = msg.content.slice(prefix.length).trim();
    const [cmdName, ...args] = withoutPrefix.split(/\s+/);

    if (!cmdName) return;

    const command = commands[cmdName.toLowerCase()];
    if (!command) return;

    if (command.ownerOnly && !ownerIds.includes(msg.author.id)) {
        await msg.reply("You don't have permissions to use this command.");
        return;
    }

    await command.run(msg, args, ownerIds);
}