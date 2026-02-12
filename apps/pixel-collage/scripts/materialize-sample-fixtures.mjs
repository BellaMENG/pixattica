#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(appRoot, "public");

const args = parseArgs(process.argv.slice(2));
if (args.help) {
    printHelp();
    process.exit(0);
}

const inputPath = args.input
    ? path.resolve(process.cwd(), args.input)
    : path.join(appRoot, "pixel-collage-sample-raw.json");
const outputRoot = args.out
    ? path.resolve(process.cwd(), args.out)
    : path.join(publicRoot, "samples", "default");

const relativeOutput = path.relative(publicRoot, outputRoot);
if (relativeOutput.startsWith("..")) {
    throw new Error(`Output path must be inside ${publicRoot}`);
}

const outputUrlBase = `/${relativeOutput.split(path.sep).join("/")}`;
const imagesDir = path.join(outputRoot, "images");
const cutoutsDir = path.join(outputRoot, "cutouts");
const imagesUrlBase = `${outputUrlBase}/images`;
const cutoutsUrlBase = `${outputUrlBase}/cutouts`;

const rawJson = await fs.readFile(inputPath, "utf8");
const rawData = JSON.parse(rawJson);
assertRawSample(rawData);

await fs.mkdir(imagesDir, { recursive: true });
await fs.mkdir(cutoutsDir, { recursive: true });

const srcMap = new Map();

const uploadedImages = [];
for (const image of rawData.uploadedImages) {
    const preferredExt = extFromFilename(image.name);
    const src = await materializeAsset({
        src: image.src,
        id: image.id,
        outputDir: imagesDir,
        outputUrlBase: imagesUrlBase,
        fallbackExt: preferredExt ?? ".png",
    });
    if (!srcMap.has(image.src)) {
        srcMap.set(image.src, src);
    }
    uploadedImages.push({ ...image, src });
}

const croppedCutouts = [];
for (const cutout of rawData.croppedCutouts) {
    const src = await materializeAsset({
        src: cutout.src,
        id: cutout.id,
        outputDir: cutoutsDir,
        outputUrlBase: cutoutsUrlBase,
        fallbackExt: ".png",
    });
    if (!srcMap.has(cutout.src)) {
        srcMap.set(cutout.src, src);
    }
    croppedCutouts.push({ ...cutout, src });
}

const canvasItems = rawData.canvasItems.map((item) =>
    item.type === "image" ? { ...item, src: srcMap.get(item.src) ?? item.src } : item,
);

const manifest = {
    version: typeof rawData.version === "number" ? rawData.version : 1,
    selectedBgId: rawData.selectedBgId ?? "hearts",
    uploadedImages,
    croppedCutouts,
    canvasItems,
};

const manifestPath = path.join(outputRoot, "manifest.json");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Input: ${inputPath}`);
console.log(`Output: ${outputRoot}`);
console.log(`Manifest: ${manifestPath}`);
console.log(`Uploaded images: ${uploadedImages.length}`);
console.log(`Cutouts: ${croppedCutouts.length}`);
console.log(`Canvas items: ${canvasItems.length}`);

function parseArgs(argv) {
    const out = { help: false, input: undefined, out: undefined };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--help" || arg === "-h") {
            out.help = true;
            continue;
        }
        if (arg === "--input") {
            out.input = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === "--out") {
            out.out = argv[i + 1];
            i += 1;
            continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return out;
}

function printHelp() {
    console.log("Materialize pixel-collage sample fixtures from a raw export JSON");
    console.log("");
    console.log(
        "Usage: node ./scripts/materialize-sample-fixtures.mjs --input <raw.json> --out <public/samples/default>",
    );
    console.log("");
    console.log("Defaults:");
    console.log(`  --input ${path.join(appRoot, "pixel-collage-sample-raw.json")}`);
    console.log(`  --out   ${path.join(publicRoot, "samples", "default")}`);
}

function assertRawSample(value) {
    if (!value || typeof value !== "object") {
        throw new Error("Raw sample JSON must be an object");
    }
    if (!Array.isArray(value.uploadedImages)) {
        throw new Error("Missing uploadedImages array");
    }
    if (!Array.isArray(value.croppedCutouts)) {
        throw new Error("Missing croppedCutouts array");
    }
    if (!Array.isArray(value.canvasItems)) {
        throw new Error("Missing canvasItems array");
    }
}

async function materializeAsset({ src, id, outputDir, outputUrlBase, fallbackExt }) {
    if (!isDataUrl(src)) return src;

    const { mime, buffer } = decodeDataUrl(src);
    const ext = extFromMime(mime) ?? fallbackExt;
    const fileName = `${id}${ext}`;
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, buffer);
    return `${outputUrlBase}/${fileName}`;
}

function isDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:");
}

function decodeDataUrl(dataUrl) {
    const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
    if (!match) {
        throw new Error("Invalid data URL");
    }
    const mime = match[1] ?? "application/octet-stream";
    const isBase64 = Boolean(match[2]);
    const payload = match[3] ?? "";
    const buffer = isBase64
        ? Buffer.from(payload, "base64")
        : Buffer.from(decodeURIComponent(payload), "utf8");
    return { mime, buffer };
}

function extFromFilename(fileName) {
    if (typeof fileName !== "string") return null;
    const ext = path.extname(fileName).toLowerCase();
    return ext || null;
}

function extFromMime(mime) {
    const map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/avif": ".avif",
        "image/svg+xml": ".svg",
        "image/heic": ".heic",
        "image/heif": ".heif",
    };
    return map[mime] ?? null;
}
