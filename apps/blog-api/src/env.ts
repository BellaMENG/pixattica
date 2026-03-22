import fs from "node:fs";

export function loadBlogApiEnv(envFile: string | URL = new URL("../.env", import.meta.url)) {
    if (!fs.existsSync(envFile)) {
        return;
    }

    process.loadEnvFile(envFile);
}
