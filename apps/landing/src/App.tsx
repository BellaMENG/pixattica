import { Footer } from "@pixattica/ui";

function App() {
    return (
        <div className="flex min-h-screen flex-col bg-pink-100">
            <main className="flex flex-1 items-center justify-center">
                <h1 className="text-2xl" style={{ color: "deeppink" }}>
                    Hello world
                </h1>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
