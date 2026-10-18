import { readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const origin = "https://bellameng.com";
const pages = [
    {
        path: "/",
        component: "/src/BagLanding.tsx",
        file: "index.html",
        title: "Bella Meng | Software Engineer",
        description: "Bella Meng, software engineer, (product engineer?), based in London.",
    },
    {
        path: "/cv",
        component: "/src/ResumeApp.tsx",
        file: "cv.html",
        title: "Bella Meng | Senior Software Engineer CV",
        description:
            "Bella Meng is a senior software engineer at Goodnotes in London. Explore her experience in product, cross-platform, and AI-enabled engineering.",
    },
    {
        path: "/books",
        component: "/src/BooksPage.tsx",
        file: "books.html",
        title: "Bella Meng | Book Ratings",
        description: "Books Bella Meng read and reviewed in 2025.",
    },
    {
        path: "/blog",
        component: "/src/BlogPage.tsx",
        file: "blog.html",
        title: "Bella Meng | Blog",
        description: "Personal notes and writing from Bella Meng, a software engineer in London.",
    },
];

function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function replaceOne(html, pattern, replacement, label) {
    if (!(typeof pattern === "string" ? html.includes(pattern) : pattern.test(html))) {
        throw new Error(`Could not find ${label} in built HTML`);
    }
    return html.replace(pattern, replacement);
}

function pageHtml(template, page, markup, manifest) {
    const url = `${origin}${page.path}`;
    let html = template;

    // Vite's SSR loader emits source asset URLs; map them to the built asset names.
    markup = markup.replaceAll(/(?:href|src)="(\/src\/assets\/[^"]+)"/g, (attribute, sourceUrl) => {
        const asset = manifest[sourceUrl.slice(1)];
        if (!asset?.file) throw new Error(`Missing built asset for ${sourceUrl}`);
        return attribute.replace(sourceUrl, `/${asset.file}`);
    });
    const componentAssets = manifest[page.component.slice(1)];
    if (!componentAssets) throw new Error(`Missing build manifest entry for ${page.component}`);
    const stylesheets = (componentAssets.css ?? [])
        .map((file) => `<link rel="stylesheet" href="/${file}" />`)
        .join("\n        ");
    html = replaceOne(html, "</head>", `        ${stylesheets}\n    </head>`, "head");

    html = replaceOne(
        html,
        /<title>[^<]*<\/title>/,
        `<title>${escapeHtml(page.title)}</title>`,
        "title",
    );
    html = replaceOne(
        html,
        /(<meta\s+name="description"\s+content=")[^"]*("\s*\/>)/,
        `$1${escapeHtml(page.description)}$2`,
        "description",
    );
    html = replaceOne(
        html,
        /<link rel="canonical" href="[^"]*"\s*\/>/,
        `<link rel="canonical" href="${url}" />`,
        "canonical",
    );
    html = replaceOne(
        html,
        /(<meta property="og:title" content=")[^"]*("\s*\/>)/,
        `$1${escapeHtml(page.title)}$2`,
        "Open Graph title",
    );
    html = replaceOne(
        html,
        /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/>)/,
        `$1${escapeHtml(page.description)}$2`,
        "Open Graph description",
    );
    html = replaceOne(
        html,
        /<meta property="og:url" content="[^"]*"\s*\/>/,
        `<meta property="og:url" content="${url}" />`,
        "Open Graph URL",
    );

    if (page.path !== "/") {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            url,
            name: page.title,
            description: page.description,
            isPartOf: { "@id": `${origin}/#website` },
            about: { "@id": `${origin}/#person` },
        };
        html = replaceOne(
            html,
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
            `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`,
            "structured data",
        );
    }

    return replaceOne(html, '<div id="root"></div>', `<div id="root">${markup}</div>`, "root");
}

const template = await readFile(new URL("./dist/index.html", import.meta.url), "utf8");
const manifest = JSON.parse(
    await readFile(new URL("./dist/.vite/manifest.json", import.meta.url), "utf8"),
);
const vite = await createServer({
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: "custom",
});

try {
    for (const page of pages) {
        const { default: Component } = await vite.ssrLoadModule(page.component);
        const markup = renderToString(createElement(Component));
        const html = pageHtml(template, page, markup, manifest);
        await writeFile(new URL(`./dist/${page.file}`, import.meta.url), html);
    }
} finally {
    await vite.close();
}
