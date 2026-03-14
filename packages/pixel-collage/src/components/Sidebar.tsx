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
const scrollArrowBaseClassName = "flex w-full justify-center transition-colors";
const scrollArrowEnabledClassName = "cursor-pointer text-pink-400 hover:text-pink-600";
const scrollArrowDisabledClassName = "cursor-default text-pink-200";
const scrollableCardListClassName = "rounded-lg border-2 border-pink-200 p-2";
const itemCardClassName = "flex items-center gap-2 rounded border border-pink-200 p-1";
const thumbnailClassName = "h-10 w-10 rounded";
const imageThumbnailClassName = `${thumbnailClassName} object-cover`;
const cutoutThumbnailClassName = `${thumbnailClassName} bg-white object-contain`;
const loadingThumbnailClassName = `${thumbnailClassName} animate-pulse bg-pink-200`;
const itemMetaClassName = "min-w-0 flex-1";
const itemNameClassName = "truncate text-[10px] text-pink-600";
const itemButtonRowClassName = "mt-0.5 flex gap-1";
const smallActionButtonClassName =
    "cursor-pointer rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 " +
    "transition-colors hover:bg-pink-300";
const sidebarClassName =
    "flex min-h-0 w-full max-h-[40vh] flex-col overflow-hidden border-b-4 border-pink-300 " +
    "bg-pink-50 md:w-64 md:max-h-none md:border-b-0 md:border-r-4";
const scrollContainerClassName = "scrollbar-hide min-h-0 flex-1 overflow-y-auto p-4 pt-0 pb-0";
const sectionClassName = "mb-6";
const sectionTitleClassName = "mb-2 text-xs text-pink-600";
const emptyStateTextClassName = "text-[10px] text-pink-300";
const primaryButtonClassName =
    "cursor-pointer rounded bg-pink-400 px-2 py-1 text-[11px] text-white transition-colors " +
    "hover:bg-pink-500";
const formRowClassName = "flex gap-2";
const textInputClassName =
    "min-w-0 flex-1 rounded border-2 border-pink-200 bg-white px-2 py-1 text-[11px] " +
    "text-pink-700 placeholder-pink-300 outline-none focus:border-pink-400";
const disabledPrimaryButtonClassName = "disabled:cursor-default disabled:opacity-50";
const backgroundGridClassName = "grid grid-cols-3 gap-2";
const backgroundSwatchButtonClassName =
    "aspect-square w-full cursor-pointer rounded border-2 transition-colors";
const backgroundSwatchActiveClassName = "border-pink-500 ring-2 ring-pink-300";
const backgroundSwatchInactiveClassName = "border-pink-200 hover:border-pink-400";
const exportButtonRowClassName = "flex gap-2";
const secondaryButtonClassName =
    "cursor-pointer rounded bg-pink-100 px-2 py-1 text-[10px] text-pink-700 " +
    "transition-colors hover:bg-pink-200";
const destructiveButtonClassName =
    "w-full rounded bg-rose-500 px-2 py-1 text-[11px] text-white transition-colors " +
    "hover:bg-rose-600 cursor-pointer disabled:opacity-50 disabled:cursor-default";

type ScrollDirection = "up" | "down";

interface SidebarProps {
    uploadedImages: UploadedImage[];
    croppedCutouts: CroppedCutout[];
    uploadingNames: Map<string, string>;
    onFileSelect: (file: File) => void;
    onStartCrop: (imageId: string) => void;
    onAddToCanvas: (cutout: CroppedCutout) => void;
    onAddImageToCanvas: (image: UploadedImage) => void;
    onDeleteImage: (id: string) => void;
    onDeleteCutout: (id: string) => void;
    onAddText: (text: string) => void;
    backgrounds: BackgroundOption[];
    selectedBgId: BackgroundId;
    onSelectBg: (id: BackgroundId) => void;
    onSaveImage: () => void;
    onEmailImage: () => void;
    onEraseCanvas: () => void;
    hasCanvasItems: boolean;
    onExportSampleData?: () => void;
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
            className={`${scrollArrowBaseClassName} py-0.5 ${
                disabled ? scrollArrowDisabledClassName : scrollArrowEnabledClassName
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
            className={`${scrollArrowBaseClassName} py-1 ${
                disabled ? scrollArrowDisabledClassName : scrollArrowEnabledClassName
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
        <div ref={containerRef} data-scrollable-cards className={scrollableCardListClassName}>
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
    onAddImageToCanvas,
    onStartCrop,
    onDeleteImage,
}: {
    img: UploadedImage;
    onAddImageToCanvas: (image: UploadedImage) => void;
    onStartCrop: (id: string) => void;
    onDeleteImage: (id: string) => void;
}) {
    return (
        <div className={itemCardClassName}>
            <img src={img.src} alt={img.name} className={imageThumbnailClassName} />
            <div className={itemMetaClassName}>
                <p className={itemNameClassName}>{img.name}</p>
                <div className={itemButtonRowClassName}>
                    <button
                        onClick={() => onAddImageToCanvas(img)}
                        className={smallActionButtonClassName}
                        title="Add image to canvas"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => onStartCrop(img.id)}
                        className={smallActionButtonClassName}
                    >
                        Crop
                    </button>
                    <button
                        onClick={() => onDeleteImage(img.id)}
                        className={smallActionButtonClassName}
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
        <div data-testid="upload-loading-placeholder" className={itemCardClassName}>
            <div className={loadingThumbnailClassName} />
            <div className={itemMetaClassName}>
                <p className={itemNameClassName}>{fileName}</p>
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
        <div className={itemCardClassName}>
            <img src={cutout.src} alt="Cutout" className={cutoutThumbnailClassName} />
            <div className="flex gap-1">
                <button
                    onClick={() => onAddToCanvas(cutout)}
                    className={smallActionButtonClassName}
                >
                    Add to Canvas
                </button>
                <button
                    onClick={() => onDeleteCutout(cutout.id)}
                    className={smallActionButtonClassName}
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
    onAddImageToCanvas,
    onDeleteImage,
    onDeleteCutout,
    onAddText,
    backgrounds,
    selectedBgId,
    onSelectBg,
    onSaveImage,
    onEmailImage,
    onEraseCanvas,
    hasCanvasItems,
    onExportSampleData,
}: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [imageStartIndex, setImageStartIndex] = useState(0);
    const [cutoutStartIndex, setCutoutStartIndex] = useState(0);
    const [textInput, setTextInput] = useState("");
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
        <aside className={sidebarClassName}>
            <div className="hidden md:flex">
                <SidebarScrollArrow
                    direction="up"
                    disabled={!canScrollSidebarUp}
                    onClick={() => scrollSidebar("up")}
                />
            </div>
            <div
                ref={scrollContainerRef}
                onScroll={updateSidebarScrollState}
                className={scrollContainerClassName}
            >
                <section className={`${sectionClassName} mt-4`}>
                    <h3 className={sectionTitleClassName}>Images</h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`mb-2 w-full ${primaryButtonClassName}`}
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
                        <p className={emptyStateTextClassName}>No images yet</p>
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
                                        onAddImageToCanvas={onAddImageToCanvas}
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

                <section className={sectionClassName}>
                    <h3 className={sectionTitleClassName}>Cutouts</h3>
                    {totalCutoutCount === 0 ? (
                        <p className={emptyStateTextClassName}>No cutouts yet</p>
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

                <section className={sectionClassName}>
                    <h3 className={sectionTitleClassName}>Text</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!textInput.trim()) return;
                            onAddText(textInput.trim());
                            setTextInput("");
                        }}
                        className={formRowClassName}
                    >
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type text..."
                            className={textInputClassName}
                        />
                        <button
                            type="submit"
                            disabled={!textInput.trim()}
                            className={`${primaryButtonClassName} ${disabledPrimaryButtonClassName}`}
                        >
                            Add Text
                        </button>
                    </form>
                </section>

                <section className="mt-auto">
                    <h3 className={sectionTitleClassName}>Background</h3>
                    <div className={backgroundGridClassName}>
                        {backgrounds.map((bg) => (
                            <button
                                key={bg.id}
                                title={bg.label}
                                onClick={() => onSelectBg(bg.id)}
                                className={`${backgroundSwatchButtonClassName} ${
                                    selectedBgId === bg.id
                                        ? backgroundSwatchActiveClassName
                                        : backgroundSwatchInactiveClassName
                                }`}
                                style={{ background: bg.style }}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-6 mb-4">
                    <h3 className={sectionTitleClassName}>Export</h3>
                    <div className={exportButtonRowClassName}>
                        <button
                            onClick={onSaveImage}
                            className={`flex-1 ${primaryButtonClassName}`}
                        >
                            Save Image
                        </button>
                        <button
                            onClick={onEmailImage}
                            className={`flex-1 ${primaryButtonClassName}`}
                        >
                            Email
                        </button>
                    </div>
                    {onExportSampleData && (
                        <button
                            onClick={onExportSampleData}
                            className={`mt-2 w-full ${secondaryButtonClassName}`}
                        >
                            Export Sample Data
                        </button>
                    )}
                </section>

                <section className="mb-4">
                    <h3 className={sectionTitleClassName}>Canvas</h3>
                    <button
                        onClick={onEraseCanvas}
                        disabled={!hasCanvasItems}
                        className={destructiveButtonClassName}
                    >
                        Erase Canvas
                    </button>
                </section>
            </div>
            <div className="hidden md:flex">
                <SidebarScrollArrow
                    direction="down"
                    disabled={!canScrollSidebarDown}
                    onClick={() => scrollSidebar("down")}
                />
            </div>
        </aside>
    );
}
