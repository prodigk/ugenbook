import { Link, useLocation } from "react-router-dom";
import { BookOpen, Settings, Heart, LogIn, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold text-foreground">UGEN 책장</span>
        </Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
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
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                로그아웃
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <LogIn className="mr-1.5 h-4 w-4" />
                로그인
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
