import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderLinkifiedText, tokenizeLinkifiedText } from "./linkifyText";

describe("tokenizeLinkifiedText", () => {
    it("extracts urls and emails without trailing punctuation", () => {
        expect(
            tokenizeLinkifiedText(
                "LinkedIn: https://www.linkedin.com/in/bella-meng/, email bellamengzihan@gmail.com.",
            ),
        ).toEqual([
            { type: "text", value: "LinkedIn: " },
            {
                type: "link",
                href: "https://www.linkedin.com/in/bella-meng/",
                value: "https://www.linkedin.com/in/bella-meng/",
            },
            { type: "text", value: "," },
            { type: "text", value: " email " },
            {
                type: "link",
                href: "mailto:bellamengzihan@gmail.com",
                value: "bellamengzihan@gmail.com",
            },
            { type: "text", value: "." },
        ]);
    });

    it("renders clickable anchors for urls and email addresses", () => {
        const html = renderToStaticMarkup(
            <>{renderLinkifiedText("https://pixattica.com hello bellamengzihan@gmail.com")}</>,
        );

        expect(html).toContain('href="https://pixattica.com"');
        expect(html).toContain('href="mailto:bellamengzihan@gmail.com"');
    });
});
