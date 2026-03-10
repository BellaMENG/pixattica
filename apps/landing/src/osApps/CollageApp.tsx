const PIXEL_COLLAGE_URL = import.meta.env.VITE_PIXEL_COLLAGE_URL ?? "/pixel-collage/";

export default function CollageApp() {
    return (
        <div className="flex h-full min-h-[26rem] flex-col gap-3">
            <p className="text-[11px] leading-relaxed text-pink-600 sm:text-xs">
                The collage maker is running inside its own OS window now. A deeper component-level
                migration can happen next without changing the shell model.
            </p>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-pink-300 bg-white shadow-[4px_4px_0px_#f9a8d4]">
                {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
                <iframe
                    src={PIXEL_COLLAGE_URL}
                    title="PIXATTICA collage maker"
                    className="h-full w-full border-0"
                />
            </div>
        </div>
    );
}
