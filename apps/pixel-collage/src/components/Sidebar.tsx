import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
    ACCEPTED_IMAGE_EXTENSIONS,
    ACCEPTED_IMAGE_TYPES,
    type UploadedImage,
    type CroppedCutout,
    type BackgroundOption,
    type BackgroundId,
} from "../App";
const VISIBLE_CARDS = 2;

type ScrollDirection = "up" | "down";

interface SidebarProps {
    uploadedImages: UploadedImage[];
    croppedCutouts: CroppedCutout[];
    uploadingNames: Map<string, string>;
    onFileSelect: (file: File) => void;
    onStartCrop: (imageId: string) => void;
    onAddToCanvas: (cutout: CroppedCutout) => void;
    onDeleteImage: (id: string) => void;
    onDeleteCutout: (id: string) => void;
    backgrounds: BackgroundOption[];
    selectedBgId: BackgroundId;
    onSelectBg: (id: BackgroundId) => void;
    onSaveImage: () => void;
    onEmailImage: () => void;
}

function clampStartIndex(startIndex: number, totalCount: number): number {
    return Math.min(startIndex, Math.max(0, totalCount - VISIBLE_CARDS));
}

function ScrollArrow({
    direction,
    label,
    disabled,
    onClick,
}: {
    direction: ScrollDirection;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`w-full flex justify-center py-0.5 transition-colors ${
                disabled
                    ? "text-pink-200 cursor-default"
                    : "text-pink-400 hover:text-pink-600 cursor-pointer"
            }`}
        >
            <span className="text-[10px]">{direction === "up" ? "▲" : "▼"}</span>
        </button>
    );
}

const SIDEBAR_SCROLL_AMOUNT = 80;

function SidebarScrollArrow({
    direction,
    disabled,
    onClick,
}: {
    direction: ScrollDirection;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            aria-label={`Scroll sidebar ${direction}`}
            disabled={disabled}
            onClick={onClick}
            className={`w-full flex justify-center py-1 transition-colors ${
                disabled
                    ? "text-pink-200 cursor-default"
                    : "text-pink-400 hover:text-pink-600 cursor-pointer"
            }`}
        >
            <span className="text-xs">{direction === "up" ? "▲" : "▼"}</span>
        </button>
    );
}

function ScrollableCardList({
    sectionName,
    startIndex,
    totalCount,
    onScrollUp,
    onScrollDown,
    children,
}: {
    sectionName: string;
    startIndex: number;
    totalCount: number;
    onScrollUp: () => void;
    onScrollDown: () => void;
    children: ReactNode;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canScrollUp = startIndex > 0;
    const canScrollDown = startIndex + VISIBLE_CARDS < totalCount;

    const isWindowed = totalCount > VISIBLE_CARDS;
    const latestRef = useRef({ canScrollUp, canScrollDown, onScrollUp, onScrollDown, isWindowed });
    latestRef.current = { canScrollUp, canScrollDown, onScrollUp, onScrollDown, isWindowed };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        function handleWheel(e: WheelEvent) {
            const { canScrollUp, canScrollDown, onScrollUp, onScrollDown, isWindowed } =
                latestRef.current;

            if (!isWindowed) return;

            e.preventDefault();
            e.stopPropagation();

            if (e.deltaY > 0 && canScrollDown) {
                onScrollDown();
            } else if (e.deltaY < 0 && canScrollUp) {
                onScrollUp();
            }
        }

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    return (
        <div
            ref={containerRef}
            data-scrollable-cards
            className="rounded-lg border-2 border-pink-200 p-2"
        >
            <ScrollArrow
                direction="up"
                label={`Scroll ${sectionName} up`}
                disabled={!canScrollUp}
                onClick={onScrollUp}
            />
            <div className="space-y-2">{children}</div>
            <ScrollArrow
                direction="down"
                label={`Scroll ${sectionName} down`}
                disabled={!canScrollDown}
                onClick={onScrollDown}
            />
        </div>
    );
}

function ImageCard({
    img,
    onStartCrop,
    onDeleteImage,
}: {
    img: UploadedImage;
    onStartCrop: (id: string) => void;
    onDeleteImage: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 rounded border border-pink-200 p-1">
            <img src={img.src} alt={img.name} className="h-10 w-10 rounded object-cover" />
            <div className="flex-1 min-w-0">
                <p className="truncate text-[10px] text-pink-600">{img.name}</p>
                <div className="mt-0.5 flex gap-1">
                    <button
                        onClick={() => onStartCrop(img.id)}
                        className="rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                    >
                        Crop
                    </button>
                    <button
                        onClick={() => onDeleteImage(img.id)}
                        className="rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                        title="Delete image"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}

function UploadingCard({ fileName }: { fileName: string }) {
    return (
        <div
            data-testid="upload-loading-placeholder"
            className="flex items-center gap-2 rounded border border-pink-200 p-1"
        >
            <div className="h-10 w-10 rounded bg-pink-200 animate-pulse" />
            <div className="flex-1 min-w-0">
                <p className="truncate text-[10px] text-pink-600">{fileName}</p>
            </div>
        </div>
    );
}

function CutoutCard({
    cutout,
    onAddToCanvas,
    onDeleteCutout,
}: {
    cutout: CroppedCutout;
    onAddToCanvas: (cutout: CroppedCutout) => void;
    onDeleteCutout: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 rounded border border-pink-200 p-1">
            <img
                src={cutout.src}
                alt="Cutout"
                className="h-10 w-10 rounded object-contain bg-white"
            />
            <div className="flex gap-1">
                <button
                    onClick={() => onAddToCanvas(cutout)}
                    className="rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                >
                    Add to Canvas
                </button>
                <button
                    onClick={() => onDeleteCutout(cutout.id)}
                    className="rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                    title="Delete cutout"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export default function Sidebar({
    uploadedImages,
    croppedCutouts,
    uploadingNames,
    onFileSelect,
    onStartCrop,
    onAddToCanvas,
    onDeleteImage,
    onDeleteCutout,
    backgrounds,
    selectedBgId,
    onSelectBg,
    onSaveImage,
    onEmailImage,
}: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [imageStartIndex, setImageStartIndex] = useState(0);
    const [cutoutStartIndex, setCutoutStartIndex] = useState(0);
    const [canScrollSidebarUp, setCanScrollSidebarUp] = useState(false);
    const [canScrollSidebarDown, setCanScrollSidebarDown] = useState(false);

    const updateSidebarScrollState = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        setCanScrollSidebarUp(el.scrollTop > 0);
        setCanScrollSidebarDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        updateSidebarScrollState();
    });

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        function handleWheel(e: WheelEvent) {
            const target = e.target as HTMLElement;
            if (target.closest("[data-scrollable-cards]")) {
                e.preventDefault();
            }
        }

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    function scrollSidebar(direction: ScrollDirection) {
        scrollContainerRef.current?.scrollBy({
            top: direction === "up" ? -SIDEBAR_SCROLL_AMOUNT : SIDEBAR_SCROLL_AMOUNT,
            behavior: "smooth",
        });
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
                onFileSelect(file);
            }
        }
        e.target.value = "";
    }

    const allImageEntries = [
        ...uploadedImages.map((img) => ({ type: "image" as const, key: img.id, img })),
        ...Array.from(uploadingNames).map(([tempId, fileName]) => ({
            type: "uploading" as const,
            key: tempId,
            fileName,
        })),
    ];
    const totalImageCount = allImageEntries.length;
    const clampedImageStart = clampStartIndex(imageStartIndex, totalImageCount);
    const visibleImageEntries = allImageEntries.slice(
        clampedImageStart,
        clampedImageStart + VISIBLE_CARDS,
    );

    const totalCutoutCount = croppedCutouts.length;
    const clampedCutoutStart = clampStartIndex(cutoutStartIndex, totalCutoutCount);
    const visibleCutouts = croppedCutouts.slice(
        clampedCutoutStart,
        clampedCutoutStart + VISIBLE_CARDS,
    );

    return (
        <aside className="flex w-64 flex-col border-r-4 border-pink-300 bg-pink-50 overflow-hidden">
            <SidebarScrollArrow
                direction="up"
                disabled={!canScrollSidebarUp}
                onClick={() => scrollSidebar("up")}
            />
            <div
                ref={scrollContainerRef}
                onScroll={updateSidebarScrollState}
                className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-0 pb-0"
            >
                <section className="mb-6">
                    <h3 className="mb-2 text-xs text-pink-600">Images</h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-2 w-full rounded bg-pink-400 px-2 py-1 text-[11px] text-white hover:bg-pink-500 transition-colors cursor-pointer"
                    >
                        Upload Image
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_EXTENSIONS}
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {totalImageCount === 0 ? (
                        <p className="text-[10px] text-pink-300">No images yet</p>
                    ) : (
                        <ScrollableCardList
                            sectionName="images"
                            startIndex={clampedImageStart}
                            totalCount={totalImageCount}
                            onScrollUp={() => setImageStartIndex((i) => Math.max(0, i - 1))}
                            onScrollDown={() =>
                                setImageStartIndex((i) =>
                                    Math.min(i + 1, totalImageCount - VISIBLE_CARDS),
                                )
                            }
                        >
                            {visibleImageEntries.map((entry) =>
                                entry.type === "image" ? (
                                    <ImageCard
                                        key={entry.key}
                                        img={entry.img}
                                        onStartCrop={onStartCrop}
                                        onDeleteImage={onDeleteImage}
                                    />
                                ) : (
                                    <UploadingCard key={entry.key} fileName={entry.fileName} />
                                ),
                            )}
                        </ScrollableCardList>
                    )}
                </section>

                <section className="mb-6">
                    <h3 className="mb-2 text-xs text-pink-600">Cutouts</h3>
                    {totalCutoutCount === 0 ? (
                        <p className="text-[10px] text-pink-300">No cutouts yet</p>
                    ) : (
                        <ScrollableCardList
                            sectionName="cutouts"
                            startIndex={clampedCutoutStart}
                            totalCount={totalCutoutCount}
                            onScrollUp={() => setCutoutStartIndex((i) => Math.max(0, i - 1))}
                            onScrollDown={() =>
                                setCutoutStartIndex((i) =>
                                    Math.min(i + 1, totalCutoutCount - VISIBLE_CARDS),
                                )
                            }
                        >
                            {visibleCutouts.map((cutout) => (
                                <CutoutCard
                                    key={cutout.id}
                                    cutout={cutout}
                                    onAddToCanvas={onAddToCanvas}
                                    onDeleteCutout={onDeleteCutout}
                                />
                            ))}
                        </ScrollableCardList>
                    )}
                </section>

                <section className="mt-auto">
                    <h3 className="mb-2 text-xs text-pink-600">Background</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {backgrounds.map((bg) => (
                            <button
                                key={bg.id}
                                title={bg.label}
                                onClick={() => onSelectBg(bg.id)}
                                className={`aspect-square w-full rounded border-2 cursor-pointer transition-colors ${
                                    selectedBgId === bg.id
                                        ? "border-pink-500 ring-2 ring-pink-300"
                                        : "border-pink-200 hover:border-pink-400"
                                }`}
                                style={{ background: bg.style }}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-6 mb-4">
                    <h3 className="mb-2 text-xs text-pink-600">Export</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={onSaveImage}
                            className="flex-1 rounded bg-pink-400 px-2 py-1 text-[11px] text-white hover:bg-pink-500 transition-colors cursor-pointer"
                        >
                            Save Image
                        </button>
                        <button
                            onClick={onEmailImage}
                            className="flex-1 rounded bg-pink-400 px-2 py-1 text-[11px] text-white hover:bg-pink-500 transition-colors cursor-pointer"
                        >
                            Email
                        </button>
                    </div>
                </section>
            </div>
            <SidebarScrollArrow
                direction="down"
                disabled={!canScrollSidebarDown}
                onClick={() => scrollSidebar("down")}
            />
        </aside>
    );
}
