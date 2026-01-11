import type { Message } from "discord.js";
import * as status from "./status.js"

type Command = {
    name: string;
    help: string;
    run: (msg: Message, args: string[], ownerId: string) => Promise<void>;
};

const commands: Record<string, Command> = {
    [status.name]: status

};

export async function handleCommand(
    msg: Message,
    prefix: string,
    ownerId: string
) {
    if (!msg.content.startsWith(prefix)) return;
    
    const withoutPrefix = msg.content.slice(prefix.length).trim();
    const [cmdName, ...args] = withoutPrefix.split(/\s+/);

    if (!cmdName) return;

    const command = commands[cmdName?.toLowerCase()];
    if (!command) return;

    await command.run(msg, args, ownerId);
    
}