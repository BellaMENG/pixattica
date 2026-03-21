import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = readFileSync(resolve(CURRENT_DIR, "../index.html"), "utf8");

describe("landing SEO metadata", () => {
    it("brands the homepage around Bella Meng's software engineering portfolio", () => {
        expect(INDEX_HTML).toContain("<title>Bella Meng | Software Engineer | Pixattica</title>");
        expect(INDEX_HTML).toContain(
            'content="Bella Meng, software engineer, (product engineer?), based in London."',
        );
        expect(INDEX_HTML).toContain('"@type": "Person"');
        expect(INDEX_HTML).toContain('"jobTitle": "Software Engineer"');
        expect(INDEX_HTML).toContain("https://www.linkedin.com/in/bella-meng/");
        expect(INDEX_HTML).toContain("bellamengzihan@gmail.com");
        expect(INDEX_HTML).toContain("Bella Meng // software engineer");
    });
});
