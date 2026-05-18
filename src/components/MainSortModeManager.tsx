import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  fetchMainSortMode,
  setMainSortMode,
  DEFAULT_MAIN_SORT_MODE,
  type MainSortMode,
} from "@/lib/settingsApi";

const OPTIONS: { value: MainSortMode; label: string; desc: string }[] = [
  { value: "read_date", label: "읽은 날짜 기준", desc: ".md 파일의 읽은 날짜 속성 기준 정렬" },
  { value: "updated", label: "업데이트 기준", desc: "최근 업데이트 기준 정렬" },
  { value: "status_read_date", label: "상태값 우선 + 읽은 날짜", desc: "작성중·완료·대기 순, 그 안에서 읽은 날짜순" },
];

export function MainSortModeManager() {
  const [mode, setMode] = useState<MainSortMode>(DEFAULT_MAIN_SORT_MODE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMainSortMode()
      .then(setMode)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (next: MainSortMode) => {
    if (next === mode) return;
    const prev = mode;
    setMode(next);
    setSaving(true);
    try {
      await setMainSortMode(next);
      toast({ title: "메인 정렬 방식이 변경되었습니다." });
    } catch (err) {
      setMode(prev);
      toast({ title: "변경 실패", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
        <ArrowUpDown className="h-4 w-4" />
        메인 정렬 방식
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="space-y-2 rounded-lg border bg-card p-3">
          {OPTIONS.map((opt) => {
            const selected = mode === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                  selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/40"
                } ${saving ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="radio"
                  name="main-sort-mode"
                  value={opt.value}
                  checked={selected}
                  onChange={() => handleChange(opt.value)}
                  className="mt-1 accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}