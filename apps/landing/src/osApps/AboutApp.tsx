export default function AboutApp() {
    return (
        <section className="flex h-full flex-col gap-3 p-5">
            <h1 className="os-accent-font text-sm sm:text-base">Bella Meng</h1>
            <p className="text-[11px] leading-relaxed sm:text-xs">
                Bella Meng, software engineer, (product engineer?), based in London.
            </p>
            <p className="text-[11px] leading-relaxed sm:text-xs">
                <a
                    href="https://www.linkedin.com/in/bella-meng/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-pink-400 underline-offset-2 hover:text-pink-500"
                >
                    LinkedIn
                </a>
                {" · "}
                <a
                    href="mailto:bellamengzihan@gmail.com"
                    className="underline decoration-pink-400 underline-offset-2 hover:text-pink-500"
                >
                    bellamengzihan@gmail.com
                </a>
            </p>
        </section>
    );
}
