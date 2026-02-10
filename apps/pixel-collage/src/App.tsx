import { useRef, useState } from "react";
import type Konva from "konva";
import { Footer } from "@pixattica/ui";
import AnimatedCursor from "./components/AnimatedCursor";
import Canvas from "./components/Canvas";
import ImageCropper from "./components/ImageCropper";
import Sidebar from "./components/Sidebar";
import { MAX_CUTOUT_SIZE_RATIO, TEXT_FONT_FAMILY, TEXT_FONT_SIZE } from "./config";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { exportCanvasToBlob, downloadBlob } from "./utils/exportCanvas";
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

interface CanvasItemBase {
    id: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}

export interface CanvasImageItem extends CanvasItemBase {
    type: "image";
    cutoutId: string;
    src: string;
}

export interface CanvasTextItem extends CanvasItemBase {
    type: "text";
    text: string;
}

export type CanvasItem = CanvasImageItem | CanvasTextItem;

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

function measureTextWidth(text: string): number {
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
        ctx.font = `${TEXT_FONT_SIZE}px ${TEXT_FONT_FAMILY}`;
        return ctx.measureText(text).width;
    }
    return text.length * TEXT_FONT_SIZE * 0.6;
}

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

    const [uploadingNames, setUploadingNames] = useState<Map<string, string>>(new Map());
    const [selectedBgId, setSelectedBgId] = useLocalStorage<BackgroundId>(
        "selectedBgId",
        BackgroundId.Hearts,
    );

    const stageRef = useRef<Konva.Stage>(null);

    const backgroundStyle = BACKGROUNDS.find((bg) => bg.id === selectedBgId)?.style ?? "white";

    const croppingImage = croppingImageId
        ? (uploadedImages.find((img) => img.id === croppingImageId) ?? null)
        : null;

    async function processUpload(file: File) {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return;

        const tempId = crypto.randomUUID();
        setUploadingNames((prev) => new Map(prev).set(tempId, file.name));

        try {
            const src = await readImageFile(file);
            setUploadedImages((prev) => {
                if (prev.some((img) => img.src === src)) return prev;
                return [...prev, { id: crypto.randomUUID(), src, name: file.name }];
            });
        } catch {
            // File read failures are silently ignored since there is
            // no actionable recovery path for the user beyond retrying.
        } finally {
            setUploadingNames((prev) => {
                const next = new Map(prev);
                next.delete(tempId);
                return next;
            });
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        for (const file of Array.from(e.dataTransfer.files)) {
            processUpload(file);
        }
    }

    function handleCropDone(cutout: CroppedCutout) {
        setCroppedCutouts((prev) => [...prev, cutout]);
        setCroppingImageId(null);
        handleAddToCanvas(cutout);
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
                    type: "image",
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

    function handleAddText(text: string) {
        const textWidth = measureTextWidth(text);

        setCanvasItems((prev) => [
            ...prev,
            {
                type: "text",
                id: crypto.randomUUID(),
                text,
                x: canvasSize.width / 2 - textWidth / 2,
                y: canvasSize.height / 2 - TEXT_FONT_SIZE / 2,
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
        setCanvasItems((prev) =>
            prev.filter((item) => item.type !== "image" || !cutoutIdsToRemove.has(item.cutoutId)),
        );
        if (croppingImageId === id) setCroppingImageId(null);
    }

    function handleDeleteCutout(id: string) {
        setCroppedCutouts((prev) => prev.filter((c) => c.id !== id));
        setCanvasItems((prev) =>
            prev.filter((item) => item.type !== "image" || item.cutoutId !== id),
        );
    }

    function handleDeleteCanvasItem(id: string) {
        setCanvasItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedCanvasItemId(null);
    }

    function handleBringToFront(id: string) {
        setCanvasItems((prev) => {
            const idx = prev.findIndex((item) => item.id === id);
            if (idx === -1 || idx === prev.length - 1) return prev;
            const item = prev[idx];
            return [...prev.slice(0, idx), ...prev.slice(idx + 1), item];
        });
    }

    function handleSendToBack(id: string) {
        setCanvasItems((prev) => {
            const idx = prev.findIndex((item) => item.id === id);
            if (idx <= 0) return prev;
            const item = prev[idx];
            return [item, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
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

    async function handleSaveImage() {
        if (!stageRef.current) return;
        const blob = await exportCanvasToBlob(
            stageRef.current,
            backgroundStyle,
            canvasSize.width,
            canvasSize.height,
        );
        downloadBlob(blob, "pixattica-collage.png");
    }

    async function handleEmailImage() {
        if (!stageRef.current) return;
        const blob = await exportCanvasToBlob(
            stageRef.current,
            backgroundStyle,
            canvasSize.width,
            canvasSize.height,
        );
        downloadBlob(blob, "pixattica-collage.png");
        window.open("mailto:?subject=My%20Pixattica%20Collage");
    }

    if (isLoading) {
        return (
            <>
                <AnimatedCursor />
                <div className="flex h-screen items-center justify-center bg-pink-100">
                    <p className="text-pink-400">Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <AnimatedCursor />
            <div
                className="flex h-screen flex-col bg-pink-100"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex h-[80vh] w-[80vw] overflow-hidden rounded-lg border-4 border-pink-300 shadow-lg">
                        <Sidebar
                            uploadedImages={uploadedImages}
                            croppedCutouts={croppedCutouts}
                            uploadingNames={uploadingNames}
                            onFileSelect={processUpload}
                            onStartCrop={setCroppingImageId}
                            onAddToCanvas={handleAddToCanvas}
                            onDeleteImage={handleDeleteImage}
                            onDeleteCutout={handleDeleteCutout}
                            onAddText={handleAddText}
                            backgrounds={BACKGROUNDS}
                            selectedBgId={selectedBgId}
                            onSelectBg={setSelectedBgId}
                            onSaveImage={handleSaveImage}
                            onEmailImage={handleEmailImage}
                        />
                        <Canvas
                            items={canvasItems}
                            selectedItemId={selectedCanvasItemId}
                            onSelect={setSelectedCanvasItemId}
                            onDelete={handleDeleteCanvasItem}
                            onBringToFront={handleBringToFront}
                            onSendToBack={handleSendToBack}
                            onDragEnd={handleItemDragEnd}
                            onTransformEnd={handleItemTransformEnd}
                            onResize={setCanvasSize}
                            backgroundStyle={backgroundStyle}
                            stageRef={stageRef}
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
                <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
            </div>
        </>
    );
}
