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
                    <p className="resume-role">
                        Senior Software Engineer | Product &amp; cross-platform engineering
                    </p>
                    <nav className="resume-contact" aria-label="Contact details">
                        <span>London, United Kingdom</span>
                        <a href="mailto:bellamengzihan@gmail.com">bellamengzihan@gmail.com</a>
                        <a href="https://linkedin.com/in/bella-meng">LinkedIn</a>
                    </nav>
                </header>

                <p className="resume-summary">
                    Product-minded Senior Software Engineer at Goodnotes with experience shipping
                    consumer features end-to-end across web, iOS and desktop. Strong in React and
                    TypeScript with Swift, Node.js and Python experience, and comfortable moving
                    across product, platform and AI-enabled engineering problems. Currently part of
                    Goodsystems, a highly AI-native team building shared platform capabilities and
                    early-stage products.
                </p>

                <section className="resume-section">
                    <h2>EXPERIENCE</h2>
                    <div className="resume-company-line">
                        <strong>Goodnotes</strong>
                        <span>London, United Kingdom</span>
                    </div>
                    <div className="resume-job">
                        <div className="resume-job-heading">
                            <div>
                                <h3>Senior Software Engineer</h3>
                                <p>Goodsystems | AI-native product &amp; platform team</p>
                            </div>
                            <time>
                                Sep 2025 – Present
                                <br />
                                Mar 2026 – Present
                            </time>
                        </div>
                        <ul>
                            <li>
                                Build a shared canvas SDK used across multiple Goodnotes products,
                                designing reusable APIs and platform capabilities that support
                                distinct product experiences from a common foundation.
                            </li>
                            <li>
                                Delivered Ondera.co, taking ambiguous requirements through rapid
                                prototyping, technical spikes, architecture, implementation and
                                iteration.
                            </li>
                            <li>
                                Work AI-native: orchestrate multiple coding agents in parallel,
                                strengthen agent harnesses and context/tooling, and use agents
                                across prototyping, debugging and implementation to improve delivery
                                speed and developer experience.
                            </li>
                            <li>
                                Before moving to Goodsystems, launched the Goodnotes app on ChatGPT
                                and built MCP-based agentic integrations connecting Goodnotes
                                capabilities to AI assistants.
                            </li>
                            <li>
                                Partner closely with product and design on technical and product
                                trade-offs; mentor engineers and contribute to architecture, testing
                                and code-quality practices.
                            </li>
                        </ul>
                    </div>
                    <div className="resume-job resume-job--previous">
                        <div className="resume-job-heading">
                            <div>
                                <h3>Software Engineer</h3>
                            </div>
                            <time>Sep 2022 – Aug 2025</time>
                        </div>
                        <ul>
                            <li>
                                Built and shipped cross-platform product features using React,
                                TypeScript, Swift and Swift-WASM across web, iOS and desktop from a
                                shared codebase serving millions of users.
                            </li>
                            <li>
                                Owned features end-to-end from technical discovery and design
                                through implementation, automated testing, rollout and iteration.
                            </li>
                            <li>
                                Built maintainable, well-tested systems using TDD and improved
                                developer experience through code review, tooling and documentation.
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="resume-section">
                    <h2>SELECTED PROJECTS</h2>
                    <div className="resume-project">
                        <h3>
                            SnugBox <span>AI-powered floor-plan furnishing tool</span>
                        </h3>
                        <a href="https://github.com/snugbox/snugbox">github.com/snugbox/snugbox</a>
                        <ul>
                            <li>
                                Won 1st place at the Granola AI x Google DeepMind hackathon with a
                                product that generates furnishing layouts from uploaded floor plans
                                and lets users refine them in an interactive editor.
                            </li>
                            <li>
                                Built the React/TypeScript product in a monorepo, combining
                                AI-generated suggestions with a custom isometric rendering
                                experience and taking the idea to a working prototype under tight
                                time constraints.
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="resume-section resume-education">
                    <h2>EDUCATION</h2>
                    <div className="resume-education-row">
                        <div>
                            <h3>M.Phil. in Data Science and Analytics</h3>
                            <p>
                                HKUST · Research focus: large-scale graph mining and data analysis.
                                Coursework included Machine Learning and Knowledge Discovery in
                                Databases.
                            </p>
                        </div>
                        <time>2020 – 2022</time>
                    </div>
                    <div className="resume-education-row">
                        <div>
                            <h3>B.Sc. in Computer Science and Mathematics</h3>
                            <p>HKUST · First Class Honours; Dean&apos;s List.</p>
                        </div>
                        <time>2016 – 2020</time>
                    </div>
                </section>

                <section className="resume-section">
                    <h2>SKILLS &amp; INTERESTS</h2>
                    <div className="resume-skills">
                        <div>
                            <h3>Languages</h3>
                            <p>TypeScript, Python, Swift</p>
                        </div>
                        <div>
                            <h3>Product &amp; mobile</h3>
                            <p>React, Node.js, Swift-WASM, iOS, cross-platform development</p>
                        </div>
                        <div>
                            <h3>AI &amp; developer experience</h3>
                            <p>
                                LLM integrations, agentic workflows, MCP, multi-agent orchestration
                                &amp; harnessing
                            </p>
                        </div>
                        <div>
                            <h3>Engineering practices</h3>
                            <p>
                                TDD, CI/CD, monorepo architecture, end-to-end ownership, technical
                                discovery, code review, developer tooling, Git
                            </p>
                        </div>
                        <div>
                            <h3>Interests</h3>
                            <p>
                                Running &amp; endurance training, strength training, boxing, Pilates
                            </p>
                        </div>
                    </div>
                </section>
                <footer className="resume-footer">BELLA MENG · 2026</footer>
            </article>
        </main>
    );
}
