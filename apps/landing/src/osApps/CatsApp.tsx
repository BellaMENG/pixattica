import { useEffect, useRef, useState, type WheelEvent } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import worldMap from "world-atlas/countries-110m.json";

type CatPhoto = {
    src: string;
    alt: string;
};

type CountryEntry = {
    id: string;
    name: string;
    slug: string;
};

const sectionClassName = "rounded-xl border-2 border-pink-300 bg-pink-100/80 p-4 sm:p-6";
const bodyTextClassName = "mt-3 text-[10px] leading-relaxed sm:text-[11px]";
const mapPanelClassName =
    "relative rounded-lg border-2 border-pink-300 bg-pink-50 p-2 shadow-[4px_4px_0px_#f9a8d4] " +
    "sm:p-3";
const sideCardClassName =
    "flex h-full flex-col rounded-lg border-2 border-pink-300 bg-pink-50 p-4 " +
    "shadow-[4px_4px_0px_#f9a8d4]";
const imageFrameClassName =
    "mt-3 flex h-52 w-full items-center justify-center rounded border-2 border-pink-300 " +
    "bg-pink-100 p-2";
const emptyStateFrameClassName =
    "mt-3 flex h-52 w-full items-center justify-center rounded border-2 border-pink-300 " +
    "bg-pink-100 px-4 text-center text-[10px] leading-relaxed sm:text-[11px]";
const navRowClassName = "mt-4 flex items-center justify-between gap-2";
const navButtonClassName =
    "rounded border-2 border-pink-300 bg-pink-50 px-3 py-2 text-[10px] hover:bg-pink-200";

const visitedCountries: CountryEntry[] = [
    { id: "156", name: "China", slug: "china" },
    { id: "764", name: "Thailand", slug: "thailand" },
    { id: "410", name: "South Korea", slug: "south-korea" },
    { id: "392", name: "Japan", slug: "japan" },
    { id: "360", name: "Indonesia", slug: "indonesia" },
    { id: "608", name: "Philippines", slug: "philippines" },
    { id: "702", name: "Singapore", slug: "singapore" },
    { id: "344", name: "Hong Kong", slug: "hong-kong" },
    { id: "446", name: "Macao", slug: "macao" },
    { id: "528", name: "Netherlands", slug: "netherlands" },
    { id: "250", name: "France", slug: "france" },
    { id: "826", name: "United Kingdom", slug: "united-kingdom" },
    { id: "276", name: "Germany", slug: "germany" },
    { id: "724", name: "Spain", slug: "spain" },
    { id: "620", name: "Portugal", slug: "portugal" },
    { id: "438", name: "Liechtenstein", slug: "liechtenstein" },
    { id: "040", name: "Austria", slug: "austria" },
    { id: "380", name: "Italy", slug: "italy" },
    { id: "300", name: "Greece", slug: "greece" },
    { id: "008", name: "Albania", slug: "albania" },
    { id: "792", name: "Turkey", slug: "turkey" },
    { id: "756", name: "Switzerland", slug: "switzerland" },
    { id: "056", name: "Belgium", slug: "belgium" },
    { id: "840", name: "United States of America", slug: "united-states" },
    { id: "484", name: "Mexico", slug: "mexico" },
];

const catPhotoModules = {
    ...(import.meta.glob("../../../about-me/src/assets/cats/*.{jpg,jpeg,png,webp,avif}", {
        import: "default",
    }) as Record<string, () => Promise<string>>),
    ...(import.meta.glob("../../../about-me/src/assets/cats/*/*.{jpg,jpeg,png,webp,avif}", {
        import: "default",
    }) as Record<string, () => Promise<string>>),
} as Record<string, () => Promise<string>>;

type CatPhotoSource = {
    alt: string;
    loadSrc: () => Promise<string>;
};

const catPhotoSourcesBySlug = Object.entries(catPhotoModules).reduce(
    (photosBySlug, [path, loadSrc]) => {
        const nestedMatch = path.match(
            /\.\.\/\.\.\/\.\.\/about-me\/src\/assets\/cats\/([^/]+)\/([^/]+)$/,
        );
        const flatMatch = path.match(/\.\.\/\.\.\/\.\.\/about-me\/src\/assets\/cats\/([^/]+)$/);

        let slug: string | undefined;
        let fileName: string | undefined;

        if (nestedMatch) {
            [, slug, fileName] = nestedMatch;
        } else if (flatMatch) {
            const matchedFileName = flatMatch[1];
            fileName = matchedFileName;
            slug = visitedCountries.find((country) =>
                matchedFileName.startsWith(`${country.slug}-`),
            )?.slug;
        }

        if (!slug || !fileName) {
            return photosBySlug;
        }

        const photoList = photosBySlug.get(slug) ?? [];
        photoList.push({
            loadSrc,
            alt: fileName
                .replace(/\.[^.]+$/, "")
                .replace(/[-_]+/g, " ")
                .trim(),
        });
        photosBySlug.set(slug, photoList);
        return photosBySlug;
    },
    new Map<string, CatPhotoSource[]>(),
);

const visitedCountriesById = new Map(
    visitedCountries.map((country) => [country.id, country] as const),
);
const visitedCountryIds = new Set(visitedCountries.map((country) => country.id));
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 4;
const MAP_ZOOM_SENSITIVITY = 0.0025;

export default function CatsApp() {
    const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
    const [activePhoto, setActivePhoto] = useState<CatPhoto | null>(null);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);
    const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(null);
    const [pinnedPhoto, setPinnedPhoto] = useState<CatPhoto | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
    const [mapZoom, setMapZoom] = useState(MAP_MIN_ZOOM);
    const latestPhotoRequestRef = useRef(0);
    const activeCountry = activeCountryId ? visitedCountriesById.get(activeCountryId) : null;

    useEffect(() => {
        const pinnedCountry = pinnedCountryId ? visitedCountriesById.get(pinnedCountryId) : null;
        const pinnedSources = pinnedCountry ? catPhotoSourcesBySlug.get(pinnedCountry.slug) : [];

        if (!pinnedCountry || !pinnedSources || pinnedSources.length === 0) {
            setPinnedPhoto(null);
        }
    }, [pinnedCountryId]);

    const handleMapWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        event.preventDefault();
        setMapZoom((currentZoom) => {
            const nextZoom = currentZoom + event.deltaY * -MAP_ZOOM_SENSITIVITY;
            return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, nextZoom));
        });
    };

    const handleMapMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
        setMapCenter(position.coordinates);
        setMapZoom(Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, position.zoom)));
    };

    const getRandomPhotoForCountry = async (countryId: string) => {
        const country = visitedCountriesById.get(countryId);
        const photoSources = country ? (catPhotoSourcesBySlug.get(country.slug) ?? []) : [];
        if (photoSources.length === 0) {
            return null;
        }

        const selectedPhoto = photoSources[Math.floor(Math.random() * photoSources.length)];
        return {
            src: await selectedPhoto.loadSrc(),
            alt: selectedPhoto.alt,
        };
    };

    const showCountry = async (countryId: string, options?: { pin?: boolean }) => {
        const photoRequestId = latestPhotoRequestRef.current + 1;
        latestPhotoRequestRef.current = photoRequestId;
        setActiveCountryId(countryId);
        setIsPhotoLoading(true);

        const randomPhoto = await getRandomPhotoForCountry(countryId);

        if (latestPhotoRequestRef.current !== photoRequestId) {
            return;
        }

        setActivePhoto(randomPhoto);
        setIsPhotoLoading(false);

        if (options?.pin) {
            setPinnedCountryId(countryId);
            setPinnedPhoto(randomPhoto);
        }
    };

    const showAdjacentCountry = (direction: "prev" | "next") => {
        if (visitedCountries.length === 0) {
            return;
        }

        const currentCountryId = activeCountryId ?? pinnedCountryId;
        const currentIndex = currentCountryId
            ? visitedCountries.findIndex((country) => country.id === currentCountryId)
            : -1;
        const nextIndex =
            direction === "next"
                ? (currentIndex + 1 + visitedCountries.length) % visitedCountries.length
                : (currentIndex - 1 + visitedCountries.length) % visitedCountries.length;

        void showCountry(visitedCountries[nextIndex].id, { pin: true });
    };

    const handleCountryEnter = (countryId: string, isVisited: boolean) => {
        if (!isVisited) {
            return;
        }

        void showCountry(countryId);
    };

    const handleCountryLeave = () => {
        latestPhotoRequestRef.current += 1;
        setActiveCountryId(pinnedCountryId);
        setActivePhoto(pinnedPhoto);
        setIsPhotoLoading(false);
    };

    const handleCountryClick = (countryId: string, isVisited: boolean) => {
        if (!isVisited) {
            return;
        }

        void showCountry(countryId, { pin: true });
    };

    return (
        <section className={sectionClassName}>
            <h2 className="os-accent-font text-sm sm:text-base">cats of the world</h2>
            <p className={bodyTextClassName}>photographed by me</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-[2fr_1fr]">
                <div className={mapPanelClassName} onWheel={handleMapWheel}>
                    <ComposableMap
                        projectionConfig={{ scale: 145 }}
                        className="h-auto w-full"
                        aria-label="World map of cats I have photographed"
                    >
                        <ZoomableGroup
                            center={mapCenter}
                            zoom={mapZoom}
                            minZoom={MAP_MIN_ZOOM}
                            maxZoom={MAP_MAX_ZOOM}
                            onMoveEnd={handleMapMoveEnd}
                            disableZooming
                        >
                            <Geographies geography={worldMap}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const countryId = geo.id?.toString() ?? "";
                                        const isVisited = visitedCountryIds.has(countryId);

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() =>
                                                    handleCountryEnter(countryId, isVisited)
                                                }
                                                onMouseLeave={handleCountryLeave}
                                                onClick={() =>
                                                    handleCountryClick(countryId, isVisited)
                                                }
                                                style={{
                                                    default: {
                                                        fill: isVisited ? "#f472b6" : "#fde6f3",
                                                        stroke: "#f9a8d4",
                                                        strokeWidth: 0.6,
                                                        outline: "none",
                                                    },
                                                    hover: {
                                                        fill: isVisited ? "#ec4899" : "#fbcfe8",
                                                        stroke: "#f9a8d4",
                                                        strokeWidth: 0.6,
                                                        outline: "none",
                                                        cursor: isVisited ? "pointer" : "default",
                                                    },
                                                    pressed: {
                                                        fill: "#db2777",
                                                        outline: "none",
                                                    },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>
                </div>
                <aside className={sideCardClassName}>
                    <div className="flex-1">
                        <h3 className="os-accent-font text-[11px] sm:text-xs">
                            {activeCountry?.name ?? "Hover a country"}
                        </h3>
                        {activeCountry ? (
                            isPhotoLoading ? (
                                <div className={emptyStateFrameClassName}>loading cat photo...</div>
                            ) : activePhoto ? (
                                <div className={imageFrameClassName}>
                                    <img
                                        src={activePhoto.src}
                                        alt={`${activeCountry.name}: ${activePhoto.alt}`}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className={emptyStateFrameClassName}>
                                    I need to go back there and take some cat photos ;(
                                </div>
                            )
                        ) : (
                            <p className={bodyTextClassName}>Hover to see cat pics!</p>
                        )}
                    </div>
                    <div className={navRowClassName}>
                        <button
                            type="button"
                            onClick={() => showAdjacentCountry("prev")}
                            className={`os-accent-font ${navButtonClassName}`}
                        >
                            ← Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => showAdjacentCountry("next")}
                            className={`os-accent-font ${navButtonClassName}`}
                        >
                            Next →
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    );
}
