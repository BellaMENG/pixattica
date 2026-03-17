import { describe, expect, it } from "vitest";
import { getShellAutocompleteSuggestions, runShellCommand, HELP_TEXT } from "./osShell";

describe("runShellCommand", () => {
    it("supports a hidden whoami easter egg command", () => {
        const result = runShellCommand("whoami", "about", 7);

        expect(result.nextModuleId).toBe("about");
        expect(result.entries).toEqual([
            {
                id: "line-7",
                kind: "output",
                text: [
                    "bellameng, I like making random things (not just softwares), I’m always active (either running or BJJing or boxing or gyming or hiking or cycling or …)",
                    "Just in case though, here is my LinkedIn if you are interested in my experiences: https://www.linkedin.com/in/bella-meng/, or you can email me at bellamengzihan@gmail.com. I’m based in London. Let’s be friends!",
                ].join("\n\n"),
            },
        ]);
    });

    it("does not expose whoami in help text and does list bbs", () => {
        expect(HELP_TEXT).not.toContain("whoami");
        expect(HELP_TEXT).toContain("bbs                  open dialtone.app");
    });

    it("does not expose hidden commands in autocomplete suggestions", () => {
        expect(
            getShellAutocompleteSuggestions("wh").some(
                (suggestion) => suggestion.completion === "whoami",
            ),
        ).toBe(false);
    });

    it("suggests commands and open targets for autocomplete", () => {
        expect(getShellAutocompleteSuggestions("he")).toEqual([
            {
                completion: "help",
                description: "show the current command index",
                label: "help",
            },
        ]);

        expect(getShellAutocompleteSuggestions("open c")).toEqual([
            {
                completion: "open cats",
                description: "open cats.app",
                label: "open cats",
            },
            {
                completion: "open collage",
                description: "open collage.app",
                label: "open collage",
            },
        ]);

        expect(getShellAutocompleteSuggestions("open b")).toEqual([
            {
                completion: "open books",
                description: "open books.app",
                label: "open books",
            },
            {
                completion: "open bbs",
                description: "open dialtone.app",
                label: "open bbs",
            },
        ]);
    });
});
