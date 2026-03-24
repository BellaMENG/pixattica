export type CloudflareBindings = {
    ADMIN_PASSWORD?: string;
    CORS_ORIGINS?: string;
    DB: D1Database;
    SEED_PLACEHOLDER?: string;
    SESSION_COOKIE_NAME?: string;
    SESSION_SECRET?: string;
};

export type BlogApiConfig = {
    adminPassword: string;
    cookieName: string;
    corsOrigins: string[];
    seedPlaceholder: boolean;
    sessionSecret: string;
};

const DEFAULT_CORS_ORIGINS = [
    "http://localhost:4177",
    "http://127.0.0.1:4177",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

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

export function loadConfig(env: CloudflareBindings): BlogApiConfig {
    return {
        adminPassword: env.ADMIN_PASSWORD ?? "change-me",
        cookieName: env.SESSION_COOKIE_NAME ?? "pixattica_blog_admin",
        corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
        seedPlaceholder: parseBoolean(env.SEED_PLACEHOLDER, true),
        sessionSecret: env.SESSION_SECRET ?? "change-me-too",
    };
}
