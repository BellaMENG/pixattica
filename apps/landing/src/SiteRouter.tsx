import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";

const BagLanding = lazy(() => import("./BagLanding"));
const OsLanding = lazy(() => import("./App"));
const ResumeApp = lazy(() => import("./ResumeApp"));
const BooksPage = lazy(() => import("./BooksPage"));
const BlogPage = lazy(() => import("./BlogPage"));

type SiteRoute = "/" | "/cv" | "/books" | "/blog";

const routeTitles: Record<SiteRoute, string> = {
    "/": "Bella Meng | Software Engineer",
    "/cv": "Bella Meng | CV",
    "/books": "Bella Meng | Books",
    "/blog": "Bella Meng | Blog",
};

function getRoute(pathname: string): SiteRoute {
    return pathname === "/cv" || pathname === "/books" || pathname === "/blog" ? pathname : "/";
}

export default function SiteRouter() {
    const [route, setRoute] = useState<SiteRoute>(() => getRoute(window.location.pathname));
    const [visitedRoutes, setVisitedRoutes] = useState<Set<SiteRoute>>(() => new Set([route]));
    const isOsLandingEnabled = import.meta.env.VITE_OS_LANDING === "true";

    function showRoute(nextRoute: SiteRoute) {
        setVisitedRoutes((visited) => {
            if (visited.has(nextRoute)) return visited;
            return new Set([...visited, nextRoute]);
        });
        setRoute(nextRoute);
    }

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const anchor =
                event.target instanceof Element
                    ? event.target.closest<HTMLAnchorElement>("a[href]")
                    : null;
            if (
                !anchor ||
                anchor.hasAttribute("download") ||
                (anchor.target && anchor.target !== "_self")
            ) {
                return;
            }

            const url = new URL(anchor.href);
            if (url.origin !== window.location.origin || !(url.pathname in routeTitles)) {
                return;
            }

            event.preventDefault();
            if (
                url.pathname === window.location.pathname &&
                url.search === window.location.search &&
                url.hash === window.location.hash
            ) {
                return;
            }

            window.history.pushState(null, "", url);
            showRoute(getRoute(url.pathname));
            window.scrollTo(0, 0);
        };

        const onPopState = () => showRoute(getRoute(window.location.pathname));

        document.addEventListener("click", onClick);
        window.addEventListener("popstate", onPopState);
        return () => {
            document.removeEventListener("click", onClick);
            window.removeEventListener("popstate", onPopState);
        };
    }, []);

    useLayoutEffect(() => {
        document.title = routeTitles[route];
        document.documentElement.classList.toggle(
            "bag-landing-enabled",
            !isOsLandingEnabled || route !== "/",
        );
    }, [isOsLandingEnabled, route]);

    return (
        <>
            {visitedRoutes.has("/") && (
                <div hidden={route !== "/"}>
                    <Suspense fallback={null}>
                        {isOsLandingEnabled ? <OsLanding /> : <BagLanding />}
                    </Suspense>
                </div>
            )}
            {visitedRoutes.has("/cv") && (
                <div hidden={route !== "/cv"}>
                    <Suspense fallback={null}>
                        <ResumeApp />
                    </Suspense>
                </div>
            )}
            {visitedRoutes.has("/books") && (
                <div hidden={route !== "/books"}>
                    <Suspense fallback={null}>
                        <BooksPage />
                    </Suspense>
                </div>
            )}
            {visitedRoutes.has("/blog") && (
                <div hidden={route !== "/blog"}>
                    <Suspense fallback={null}>
                        <BlogPage />
                    </Suspense>
                </div>
            )}
        </>
    );
}
