import { useEffect, useState } from "react";
import aThousandSplendidSunsCover from "../assets/book-covers/a-thousand-splendid-suns.jpg";
import cryingInHMartCover from "../assets/book-covers/crying-in-h-mart.jpg";
import gloriousExploitsCover from "../assets/book-covers/glorious-exploits.jpg";
import martyrCover from "../assets/book-covers/martyr.jpg";
import neverLetMeGoCover from "../assets/book-covers/never-let-me-go.jpg";
import tomorrowAndTomorrowCover from "../assets/book-covers/tomorrow-and-tomorrow-and-tomorrow.jpg";

const books2025 = [
    {
        title: "Glorious Exploits",
        author: "Ferdia Lennon",
        coverSrc: gloriousExploitsCover,
        review: "something about the way the story being told from the perspective of Lampo is so touching. Although it is a tragedy, all I felt when reading is love. I do believe no matter what situation we are put in, it is part of human instinct to find beauty and survive, because we always have love for life, and that is being alive.",
    },
    {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        coverSrc: tomorrowAndTomorrowCover,
        review: "i finished this book while waiting in line to board a Ryan air flight, and cried",
    },
    {
        title: "Crying in H Mart",
        author: "Michelle Zauner",
        coverSrc: cryingInHMartCover,
        review: "before during and after turning vegetarian, the only major doubt for me was the identity carried by food. To say bye to meat, is to say bye to some (majority of) dishes i grew up with, which is to say bye to the culture, the childhood, the connection i could always savor from food",
    },
    {
        title: "A Thousand Splendid Suns",
        author: "Khaled Hosseini",
        coverSrc: aThousandSplendidSunsCover,
        review: "sometimes I don’t write reviews because I finished the book and was left speechless and felt like if I wrote down anything it would just disappoint me, because I don’t know how to put the feelings into words. This book is one of those books.",
    },
    {
        title: "Martyr!",
        author: "Kaveh Akbar",
        coverSrc: martyrCover,
        review: "i need to get my book back and read it again",
    },
    {
        title: "Never Let Me Go",
        author: "Kazuo Ishiguro",
        coverSrc: neverLetMeGoCover,
        review: "the writing, the story, the character portrait, the thoughts behind the plotlines, the ideology the Ishiguro's trying to convery, or at least how i understand it, are coming together like spices that perfects a dish",
    },
];

export function BooksSection() {
    const [activeBookIndex, setActiveBookIndex] = useState(0);
    const activeBook = books2025[activeBookIndex];

    useEffect(() => {
        books2025.forEach((book) => {
            const preloadedImage = new Image();
            preloadedImage.src = book.coverSrc;
        });
    }, []);

    const showPreviousBook = () => {
        setActiveBookIndex((currentIndex) =>
            currentIndex === 0 ? books2025.length - 1 : currentIndex - 1,
        );
    };

    const showNextBook = () => {
        setActiveBookIndex((currentIndex) =>
            currentIndex === books2025.length - 1 ? 0 : currentIndex + 1,
        );
    };

    return (
        <section className="mt-8 rounded-xl border-2 border-pink-300 bg-pink-100/80 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base">Books I read and loved in 2025</h2>
            <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">
                and some random reviews by me
            </p>
            <article className="mt-5 flex items-start gap-4 rounded-lg border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4] sm:p-5">
                <div className="shrink-0">
                    <img
                        key={activeBook.coverSrc}
                        src={activeBook.coverSrc}
                        alt={`Cover of ${activeBook.title}`}
                        className="h-40 w-auto rounded border-2 border-pink-300 bg-pink-100 object-cover sm:h-48"
                        loading="eager"
                        fetchPriority="high"
                    />
                </div>
                <div className="min-w-0">
                    <h3 className="text-[11px] leading-snug sm:text-xs">{activeBook.title}</h3>
                    <p className="mt-1 text-[10px] sm:text-[11px]">{activeBook.author}</p>
                    <p className="mt-3 text-[10px] leading-relaxed sm:text-[11px]">
                        {activeBook.review}
                    </p>
                </div>
            </article>
            <div className="mt-4 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={showPreviousBook}
                    className="rounded border-2 border-pink-300 bg-pink-50 px-3 py-2 text-[10px] hover:bg-pink-200"
                >
                    ← Prev
                </button>
                <div className="flex items-center gap-2" aria-label="Book slides">
                    {books2025.map((book, index) => (
                        <button
                            key={book.title}
                            type="button"
                            onClick={() => setActiveBookIndex(index)}
                            aria-label={`Go to ${book.title}`}
                            className={`h-2 w-2 rounded-sm border border-pink-300 ${
                                index === activeBookIndex ? "bg-pink-500" : "bg-pink-100"
                            }`}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={showNextBook}
                    className="rounded border-2 border-pink-300 bg-pink-50 px-3 py-2 text-[10px] hover:bg-pink-200"
                >
                    Next →
                </button>
            </div>
        </section>
    );
}
