import { Footer } from "@pixattica/ui";

function App() {
    return (
        <div className="flex min-h-screen flex-col bg-pink-100 text-pink-700">
            <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-12">
                <section className="w-full rounded-2xl border-4 border-pink-300 bg-pink-50 p-8 shadow-[8px_8px_0px_#f9a8d4]">
                    <h1 className="mb-6 text-xl sm:text-2xl">About Me</h1>
                    <p className="text-[11px] leading-relaxed sm:text-xs">
                        Hi, I&apos;m Bella. This site is just for fun — a collection of tools and
                        projects I&apos;ve been building at Pixattica.
                    </p>
                </section>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
