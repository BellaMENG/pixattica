import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { AnimatedCursor, Footer } from "@pixattica/ui";
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
    cutoutId?: string;
    sourceImageId?: string;
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

interface SampleManifest {
    version: number;
    selectedBgId?: BackgroundId;
    uploadedImages: UploadedImage[];
    croppedCutouts: CroppedCutout[];
    canvasItems: CanvasItem[];
}

const BASE_URL = import.meta.env.BASE_URL;
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "/";
const SAMPLE_MANIFEST_URL = `${BASE_URL}samples/default/manifest.json`;
const SAMPLE_SEED_STORAGE_KEY = "pixelCollageSampleSeedVersion";
const SAMPLE_SEED_VERSION = "1";
const SHOULD_AUTO_SEED = import.meta.env.MODE !== "test";

const BACKGROUNDS: BackgroundOption[] = [
    { id: BackgroundId.White, label: "White", style: "white" },
    { id: BackgroundId.Pink, label: "Light Pink", style: "#fce7f3" },
    {
        id: BackgroundId.Hearts,
        label: "Pixel Hearts",
        style: `url('${BASE_URL}bg-pixel-hearts.svg') repeat`,
    },
];

function measureTextWidth(text: string): number {
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
        ctx.font = `${TEXT_FONT_SIZE}px ${TEXT_FONT_FAMILY}`;
        return ctx.measureText(text).width;
    }
    return text.length * TEXT_FONT_SIZE * 0.6;
}

function isBackgroundId(value: unknown): value is BackgroundId {
    return (
        value === BackgroundId.White || value === BackgroundId.Pink || value === BackgroundId.Hearts
    );
}

function parseSampleManifest(value: unknown): SampleManifest | null {
    if (!value || typeof value !== "object") return null;
    const raw = value as Partial<SampleManifest>;
    if (
        !Array.isArray(raw.uploadedImages) ||
        !Array.isArray(raw.croppedCutouts) ||
        !Array.isArray(raw.canvasItems)
    ) {
        return null;
    }

    return {
        version: typeof raw.version === "number" ? raw.version : 1,
        selectedBgId: isBackgroundId(raw.selectedBgId) ? raw.selectedBgId : undefined,
        uploadedImages: raw.uploadedImages as UploadedImage[],
        croppedCutouts: raw.croppedCutouts as CroppedCutout[],
        canvasItems: raw.canvasItems as CanvasItem[],
    };
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
    const [hasCheckedSampleSeed, setHasCheckedSampleSeed] = useState(!SHOULD_AUTO_SEED);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);
    const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
    const [canvasCroppingImage, setCanvasCroppingImage] = useState<UploadedImage | null>(null);

    const [uploadingNames, setUploadingNames] = useState<Map<string, string>>(new Map());
    const [selectedBgId, setSelectedBgId] = useLocalStorage<BackgroundId>(
        "selectedBgId",
        BackgroundId.Hearts,
    );

    const stageRef = useRef<Konva.Stage>(null);
    const uploadedImagesRef = useRef<UploadedImage[]>(uploadedImages);
    const sampleSeedCheckedRef = useRef(false);

    useEffect(() => {
        uploadedImagesRef.current = uploadedImages;
    }, [uploadedImages]);

    const backgroundStyle = BACKGROUNDS.find((bg) => bg.id === selectedBgId)?.style ?? "white";

    const croppingImage =
        canvasCroppingImage ??
        (croppingImageId
            ? (uploadedImages.find((img) => img.id === croppingImageId) ?? null)
            : null);

    useEffect(() => {
        if (!SHOULD_AUTO_SEED) return;
        if (isLoading || sampleSeedCheckedRef.current) return;
        sampleSeedCheckedRef.current = true;

        const hasSeedFlag = localStorage.getItem(SAMPLE_SEED_STORAGE_KEY) === SAMPLE_SEED_VERSION;
        const hasExistingData =
            uploadedImages.length > 0 || croppedCutouts.length > 0 || canvasItems.length > 0;

        if (hasSeedFlag || hasExistingData) {
            if (!hasSeedFlag && hasExistingData) {
                localStorage.setItem(SAMPLE_SEED_STORAGE_KEY, SAMPLE_SEED_VERSION);
            }
            setHasCheckedSampleSeed(true);
            return;
        }

        let cancelled = false;
        async function seedFromSampleManifest() {
            try {
                const response = await fetch(SAMPLE_MANIFEST_URL, { cache: "no-store" });
                if (!response.ok) return;
                const manifest = parseSampleManifest(await response.json());
                if (!manifest) return;

                setUploadedImages(manifest.uploadedImages);
                setCroppedCutouts(manifest.croppedCutouts);
                setCanvasItems(manifest.canvasItems);
                if (manifest.selectedBgId) {
                    setSelectedBgId(manifest.selectedBgId);
                }
                localStorage.setItem(SAMPLE_SEED_STORAGE_KEY, SAMPLE_SEED_VERSION);
            } catch {
                // Seeding is best-effort; app falls back to empty state when sample assets are unavailable.
            } finally {
                if (!cancelled) {
                    setHasCheckedSampleSeed(true);
                }
            }
        }

        seedFromSampleManifest();
        return () => {
            cancelled = true;
        };
    }, [
        isLoading,
        uploadedImages.length,
        croppedCutouts.length,
        canvasItems.length,
        setUploadedImages,
        setCroppedCutouts,
        setCanvasItems,
        setSelectedBgId,
    ]);

    async function processUpload(file: File) {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return;

        const tempId = crypto.randomUUID();
        setUploadingNames((prev) => new Map(prev).set(tempId, file.name));

        try {
            const src = await readImageFile(file);
            if (uploadedImagesRef.current.some((img) => img.src === src)) return;

            const uploadedImage: UploadedImage = { id: crypto.randomUUID(), src, name: file.name };
            uploadedImagesRef.current = [...uploadedImagesRef.current, uploadedImage];
            setUploadedImages((prev) => [...prev, uploadedImage]);
            handleAddImageToCanvas({ src: uploadedImage.src, sourceImageId: uploadedImage.id });
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
        setCanvasCroppingImage(null);
        handleAddToCanvas(cutout);
    }

    function handleStartCrop(imageId: string) {
        setCanvasCroppingImage(null);
        setCroppingImageId(imageId);
    }

    function handleCropCanvasItem(itemId: string) {
        const selectedItem = canvasItems.find(
            (item): item is CanvasImageItem => item.id === itemId && item.type === "image",
        );
        if (!selectedItem) return;

        const sourceImageId =
            selectedItem.sourceImageId ??
            (selectedItem.cutoutId
                ? croppedCutouts.find((cutout) => cutout.id === selectedItem.cutoutId)
                      ?.sourceImageId
                : undefined) ??
            selectedItem.id;

        setCroppingImageId(null);
        setCanvasCroppingImage({
            id: sourceImageId,
            src: selectedItem.src,
            name: "Canvas image",
        });
    }

    function handleAddImageToCanvas({
        src,
        cutoutId,
        sourceImageId,
    }: {
        src: string;
        cutoutId?: string;
        sourceImageId?: string;
    }) {
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
                    cutoutId,
                    sourceImageId,
                    src,
                    x: canvasSize.width / 2 - (img.naturalWidth * scale) / 2,
                    y: canvasSize.height / 2 - (img.naturalHeight * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    rotation: 0,
                },
            ]);
        };
        img.src = src;
    }

    function handleAddToCanvas(cutout: CroppedCutout) {
        handleAddImageToCanvas({
            src: cutout.src,
            cutoutId: cutout.id,
            sourceImageId: cutout.sourceImageId,
        });
    }

    function handleAddUploadedImageToCanvas(image: UploadedImage) {
        handleAddImageToCanvas({ src: image.src, sourceImageId: image.id });
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
            prev.filter(
                (item) =>
                    item.type !== "image" ||
                    (item.sourceImageId !== id &&
                        !(item.cutoutId && cutoutIdsToRemove.has(item.cutoutId))),
            ),
        );
        if (croppingImageId === id) setCroppingImageId(null);
        if (canvasCroppingImage?.id === id) setCanvasCroppingImage(null);
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

    function handleExportSampleData() {
        const payload: SampleManifest & { generatedAt: string } = {
            version: 1,
            generatedAt: new Date().toISOString(),
            selectedBgId,
            uploadedImages,
            croppedCutouts,
            canvasItems,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        downloadBlob(blob, "pixel-collage-sample-raw.json");
    }

    if (isLoading || !hasCheckedSampleSeed) {
        return (
            <>
                <AnimatedCursor />
                <div className="relative flex h-screen items-center justify-center bg-pink-100">
                    <a
                        href={LANDING_URL}
                        className="absolute left-4 top-4 z-50 rounded border-2 border-pink-300 bg-pink-50 px-2 py-1 text-[10px] text-pink-700 hover:bg-pink-200"
                    >
                        ← back
                    </a>
                    <p className="text-pink-400">Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <AnimatedCursor />
            <div
                className="relative flex h-screen flex-col bg-pink-100"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <a
                    href={LANDING_URL}
                    className="absolute left-4 top-4 z-50 rounded border-2 border-pink-300 bg-pink-50 px-2 py-1 text-[10px] text-pink-700 hover:bg-pink-200"
                >
                    ← back
                </a>
                <div className="flex flex-1 md:items-center md:justify-center">
                    <div className="flex flex-col w-full h-full md:flex-row md:h-[80vh] md:w-[80vw] overflow-hidden md:rounded-lg md:border-4 md:border-pink-300 md:shadow-lg">
                        <Sidebar
                            uploadedImages={uploadedImages}
                            croppedCutouts={croppedCutouts}
                            uploadingNames={uploadingNames}
                            onFileSelect={processUpload}
                            onStartCrop={handleStartCrop}
                            onAddToCanvas={handleAddToCanvas}
                            onAddImageToCanvas={handleAddUploadedImageToCanvas}
                            onDeleteImage={handleDeleteImage}
                            onDeleteCutout={handleDeleteCutout}
                            onAddText={handleAddText}
                            backgrounds={BACKGROUNDS}
                            selectedBgId={selectedBgId}
                            onSelectBg={setSelectedBgId}
                            onSaveImage={handleSaveImage}
                            onEmailImage={handleEmailImage}
                            onExportSampleData={
                                import.meta.env.DEV ? handleExportSampleData : undefined
                            }
                        />
                        <Canvas
                            items={canvasItems}
                            selectedItemId={selectedCanvasItemId}
                            onSelect={setSelectedCanvasItemId}
                            onDelete={handleDeleteCanvasItem}
                            onBringToFront={handleBringToFront}
                            onSendToBack={handleSendToBack}
                            onCrop={handleCropCanvasItem}
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
                            onCancel={() => {
                                setCroppingImageId(null);
                                setCanvasCroppingImage(null);
                            }}
                        />
                    )}
                </div>
                <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
            </div>
        </>
    );
}
