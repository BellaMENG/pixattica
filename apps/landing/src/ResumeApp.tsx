import "./ResumeApp.css";

export default function ResumeApp() {
    return (
        <main className="resume-page">
            <article className="resume-sheet">
                <a className="resume-back" href="/" aria-label="Back to What's in my bag">
                    ← BACK
                </a>
                <header className="resume-header">
                    <h1>BELLA MENG</h1>
                    <p className="resume-role">Senior Software Engineer | Product Engineering</p>
                    <nav className="resume-contact" aria-label="Contact details">
                        <a href="tel:+447442244043">+44 7442 244043</a>
                        <span>London, UK</span>
                        <a href="mailto:bellamengzihan@gmail.com">bellamengzihan@gmail.com</a>
                        <a href="https://bellameng.com">bellameng.com</a>
                        <a href="https://linkedin.com/in/bella-meng">linkedin.com/in/bella-meng</a>
                    </nav>
                </header>

                <p className="resume-summary">
                    Senior Software Engineer with 4+ years of experience at Goodnotes, working
                    primarily with TypeScript, React and cross-platform technologies. Currently part
                    of Goodsystems, an AI-native engineering team working on early-stage products,
                    shared platform infrastructure and agentic engineering workflows. Experienced in
                    both building new products from scratch and developing features for established
                    consumer products.
                </p>

                <section className="resume-section">
                    <h2>EXPERIENCE</h2>
                    <div className="resume-company-line">
                        <strong>Goodnotes</strong>
                        <span>London, UK</span>
                    </div>
                    <div className="resume-job">
                        <div className="resume-job-heading">
                            <h3>Senior Software Engineer</h3>
                            <time>Sep 2025 – Present</time>
                        </div>
                        <div className="resume-job-heading">
                            <p>
                                Goodsystems | AI-native product &amp; platform team · Mar 2026 –
                                Present
                            </p>
                        </div>
                        <ul>
                            <li>
                                <strong>AI-native engineering:</strong> Build and improve agentic
                                engineering workflows, focusing on harness engineering, context
                                management and making our codebase and tooling easier for agents to
                                work with.
                            </li>
                            <li>
                                <strong>Shared platform:</strong> Build a reusable canvas SDK for
                                multiple Goodnotes products, designing APIs and shared capabilities
                                that enable distinct product experiences from a common foundation
                                (since Jun 2026).
                            </li>
                            <li>
                                <strong>0-to-1 product development:</strong> Part of the team
                                building Ondera and other products from scratch, working across
                                product exploration, rapid prototyping, technical design and
                                implementation. Help shape both the product direction and its
                                technical foundations as the product evolves.
                            </li>
                            <li>
                                <strong>Agentic products:</strong> Previously built and launched the
                                Goodnotes app on ChatGPT and developed MCP integrations exposing
                                Goodnotes capabilities to AI assistants through conversational
                                workflows.
                            </li>
                            <li>
                                Partner with product and design on pragmatic trade-offs; mentor
                                engineers and improve team practices around architecture, testing,
                                code quality and developer tooling.
                            </li>
                        </ul>
                    </div>
                    <div className="resume-job resume-job--previous">
                        <div className="resume-job-heading">
                            <h3>Software Engineer</h3>
                            <time>Sep 2022 – Aug 2025</time>
                        </div>
                        <ul>
                            <li>
                                Built and shipped consumer features across web, iOS and desktop
                                using React, TypeScript, Swift and Swift-WASM from a shared codebase
                                serving millions of users.
                            </li>
                            <li>
                                Owned features end to end, from technical discovery and design
                                through implementation, automated testing, rollout and iteration;
                                improved maintainability through TDD, code reviews and
                                documentation.
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="resume-section">
                    <h2>SELECTED PROJECT</h2>
                    <div className="resume-project">
                        <div className="resume-job-heading">
                            <h3>
                                SnugBox <span>AI-powered floor-plan furnishing tool</span>
                            </h3>
                            <time dateTime="2026">2026</time>
                        </div>
                        <a href="https://github.com/snugbox/snugbox">github.com/snugbox/snugbox</a>
                        <ul>
                            <li>
                                <strong>1st place, Granola AI × Google DeepMind hackathon.</strong>{" "}
                                Built a working product that generates furnishing layouts from
                                uploaded floor plans and lets users refine them in a
                                React/TypeScript interactive editor, combining AI suggestions with
                                custom isometric rendering.
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="resume-section resume-education">
                    <h2>EDUCATION</h2>
                    <div className="resume-education-row">
                        <div>
                            <h3>MPhil, Data Science and Analytics | HKUST</h3>
                            <p>
                                Research: large-scale graph mining and data analysis; coursework in
                                machine learning and knowledge discovery.
                            </p>
                        </div>
                        <time>2020 – 2022</time>
                    </div>
                    <div className="resume-education-row">
                        <div>
                            <h3>BSc, Computer Science and Mathematics | HKUST</h3>
                            <p>First Class Honours; Dean’s List.</p>
                        </div>
                        <time>2016 – 2020</time>
                    </div>
                </section>

                <section className="resume-section">
                    <h2>TECHNICAL SKILLS</h2>
                    <div className="resume-skills">
                        <div>
                            <h3>Languages &amp; frameworks</h3>
                            <p>TypeScript, React, Node.js, Python, Swift, Swift-WASM</p>
                        </div>
                        <div>
                            <h3>AI &amp; tooling</h3>
                            <p>
                                LLM integrations, MCP, agentic workflows, multi-agent orchestration,
                                harness engineering
                            </p>
                        </div>
                        <div>
                            <h3>Engineering</h3>
                            <p>
                                TDD, CI/CD, monorepos, Git, reusable APIs, cross-platform
                                architecture
                            </p>
                        </div>
                    </div>
                </section>
                <footer className="resume-footer">BELLA MENG · 2026</footer>
            </article>
        </main>
    );
}
