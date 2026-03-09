import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { fetchBooks } from "@/lib/bookApi";
import { fetchUserLikes } from "@/lib/likesApi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { Navigate } from "react-router-dom";
import type { Book } from "@/types/book";

const Likes = () => {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchBooks(), fetchUserLikes(user.id)])
      .then(([allBooks, ids]) => {
        setBooks(allBooks);
        setLikedIds(ids);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const likedBooks = useMemo(
    () => books.filter((b) => likedIds.includes(b.id)),
    [books, likedIds]
  );

  if (authLoading) return null;
  if (!user || !isAdminEmail(user.email)) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            좋아요 목록
          </h1>
          <p className="mt-2 text-muted-foreground">
            좋아요를 누른 도서 {likedBooks.length}권
          </p>
        </div>

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">불러오는 중...</div>
        ) : likedBooks.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {likedBooks.map((book, idx) => (
              <BookCard key={book.id} book={book} index={idx} liked onToggleLike={() => {
                setLikedIds((prev) => prev.filter((id) => id !== book.id));
              }} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <p className="font-serif text-xl text-muted-foreground">
              좋아요한 도서가 없습니다
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Likes;
