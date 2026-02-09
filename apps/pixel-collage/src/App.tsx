import { useState } from "react";
import Canvas from "./components/Canvas";
import ImageCropper from "./components/ImageCropper";
import Sidebar from "./components/Sidebar";

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
}

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
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [croppedCutouts, setCroppedCutouts] = useState<CroppedCutout[]>([]);
    const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
    const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);
    const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
    const [selectedBgId, setSelectedBgId] = useState(BackgroundId.Hearts);

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
            },
        ]);
    }

    function handleDeleteCanvasItem(id: string) {
        setCanvasItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedCanvasItemId(null);
    }

    function handleItemDragEnd(id: string, x: number, y: number) {
        setCanvasItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)));
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
