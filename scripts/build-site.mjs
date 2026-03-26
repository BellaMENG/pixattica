import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const landingDistDir = resolve(rootDir, "apps/landing/dist");
const readingDistDir = resolve(rootDir, "apps/reading/dist");
const siteDistDir = resolve(rootDir, "dist");

function copyDirectoryContents(sourceDir, destinationDir) {
    mkdirSync(destinationDir, { recursive: true });

    for (const entry of readdirSync(sourceDir)) {
        cpSync(resolve(sourceDir, entry), resolve(destinationDir, entry), {
            recursive: true,
        });
    }
}

if (!existsSync(landingDistDir)) {
    throw new Error(`Landing build output not found: ${landingDistDir}`);
}

if (!existsSync(readingDistDir)) {
    throw new Error(`Reading build output not found: ${readingDistDir}`);
}

rmSync(siteDistDir, { force: true, recursive: true });
mkdirSync(siteDistDir, { recursive: true });

copyDirectoryContents(landingDistDir, siteDistDir);
copyDirectoryContents(readingDistDir, resolve(siteDistDir, "reading"));

console.log("Assembled Cloudflare site output in ./dist");
