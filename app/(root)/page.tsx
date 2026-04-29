import HeroSection from '@/components/HeroSection'
import { sampleBooks } from '@/lib/constants'
import BookCard from '@/components/BookCard'

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="library-books-grid wrapper mb-6">
        {
          sampleBooks.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
          ))
        }
      </div>
    </>
  )
}
