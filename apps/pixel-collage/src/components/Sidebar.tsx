import { useRef } from "react";
import type { UploadedImage, CroppedCutout } from "../App";

interface SidebarProps {
  uploadedImages: UploadedImage[];
  croppedCutouts: CroppedCutout[];
  onUpload: (image: UploadedImage) => void;
  onStartCrop: (imageId: string) => void;
  onAddToCanvas: (cutout: CroppedCutout) => void;
}

export default function Sidebar({
  uploadedImages,
  croppedCutouts,
  onUpload,
  onStartCrop,
  onAddToCanvas,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onUpload({
        id: crypto.randomUUID(),
        src: reader.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);

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
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadedImages.length === 0 ? (
          <p className="text-[10px] text-pink-300">No images yet</p>
        ) : (
          <div className="space-y-2">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-2 rounded border border-pink-200 p-1"
              >
                <img src={img.src} alt={img.name} className="h-10 w-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[10px] text-pink-600">{img.name}</p>
                  <button
                    onClick={() => onStartCrop(img.id)}
                    className="mt-0.5 rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                  >
                    Crop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
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
                <button
                  onClick={() => onAddToCanvas(cutout)}
                  className="rounded bg-pink-200 px-1.5 py-0.5 text-[10px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                >
                  Add to Canvas
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
