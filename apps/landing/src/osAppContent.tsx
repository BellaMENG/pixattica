import { Suspense, lazy } from "react";
import type { PixelCollageApp as PixelCollageAppComponent } from "@pixattica/pixel-collage";
import type { AppId, AppModule } from "./osData";

type OsAppContentProps = {
    activeModule: AppModule;
};

const PIXEL_COLLAGE_ASSET_BASE_URL = import.meta.env.VITE_PIXEL_COLLAGE_URL ?? "/";
const loadAboutApp = () => import("./osApps/AboutApp");
const loadBbsApp = () => import("./osApps/BbsApp");
const loadBooksApp = () => import("./osApps/BooksApp");
const loadCatsApp = () => import("./osApps/CatsApp");
const loadCollageApp = async () => {
    const module = await import("@pixattica/pixel-collage");
    return {
        default: module.PixelCollageApp,
    } satisfies {
        default: typeof PixelCollageAppComponent;
    };
};

const AboutApp = lazy(loadAboutApp);
const BbsApp = lazy(loadBbsApp);
const BooksApp = lazy(loadBooksApp);
const CatsApp = lazy(loadCatsApp);
const CollageApp = lazy(loadCollageApp);

const APP_PRELOADERS: Record<AppId, () => Promise<unknown>> = {
    about: loadAboutApp,
    bbs: loadBbsApp,
    books: loadBooksApp,
    cats: loadCatsApp,
    collage: loadCollageApp,
};

function OsAppLoadingState({ activeModule }: { activeModule: AppModule }) {
    return (
        <div className="rounded-xl border-2 border-pink-300 bg-pink-100/80 p-5 shadow-[4px_4px_0px_#f9a8d4]">
            <p className="text-[10px] uppercase tracking-[0.08em] text-pink-500">
                {activeModule.label}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-pink-700 sm:text-xs">
                loading {activeModule.command}...
            </p>
        </div>
    );
}

export function OsAppContent({ activeModule }: OsAppContentProps) {
    let content;

    if (activeModule.id === "bbs") {
        content = <BbsApp />;
    } else if (activeModule.id === "books") {
        content = <BooksApp />;
    } else if (activeModule.id === "cats") {
        content = <CatsApp />;
    } else if (activeModule.id === "collage") {
        content = <CollageApp embedded assetBaseUrl={PIXEL_COLLAGE_ASSET_BASE_URL} />;
    } else {
        content = <AboutApp />;
    }

    return (
        <Suspense fallback={<OsAppLoadingState activeModule={activeModule} />}>{content}</Suspense>
    );
}

export async function preloadOsAppWindow(appId: AppId) {
    await APP_PRELOADERS[appId]();
}
