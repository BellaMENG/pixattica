export type BlogApiConfig = {
    adminPassword: string;
    cookieName: string;
    corsOrigins: string[];
    databaseUrl: string;
    host: string;
    port: number;
    seedPlaceholder: boolean;
    sessionSecret: string;
};

const DEFAULT_CORS_ORIGINS = [
    "http://localhost:4177",
    "http://127.0.0.1:4177",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

function parsePort(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
    if (!value) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (["0", "false", "no"].includes(normalized)) {
        return false;
    }

    if (["1", "true", "yes"].includes(normalized)) {
        return true;
    }

    return fallback;
}

function parseCorsOrigins(value: string | undefined) {
    if (!value) {
        return DEFAULT_CORS_ORIGINS;
    }

    return value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BlogApiConfig {
    return {
        adminPassword: env.ADMIN_PASSWORD ?? "change-me",
        cookieName: env.SESSION_COOKIE_NAME ?? "pixattica_blog_admin",
        corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
        databaseUrl: env.DATABASE_URL ?? "./data/blog.sqlite",
        host: env.HOST ?? "0.0.0.0",
        port: parsePort(env.PORT, 4176),
        seedPlaceholder: parseBoolean(env.SEED_PLACEHOLDER, true),
        sessionSecret: env.SESSION_SECRET ?? "change-me-too",
    };
}

export function resolveConfig(
    overrides: Partial<BlogApiConfig> = {},
    env: NodeJS.ProcessEnv = process.env,
): BlogApiConfig {
    const baseConfig = loadConfig(env);
    return {
        ...baseConfig,
        ...overrides,
        corsOrigins: overrides.corsOrigins ?? baseConfig.corsOrigins,
    };
}
