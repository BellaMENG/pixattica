import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { loadBlogApiEnv } from "./env.js";

const tempDirectories: string[] = [];

function createEnvFile(contents: string) {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "pixattica-blog-api-env-"));
    tempDirectories.push(tempDirectory);

    const envPath = path.join(tempDirectory, ".env");
    writeFileSync(envPath, contents);

    return pathToFileURL(envPath);
}

afterEach(() => {
    delete process.env.PIXATTICA_TEST_ENV;
    delete process.env.PIXATTICA_TEST_ENV_OVERRIDE;

    while (tempDirectories.length > 0) {
        const tempDirectory = tempDirectories.pop();
        if (tempDirectory) {
            rmSync(tempDirectory, { force: true, recursive: true });
        }
    }
});

describe("loadBlogApiEnv", () => {
    it("loads values from the local env file", () => {
        delete process.env.PIXATTICA_TEST_ENV;

        loadBlogApiEnv(createEnvFile("PIXATTICA_TEST_ENV=loaded-from-file\n"));

        expect(process.env.PIXATTICA_TEST_ENV).toBe("loaded-from-file");
    });

    it("does not override already injected environment variables", () => {
        process.env.PIXATTICA_TEST_ENV_OVERRIDE = "already-set";

        loadBlogApiEnv(createEnvFile("PIXATTICA_TEST_ENV_OVERRIDE=from-file\n"));

        expect(process.env.PIXATTICA_TEST_ENV_OVERRIDE).toBe("already-set");
    });
});
