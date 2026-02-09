import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "./App";

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
};
const canvasItem2 = {
    id: "ci-2",
    cutoutId: "cutout-2",
    src: "data:image/png;base64,c2",
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
};
const canvasItem3 = {
    id: "ci-3",
    cutoutId: "cutout-3",
    src: "data:image/png;base64,c3",
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
};

function seedLocalStorage(
    images: (typeof img1)[],
    cutouts: (typeof cutout1)[],
    canvasItems: (typeof canvasItem1)[],
) {
    localStorage.setItem("pixel-collage:uploadedImages", JSON.stringify(images));
    localStorage.setItem("pixel-collage:croppedCutouts", JSON.stringify(cutouts));
    localStorage.setItem("pixel-collage:canvasItems", JSON.stringify(canvasItems));
}

describe("delete handlers", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        localStorage.clear();
    });

    describe("handleDeleteCutout", () => {
        it("removes the cutout and its canvas items, leaves others intact", () => {
            seedLocalStorage([img1], [cutout1, cutout2], [canvasItem1, canvasItem2]);
            render(<App />);

            // Both cutouts visible
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(2);
            expect(screen.getByTestId("canvas-item-ci-1")).toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-2")).toBeInTheDocument();

            // Delete cutout-1
            fireEvent.click(screen.getAllByTitle("Delete cutout")[0]);

            // cutout-1 gone, cutout-2 remains
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(1);

            // canvas item for cutout-1 gone, cutout-2's canvas item remains
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-2")).toBeInTheDocument();

            // The source image is unaffected
            expect(screen.getByText("photo1.png")).toBeInTheDocument();
        });

        it("shows empty state when last cutout is deleted", () => {
            seedLocalStorage([img1], [cutout1], [canvasItem1]);
            render(<App />);

            fireEvent.click(screen.getByTitle("Delete cutout"));

            expect(screen.queryByTitle("Delete cutout")).not.toBeInTheDocument();
            expect(screen.getByText("No cutouts yet")).toBeInTheDocument();
        });
    });

    describe("handleDeleteImage", () => {
        it("removes the image, its cutouts, and their canvas items, leaves others intact", () => {
            seedLocalStorage(
                [img1, img2],
                [cutout1, cutout2, cutout3],
                [canvasItem1, canvasItem2, canvasItem3],
            );
            render(<App />);

            // Both images, 3 cutouts, 3 canvas items
            expect(screen.getAllByTitle("Delete image")).toHaveLength(2);
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(3);

            // Delete img-1 (has cutout-1 and cutout-2)
            fireEvent.click(screen.getAllByTitle("Delete image")[0]);

            // img-1 gone, img-2 remains
            expect(screen.getAllByTitle("Delete image")).toHaveLength(1);
            expect(screen.queryByText("photo1.png")).not.toBeInTheDocument();
            expect(screen.getByText("photo2.png")).toBeInTheDocument();

            // cutout-1 and cutout-2 (from img-1) gone, cutout-3 (from img-2) remains
            expect(screen.getAllByTitle("Delete cutout")).toHaveLength(1);

            // canvas items for cutout-1 and cutout-2 gone, cutout-3's remains
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
            expect(screen.queryByTestId("canvas-item-ci-2")).not.toBeInTheDocument();
            expect(screen.getByTestId("canvas-item-ci-3")).toBeInTheDocument();
        });

        it("shows empty states when last image and its cutouts are deleted", () => {
            seedLocalStorage([img1], [cutout1], [canvasItem1]);
            render(<App />);

            fireEvent.click(screen.getByTitle("Delete image"));

            expect(screen.getByText("No images yet")).toBeInTheDocument();
            expect(screen.getByText("No cutouts yet")).toBeInTheDocument();
            expect(screen.queryByTestId("canvas-item-ci-1")).not.toBeInTheDocument();
        });
    });
});
