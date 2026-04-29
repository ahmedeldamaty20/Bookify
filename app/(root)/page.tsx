import HeroSection from '@/components/HeroSection'
import BookCard from '@/components/BookCard'
import { getAllBooks } from '@/lib/actions/book.actions'

export default async function Home() {
  const bookResults = await getAllBooks("");
  const books = bookResults.success ? bookResults.data ?? [] : [];

  return (
    <>
      <HeroSection />
      <div className="library-books-grid wrapper mb-6">
        {
          books.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
          ))
        }
      </div>
    </>
  )
}
