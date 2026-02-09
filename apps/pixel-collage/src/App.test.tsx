import "fake-indexeddb/auto";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "./App";
import { ACCEPTED_IMAGE_TYPES } from "./App";
import { saveValue } from "./utils/imageStorage";

vi.mock("heic2any", () => ({
    default: vi.fn().mockResolvedValue(new Blob(["converted"], { type: "image/jpeg" })),
}));

vi.mock("./components/Canvas", () => ({
    default: ({ items }: { items: Array<{ id: string }> }) => (
        <div data-testid="canvas">
            {items.map((item) => (
                <div key={item.id} data-testid={`canvas-item-${item.id}`} />
            ))}
        </div>
    ),
}));

vi.mock("./components/ImageCropper", () => ({
    default: () => null,
}));

const img1 = { id: "img-1", src: "data:image/png;base64,img1", name: "photo1.png" };
const img2 = { id: "img-2", src: "data:image/png;base64,img2", name: "photo2.png" };

const cutout1 = { id: "cutout-1", src: "data:image/png;base64,c1", sourceImageId: "img-1" };
const cutout2 = { id: "cutout-2", src: "data:image/png;base64,c2", sourceImageId: "img-1" };
const cutout3 = { id: "cutout-3", src: "data:image/png;base64,c3", sourceImageId: "img-2" };

const canvasItem1 = {
    id: "ci-1",
    cutoutId: "cutout-1",
    src: "data:image/png;base64,c1",
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};
const canvasItem2 = {
    id: "ci-2",
    cutoutId: "cutout-2",
    src: "data:image/png;base64,c2",
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};
const canvasItem3 = {
    id: "ci-3",
    cutoutId: "cutout-3",
    src: "data:image/png;base64,c3",
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};

async function seedIndexedDB(
    images: (typeof img1)[],
    cutouts: (typeof cutout1)[],
    items: (typeof canvasItem1)[],
) {
    await saveValue("uploadedImages", images);
    await saveValue("croppedCutouts", cutouts);
    await saveValue("canvasItems", items);
}

async function renderAndWaitForLoad() {
    render(<App />);
    await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
}

function getFileInput() {
    return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function simulateFileSelect(input: HTMLInputElement, name: string, type: string) {
    const file = new File(["fake-image-data"], name, { type });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);
}

describe("file upload validation", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it.each([
        ["image/png", "photo.png"],
        ["image/jpeg", "photo.jpg"],
        ["image/webp", "photo.webp"],
        ["image/gif", "photo.gif"],
        ["image/avif", "photo.avif"],
        ["image/svg+xml", "icon.svg"],
        ["image/heic", "photo.heic"],
        ["image/heif", "photo.heif"],
    ])("accepts %s files", async (mimeType, fileName) => {
        await renderAndWaitForLoad();
        expect(screen.getByText("No images yet")).toBeInTheDocument();

        simulateFileSelect(getFileInput(), fileName, mimeType);

        await waitFor(() => {
            expect(screen.getByText(fileName)).toBeInTheDocument();
        });
        expect(screen.queryByText("No images yet")).not.toBeInTheDocument();
    });

    it.each([
        ["image/tiff", "photo.tiff"],
        ["image/bmp", "photo.bmp"],
        ["application/pdf", "doc.pdf"],
        ["text/plain", "notes.txt"],
    ])("rejects %s files", async (mimeType, fileName) => {
        await renderAndWaitForLoad();
        expect(screen.getByText("No images yet")).toBeInTheDocument();

        simulateFileSelect(getFileInput(), fileName, mimeType);

        expect(screen.getByText("No images yet")).toBeInTheDocument();
    });

    it("ACCEPTED_IMAGE_TYPES contains exactly the expected types", () => {
        const expected = new Set([
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "image/avif",
            "image/svg+xml",
            "image/heic",
            "image/heif",
        ]);
        expect(ACCEPTED_IMAGE_TYPES).toEqual(expected);
    });
});

describe("delete handlers", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    describe("handleDeleteCutout", () => {
        it("removes the cutout and its canvas items, leaves others intact", async () => {
            await seedIndexedDB([img1], [cutout1, cutout2], [canvasItem1, canvasItem2]);
            await renderAndWaitForLoad();

            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(2);
            expect(screen.getByTestId("canvas-item-ci-1")).toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-2")).toBeInTheDocument();

            fireEvent.click(screen.getAllByTitle("Delete cutout")[0]);

            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(1);
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-2")).toBeInTheDocument();
            expect(screen.getByText("photo1.png")).toBeInTheDocument();
        });

        it("shows empty state when last cutout is deleted", async () => {
            await seedIndexedDB([img1], [cutout1], [canvasItem1]);
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByTitle("Delete cutout"));

            expect(screen.queryByTitle("Delete cutout")).not.toBeInTheDocument();
            expect(screen.getByText("No cutouts yet")).toBeInTheDocument();
        });
    });

    describe("handleDeleteImage", () => {
        it("removes the image, its cutouts, and their canvas items, leaves others intact", async () => {
            await seedIndexedDB(
                [img1, img2],
                [cutout1, cutout2, cutout3],
                [canvasItem1, canvasItem2, canvasItem3],
            );
            await renderAndWaitForLoad();

            expect(screen.getAllByTitle("Delete image")).toHaveLength(2);
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(3);

            fireEvent.click(screen.getAllByTitle("Delete image")[0]);

            expect(screen.getAllByTitle("Delete image")).toHaveLength(1);
            expect(screen.queryByText("photo1.png")).not.toBeInTheDocument();
            expect(screen.getByText("photo2.png")).toBeInTheDocument();
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(1);
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
            expect(screen.queryByTestId("canvas-item-ci-2")).not.toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-3")).toBeInTheDocument();
        });

        it("shows empty states when last image and its cutouts are deleted", async () => {
            await seedIndexedDB([img1], [cutout1], [canvasItem1]);
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByTitle("Delete image"));

            expect(screen.getByText("No images yet")).toBeInTheDocument();
            expect(screen.getByText("No cutouts yet")).toBeInTheDocument();
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
        });
    });
});
