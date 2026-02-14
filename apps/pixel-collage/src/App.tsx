import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { AnimatedCursor, Footer } from "@pixattica/ui";
import Canvas from "./components/Canvas";
import ConfirmModal from "./components/ConfirmModal";
import ImageCropper from "./components/ImageCropper";
import Sidebar from "./components/Sidebar";
import {
    MAX_CUTOUT_SIZE_RATIO,
    TEXT_BOX_MIN_WIDTH,
    TEXT_FONT_FAMILY,
    TEXT_FONT_SIZE,
} from "./config";
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
    width?: number;
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

enum EraseConfirmationStep {
    None = "none",
    First = "first",
    Second = "second",
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
    canvasItems: SampleCanvasItem[];
    canvasReferenceSize?: SampleCanvasSize;
    canvasCoordinateMode?: "absolute" | "relative";
}

interface SampleCanvasSize {
    width: number;
    height: number;
}

type SampleCanvasItem = (
    | (Omit<CanvasImageItem, "x" | "y"> & { x?: number; y?: number })
    | (Omit<CanvasTextItem, "x" | "y"> & { x?: number; y?: number })
) & {
    xRatio?: number;
    yRatio?: number;
    scaleRatio?: number;
    scaleXRatio?: number;
    scaleYRatio?: number;
    widthRatio?: number;
};

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

function isSampleCanvasSize(value: unknown): value is SampleCanvasSize {
    if (!value || typeof value !== "object") return false;
    const raw = value as Partial<SampleCanvasSize>;
    return (
        typeof raw.width === "number" &&
        Number.isFinite(raw.width) &&
        raw.width > 0 &&
        typeof raw.height === "number" &&
        Number.isFinite(raw.height) &&
        raw.height > 0
    );
}

function hasRelativeSamplePosition(item: SampleCanvasItem): boolean {
    return (
        typeof item.xRatio === "number" &&
        Number.isFinite(item.xRatio) &&
        typeof item.yRatio === "number" &&
        Number.isFinite(item.yRatio)
    );
}

function hasRelativeSampleSizing(item: SampleCanvasItem): boolean {
    return (
        (typeof item.scaleRatio === "number" && Number.isFinite(item.scaleRatio)) ||
        (typeof item.scaleXRatio === "number" && Number.isFinite(item.scaleXRatio)) ||
        (typeof item.scaleYRatio === "number" && Number.isFinite(item.scaleYRatio)) ||
        (typeof item.widthRatio === "number" && Number.isFinite(item.widthRatio))
    );
}

function resolveSampleCoordinate(
    value: number | undefined,
    ratio: number | undefined,
    targetSize: number,
    referenceSize: number | undefined,
): number {
    if (typeof ratio === "number" && Number.isFinite(ratio)) {
        return ratio * targetSize;
    }
    if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        typeof referenceSize === "number" &&
        Number.isFinite(referenceSize) &&
        referenceSize > 0 &&
        targetSize > 0
    ) {
        return (value / referenceSize) * targetSize;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 0;
}

function resolveSampleSize(
    value: number | undefined,
    ratio: number | undefined,
    targetSize: number,
    referenceSize: number | undefined,
): number {
    if (typeof ratio === "number" && Number.isFinite(ratio)) {
        return ratio * targetSize;
    }
    if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        typeof referenceSize === "number" &&
        Number.isFinite(referenceSize) &&
        referenceSize > 0 &&
        targetSize > 0
    ) {
        return (value / referenceSize) * targetSize;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 1;
}

function resolveSampleCanvasItems(
    items: SampleCanvasItem[],
    targetSize: SampleCanvasSize,
    referenceSize?: SampleCanvasSize,
): CanvasItem[] {
    return items.map((item) => {
        const x = resolveSampleCoordinate(
            item.x,
            item.xRatio,
            targetSize.width,
            referenceSize?.width,
        );
        const y = resolveSampleCoordinate(
            item.y,
            item.yRatio,
            targetSize.height,
            referenceSize?.height,
        );
        const sourceScale =
            typeof item.scaleX === "number"
                ? item.scaleX
                : typeof item.scaleY === "number"
                  ? item.scaleY
                  : undefined;
        const scaleRatio =
            typeof item.scaleRatio === "number"
                ? item.scaleRatio
                : typeof item.scaleXRatio === "number"
                  ? item.scaleXRatio
                  : item.scaleYRatio;
        const uniformScale = resolveSampleSize(
            sourceScale,
            scaleRatio,
            targetSize.width,
            referenceSize?.width,
        );

        if (item.type === "image") {
            return {
                ...item,
                x,
                y,
                // Keep artifact aspect ratio locked by using one scale driver.
                scaleX: uniformScale,
                scaleY: uniformScale,
            };
        }
        return {
            ...item,
            x,
            y,
            // Keep artifact aspect ratio locked by using one scale driver.
            scaleX: uniformScale,
            scaleY: uniformScale,
            width:
                typeof item.width === "number"
                    ? resolveSampleSize(
                          item.width,
                          item.widthRatio,
                          targetSize.width,
                          referenceSize?.width,
                      )
                    : item.width,
        };
    });
}

function normalizeSampleAssetSrc(src: string): string {
    if (!src) return src;
    if (/^(data:|blob:|https?:\/\/|\/\/)/i.test(src)) return src;
    if (src.startsWith(BASE_URL)) return src;

    if (src.startsWith("/samples/")) {
        const baseNoTrailingSlash = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
        return `${baseNoTrailingSlash}${src}`;
    }
    if (src.startsWith("samples/")) {
        return `${BASE_URL}${src}`;
    }
    return src;
}

function normalizeUploadedImages(images: UploadedImage[]): [UploadedImage[], boolean] {
    let changed = false;
    const normalized = images.map((image) => {
        const src = normalizeSampleAssetSrc(image.src);
        if (src !== image.src) {
            changed = true;
            return { ...image, src };
        }
        return image;
    });
    return [normalized, changed];
}

function normalizeCroppedCutouts(cutouts: CroppedCutout[]): [CroppedCutout[], boolean] {
    let changed = false;
    const normalized = cutouts.map((cutout) => {
        const src = normalizeSampleAssetSrc(cutout.src);
        if (src !== cutout.src) {
            changed = true;
            return { ...cutout, src };
        }
        return cutout;
    });
    return [normalized, changed];
}

function normalizeCanvasItems(items: CanvasItem[]): [CanvasItem[], boolean] {
    let changed = false;
    const normalized = items.map((item) => {
        if (item.type !== "image") return item;
        const src = normalizeSampleAssetSrc(item.src);
        if (src !== item.src) {
            changed = true;
            return { ...item, src };
        }
        return item;
    });
    return [normalized, changed];
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
        canvasReferenceSize: isSampleCanvasSize(raw.canvasReferenceSize)
            ? raw.canvasReferenceSize
            : undefined,
        canvasCoordinateMode: raw.canvasCoordinateMode === "relative" ? "relative" : "absolute",
        uploadedImages: (raw.uploadedImages as UploadedImage[]).map((image) => ({
            ...image,
            src: normalizeSampleAssetSrc(image.src),
        })),
        croppedCutouts: (raw.croppedCutouts as CroppedCutout[]).map((cutout) => ({
            ...cutout,
            src: normalizeSampleAssetSrc(cutout.src),
        })),
        canvasItems: (raw.canvasItems as SampleCanvasItem[]).map((item) =>
            item.type === "image" ? { ...item, src: normalizeSampleAssetSrc(item.src) } : item,
        ),
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
    const [eraseConfirmationStep, setEraseConfirmationStep] = useState(EraseConfirmationStep.None);

    const [uploadingNames, setUploadingNames] = useState<Map<string, string>>(new Map());
    const [selectedBgId, setSelectedBgId] = useLocalStorage<BackgroundId>(
        "selectedBgId",
        BackgroundId.Hearts,
    );

    const stageRef = useRef<Konva.Stage>(null);
    const uploadedImagesRef = useRef<UploadedImage[]>(uploadedImages);
    const sampleSeedCheckedRef = useRef(false);
    const pendingRelativeSampleManifestRef = useRef<SampleManifest | null>(null);

    useEffect(() => {
        uploadedImagesRef.current = uploadedImages;
    }, [uploadedImages]);

    useEffect(() => {
        const pendingManifest = pendingRelativeSampleManifestRef.current;
        if (!pendingManifest) return;
        if (canvasSize.width <= 0 || canvasSize.height <= 0) return;
        const resolvedCanvasSize = { width: canvasSize.width, height: canvasSize.height };

        setCanvasItems(
            resolveSampleCanvasItems(
                pendingManifest.canvasItems,
                resolvedCanvasSize,
                pendingManifest.canvasReferenceSize,
            ),
        );
        pendingRelativeSampleManifestRef.current = null;
    }, [canvasSize.width, canvasSize.height, setCanvasItems]);

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
                const shouldResolveRelative =
                    manifest.canvasCoordinateMode === "relative" ||
                    manifest.canvasItems.some(
                        (item) => hasRelativeSamplePosition(item) || hasRelativeSampleSizing(item),
                    );

                if (!shouldResolveRelative) {
                    setCanvasItems(manifest.canvasItems as CanvasItem[]);
                } else if (canvasSize.width > 0 && canvasSize.height > 0) {
                    const resolvedCanvasSize = {
                        width: canvasSize.width,
                        height: canvasSize.height,
                    };
                    setCanvasItems(
                        resolveSampleCanvasItems(
                            manifest.canvasItems,
                            resolvedCanvasSize,
                            manifest.canvasReferenceSize,
                        ),
                    );
                } else {
                    pendingRelativeSampleManifestRef.current = manifest;
                }
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
        canvasSize.width,
        canvasSize.height,
    ]);

    useEffect(() => {
        if (isLoading) return;

        const [normalizedImages, imagesChanged] = normalizeUploadedImages(uploadedImages);
        const [normalizedCutouts, cutoutsChanged] = normalizeCroppedCutouts(croppedCutouts);
        const [normalizedCanvasItems, canvasItemsChanged] = normalizeCanvasItems(canvasItems);

        if (imagesChanged) setUploadedImages(normalizedImages);
        if (cutoutsChanged) setCroppedCutouts(normalizedCutouts);
        if (canvasItemsChanged) setCanvasItems(normalizedCanvasItems);
    }, [
        isLoading,
        uploadedImages,
        croppedCutouts,
        canvasItems,
        setUploadedImages,
        setCroppedCutouts,
        setCanvasItems,
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
                width: Math.max(textWidth, TEXT_BOX_MIN_WIDTH),
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

    function handleEraseCanvas() {
        if (canvasItems.length === 0) return;
        setEraseConfirmationStep(EraseConfirmationStep.First);
    }

    function handleCancelEraseCanvas() {
        setEraseConfirmationStep(EraseConfirmationStep.None);
    }

    function handleConfirmEraseCanvas() {
        if (eraseConfirmationStep === EraseConfirmationStep.First) {
            setEraseConfirmationStep(EraseConfirmationStep.Second);
            return;
        }
        if (eraseConfirmationStep !== EraseConfirmationStep.Second) return;

        setCanvasItems([]);
        setSelectedCanvasItemId(null);
        setEraseConfirmationStep(EraseConfirmationStep.None);
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
        setCanvasItems((prev) => {
            return prev.map((item) => {
                if (item.id !== id) return item;
                if (item.type !== "text") {
                    return { ...item, x, y, scaleX, scaleY, rotation };
                }

                const baseWidth =
                    item.width ?? Math.max(measureTextWidth(item.text), TEXT_BOX_MIN_WIDTH);
                const nextWidth = Math.max(TEXT_BOX_MIN_WIDTH, baseWidth * Math.abs(scaleX));
                return {
                    ...item,
                    x,
                    y,
                    rotation,
                    width: nextWidth,
                    // For text we convert transform scaling into box width and keep glyph scale stable.
                    scaleX: 1,
                    scaleY: 1,
                };
            });
        });
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
                            onEraseCanvas={handleEraseCanvas}
                            hasCanvasItems={canvasItems.length > 0}
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
                    <ConfirmModal
                        isOpen={eraseConfirmationStep !== EraseConfirmationStep.None}
                        title={
                            eraseConfirmationStep === EraseConfirmationStep.Second
                                ? "Final confirmation"
                                : "Erase entire canvas?"
                        }
                        message={
                            eraseConfirmationStep === EraseConfirmationStep.Second
                                ? "This cannot be undone. Confirm to erase everything on the canvas."
                                : "This will remove all images and texts currently placed on your canvas."
                        }
                        confirmLabel={
                            eraseConfirmationStep === EraseConfirmationStep.Second
                                ? "Erase Everything"
                                : "Erase"
                        }
                        cancelLabel="Keep Canvas"
                        onConfirm={handleConfirmEraseCanvas}
                        onCancel={handleCancelEraseCanvas}
                    />
                </div>
                <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
            </div>
        </>
    );
}
