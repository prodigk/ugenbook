import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReadDateCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

const MONTHS_KO = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export function ReadDateCalendar({ selected, onSelect, className }: ReadDateCalendarProps) {
  const today = new Date();
  const [month, setMonth] = React.useState<Date>(selected ?? today);

  const currentYear = today.getFullYear();
  const fromYear = 1990;
  const toYear = currentYear + 1;
  const years: number[] = [];
  for (let y = toYear; y >= fromYear; y--) years.push(y);

  const handleYearChange = (yearStr: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(yearStr, 10));
    setMonth(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthStr, 10));
    setMonth(newDate);
  };

  return (
    <div className={cn("p-3 pointer-events-auto", className)}>
      <div className="mb-3 flex gap-2">
        <Select value={String(month.getFullYear())} onValueChange={handleYearChange}>
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-popover">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(month.getMonth())} onValueChange={handleMonthChange}>
          <SelectTrigger className="h-8 w-24 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {MONTHS_KO.map((m, i) => (
              <SelectItem key={i} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DayPicker
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
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
      />
    </div>
  );
}
