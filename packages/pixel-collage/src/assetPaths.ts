function normalizeAssetBaseUrl(assetBaseUrl: string): string {
    if (!assetBaseUrl) return "/";
    return assetBaseUrl.endsWith("/") ? assetBaseUrl : `${assetBaseUrl}/`;
}

export function resolveCollageAssetSrc(src: string, assetBaseUrl: string): string {
    if (!src) return src;
    if (/^(data:|blob:|https?:\/\/|\/\/)/i.test(src)) return src;

    const normalizedBaseUrl = normalizeAssetBaseUrl(assetBaseUrl);
    if (src.startsWith(normalizedBaseUrl)) return src;

    const relativePath = src.startsWith("/") ? src.slice(1) : src;
    return `${normalizedBaseUrl}${relativePath}`;
}

export function getSampleManifestUrl(assetBaseUrl: string): string {
    return resolveCollageAssetSrc("samples/default/manifest.json", assetBaseUrl);
}

export function getPixelHeartsBackgroundStyle(assetBaseUrl: string): string {
    return `url('${resolveCollageAssetSrc("bg-pixel-hearts.svg", assetBaseUrl)}') repeat`;
}
