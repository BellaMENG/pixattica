import type Konva from "konva";

export async function exportCanvasToBlob(
    stage: Konva.Stage,
    backgroundStyle: string,
    width: number,
    height: number,
    pixelRatio: number = Math.max(window.devicePixelRatio, 2),
): Promise<Blob> {
    const outW = width * pixelRatio;
    const outH = height * pixelRatio;
    const offscreen = document.createElement("canvas");
    offscreen.width = outW;
    offscreen.height = outH;
    const ctx = offscreen.getContext("2d")!;
    ctx.scale(pixelRatio, pixelRatio);

    if (backgroundStyle.startsWith("url(")) {
        const urlMatch = backgroundStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (urlMatch) {
            const img = await loadImage(urlMatch[1]);
            const pattern = ctx.createPattern(img, "repeat");
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, width, height);
            }
        }
    } else {
        ctx.fillStyle = backgroundStyle;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const stageCanvas = stage.toCanvas({ pixelRatio });
    ctx.drawImage(stageCanvas, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to export canvas"));
        }, "image/png");
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
