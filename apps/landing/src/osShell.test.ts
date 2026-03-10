import { describe, expect, it } from "vitest";
import { runShellCommand, HELP_TEXT } from "./osShell";

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

    it("does not expose whoami in help text", () => {
        expect(HELP_TEXT).not.toContain("whoami");
    });
});
