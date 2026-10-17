import BlogsApp from "./osApps/BlogsApp";
import "./BooksPage.css";

export default function BlogPage() {
    return (
        <main className="books-page">
            <div className="books-page__sheet">
                <a className="books-page__back" href="/">
                    ← BACK
                </a>
                <header className="books-page__header">
                    <p className="books-page__eyebrow">BELLA'S NOTEBOOK</p>
                    <h1>Morning pages</h1>
                </header>
                <BlogsApp />
            </div>
        </main>
    );
}
