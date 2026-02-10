interface FooterProps {
    instagramUrl: string;
}

export function Footer({ instagramUrl }: FooterProps) {
    return (
        <footer className="flex items-center justify-center gap-3 py-6 text-xs text-gray-500">
            <span>&copy; 2026 Pixattica</span>
            <span>|</span>
            <a
                href={instagramUrl}
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
    );
}
