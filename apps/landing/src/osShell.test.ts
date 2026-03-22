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

    it("supports open with an explicit app flag", () => {
        const result = runShellCommand("open -a cats", "about", 9);

        expect(result.nextModuleId).toBe("cats");
        expect(result.openedModuleId).toBe("cats");
        expect(result.windowState).toBe("open");
        expect(result.entries).toEqual([
            {
                id: "line-9",
                kind: "output",
                text: "launched: cats.app",
            },
        ]);
    });

    it("requires apps to be launched through open", () => {
        const result = runShellCommand("books", "about", 11);

        expect(result.nextModuleId).toBe("about");
        expect(result.entries).toEqual([
            {
                id: "line-11",
                kind: "output",
                text: "command not found: books. try `help` or `open books`.",
            },
        ]);
    });

    it("keeps help text concise while listing the app catalog", () => {
        expect(HELP_TEXT).toContain("open [-a] <app>  launch an app");
        expect(HELP_TEXT).toContain("apps             about, books, cats, collage, bbs");
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

        expect(getShellAutocompleteSuggestions("open -a b")).toEqual([
            {
                completion: "open -a books",
                description: "open books.app",
                label: "open -a books",
            },
            {
                completion: "open -a bbs",
                description: "open dialtone.app",
                label: "open -a bbs",
            },
        ]);

        expect(getShellAutocompleteSuggestions("open -")).toEqual([
            {
                completion: "open -a ",
                description: "launch an app with an explicit app flag",
                label: "open -a",
            },
            {
                completion: "open --app ",
                description: "launch an app with an explicit app flag",
                label: "open --app",
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
