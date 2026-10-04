import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadDateCalendar } from "@/components/ReadDateCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateBookFields } from "@/lib/bookApi";
import type { Book, BookStatus } from "@/types/book";

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function BookReadingControls({
  book,
  canEdit,
  onChange,
}: {
  book: Book;
  canEdit: boolean;
  onChange: (fields: Partial<Book>) => void;
}) {
  const isMobile = useIsMobile();
  const DatePicker = isMobile ? Dialog : Popover;
  const DateTrigger = isMobile ? DialogTrigger : PopoverTrigger;
  const DateContent = isMobile ? DialogContent : PopoverContent;
  const [date, setDate] = useState(book.readDate || "");
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  useEffect(() => setDate(book.readDate || ""), [book.id, book.readDate]);
  const save = async (fields: {
    status?: BookStatus;
    read_date?: string | null;
  }) => {
    if (!canEdit || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await updateBookFields(book.id, fields);
      const changes: Partial<Book> = {};
      if (fields.status) changes.status = fields.status;
      if ("read_date" in fields) {
        changes.readDate = fields.read_date || undefined;
        setDate(fields.read_date || "");
        setDateOpen(false);
      }
      onChange(changes);
      setNotice(
        fields.status
          ? "독서 상태를 저장했습니다."
          : "읽은 날짜를 저장했습니다.",
      );
    } catch {
      setError(
        "저장하지 못했습니다. 로그인 상태를 확인하고 다시 시도해 주세요.",
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };
  return (
    <section
      className="book-metadata"
      aria-label="독서 기록 설정"
      id="reading-settings"
    >
      <div className="detail-tags">
        <Badge>{book.category}</Badge>
        {book.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        <span className="detail-status" data-status={book.status}>
          {canEdit ? (
            <>
              <select
                aria-label="기록 상태"
                value={book.status}
                disabled={saving}
                onChange={(event) =>
                  void save({ status: event.target.value as BookStatus })
                }
              >
                {(["작성중", "대기", "완료"] as BookStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} aria-hidden="true" />
            </>
          ) : (
            <span>{book.status}</span>
          )}
        </span>
      </div>
      <div className="detail-dates">
        <div className="detail-date-item">
          <span className="detail-date-label">읽은 날짜</span>
          {canEdit ? (
            <DatePicker
              open={dateOpen}
              onOpenChange={(open) => {
                if (!saving) {
                  setDateOpen(open);
                  setDate(book.readDate || "");
                  setError("");
                }
              }}
            >
              <DateTrigger asChild>
                <button
                  type="button"
                  className="metadata-date-button"
                  disabled={saving}
                  aria-label="읽은 날짜 변경"
                >
                  <span>
                    {book.readDate
                      ? new Date(
                          book.readDate + "T00:00:00",
                        ).toLocaleDateString("ko-KR")
                      : "날짜 지정"}
                  </span>
                </button>
              </DateTrigger>
              <DateContent
                className="read-date-popover"
                {...(isMobile ? {} : { align: "start" as const })}
              >
                {isMobile ? (
                  <>
                    <DialogTitle className="font-normal text-xl">
                      읽은 날짜
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      연도와 월을 먼저 선택한 뒤 날짜를 고르세요.
                    </DialogDescription>
                  </>
                ) : (
                  <>
                    <h3>읽은 날짜</h3>
                    <p className="text-xs text-muted-foreground">
                      연도와 월을 먼저 선택한 뒤 날짜를 고르세요.
                    </p>
                  </>
                )}
                <fieldset disabled={saving}>
                  <ReadDateCalendar
                    selected={date ? new Date(date + "T00:00:00") : undefined}
                    onSelect={(value) => setDate(value ? localDate(value) : "")}
                  />
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void save({ read_date: date || null });
                    }}
                  >
                    <label
                      htmlFor={`read-date-${book.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      직접 입력
                    </label>
                    <Input
                      id={`read-date-${book.id}`}
                      type="date"
                      value={date}
                      max="9999-12-31"
                      onChange={(event) => setDate(event.target.value)}
                    />
                    <div className="date-actions">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDate("")}
                      >
                        날짜 지우기
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving || date === (book.readDate || "")}
                      >
                        {saving ? "저장 중..." : "날짜 저장"}
                      </Button>
                    </div>
                  </form>
                </fieldset>
                {error && (
                  <p role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </DateContent>
            </DatePicker>
          ) : (
            <span>
              {book.readDate
                ? new Date(book.readDate + "T00:00:00").toLocaleDateString(
                    "ko-KR",
                  )
                : "미지정"}
            </span>
          )}
        </div>
        <div className="detail-date-item">
          <span className="detail-date-label">최종 수정</span>
          <time dateTime={book.updatedAt}>
            {new Date(book.updatedAt).toLocaleDateString("ko-KR")}
          </time>
        </div>
      </div>
      <p role="status" className="sr-only">
        {saving ? "저장 중..." : notice}
      </p>
      {error && !dateOpen && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
