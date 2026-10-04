import { Link, useLocation } from "react-router-dom";
import { Settings, Star, LogOut, ArrowUpRight, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import ugenSymbol from "@/assets/ugen-symbol.png";

export function Header() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  return (
    <>
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <header className="library-header">
        <div className="container header-inner">
          <Link to="/" className="library-brand" aria-label="UGEN's Library 홈">
            <img src={ugenSymbol} alt="" />
            <span>
              ugen<span className="brand-slash">/</span>
              <span className="brand-label">library</span>
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <nav aria-label="주 메뉴" className="main-nav">
            <Link to="/" className={pathname === "/" ? "active" : ""}>
              <BookOpen size={15} />
              책장
            </Link>
            {
              <Link
                to="/favorites"
                className={
                  ["/likes", "/favorites"].includes(pathname) ? "active" : ""
                }
              >
                <Star size={15} />
                즐겨찾기
              </Link>
            }
            <Link
              to="/admin"
              className={
                pathname === "/admin" || pathname === "/login" ? "active" : ""
              }
            >
              <Settings size={15} />
              관리
            </Link>
          </nav>
          <div className="header-actions">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                aria-label="로그아웃"
              >
                <LogOut size={15} />
                <span className="desktop-label">로그아웃</span>
              </Button>
            ) : (
              <Link to="/login" className="login-link">
                <span>로그인</span>
                <ArrowUpRight size={14} />
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
