import { useRef } from "react";
import {
    ACCEPTED_IMAGE_EXTENSIONS,
    ACCEPTED_IMAGE_TYPES,
    type UploadedImage,
    type CroppedCutout,
    type BackgroundOption,
    type BackgroundId,
} from "../App";

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
}: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !ACCEPTED_IMAGE_TYPES.has(file.type)) return;

        onFileSelect(file);
        e.target.value = "";
    }

    return (
        <aside className="flex w-64 flex-col border-r-4 border-pink-300 bg-pink-50 p-4 overflow-y-auto">
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
                    className="hidden"
                    onChange={handleFileChange}
                />

                {uploadedImages.length === 0 && uploadingNames.size === 0 ? (
                    <p className="text-[10px] text-pink-300">No images yet</p>
                ) : (
                    <div className="space-y-2">
                        {uploadedImages.map((img) => (
                            <div
                                key={img.id}
                                className="flex items-center gap-2 rounded border border-pink-200 p-1"
                            >
                                <img
                                    src={img.src}
                                    alt={img.name}
                                    className="h-10 w-10 rounded object-cover"
                                />
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
                        ))}
                        {Array.from(uploadingNames).map(([tempId, fileName]) => (
                            <div
                                key={tempId}
                                data-testid="upload-loading-placeholder"
                                className="flex items-center gap-2 rounded border border-pink-200 p-1"
                            >
                                <div className="h-10 w-10 rounded bg-pink-200 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-[10px] text-pink-600">{fileName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="mb-6">
                <h3 className="mb-2 text-xs text-pink-600">Cutouts</h3>
                {croppedCutouts.length === 0 ? (
                    <p className="text-[10px] text-pink-300">No cutouts yet</p>
                ) : (
                    <div className="space-y-2">
                        {croppedCutouts.map((cutout) => (
                            <div
                                key={cutout.id}
                                className="flex items-center gap-2 rounded border border-pink-200 p-1"
                            >
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
                        ))}
                    </div>
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
        </aside>
    );
}
