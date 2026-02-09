import { describe, it, expect, vi, beforeEach } from "vitest";
import { readImageFile } from "./readImageFile";

vi.mock("heic2any", () => ({
    default: vi.fn(),
}));

import heic2any from "heic2any";

const mockedHeic2any = vi.mocked(heic2any);

function createFile(name: string, type: string, content = "fake-image-data"): File {
    return new File([content], name, { type });
}

describe("readImageFile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("reads a PNG file as a data URL without conversion", async () => {
        const file = createFile("photo.png", "image/png");
        const result = await readImageFile(file);

        expect(result).toMatch(/^data:image\/png;base64,/);
        expect(mockedHeic2any).not.toHaveBeenCalled();
    });

    it("reads a JPEG file as a data URL without conversion", async () => {
        const file = createFile("photo.jpg", "image/jpeg");
        const result = await readImageFile(file);

        expect(result).toMatch(/^data:image\/jpeg;base64,/);
        expect(mockedHeic2any).not.toHaveBeenCalled();
    });

    it("converts a HEIC file to JPEG via heic2any and returns a data URL", async () => {
        const jpegBlob = new Blob(["converted-jpeg-data"], { type: "image/jpeg" });
        mockedHeic2any.mockResolvedValue(jpegBlob);

        const file = createFile("photo.heic", "image/heic");
        const result = await readImageFile(file);

        expect(mockedHeic2any).toHaveBeenCalledWith({
            blob: file,
            toType: "image/jpeg",
            quality: 0.92,
        });
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("converts a HEIF file to JPEG via heic2any and returns a data URL", async () => {
        const jpegBlob = new Blob(["converted-jpeg-data"], { type: "image/jpeg" });
        mockedHeic2any.mockResolvedValue(jpegBlob);

        const file = createFile("photo.heif", "image/heif");
        const result = await readImageFile(file);

        expect(mockedHeic2any).toHaveBeenCalledWith({
            blob: file,
            toType: "image/jpeg",
            quality: 0.92,
        });
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("handles heic2any returning a Blob array by using the first element", async () => {
        const jpegBlob = new Blob(["converted-jpeg-data"], { type: "image/jpeg" });
        mockedHeic2any.mockResolvedValue([jpegBlob]);

        const file = createFile("photo.heic", "image/heic");
        const result = await readImageFile(file);

        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("rejects when heic2any conversion fails", async () => {
        mockedHeic2any.mockRejectedValue(new Error("conversion failed"));

        const file = createFile("photo.heic", "image/heic");

        await expect(readImageFile(file)).rejects.toThrow("conversion failed");
    });

    it("rejects when FileReader encounters an error", async () => {
        const originalFileReader = globalThis.FileReader;

        const mockFileReader = {
            readAsDataURL: vi.fn(),
            onerror: null as ((ev: ProgressEvent) => void) | null,
            error: new DOMException("read error"),
        };

        globalThis.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

        const file = createFile("photo.png", "image/png");
        const promise = readImageFile(file);

        mockFileReader.onerror?.(new ProgressEvent("error"));

        await expect(promise).rejects.toThrow("read error");

        globalThis.FileReader = originalFileReader;
    });
});
