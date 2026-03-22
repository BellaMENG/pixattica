import { loadBlogApiEnv } from "./env.js";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

loadBlogApiEnv();

const config = loadConfig(process.env);
const app = buildApp({ config });

try {
    await app.listen({
        host: config.host,
        port: config.port,
    });
} catch (error) {
    app.log.error(error);
    process.exit(1);
}
