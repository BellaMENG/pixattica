import { AnimatedCursor, Footer } from "@pixattica/ui";
import { BooksSection } from "./components/BooksSection";
import { TravelMapSection } from "./components/TravelMapSection";

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "/";

function App() {
    return (
        <div className="relative flex min-h-screen flex-col bg-pink-100 text-pink-700">
            <AnimatedCursor />
            <a
                href={LANDING_URL}
                className="absolute left-4 top-4 z-50 rounded border-2 border-pink-300 bg-pink-50 px-2 py-1 text-[10px] hover:bg-pink-200"
            >
                ← back
            </a>
            <main className="mx-auto flex w-full max-w-4xl flex-1 items-start px-6 py-12">
                <section className="w-full rounded-2xl border-4 border-pink-300 bg-pink-50 p-8 shadow-[8px_8px_0px_#f9a8d4]">
                    <h1 className="mb-6 text-xl sm:text-2xl">About Me</h1>
                    <p className="text-[11px] leading-relaxed sm:text-xs">Hi, I&apos;m Bella.</p>
                    <BooksSection />
                    <TravelMapSection />
                </section>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
