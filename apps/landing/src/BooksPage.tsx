import { books2025 } from "./osApps/BooksApp";
import "./BooksPage.css";

export default function BooksPage() {
    return (
        <main className="books-page">
            <div className="books-page__sheet">
                <a className="books-page__back" href="/">
                    ← BACK
                </a>
                <header className="books-page__header">
                    <p className="books-page__eyebrow">BELLA'S BOOKSHELF · 2025</p>
                    <h1>My book ratings</h1>
                    <p>Books I read and loved in 2025, with some random reviews by me.</p>
                    <a
                        className="books-page__goodreads"
                        href="https://www.goodreads.com/bellameng"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Find me on Goodreads ↗
                    </a>
                </header>
                <div className="books-page__list">
                    {books2025.map((book, index) => (
                        <article className="books-page__book" key={book.title}>
                            <img
                                src={book.coverSrc}
                                alt={`Cover of ${book.title}`}
                                loading={index === 0 ? "eager" : "lazy"}
                            />
                            <div className="books-page__book-content">
                                <span className="books-page__number">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h2>{book.title}</h2>
                                <p className="books-page__author">by {book.author}</p>
                                <p className="books-page__review">{book.review}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
}
