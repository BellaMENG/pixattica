function App() {
    return (
        <div className="flex min-h-screen flex-col bg-pink-50">
            <main className="flex flex-1 items-center justify-center">
                <h1 className="text-2xl" style={{ color: "deeppink" }}>
                    Hello world
                </h1>
            </main>
            <footer className="flex items-center justify-center gap-3 py-6 text-xs text-gray-500">
                <span>&copy; 2026 Pixattica</span>
                <span>|</span>
                <a
                    href={import.meta.env.VITE_INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-500"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                </a>
            </footer>
        </div>
    );
}

export default App;
