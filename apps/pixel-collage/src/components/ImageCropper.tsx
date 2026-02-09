import { useState } from "react";
import { ReactLassoSelect, getCanvas } from "react-lasso-select";
import type { UploadedImage, CroppedCutout } from "../App";
import { MIN_LASSO_POINTS, CROPPER_IMAGE_MAX_HEIGHT, CROPPER_IMAGE_MAX_WIDTH } from "../config";

interface Point {
    x: number;
    y: number;
}

interface ImageCropperProps {
    image: UploadedImage;
    onDone: (cutout: CroppedCutout) => void;
    onCancel: () => void;
}

export default function ImageCropper({ image, onDone, onCancel }: ImageCropperProps) {
    const [points, setPoints] = useState<Point[]>([]);
    const [clippedSrc, setClippedSrc] = useState<string | null>(null);

    function handleComplete(path: Point[]) {
        if (path.length < MIN_LASSO_POINTS) return;
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex max-h-[90vh] max-w-[90vw] flex-col rounded-lg bg-white p-4 shadow-xl">
                <h2 className="mb-3 text-sm font-medium text-pink-700">Crop: {image.name}</h2>
                <p className="mb-2 text-[10px] text-pink-400">
                    Draw a freehand selection around the area you want to keep
                </p>

                <div className="flex-1 overflow-auto">
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

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        onClick={handleReset}
                        className="rounded bg-pink-100 px-3 py-1 text-[11px] text-pink-600 hover:bg-pink-200 transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onCancel}
                        className="rounded bg-pink-100 px-3 py-1 text-[11px] text-pink-600 hover:bg-pink-200 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDone}
                        disabled={!clippedSrc}
                        className="rounded bg-pink-400 px-3 py-1 text-[11px] text-white hover:bg-pink-500 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
