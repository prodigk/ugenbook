import { Link, useLocation } from "react-router-dom";
import { Settings, Heart, LogIn, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import ugenSymbol from "@/assets/ugen-symbol.png";

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="UGEN's Library 홈">
          <img
            src={ugenSymbol}
            alt="UGEN's Library"
            className="h-8 w-8 rounded-full object-cover"
          />
        </Link>
        <div className="flex items-center gap-1">
          {user ?
          <>
              {isAdmin &&
            <Button
              variant={location.pathname === "/likes" ? "secondary" : "ghost"}
              size="sm"
              asChild>
              
                  <Link to="/likes">
                    <Heart className="mr-1.5 h-4 w-4" />
                    좋아요
                  </Link>
                </Button>
            }
              <Button
              variant={location.pathname === "/admin" ? "secondary" : "ghost"}
              size="sm"
              asChild>
              
                <Link to="/admin">
                  <Settings className="mr-1.5 h-4 w-4" />
                  관리
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                로그아웃
              </Button>
            </> :

          <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <LogIn className="mr-1.5 h-4 w-4" />
                로그인
              </Link>
            </Button>
          }
          <ThemeToggle />
        </div>
      </div>
    </header>);

}
