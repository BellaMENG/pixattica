import "fake-indexeddb/auto";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "./App";
import { ACCEPTED_IMAGE_TYPES } from "./App";
import { saveValue } from "./utils/imageStorage";
import { readImageFile } from "./utils/readImageFile";

vi.mock("./utils/readImageFile", () => ({
    readImageFile: vi.fn(() => createDeferredReadImageFile()),
}));

const mockedReadImageFile = vi.mocked(readImageFile);

vi.mock("heic2any", () => ({
    default: vi.fn().mockResolvedValue(new Blob(["converted"], { type: "image/jpeg" })),
}));

let resolveReadImageFile: (value: string) => void;
let rejectReadImageFile: (reason: unknown) => void;

function createDeferredReadImageFile() {
    return new Promise<string>((resolve, reject) => {
        resolveReadImageFile = resolve;
        rejectReadImageFile = reject;
    });
}

vi.mock("./components/Canvas", () => ({
    default: ({
        items,
        selectedItemId,
        onSelect,
        onBringToFront,
        onSendToBack,
        stageRef,
    }: {
        items: Array<{ id: string; type: string; text?: string }>;
        selectedItemId: string | null;
        onSelect: (id: string | null) => void;
        onBringToFront: (id: string) => void;
        onSendToBack: (id: string) => void;
        onResize: (size: { width: number; height: number }) => void;
        stageRef?: React.RefObject<unknown>;
    }) => {
        if (stageRef && !stageRef.current) {
            (stageRef as React.MutableRefObject<unknown>).current = {
                toCanvas: () => document.createElement("canvas"),
            };
        }
        return (
            <div data-testid="canvas">
                {items.map((item) => (
                    <div
                        key={item.id}
                        data-testid={`canvas-item-${item.id}`}
                        data-type={item.type}
                        data-text={item.text ?? ""}
                    >
                        <button onClick={() => onSelect(item.id)}>Select {item.id}</button>
                    </div>
                ))}
                {selectedItemId && (
                    <div data-testid="item-toolbar">
                        <button onClick={() => onBringToFront(selectedItemId)}>
                            Bring to Front
                        </button>
                        <button onClick={() => onSendToBack(selectedItemId)}>Send to Back</button>
                    </div>
                )}
            </div>
        );
    },
}));

vi.mock("./components/ImageCropper", () => ({
    default: () => null,
}));

vi.mock("./utils/exportCanvas", () => ({
    exportCanvasToBlob: vi.fn().mockResolvedValue(new Blob(["fake-png"], { type: "image/png" })),
    downloadBlob: vi.fn(),
}));

const img1 = { id: "img-1", src: "data:image/png;base64,img1", name: "photo1.png" };
const img2 = { id: "img-2", src: "data:image/png;base64,img2", name: "photo2.png" };
const img3 = { id: "img-3", src: "data:image/png;base64,img3", name: "photo3.png" };
const img4 = { id: "img-4", src: "data:image/png;base64,img4", name: "photo4.png" };
const img5 = { id: "img-5", src: "data:image/png;base64,img5", name: "photo5.png" };

const cutout1 = { id: "cutout-1", src: "data:image/png;base64,c1", sourceImageId: "img-1" };
const cutout2 = { id: "cutout-2", src: "data:image/png;base64,c2", sourceImageId: "img-1" };
const cutout3 = { id: "cutout-3", src: "data:image/png;base64,c3", sourceImageId: "img-2" };
const cutout4 = { id: "cutout-4", src: "data:image/png;base64,c4", sourceImageId: "img-3" };
const cutout5 = { id: "cutout-5", src: "data:image/png;base64,c5", sourceImageId: "img-4" };

const canvasItem1 = {
    type: "image" as const,
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
    type: "image" as const,
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
    type: "image" as const,
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

function simulateMultiFileSelect(
    input: HTMLInputElement,
    files: Array<{ name: string; type: string }>,
) {
    const fileList = files.map((f) => new File(["fake-image-data"], f.name, { type: f.type }));
    Object.defineProperty(input, "files", { value: fileList, configurable: true });
    fireEvent.change(input);
}

function simulateMultiFileDrop(
    dropTarget: HTMLElement,
    files: Array<{ name: string; type: string }>,
) {
    const fileList = files.map((f) => new File(["fake-image-data"], f.name, { type: f.type }));
    fireEvent.drop(dropTarget, {
        dataTransfer: { files: fileList },
    });
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

        await act(async () => {
            resolveReadImageFile(`data:${mimeType};base64,fakedata`);
        });

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
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(2);

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

describe("loading card during image upload", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it("shows a loading placeholder immediately when upload starts", async () => {
        await renderAndWaitForLoad();

        simulateFileSelect(getFileInput(), "photo.png", "image/png");

        await waitFor(() => {
            expect(screen.getByText("photo.png")).toBeInTheDocument();
        });
        expect(screen.getByTestId("upload-loading-placeholder")).toBeInTheDocument();
    });

    it("removes the loading placeholder after upload completes", async () => {
        await renderAndWaitForLoad();

        simulateFileSelect(getFileInput(), "photo.png", "image/png");

        await waitFor(() => {
            expect(screen.getByTestId("upload-loading-placeholder")).toBeInTheDocument();
        });

        await act(async () => {
            resolveReadImageFile("data:image/png;base64,fakedata");
        });

        await waitFor(() => {
            expect(screen.queryByTestId("upload-loading-placeholder")).not.toBeInTheDocument();
        });
        expect(screen.getByText("photo.png")).toBeInTheDocument();
    });

    it("suppresses 'No images yet' while upload is in progress", async () => {
        await renderAndWaitForLoad();
        expect(screen.getByText("No images yet")).toBeInTheDocument();

        simulateFileSelect(getFileInput(), "photo.png", "image/png");

        await waitFor(() => {
            expect(screen.queryByText("No images yet")).not.toBeInTheDocument();
        });

        await act(async () => {
            resolveReadImageFile("data:image/png;base64,fakedata");
        });

        await waitFor(() => {
            expect(screen.queryByText("No images yet")).not.toBeInTheDocument();
        });
    });

    it("removes the loading placeholder after upload fails", async () => {
        await renderAndWaitForLoad();

        simulateFileSelect(getFileInput(), "photo.png", "image/png");

        await waitFor(() => {
            expect(screen.getByTestId("upload-loading-placeholder")).toBeInTheDocument();
        });

        await act(async () => {
            rejectReadImageFile(new Error("read failed"));
        });

        await waitFor(() => {
            expect(screen.queryByTestId("upload-loading-placeholder")).not.toBeInTheDocument();
        });
    });
});

function canvasItemIds() {
    const canvas = screen.getByTestId("canvas");
    return Array.from(canvas.querySelectorAll("[data-testid^='canvas-item-']")).map((el) =>
        el.getAttribute("data-testid")!.replace("canvas-item-", ""),
    );
}

describe("z-order controls", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it("Bring to Front moves the selected canvas item to the end of the array", async () => {
        await seedIndexedDB(
            [img1, img2],
            [cutout1, cutout2, cutout3],
            [canvasItem1, canvasItem2, canvasItem3],
        );
        await renderAndWaitForLoad();

        expect(canvasItemIds()).toEqual(["ci-1", "ci-2", "ci-3"]);

        fireEvent.click(screen.getByText("Select ci-1"));
        fireEvent.click(screen.getByText("Bring to Front"));

        expect(canvasItemIds()).toEqual(["ci-2", "ci-3", "ci-1"]);
    });

    it("Send to Back moves the selected canvas item to the start of the array", async () => {
        await seedIndexedDB(
            [img1, img2],
            [cutout1, cutout2, cutout3],
            [canvasItem1, canvasItem2, canvasItem3],
        );
        await renderAndWaitForLoad();

        expect(canvasItemIds()).toEqual(["ci-1", "ci-2", "ci-3"]);

        fireEvent.click(screen.getByText("Select ci-3"));
        fireEvent.click(screen.getByText("Send to Back"));

        expect(canvasItemIds()).toEqual(["ci-3", "ci-1", "ci-2"]);
    });

    it("Bring to Front is a no-op when item is already on top", async () => {
        await seedIndexedDB(
            [img1, img2],
            [cutout1, cutout2, cutout3],
            [canvasItem1, canvasItem2, canvasItem3],
        );
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText("Select ci-3"));
        fireEvent.click(screen.getByText("Bring to Front"));

        expect(canvasItemIds()).toEqual(["ci-1", "ci-2", "ci-3"]);
    });

    it("Send to Back is a no-op when item is already at bottom", async () => {
        await seedIndexedDB(
            [img1, img2],
            [cutout1, cutout2, cutout3],
            [canvasItem1, canvasItem2, canvasItem3],
        );
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText("Select ci-1"));
        fireEvent.click(screen.getByText("Send to Back"));

        expect(canvasItemIds()).toEqual(["ci-1", "ci-2", "ci-3"]);
    });
});

describe("sidebar scroll arrows", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it("renders sidebar up and down scroll arrows", async () => {
        await renderAndWaitForLoad();

        expect(screen.getByLabelText("Scroll sidebar up")).toBeInTheDocument();
        expect(screen.getByLabelText("Scroll sidebar down")).toBeInTheDocument();
    });

    it("sidebar up arrow is disabled initially", async () => {
        await renderAndWaitForLoad();

        expect(screen.getByLabelText("Scroll sidebar up")).toBeDisabled();
    });
});

describe("scrollable card sections", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    describe("images section", () => {
        it("shows only 2 image cards when more than 2 images exist", async () => {
            await seedIndexedDB([img1, img2, img3, img4, img5], [], []);
            await renderAndWaitForLoad();

            const visibleNames = ["photo1.png", "photo2.png"];
            const hiddenNames = ["photo3.png", "photo4.png", "photo5.png"];

            visibleNames.forEach((name) => {
                expect(screen.getByText(name)).toBeInTheDocument();
            });
            hiddenNames.forEach((name) => {
                expect(screen.queryByText(name)).not.toBeInTheDocument();
            });
        });

        it("down arrow is enabled when there are more than 2 images", async () => {
            await seedIndexedDB([img1, img2, img3], [], []);
            await renderAndWaitForLoad();

            expect(screen.getByLabelText("Scroll images down")).not.toBeDisabled();
        });

        it("up arrow is disabled initially", async () => {
            await seedIndexedDB([img1, img2, img3], [], []);
            await renderAndWaitForLoad();

            expect(screen.getByLabelText("Scroll images up")).toBeDisabled();
        });

        it("scrolls down to show next images when down arrow is clicked", async () => {
            await seedIndexedDB([img1, img2, img3, img4, img5], [], []);
            await renderAndWaitForLoad();

            const downButton = screen.getByLabelText("Scroll images down");
            fireEvent.click(downButton);

            expect(screen.getByText("photo2.png")).toBeInTheDocument();
            expect(screen.getByText("photo3.png")).toBeInTheDocument();
            expect(screen.queryByText("photo1.png")).not.toBeInTheDocument();
            expect(screen.queryByText("photo4.png")).not.toBeInTheDocument();
        });

        it("up arrow is enabled after scrolling down", async () => {
            await seedIndexedDB([img1, img2, img3], [], []);
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByLabelText("Scroll images down"));

            expect(screen.getByLabelText("Scroll images up")).not.toBeDisabled();
        });

        it("scrolls back up when up arrow is clicked", async () => {
            await seedIndexedDB([img1, img2, img3, img4, img5], [], []);
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByLabelText("Scroll images down"));
            fireEvent.click(screen.getByLabelText("Scroll images down"));

            expect(screen.getByText("photo3.png")).toBeInTheDocument();
            expect(screen.getByText("photo4.png")).toBeInTheDocument();

            fireEvent.click(screen.getByLabelText("Scroll images up"));

            expect(screen.getByText("photo2.png")).toBeInTheDocument();
            expect(screen.getByText("photo3.png")).toBeInTheDocument();
            expect(screen.queryByText("photo1.png")).not.toBeInTheDocument();
            expect(screen.queryByText("photo4.png")).not.toBeInTheDocument();
        });

        it("disables down arrow when scrolled to the end", async () => {
            await seedIndexedDB([img1, img2, img3], [], []);
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByLabelText("Scroll images down"));

            expect(screen.getByLabelText("Scroll images down")).toBeDisabled();
        });

        it("disables both scroll arrows when 2 or fewer images exist", async () => {
            await seedIndexedDB([img1, img2], [], []);
            await renderAndWaitForLoad();

            expect(screen.getByLabelText("Scroll images down")).toBeDisabled();
            expect(screen.getByLabelText("Scroll images up")).toBeDisabled();
        });
    });

    describe("cutouts section", () => {
        it("shows only 2 cutout cards when more than 2 cutouts exist", async () => {
            await seedIndexedDB(
                [img1, img2, img3, img4],
                [cutout1, cutout2, cutout3, cutout4, cutout5],
                [],
            );
            await renderAndWaitForLoad();

            expect(screen.getAllByText("Add to Canvas")).toHaveLength(2);
        });

        it("down arrow is enabled when there are more than 2 cutouts", async () => {
            await seedIndexedDB([img1, img2, img3, img4], [cutout1, cutout2, cutout3], []);
            await renderAndWaitForLoad();

            expect(screen.getByLabelText("Scroll cutouts down")).not.toBeDisabled();
        });

        it("scrolls down to show next cutouts when down arrow is clicked", async () => {
            await seedIndexedDB(
                [img1, img2, img3, img4],
                [cutout1, cutout2, cutout3, cutout4, cutout5],
                [],
            );
            await renderAndWaitForLoad();

            fireEvent.click(screen.getByLabelText("Scroll cutouts down"));

            expect(screen.getAllByText("Add to Canvas")).toHaveLength(2);

            expect(screen.getByLabelText("Scroll cutouts up")).not.toBeDisabled();
        });

        it("disables both scroll arrows when 2 or fewer cutouts exist", async () => {
            await seedIndexedDB([img1, img2], [cutout1, cutout2], []);
            await renderAndWaitForLoad();

            expect(screen.getByLabelText("Scroll cutouts down")).toBeDisabled();
            expect(screen.getByLabelText("Scroll cutouts up")).toBeDisabled();
        });
    });
});

describe("multi-file upload", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
        mockedReadImageFile.mockReset();
    });

    it("uploads multiple files selected via the file input", async () => {
        mockedReadImageFile
            .mockResolvedValueOnce("data:image/png;base64,aaa")
            .mockResolvedValueOnce("data:image/jpeg;base64,bbb");

        await renderAndWaitForLoad();
        expect(screen.getByText("No images yet")).toBeInTheDocument();

        await act(async () => {
            simulateMultiFileSelect(getFileInput(), [
                { name: "cat.png", type: "image/png" },
                { name: "dog.jpg", type: "image/jpeg" },
            ]);
        });

        await waitFor(() => {
            expect(screen.getByText("cat.png")).toBeInTheDocument();
            expect(screen.getByText("dog.jpg")).toBeInTheDocument();
        });
        expect(mockedReadImageFile).toHaveBeenCalledTimes(2);
    });

    it("uploads multiple files via drag and drop", async () => {
        mockedReadImageFile
            .mockResolvedValueOnce("data:image/png;base64,aaa")
            .mockResolvedValueOnce("data:image/webp;base64,bbb");

        await renderAndWaitForLoad();
        expect(screen.getByText("No images yet")).toBeInTheDocument();

        const dropTarget = screen
            .getByText("No images yet")
            .closest("[class*='flex h-screen']") as HTMLElement;

        await act(async () => {
            simulateMultiFileDrop(dropTarget, [
                { name: "photo1.png", type: "image/png" },
                { name: "photo2.webp", type: "image/webp" },
            ]);
        });

        await waitFor(() => {
            expect(screen.getByText("photo1.png")).toBeInTheDocument();
            expect(screen.getByText("photo2.webp")).toBeInTheDocument();
        });
        expect(mockedReadImageFile).toHaveBeenCalledTimes(2);
    });

    it("skips invalid files in a multi-file selection", async () => {
        mockedReadImageFile.mockResolvedValueOnce("data:image/png;base64,aaa");

        await renderAndWaitForLoad();

        await act(async () => {
            simulateMultiFileSelect(getFileInput(), [
                { name: "cat.png", type: "image/png" },
                { name: "notes.txt", type: "text/plain" },
            ]);
        });

        await waitFor(() => {
            expect(screen.getByText("cat.png")).toBeInTheDocument();
        });
        expect(mockedReadImageFile).toHaveBeenCalledTimes(1);
    });
});

describe("export buttons", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it("renders Save Image and Email buttons in the sidebar", async () => {
        await renderAndWaitForLoad();

        expect(screen.getByText("Save Image")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("clicking Save Image triggers a download", async () => {
        const { downloadBlob } = await import("./utils/exportCanvas");
        const mockedDownload = vi.mocked(downloadBlob);
        mockedDownload.mockClear();

        await renderAndWaitForLoad();

        await act(async () => {
            fireEvent.click(screen.getByText("Save Image"));
        });

        expect(mockedDownload).toHaveBeenCalledWith(expect.any(Blob), "pixattica-collage.png");
    });

    it("clicking Email triggers download and opens mailto link", async () => {
        const { downloadBlob } = await import("./utils/exportCanvas");
        const mockedDownload = vi.mocked(downloadBlob);
        mockedDownload.mockClear();

        const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        await renderAndWaitForLoad();

        await act(async () => {
            fireEvent.click(screen.getByText("Email"));
        });

        expect(mockedDownload).toHaveBeenCalledWith(expect.any(Blob), "pixattica-collage.png");
        expect(openSpy).toHaveBeenCalledWith("mailto:?subject=My%20Pixattica%20Collage");

        openSpy.mockRestore();
    });
});

describe("add text to canvas", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        globalThis.indexedDB = new IDBFactory();
        localStorage.clear();
    });

    it("renders the Add Text button disabled when input is empty", async () => {
        await renderAndWaitForLoad();

        const addTextButton = screen.getByText("Add Text");
        expect(addTextButton).toBeDisabled();
    });

    it("enables the Add Text button when text is entered", async () => {
        await renderAndWaitForLoad();

        const input = screen.getByPlaceholderText("Type text...");
        fireEvent.change(input, { target: { value: "Hello" } });

        expect(screen.getByText("Add Text")).not.toBeDisabled();
    });

    it("adds a text item to the canvas when Add Text is clicked", async () => {
        await renderAndWaitForLoad();

        const input = screen.getByPlaceholderText("Type text...");
        fireEvent.change(input, { target: { value: "Hello World" } });
        fireEvent.click(screen.getByText("Add Text"));

        const canvas = screen.getByTestId("canvas");
        const textItems = canvas.querySelectorAll('[data-type="text"]');
        expect(textItems).toHaveLength(1);
        expect(textItems[0].getAttribute("data-text")).toBe("Hello World");
    });

    it("clears the input after adding text", async () => {
        await renderAndWaitForLoad();

        const input = screen.getByPlaceholderText("Type text...");
        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.click(screen.getByText("Add Text"));

        expect(input).toHaveValue("");
        expect(screen.getByText("Add Text")).toBeDisabled();
    });

    it("does not add a text item when input is only whitespace", async () => {
        await renderAndWaitForLoad();

        const input = screen.getByPlaceholderText("Type text...");
        fireEvent.change(input, { target: { value: "   " } });

        expect(screen.getByText("Add Text")).toBeDisabled();
    });
});
