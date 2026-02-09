import heic2any from "heic2any";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

export async function readImageFile(file: File): Promise<string> {
    if (HEIC_TYPES.has(file.type)) {
        return convertHeicToDataUrl(file);
    }
    return readAsDataUrl(file);
}

async function convertHeicToDataUrl(file: File): Promise<string> {
    const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    return readAsDataUrl(blob);
}

function readAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
