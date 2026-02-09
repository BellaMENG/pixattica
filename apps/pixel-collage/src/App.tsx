import { useState } from "react";
import Canvas from "./components/Canvas";
import ImageCropper from "./components/ImageCropper";
import Sidebar from "./components/Sidebar";
import { useLocalStorage } from "./hooks/useLocalStorage";

export interface UploadedImage {
    id: string;
    src: string;
    name: string;
}

export interface CroppedCutout {
    id: string;
    src: string;
    sourceImageId: string;
}

export interface CanvasItem {
    id: string;
    cutoutId: string;
    src: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}

export const ACCEPTED_IMAGE_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/svg+xml",
    "image/heic",
    "image/heif",
]);

export const ACCEPTED_IMAGE_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.gif,.avif,.svg,.heic,.heif";

export enum BackgroundId {
    White = "white",
    Pink = "pink",
    Hearts = "hearts",
}

export interface BackgroundOption {
    id: BackgroundId;
    label: string;
    style: string;
}

const BACKGROUNDS: BackgroundOption[] = [
    { id: BackgroundId.White, label: "White", style: "white" },
    { id: BackgroundId.Pink, label: "Light Pink", style: "#fce7f3" },
    { id: BackgroundId.Hearts, label: "Pixel Hearts", style: "url('/bg-pixel-hearts.svg') repeat" },
];

export default function App() {
    const [uploadedImages, setUploadedImages] = useLocalStorage<UploadedImage[]>(
        "uploadedImages",
        [],
    );
    const [croppedCutouts, setCroppedCutouts] = useLocalStorage<CroppedCutout[]>(
        "croppedCutouts",
        [],
    );
    const [canvasItems, setCanvasItems] = useLocalStorage<CanvasItem[]>("canvasItems", []);
    const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);
    const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
    const [selectedBgId, setSelectedBgId] = useLocalStorage<BackgroundId>(
        "selectedBgId",
        BackgroundId.Hearts,
    );

    const backgroundStyle = BACKGROUNDS.find((bg) => bg.id === selectedBgId)?.style ?? "white";

    const croppingImage = croppingImageId
        ? (uploadedImages.find((img) => img.id === croppingImageId) ?? null)
        : null;

    function handleUpload(image: UploadedImage) {
        setUploadedImages((prev) => [...prev, image]);
    }

    function handleCropDone(cutout: CroppedCutout) {
        setCroppedCutouts((prev) => [...prev, cutout]);
        setCroppingImageId(null);
    }

    function handleAddToCanvas(cutout: CroppedCutout) {
        setCanvasItems((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                cutoutId: cutout.id,
                src: cutout.src,
                x: 200,
                y: 200,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
            },
        ]);
    }

    function handleDeleteImage(id: string) {
        const cutoutIdsToRemove = new Set(
            croppedCutouts.filter((c) => c.sourceImageId === id).map((c) => c.id),
        );
        setUploadedImages((prev) => prev.filter((img) => img.id !== id));
        setCroppedCutouts((prev) => prev.filter((c) => c.sourceImageId !== id));
        setCanvasItems((prev) => prev.filter((item) => !cutoutIdsToRemove.has(item.cutoutId)));
        if (croppingImageId === id) setCroppingImageId(null);
    }

    function handleDeleteCutout(id: string) {
        setCroppedCutouts((prev) => prev.filter((c) => c.id !== id));
        setCanvasItems((prev) => prev.filter((item) => item.cutoutId !== id));
    }

    function handleDeleteCanvasItem(id: string) {
        setCanvasItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedCanvasItemId(null);
    }

    function handleItemDragEnd(id: string, x: number, y: number) {
        setCanvasItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)));
    }

    function handleItemTransformEnd(
        id: string,
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        rotation: number,
    ) {
        setCanvasItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, x, y, scaleX, scaleY, rotation } : item,
            ),
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-pink-100">
            <div className="flex h-[80vh] w-[80vw] overflow-hidden rounded-lg border-4 border-pink-300 shadow-lg">
                <Sidebar
                    uploadedImages={uploadedImages}
                    croppedCutouts={croppedCutouts}
                    onUpload={handleUpload}
                    onStartCrop={setCroppingImageId}
                    onAddToCanvas={handleAddToCanvas}
                    onDeleteImage={handleDeleteImage}
                    onDeleteCutout={handleDeleteCutout}
                    backgrounds={BACKGROUNDS}
                    selectedBgId={selectedBgId}
                    onSelectBg={setSelectedBgId}
                />
                <Canvas
                    items={canvasItems}
                    selectedItemId={selectedCanvasItemId}
                    onSelect={setSelectedCanvasItemId}
                    onDelete={handleDeleteCanvasItem}
                    onDragEnd={handleItemDragEnd}
                    onTransformEnd={handleItemTransformEnd}
                    onUpload={handleUpload}
                    backgroundStyle={backgroundStyle}
                />
            </div>

            {croppingImage && (
                <ImageCropper
                    image={croppingImage}
                    onDone={handleCropDone}
                    onCancel={() => setCroppingImageId(null)}
                />
            )}
        </div>
    );
}
