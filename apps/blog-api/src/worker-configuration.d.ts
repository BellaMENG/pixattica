declare namespace Cloudflare {
    interface Env {
        ADMIN_PASSWORD?: string;
        CORS_ORIGINS?: string;
        DB: D1Database;
        SEED_PLACEHOLDER?: string;
        SESSION_COOKIE_NAME?: string;
        SESSION_SECRET?: string;
    }
}
