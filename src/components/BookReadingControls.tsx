import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadDateCalendar } from "@/components/ReadDateCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateBookFields } from "@/lib/bookApi";
import type { Book, BookStatus } from "@/types/book";

export function localDate(date: Date) {
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
      className="reading-controls"
      aria-label="독서 기록 설정"
      id="reading-settings"
    >
      <div className="reading-control-title">
        <span>
          <Pencil size={14} /> 나의 독서 기록
        </span>
        {saving && (
          <span role="status">
            <Loader2 size={13} className="animate-spin" />
            저장 중...
          </span>
        )}
      </div>
      <div className="reading-status">
        <span className="reading-field-label">기록 상태</span>
        <div role="group" aria-label="기록 상태 선택">
          {(["작성중", "대기", "완료"] as BookStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={book.status === status}
              disabled={!canEdit || saving}
              onClick={() => void save({ status })}
            >
              {book.status === status && <Check size={13} />} {status}
            </button>
          ))}
        </div>
      </div>
      <div className="reading-date">
        <span className="reading-field-label">
          <CalendarDays size={14} />
          읽은 날짜
        </span>
        {canEdit ? (
          <Popover
            open={dateOpen}
            onOpenChange={(open) => {
              if (!saving) {
                setDateOpen(open);
                setDate(book.readDate || "");
                setError("");
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={saving}
                aria-label="읽은 날짜 변경"
              >
                <span>
                  {book.readDate
                    ? new Date(book.readDate + "T00:00:00").toLocaleDateString(
                        "ko-KR",
                      )
                    : "날짜 지정"}
                </span>
                <Pencil size={13} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="read-date-popover" align="start">
              <h3>읽은 날짜</h3>
              <p className="text-xs text-muted-foreground">
                연도와 월을 먼저 선택한 뒤 날짜를 고르세요.
              </p>
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
            </PopoverContent>
          </Popover>
        ) : (
          <p>
            {book.readDate
              ? new Date(book.readDate + "T00:00:00").toLocaleDateString(
                  "ko-KR",
                )
              : "아직 지정하지 않았습니다."}
          </p>
        )}
      </div>
      {!canEdit && (
        <p className="reading-login">
          <Link
            to={`/login?next=${encodeURIComponent(`/book/${book.id}#reading-settings`)}`}
          >
            관리자 로그인 후 상태·날짜 수정 ↗
          </Link>
        </p>
      )}
      {notice && (
        <p role="status" className="reading-save-notice">
          {notice}
        </p>
      )}
      {error && !dateOpen && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
