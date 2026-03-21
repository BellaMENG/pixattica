import { describe, expect, it } from "vitest";
import { getShellAutocompleteSuggestions, runShellCommand, HELP_TEXT } from "./osShell";

describe("runShellCommand", () => {
    it("supports the whoami intro command", () => {
        const result = runShellCommand("whoami", "about", 7);

        expect(result.nextModuleId).toBe("about");
        expect(result.entries).toEqual([
            {
                id: "line-7",
                kind: "output",
                text: [
                    "Bella Meng, software engineer, (product engineer?), based in London. I like making random things outside software too.",
                    "More about my work lives on LinkedIn: https://www.linkedin.com/in/bella-meng/. You can also reach me at bellamengzihan@gmail.com.",
                ].join("\n\n"),
            },
        ]);
    });

    it("lists whoami and bbs in help text", () => {
        expect(HELP_TEXT).toContain("whoami               show Bella's intro card");
        expect(HELP_TEXT).toContain("bbs                  open dialtone.app");
    });

    it("exposes whoami in autocomplete suggestions", () => {
        expect(
            getShellAutocompleteSuggestions("wh").find(
                (suggestion) => suggestion.completion === "whoami",
            ),
        ).toEqual({
            completion: "whoami",
            description: "show Bella's intro card",
            label: "whoami",
        });
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
