const PIXEL_COLLAGE_URL = import.meta.env.VITE_PIXEL_COLLAGE_URL ?? "/pixel-collage/";
const EMBEDDED_PIXEL_COLLAGE_URL = PIXEL_COLLAGE_URL.includes("?")
    ? `${PIXEL_COLLAGE_URL}&embedded=1`
    : `${PIXEL_COLLAGE_URL}?embedded=1`;

export default function CollageApp() {
    return (
        <div className="h-full min-h-0 overflow-hidden bg-white">
            {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
                src={EMBEDDED_PIXEL_COLLAGE_URL}
                title="PIXATTICA collage maker"
                className="h-full w-full border-0"
            />
        </div>
    );
}
