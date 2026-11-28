import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import BagLanding from "./BagLanding";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

describe("BagLanding touch interactions", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    let hitItem: Element | null = null;
    let clickPrevented: boolean[] = [];

    const observeClick = (event: globalThis.MouseEvent) => {
        clickPrevented.push(event.defaultPrevented);
        event.preventDefault();
    };

    const pointer = async (target: Element, type: string, x: number, y: number) => {
        const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
        });
        Object.defineProperties(event, {
            pointerType: { value: "touch" },
            pointerId: { value: 1 },
            isPrimary: { value: true },
        });
        await act(async () => target.dispatchEvent(event));
    };

    const click = async (target: Element) => {
        const event = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
        await act(async () => {
            target.dispatchEvent(event);
        });
        return event;
    };

    const item = (id: string) => container!.querySelector<HTMLElement>(`[data-bag-item="${id}"]`)!;

    const mount = async () => {
        vi.stubGlobal(
            "matchMedia",
            vi.fn(() => ({ matches: false })),
        );
        Object.defineProperty(document, "elementFromPoint", {
            configurable: true,
            value: vi.fn(() => hitItem),
        });
        document.addEventListener("click", observeClick);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => root?.render(<BagLanding />));
        await act(async () => {
            container?.querySelector(".bag-scene__back")?.dispatchEvent(new Event("load"));
        });
    };

    afterEach(async () => {
        if (root) await act(async () => root?.unmount());
        container?.remove();
        root = null;
        container = null;
        hitItem = null;
        clickPrevented = [];
        document.removeEventListener("click", observeClick);
        Reflect.deleteProperty(document, "elementFromPoint");
        vi.unstubAllGlobals();
    });

    it("keeps the first tap lifted and follows the link on the second tap", async () => {
        await mount();
        const laptop = item("laptop");
        hitItem = laptop;

        await pointer(laptop, "pointerdown", 10, 10);
        expect(laptop.classList.contains("is-swiped")).toBe(true);
        await pointer(laptop, "pointerup", 10, 10);
        expect(laptop.classList.contains("is-tapped")).toBe(true);
        await click(laptop);
        expect(clickPrevented).toEqual([true]);

        await pointer(laptop, "pointerdown", 10, 10);
        expect(laptop.classList.contains("is-tapped")).toBe(true);
        await pointer(laptop, "pointerup", 10, 10);
        await click(laptop);
        expect(clickPrevented).toEqual([true, false]);
    });

    it("tears, opens, and draws cat photos without repeating within a round", async () => {
        await mount();
        const churu = item("churu");
        const photo = () => container!.querySelector<HTMLImageElement>(".bag-cat-photo img");
        hitItem = churu;
        // Exploring the bag by swiping across the treat must leave it sealed.
        await pointer(churu, "pointerdown", 10, 10);
        await pointer(churu, "pointermove", 30, 10);
        await pointer(churu, "pointerup", 30, 10);
        await click(churu);
        expect(churu.dataset.churuStage).toBe("sealed");

        for (const stage of ["torn", "open"]) {
            await pointer(churu, "pointerdown", 10, 10);
            await pointer(churu, "pointerup", 10, 10);
            await click(churu);
            expect(churu.dataset.churuStage).toBe(stage);
            expect(photo()).toBeNull();
        }
        expect(container!.textContent).toContain("meet my cats →");

        const personal = import.meta.glob("./assets/bag/cats/*.{jpg,jpeg,png,webp,avif}");
        const fallback = import.meta.glob("./assets/cats/**/*.{jpg,jpeg,png,webp,avif}");
        const count = Object.keys(personal).length || Object.keys(fallback).length;
        const draws = new Set<string>();
        for (let i = 0; i < count; i++) {
            await click(churu);
            draws.add(photo()!.src);
        }
        expect(draws.size).toBe(count);

        const last = photo()!.src;
        await click(container!.querySelector('[aria-label="Close cat photo"]')!);
        expect(photo()).toBeNull();
        expect(document.activeElement).toBe(churu);
        await click(churu);
        expect(photo()).toBeTruthy();
        if (count > 1) expect(photo()!.src).not.toBe(last);
    });

    it("puts the Churu away when clicking elsewhere at any stage", async () => {
        await mount();
        const churu = item("churu");
        const heading = container!.querySelector("h1")!;
        const otherItem = item("switch");

        for (const clicks of [1, 2, 3]) {
            hitItem = churu;
            await pointer(churu, "pointerdown", 10, 10);
            await pointer(churu, "pointerup", 10, 10);
            await click(churu);
            expect(churu.dataset.churuStage).toBe("torn");
            for (let i = 1; i < clicks; i++) await click(churu);
            if (clicks === 3) expect(container!.querySelector(".bag-cat-photo")).toBeTruthy();

            await click(clicks === 2 ? otherItem : heading);
            expect(churu.dataset.churuStage).toBe("sealed");
            expect(churu.classList.contains("is-tapped")).toBe(false);
            expect(container!.querySelector(".bag-cat-photo")).toBeNull();
            if (clicks === 2) expect(otherItem.classList.contains("is-tapped")).toBe(true);
        }
    });

    it("lifts consecutive items during a swipe and suppresses the swipe click", async () => {
        await mount();
        const laptop = item("laptop");
        const book = item("book");
        hitItem = laptop;

        await pointer(laptop, "pointerdown", 10, 10);
        expect(laptop.classList.contains("is-swiped")).toBe(true);
        hitItem = book;
        await pointer(laptop, "pointermove", 30, 10);
        expect(laptop.classList.contains("is-swiped")).toBe(false);
        expect(book.classList.contains("is-swiped")).toBe(true);
        await pointer(laptop, "pointerup", 30, 10);
        expect(book.classList.contains("is-swiped")).toBe(false);
        expect(book.classList.contains("is-tapped")).toBe(false);
        const swipeClick = await click(laptop);
        expect(swipeClick.defaultPrevented).toBe(true);
        expect(clickPrevented).toEqual([]);
    });
});
