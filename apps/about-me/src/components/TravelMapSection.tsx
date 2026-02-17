import { useState, type WheelEvent } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import worldMap from "world-atlas/countries-50m.json";

type VisitedCountry = {
    id: string;
    name: string;
    imagePlaceholder: string;
    note: string;
};

const visitedCountries: VisitedCountry[] = [
    {
        id: "156",
        name: "China",
        imagePlaceholder: "China Photo",
        note: "Replace with your photo for China.",
    },
    {
        id: "764",
        name: "Thailand",
        imagePlaceholder: "Thailand Photo",
        note: "Replace with your photo for Thailand.",
    },
    {
        id: "410",
        name: "South Korea",
        imagePlaceholder: "South Korea Photo",
        note: "Replace with your photo for South Korea.",
    },
    {
        id: "392",
        name: "Japan",
        imagePlaceholder: "Japan Photo",
        note: "Replace with your photo for Japan.",
    },
    {
        id: "360",
        name: "Indonesia",
        imagePlaceholder: "Indonesia Photo",
        note: "Replace with your photo for Indonesia.",
    },
    {
        id: "608",
        name: "Philippines",
        imagePlaceholder: "Philippines Photo",
        note: "Replace with your photo for the Philippines.",
    },
    {
        id: "702",
        name: "Singapore",
        imagePlaceholder: "Singapore Photo",
        note: "Replace with your photo for Singapore.",
    },
    {
        id: "344",
        name: "Hong Kong",
        imagePlaceholder: "Hong Kong Photo",
        note: "Replace with your photo for Hong Kong.",
    },
    {
        id: "446",
        name: "Macao",
        imagePlaceholder: "Macao Photo",
        note: "Replace with your photo for Macao.",
    },
    {
        id: "528",
        name: "Netherlands",
        imagePlaceholder: "Netherlands Photo",
        note: "Replace with your photo for the Netherlands.",
    },
    {
        id: "250",
        name: "France",
        imagePlaceholder: "France Photo",
        note: "Replace with your photo for France.",
    },
    {
        id: "826",
        name: "United Kingdom",
        imagePlaceholder: "United Kingdom Photo",
        note: "Replace with your photo for the U.K.",
    },
    {
        id: "276",
        name: "Germany",
        imagePlaceholder: "Germany Photo",
        note: "Replace with your photo for Germany.",
    },
    {
        id: "724",
        name: "Spain",
        imagePlaceholder: "Spain Photo",
        note: "Replace with your photo for Spain.",
    },
    {
        id: "620",
        name: "Portugal",
        imagePlaceholder: "Portugal Photo",
        note: "Replace with your photo for Portugal.",
    },
    {
        id: "438",
        name: "Liechtenstein",
        imagePlaceholder: "Liechtenstein Photo",
        note: "Replace with your photo for Liechtenstein.",
    },
    {
        id: "040",
        name: "Austria",
        imagePlaceholder: "Austria Photo",
        note: "Replace with your photo for Austria.",
    },
    {
        id: "380",
        name: "Italy",
        imagePlaceholder: "Italy Photo",
        note: "Replace with your photo for Italy.",
    },
    {
        id: "300",
        name: "Greece",
        imagePlaceholder: "Greece Photo",
        note: "Replace with your photo for Greece.",
    },
    {
        id: "008",
        name: "Albania",
        imagePlaceholder: "Albania Photo",
        note: "Replace with your photo for Albania.",
    },
    {
        id: "792",
        name: "Turkey",
        imagePlaceholder: "Turkey Photo",
        note: "Replace with your photo for Turkey.",
    },
    {
        id: "756",
        name: "Switzerland",
        imagePlaceholder: "Switzerland Photo",
        note: "Replace with your photo for Switzerland.",
    },
    {
        id: "056",
        name: "Belgium",
        imagePlaceholder: "Belgium Photo",
        note: "Replace with your photo for Belgium.",
    },
    {
        id: "840",
        name: "United States of America",
        imagePlaceholder: "USA Photo",
        note: "Replace with your photo for the U.S.",
    },
    {
        id: "484",
        name: "Mexico",
        imagePlaceholder: "Mexico Photo",
        note: "Replace with your photo for Mexico.",
    },
];

const visitedCountriesById = new Map(
    visitedCountries.map((country) => [country.id, country] as const),
);
const visitedCountryIds = new Set(visitedCountries.map((country) => country.id));
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 4;
const MAP_ZOOM_SENSITIVITY = 0.0025;

export function TravelMapSection() {
    const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
    const [mapZoom, setMapZoom] = useState(MAP_MIN_ZOOM);
    const hoveredCountry = hoveredCountryId ? visitedCountriesById.get(hoveredCountryId) : null;

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

    return (
        <section className="mt-8 rounded-xl border-2 border-pink-300 bg-pink-100/80 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base">Places I&apos;ve Been</h2>
            <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">
                highlighted countries are places I&apos;ve visited. hover one to see a travel photo
                placeholder.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div
                    className="relative rounded-lg border-2 border-pink-300 bg-pink-50 p-2 shadow-[4px_4px_0px_#f9a8d4] sm:p-3"
                    onWheel={handleMapWheel}
                >
                    <ComposableMap
                        projectionConfig={{ scale: 145 }}
                        className="h-auto w-full"
                        aria-label="World map of places I have visited"
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
                                                    setHoveredCountryId(
                                                        isVisited ? countryId : null,
                                                    )
                                                }
                                                onMouseLeave={() => setHoveredCountryId(null)}
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
                <aside className="rounded-lg border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4]">
                    <h3 className="text-[11px] sm:text-xs">
                        {hoveredCountry?.name ?? "Hover a visited country"}
                    </h3>
                    {hoveredCountry ? (
                        <div className="mt-3 flex h-36 items-center justify-center rounded border-2 border-dashed border-pink-300 bg-pink-100 text-center text-[10px] sm:text-[11px]">
                            {hoveredCountry.imagePlaceholder}
                        </div>
                    ) : (
                        <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">
                            This panel updates when you hover one of the highlighted countries.
                        </p>
                    )}
                </aside>
            </div>
        </section>
    );
}
