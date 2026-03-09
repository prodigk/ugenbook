import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Trash2, EyeOff, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteBookById, updateBookFields } from "@/lib/bookApi";
import { toggleLike } from "@/lib/likesApi";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

interface Props {
  book: Book;
  userId: string;
  liked: boolean;
  onLikeChange: (liked: boolean) => void;
  onBookChange: (book: Book) => void;
}

export function BookAdminActions({ book, userId, liked, onLikeChange, onBookChange }: Props) {
  const navigate = useNavigate();
  const [togglingLike, setTogglingLike] = useState(false);
  const [togglingHide, setTogglingHide] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleLike = async () => {
    if (togglingLike) return;
    setTogglingLike(true);
    try {
      await toggleLike(userId, book.id, liked);
      onLikeChange(!liked);
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingLike(false);
    }
  };

  const handleToggleHide = async () => {
    if (togglingHide) return;
    setTogglingHide(true);
    try {
      const newHidden = !book.isHidden;
      await updateBookFields(book.id, { is_hidden: newHidden });
      onBookChange({ ...book, isHidden: newHidden });
      toast({ title: newHidden ? "도서가 숨겨졌습니다" : "도서가 다시 공개되었습니다" });
    } catch (e) {
      toast({ title: "변경 실패", description: String(e), variant: "destructive" });
    } finally {
      setTogglingHide(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBookById(book.id);
      toast({ title: "도서가 삭제되었습니다" });
      navigate("/");
    } catch (e) {
      toast({ title: "삭제 실패", description: String(e), variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Like */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleLike}
        disabled={togglingLike}
        className="gap-1.5"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            liked ? "fill-destructive text-destructive" : "text-muted-foreground"
          }`}
        />
        <span className="text-xs">{liked ? "좋아요 취소" : "좋아요"}</span>
      </Button>

      {/* Hide/Show */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleHide}
        disabled={togglingHide}
        className="gap-1.5"
      >
        {togglingHide ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : book.isHidden ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs">{book.isHidden ? "공개" : "감추기"}</span>
      </Button>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="text-xs">삭제</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>도서를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{book.title}"을(를) 삭제하면 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
