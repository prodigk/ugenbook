import { Link, useLocation } from "react-router-dom";
import { BookOpen, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold text-foreground">서평 아카이브</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant={location.pathname === "/admin" ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin">
              <Settings className="mr-1.5 h-4 w-4" />
              관리
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
