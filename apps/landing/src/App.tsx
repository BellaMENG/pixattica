import { AnimatedCursor, Footer } from "@pixattica/ui";

const ABOUT_ME_URL = import.meta.env.VITE_ABOUT_ME_URL ?? "/about-me/";
const PIXEL_COLLAGE_URL = import.meta.env.VITE_PIXEL_COLLAGE_URL ?? "/pixel-collage/";

function App() {
    return (
        <div className="flex min-h-screen flex-col bg-pink-100 text-pink-700">
            <AnimatedCursor />
            <main className="flex flex-1 flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-start gap-3">
                    <h1 className="text-2xl" style={{ color: "deeppink" }}>
                        Pixattica
                    </h1>
                    <p className="max-w-md text-sm text-pink-600">
                        A playful pixel collage and Valentine's Day card maker you can use directly
                        in your browser.
                    </p>
                    <nav className="flex flex-col items-start gap-3">
                        <a
                            href={ABOUT_ME_URL}
                            className="text-sm text-pink-500 underline hover:text-pink-600"
                        >
                            About Me
                        </a>
                        <a
                            href={PIXEL_COLLAGE_URL}
                            className="text-sm text-pink-500 underline hover:text-pink-600"
                        >
                            Valentine's Day Card Maker
                        </a>
                    </nav>
                </div>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
