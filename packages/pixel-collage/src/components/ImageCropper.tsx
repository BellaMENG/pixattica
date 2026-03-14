import { removeBackground } from "@imgly/background-removal";
import { useState } from "react";
import { ReactLassoSelect, getCanvas } from "react-lasso-select";
import type { UploadedImage, CroppedCutout } from "../App";
import { MIN_LASSO_POINTS, CROPPER_IMAGE_MAX_HEIGHT, CROPPER_IMAGE_MAX_WIDTH } from "../config";
import { blobToDataUrl } from "../utils/blobToDataUrl";
import FreehandCrop from "./FreehandCrop";

interface Point {
    x: number;
    y: number;
}

type CropMode = "freehand" | "click";

function getDefaultCropMode(): CropMode {
    if (typeof window === "undefined") return "click";

    const navWithUAData = navigator as Navigator & {
        userAgentData?: { mobile?: boolean };
    };
    const isMobileByUAData = navWithUAData.userAgentData?.mobile === true;
    const isMobileByUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
    );
    const isCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const isSmallViewport = window.matchMedia?.("(max-width: 768px)").matches ?? false;

    return isMobileByUAData || isMobileByUA || (isCoarsePointer && isSmallViewport)
        ? "freehand"
        : "click";
}

interface ImageCropperProps {
    image: UploadedImage;
    onDone: (cutout: CroppedCutout) => void;
    onCancel: () => void;
}

export default function ImageCropper({ image, onDone, onCancel }: ImageCropperProps) {
    const [points, setPoints] = useState<Point[]>([]);
    const [clippedSrc, setClippedSrc] = useState<string | null>(null);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [cropMode, setCropMode] = useState<CropMode>(getDefaultCropMode);

    function handleComplete(path: Point[]) {
        if (path.length < MIN_LASSO_POINTS) return;
        setPoints(path);
        getCanvas(image.src, path, (err, canvas) => {
            if (!err) {
                setClippedSrc(canvas.toDataURL());
            }
        });
    }

    function handleDone() {
        if (!clippedSrc) return;
        onDone({
            id: crypto.randomUUID(),
            src: clippedSrc,
            sourceImageId: image.id,
        });
    }

    function handleReset() {
        setPoints([]);
        setClippedSrc(null);
    }

    function handleModeChange(mode: CropMode) {
        if (mode === cropMode) return;
        setCropMode(mode);
        handleReset();
    }

    async function handleRemoveBg() {
        setIsRemovingBg(true);
        try {
            const blob = await removeBackground(image.src);
            const src = await blobToDataUrl(blob);
            onDone({
                id: crypto.randomUUID(),
                src,
                sourceImageId: image.id,
            });
        } finally {
            setIsRemovingBg(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex max-h-[90vh] max-w-[90vw] flex-col rounded-lg bg-white p-4 shadow-xl">
                <h2 className="mb-3 text-sm font-medium text-pink-700">Crop: {image.name}</h2>
                <p className="mb-2 text-[10px] text-pink-400">
                    {cropMode === "freehand"
                        ? "Draw a freehand selection around the area you want to keep"
                        : "Click to place points around the area you want to keep"}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => handleModeChange("freehand")}
                        disabled={isRemovingBg}
                        className={`rounded px-3 py-1 text-[11px] transition-colors cursor-pointer disabled:opacity-40 ${
                            cropMode === "freehand"
                                ? "bg-pink-400 text-white"
                                : "bg-pink-100 text-pink-600 hover:bg-pink-200"
                        }`}
                    >
                        Freehand Crop
                    </button>
                    <button
                        onClick={() => handleModeChange("click")}
                        disabled={isRemovingBg}
                        className={`rounded px-3 py-1 text-[11px] transition-colors cursor-pointer disabled:opacity-40 ${
                            cropMode === "click"
                                ? "bg-pink-400 text-white"
                                : "bg-pink-100 text-pink-600 hover:bg-pink-200"
                        }`}
                    >
                        Click Crop
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {cropMode === "freehand" ? (
                        <FreehandCrop
                            src={image.src}
                            points={points}
                            onComplete={handleComplete}
                            onReset={handleReset}
                            imageStyle={{
                                maxHeight: CROPPER_IMAGE_MAX_HEIGHT,
                                maxWidth: CROPPER_IMAGE_MAX_WIDTH,
                            }}
                        />
                    ) : (
                        <ReactLassoSelect
                            src={image.src}
                            value={points}
                            onChange={setPoints}
                            onComplete={handleComplete}
                            imageStyle={{
                                maxHeight: CROPPER_IMAGE_MAX_HEIGHT,
                                maxWidth: CROPPER_IMAGE_MAX_WIDTH,
                            }}
                        />
                    )}
                </div>

                {clippedSrc && (
                    <div className="mt-3 flex items-center gap-3">
                        <span className="text-[10px] text-pink-500">Preview:</span>
                        <img
                            src={clippedSrc}
                            alt="Cropped preview"
                            className="h-16 rounded border border-pink-200 object-contain"
                        />
                    </div>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                        onClick={handleRemoveBg}
                        disabled={isRemovingBg}
                        className="rounded bg-pink-100 px-3 py-1 text-[11px] text-pink-600 hover:bg-pink-200 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        {isRemovingBg ? "Removing..." : "Remove BG"}
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={isRemovingBg}
                        className="rounded bg-pink-100 px-3 py-1 text-[11px] text-pink-600 hover:bg-pink-200 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isRemovingBg}
                        className="rounded bg-pink-100 px-3 py-1 text-[11px] text-pink-600 hover:bg-pink-200 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDone}
                        disabled={!clippedSrc || isRemovingBg}
                        className="rounded bg-pink-400 px-3 py-1 text-[11px] text-white hover:bg-pink-500 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
