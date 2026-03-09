import { useState, type WheelEvent } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import worldMap from "world-atlas/countries-50m.json";

type CatPhoto = {
    src: string;
    alt: string;
};

type VisitedCountry = {
    id: string;
    name: string;
    slug: string;
    imagePlaceholder: string;
};

const visitedCountries: VisitedCountry[] = [
    {
        id: "156",
        name: "China",
        slug: "china",
        imagePlaceholder: "China Cat Photo",
    },
    {
        id: "764",
        name: "Thailand",
        slug: "thailand",
        imagePlaceholder: "Thailand Cat Photo",
    },
    {
        id: "410",
        name: "South Korea",
        slug: "south-korea",
        imagePlaceholder: "South Korea Cat Photo",
    },
    {
        id: "392",
        name: "Japan",
        slug: "japan",
        imagePlaceholder: "Japan Cat Photo",
    },
    {
        id: "360",
        name: "Indonesia",
        slug: "indonesia",
        imagePlaceholder: "Indonesia Cat Photo",
    },
    {
        id: "608",
        name: "Philippines",
        slug: "philippines",
        imagePlaceholder: "Philippines Cat Photo",
    },
    {
        id: "702",
        name: "Singapore",
        slug: "singapore",
        imagePlaceholder: "Singapore Cat Photo",
    },
    {
        id: "344",
        name: "Hong Kong",
        slug: "hong-kong",
        imagePlaceholder: "Hong Kong Cat Photo",
    },
    {
        id: "446",
        name: "Macao",
        slug: "macao",
        imagePlaceholder: "Macao Cat Photo",
    },
    {
        id: "528",
        name: "Netherlands",
        slug: "netherlands",
        imagePlaceholder: "Netherlands Cat Photo",
    },
    {
        id: "250",
        name: "France",
        slug: "france",
        imagePlaceholder: "France Cat Photo",
    },
    {
        id: "826",
        name: "United Kingdom",
        slug: "united-kingdom",
        imagePlaceholder: "United Kingdom Cat Photo",
    },
    {
        id: "276",
        name: "Germany",
        slug: "germany",
        imagePlaceholder: "Germany Cat Photo",
    },
    {
        id: "724",
        name: "Spain",
        slug: "spain",
        imagePlaceholder: "Spain Cat Photo",
    },
    {
        id: "620",
        name: "Portugal",
        slug: "portugal",
        imagePlaceholder: "Portugal Cat Photo",
    },
    {
        id: "438",
        name: "Liechtenstein",
        slug: "liechtenstein",
        imagePlaceholder: "Liechtenstein Cat Photo",
    },
    {
        id: "040",
        name: "Austria",
        slug: "austria",
        imagePlaceholder: "Austria Cat Photo",
    },
    {
        id: "380",
        name: "Italy",
        slug: "italy",
        imagePlaceholder: "Italy Cat Photo",
    },
    {
        id: "300",
        name: "Greece",
        slug: "greece",
        imagePlaceholder: "Greece Cat Photo",
    },
    {
        id: "008",
        name: "Albania",
        slug: "albania",
        imagePlaceholder: "Albania Cat Photo",
    },
    {
        id: "792",
        name: "Turkey",
        slug: "turkey",
        imagePlaceholder: "Turkey Cat Photo",
    },
    {
        id: "756",
        name: "Switzerland",
        slug: "switzerland",
        imagePlaceholder: "Switzerland Cat Photo",
    },
    {
        id: "056",
        name: "Belgium",
        slug: "belgium",
        imagePlaceholder: "Belgium Cat Photo",
    },
    {
        id: "840",
        name: "United States of America",
        slug: "united-states",
        imagePlaceholder: "USA Cat Photo",
    },
    {
        id: "484",
        name: "Mexico",
        slug: "mexico",
        imagePlaceholder: "Mexico Cat Photo",
    },
];

const catPhotoModules = {
    ...(import.meta.glob("../assets/cats/*.{jpg,jpeg,png,webp,avif}", {
        eager: true,
        import: "default",
    }) as Record<string, string>),
    ...(import.meta.glob("../assets/cats/*/*.{jpg,jpeg,png,webp,avif}", {
        eager: true,
        import: "default",
    }) as Record<string, string>),
} as Record<string, string>;

const catPhotosBySlug = Object.entries(catPhotoModules).reduce((photosBySlug, [path, src]) => {
    const nestedMatch = path.match(/\.\.\/assets\/cats\/([^/]+)\/([^/]+)$/);
    const flatMatch = path.match(/\.\.\/assets\/cats\/([^/]+)$/);

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

    const resolvedFileName = fileName;
    const photoList = photosBySlug.get(slug) ?? [];
    photoList.push({
        src,
        alt: resolvedFileName
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim(),
    });
    photosBySlug.set(slug, photoList);
    return photosBySlug;
}, new Map<string, CatPhoto[]>());

const visitedCountriesById = new Map(
    visitedCountries.map((country) => [country.id, country] as const),
);
const visitedCountryIds = new Set(visitedCountries.map((country) => country.id));
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 4;
const MAP_ZOOM_SENSITIVITY = 0.0025;

export function TravelMapSection() {
    const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
    const [activePhoto, setActivePhoto] = useState<CatPhoto | null>(null);
    const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(null);
    const [pinnedPhoto, setPinnedPhoto] = useState<CatPhoto | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
    const [mapZoom, setMapZoom] = useState(MAP_MIN_ZOOM);
    const activeCountry = activeCountryId ? visitedCountriesById.get(activeCountryId) : null;

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

    const getRandomPhotoForCountry = (countryId: string) => {
        const country = visitedCountriesById.get(countryId);
        const photos = country ? (catPhotosBySlug.get(country.slug) ?? []) : [];
        return photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)] : null;
    };

    const showCountry = (countryId: string, options?: { pin?: boolean }) => {
        const randomPhoto = getRandomPhotoForCountry(countryId);
        setActiveCountryId(countryId);
        setActivePhoto(randomPhoto);

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

        showCountry(visitedCountries[nextIndex].id, { pin: true });
    };

    const handleCountryEnter = (countryId: string, isVisited: boolean) => {
        if (!isVisited) {
            return;
        }

        showCountry(countryId);
    };

    const handleCountryLeave = () => {
        setActiveCountryId(pinnedCountryId);
        setActivePhoto(pinnedPhoto);
    };

    const handleCountryClick = (countryId: string, isVisited: boolean) => {
        if (!isVisited) {
            return;
        }

        showCountry(countryId, { pin: true });
    };

    return (
        <section className="mt-8 rounded-xl border-2 border-pink-300 bg-pink-100/80 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base">cats of the world</h2>
            <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">photographed by me</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div
                    className="relative rounded-lg border-2 border-pink-300 bg-pink-50 p-2 shadow-[4px_4px_0px_#f9a8d4] sm:p-3"
                    onWheel={handleMapWheel}
                >
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
                <aside className="flex h-full flex-col rounded-lg border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4]">
                    <div className="flex-1">
                        <h3 className="text-[11px] sm:text-xs">
                            {activeCountry?.name ?? "Hover a country"}
                        </h3>
                        {activeCountry ? (
                            activePhoto ? (
                                <div className="mt-3 flex h-52 w-full items-center justify-center rounded border-2 border-pink-300 bg-pink-100 p-2">
                                    <img
                                        src={activePhoto.src}
                                        alt={`${activeCountry.name}: ${activePhoto.alt}`}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="mt-3 flex h-52 w-full items-center justify-center rounded border-2 border-pink-300 bg-pink-100 px-4 text-center text-[10px] leading-relaxed sm:text-[11px]">
                                    I need to go back there and take some cat photos ;(
                                </div>
                            )
                        ) : (
                            <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">
                                Hover to see cat pics!
                            </p>
                        )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => showAdjacentCountry("prev")}
                            className="rounded border-2 border-pink-300 bg-pink-50 px-3 py-2 text-[10px] hover:bg-pink-200"
                        >
                            ← Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => showAdjacentCountry("next")}
                            className="rounded border-2 border-pink-300 bg-pink-50 px-3 py-2 text-[10px] hover:bg-pink-200"
                        >
                            Next →
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    );
}
