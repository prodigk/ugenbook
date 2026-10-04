import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ko } from "date-fns/locale";

interface ReadDateCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

const MONTHS_KO = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

export function ReadDateCalendar({
  selected,
  onSelect,
  className,
}: ReadDateCalendarProps) {
  const today = new Date();
  const [month, setMonth] = React.useState<Date>(selected ?? today);

  const selectedTime = selected?.getTime();
  React.useEffect(() => {
    if (selectedTime !== undefined) {
      const date = new Date(selectedTime);
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [selectedTime]);

  const currentYear = today.getFullYear();
  const fromYear = Math.min(1900, selected?.getFullYear() ?? 1900);
  const toYear = Math.max(currentYear + 1, selected?.getFullYear() ?? 0);
  const years: number[] = [];
  for (let y = toYear; y >= fromYear; y--) years.push(y);

  const handleYearChange = (yearStr: string) =>
    setMonth(new Date(Number(yearStr), month.getMonth(), 1));
  const handleMonthChange = (monthStr: string) =>
    setMonth(new Date(month.getFullYear(), Number(monthStr), 1));

  return (
    <div className={cn("p-3 pointer-events-auto", className)}>
      <div className="calendar-jump">
        <label>
          연도
          <select
            aria-label="읽은 연도"
            value={month.getFullYear()}
            onChange={(event) => handleYearChange(event.target.value)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </label>
        <label>
          월
          <select
            aria-label="읽은 월"
            value={month.getMonth()}
            onChange={(event) => handleMonthChange(event.target.value)}
          >
            {MONTHS_KO.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <DayPicker
        locale={ko}
        labels={{
          labelDay: (date) =>
            `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
          labelPrevious: () => "이전 달",
          labelNext: () => "다음 달",
        }}
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        showOutsideDays
        classNames={{
          months: "flex flex-col",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          ),
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        components={{
          DayContent: ({ date }) => (
            <span
              aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
            >
              {date.getDate()}
            </span>
          ),
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
      />
    </div>
  );
}
