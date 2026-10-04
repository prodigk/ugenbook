import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/Header";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdminEmail(email)) {
      toast({
        title: "접근 불가",
        description: "관리자 계정만 로그인할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (next) window.location.href = next;
      else navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container login-layout">
        <section className="login-intro">
          <p className="mono-label">THE LIBRARY DESK</p>
          <h1>
            오늘의 기록을,
            <br />
            내일의 책장에.
          </h1>
          <p>
            책을 더하고, 기억할 문장을 정리하는
            <br />
            UGEN의 개인 서재 관리 공간입니다.
          </p>
          <span className="login-illustration" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="mono-label">READ. REFLECT. REMEMBER.</span>
        </section>
        <Card className="login-card">
          <CardHeader className="login-card-heading">
            <CardTitle className="font-serif text-3xl font-normal">
              관리자 로그인
            </CardTitle>
            <CardDescription>
              도서 관리 및 발행을 위해 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "처리 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
