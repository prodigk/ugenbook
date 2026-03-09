import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookCategory, BookStatus } from "@/types/book";

const CATEGORIES: BookCategory[] = [
  "경제", "인문", "사회과학", "커리어", "철학", "자기계발", "문학", "과학", "기타",
];

const STATUSES: BookStatus[] = ["작성중", "완료"];

interface BookTagEditorProps {
  type: "category" | "status";
  value: string;
  onUpdate: (newValue: string) => void;
}

export function BookTagEditor({ type, value, onUpdate }: BookTagEditorProps) {
  const [open, setOpen] = useState(false);
  const options = type === "category" ? CATEGORIES : STATUSES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant={type === "status" && value === "완료" ? "default" : value === "작성중" ? "outline" : "secondary"}
          className="cursor-pointer shrink-0 text-xs gap-1"
        >
          {value}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start">
        <div className="flex flex-col">
          {options.map((opt) => (
            <Button
              key={opt}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start text-xs h-8",
                opt === value && "font-bold"
              )}
              onClick={() => {
                onUpdate(opt);
                setOpen(false);
              }}
            >
              {opt === value && <Check className="h-3 w-3 mr-1" />}
              {opt}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
