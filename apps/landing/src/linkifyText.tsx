import { Fragment, type ReactNode } from "react";

type LinkToken = { type: "text"; value: string } | { type: "link"; href: string; value: string };

const LINK_PATTERN = /(https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
const TRAILING_PUNCTUATION_PATTERN = /[),.!?]+$/;

function createHref(value: string): string {
    return value.includes("@") && !value.startsWith("http") ? `mailto:${value}` : value;
}

export function tokenizeLinkifiedText(text: string): LinkToken[] {
    const tokens: LinkToken[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(LINK_PATTERN)) {
        const rawValue = match[0];
        const matchIndex = match.index ?? 0;
        const trailingPunctuation = rawValue.match(TRAILING_PUNCTUATION_PATTERN)?.[0] ?? "";
        const value = trailingPunctuation
            ? rawValue.slice(0, -trailingPunctuation.length)
            : rawValue;

        if (matchIndex > lastIndex) {
            tokens.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
        }

        tokens.push({
            type: "link",
            href: createHref(value),
            value,
        });

        if (trailingPunctuation) {
            tokens.push({ type: "text", value: trailingPunctuation });
        }

        lastIndex = matchIndex + rawValue.length;
    }

    if (lastIndex < text.length) {
        tokens.push({ type: "text", value: text.slice(lastIndex) });
    }

    return tokens;
}

export function renderLinkifiedText(text: string): ReactNode {
    return tokenizeLinkifiedText(text).map((token, index) => {
        if (token.type === "text") {
            return <Fragment key={`text-${index}`}>{token.value}</Fragment>;
        }

        const isExternal = token.href.startsWith("http");
        return (
            <a
                key={`link-${index}`}
                href={token.href}
                className="os-inline-link"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer noopener" : undefined}
            >
                {token.value}
            </a>
        );
    });
}
