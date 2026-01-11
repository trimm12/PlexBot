import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type BotConfig = {
    statusPingsEnabled: boolean;
}

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const config_path = path.join(dirname, "bot-config.json");

const default_config: BotConfig = {
    statusPingsEnabled: true
};

export function loadConfig(): BotConfig {
    try {
        if (!fs.existsSync(config_path)) return {...default_config};
        return {...default_config, ...JSON.parse(fs.readFileSync(config_path, "utf-8"))};
    } catch {
        return {...default_config};
    }
}

export function saveConfig(cfg: BotConfig) {
    fs.writeFileSync(config_path, JSON.stringify(cfg, null, 2), "utf-8");
}