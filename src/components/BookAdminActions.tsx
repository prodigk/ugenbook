import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, EyeOff, Eye, Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { deleteBookById, updateBookFields } from "@/lib/bookApi";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

interface Props {
  book: Book;
  onBookChange: (book: Book) => void;
}

export function BookAdminActions({ book, onBookChange }: Props) {
  const navigate = useNavigate();
  const [togglingHide, setTogglingHide] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleToggleHide = async () => {
    if (togglingHide) return;
    setTogglingHide(true);
    try {
      const newHidden = !book.isHidden;
      await updateBookFields(book.id, { is_hidden: newHidden });
      onBookChange({ ...book, isHidden: newHidden });
      toast({
        title: newHidden ? "도서가 숨겨졌습니다" : "도서가 다시 공개되었습니다",
      });
    } catch (e) {
      toast({
        title: "변경 실패",
        description: String(e),
        variant: "destructive",
      });
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
      toast({
        title: "삭제 실패",
        description: String(e),
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="detail-icon-action"
            aria-label="도서 관리"
            title="도서 관리"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => void handleToggleHide()}
            disabled={togglingHide}
          >
            {book.isHidden ? (
              <Eye className="mr-2 h-4 w-4" />
            ) : (
              <EyeOff className="mr-2 h-4 w-4" />
            )}
            {book.isHidden ? "도서 공개" : "도서 감추기"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> 도서 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
              {deleting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
