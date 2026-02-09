import { useState } from "react";
import Canvas from "./components/Canvas";
import ImageCropper from "./components/ImageCropper";
import Sidebar from "./components/Sidebar";
import { MAX_CUTOUT_SIZE_RATIO } from "./config";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { readImageFile } from "./utils/readImageFile";

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
    const [uploadedImages, setUploadedImages, imagesLoading] = useIndexedDB<UploadedImage[]>(
        "uploadedImages",
        [],
    );
    const [croppedCutouts, setCroppedCutouts, cutoutsLoading] = useIndexedDB<CroppedCutout[]>(
        "croppedCutouts",
        [],
    );
    const [canvasItems, setCanvasItems, canvasItemsLoading] = useIndexedDB<CanvasItem[]>(
        "canvasItems",
        [],
    );
    const isLoading = imagesLoading || cutoutsLoading || canvasItemsLoading;
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
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

    async function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !ACCEPTED_IMAGE_TYPES.has(file.type)) return;

        const src = await readImageFile(file);
        handleUpload({
            id: crypto.randomUUID(),
            src,
            name: file.name,
        });
    }

    function handleCropDone(cutout: CroppedCutout) {
        setCroppedCutouts((prev) => [...prev, cutout]);
        setCroppingImageId(null);
    }

    function handleAddToCanvas(cutout: CroppedCutout) {
        const img = new Image();
        img.onload = () => {
            const maxW = canvasSize.width * MAX_CUTOUT_SIZE_RATIO;
            const maxH = canvasSize.height * MAX_CUTOUT_SIZE_RATIO;
            const scale =
                maxW > 0 && maxH > 0
                    ? Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
                    : 1;

            setCanvasItems((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    cutoutId: cutout.id,
                    src: cutout.src,
                    x: canvasSize.width / 2 - (img.naturalWidth * scale) / 2,
                    y: canvasSize.height / 2 - (img.naturalHeight * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    rotation: 0,
                },
            ]);
        };
        img.src = cutout.src;
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

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-pink-100">
                <p className="text-pink-400">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className="flex h-screen items-center justify-center bg-pink-100"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
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
                    onResize={setCanvasSize}
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
