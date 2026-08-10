import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import manifest from "../../.lovable/mcp/manifest.json";

const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}${manifest.path}`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7"
        aria-label="코드 복사"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

interface ToolDoc {
  name: string;
  summary: string;
  input: string;
  output: string;
  prompt: string;
}

const TOOL_DOCS: Record<string, ToolDoc> = {
  search_books: {
    name: "search_books",
    summary: "제목·저자로 검색하고 상태/카테고리로 필터링합니다. 본문(마크다운)은 반환하지 않습니다.",
    prompt: '"내 책장에서 상태가 작성중인 책 5권만 알려줘"',
    input: `{
  "query": "집중력",
  "status": "작성중",
  "category": "자기계발",
  "limit": 5
}`,
    output: `{
  "books": [
    {
      "id": "0f2c…",
      "title": "도둑맞은 집중력",
      "author": "요한 하리",
      "category": "자기계발",
      "status": "작성중",
      "tags": ["집중", "몰입"],
      "read_date": "2025-04-12",
      "updated_at": "2026-08-02T11:20:31.442Z",
      "is_hidden": false
    }
  ]
}`,
  },
  get_book: {
    name: "get_book",
    summary: "id 또는 정확한 제목으로 책 한 권을 조회합니다. 마크다운 서평 전문이 포함됩니다.",
    prompt: '"\'도둑맞은 집중력\' 서평 내용을 요약해줘"',
    input: `{ "title": "도둑맞은 집중력" }

// 또는
{ "id": "0f2c1a4e-…" }`,
    output: `{
  "book": {
    "id": "0f2c…",
    "title": "도둑맞은 집중력",
    "author": "요한 하리",
    "category": "자기계발",
    "status": "작성중",
    "tags": ["집중", "몰입"],
    "read_date": "2025-04-12",
    "markdown": "---\\nDate: 2025-04-12\\n---\\n\\n## 핵심 요약 …",
    "file_name": "도둑맞은 집중력.md",
    "is_hidden": false
  }
}`,
  },
  list_categories: {
    name: "list_categories",
    summary: "관리 페이지에서 설정한 카테고리를 표시 순서대로 반환합니다. 입력값이 없습니다.",
    prompt: '"책장에 어떤 카테고리가 있어?"',
    input: `{}`,
    output: `{
  "categories": [
    { "id": "a1…", "name": "경제", "sort_order": 0 },
    { "id": "b2…", "name": "인문", "sort_order": 1 }
  ]
}`,
  },
  update_book_metadata: {
    name: "update_book_metadata",
    summary:
      "책의 상태·카테고리·읽은 날짜·태그·숨김 여부를 수정합니다. id는 필수이고, 보낸 항목만 변경됩니다. 관리자 계정으로 연결했을 때만 성공합니다.",
    prompt: '"\'도둑맞은 집중력\'을 완료 상태로 바꾸고 읽은 날짜를 오늘로 지정해줘"',
    input: `{
  "id": "0f2c1a4e-…",
  "status": "완료",
  "read_date": "2026-08-10",
  "tags": ["집중", "몰입"],
  "is_hidden": false
}`,
    output: `{
  "book": {
    "id": "0f2c…",
    "title": "도둑맞은 집중력",
    "author": "요한 하리",
    "category": "자기계발",
    "status": "완료",
    "tags": ["집중", "몰입"],
    "read_date": "2026-08-10",
    "is_hidden": false
  }
}`,
  },
};

const ANNOTATION_LABELS: Record<string, string> = {
  readOnlyHint: "읽기 전용",
  destructiveHint: "파괴적 변경",
  idempotentHint: "멱등",
  openWorldHint: "외부 연동",
};

export default function McpDocs() {
  const tools = manifest.mcp.tools;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            돌아가기
          </Link>
        </Button>

        <h1 className="font-serif text-3xl font-semibold tracking-tight">에이전트 연동 (MCP) 문서</h1>
        <p className="mt-2 text-muted-foreground">
          {manifest.mcp.server.title} v{manifest.mcp.server.version} — ChatGPT, Claude, Cursor 같은 AI
          어시스턴트가 이 책장의 데이터를 읽고 수정할 수 있게 해주는 MCP 서버입니다.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="font-serif text-xl font-semibold">1. 연결하기</h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">서버 주소</CardTitle>
              <CardDescription>
                MCP 클라이언트에서 &quot;원격 MCP 서버 추가&quot;에 아래 주소를 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock code={MCP_URL} />
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>전송 방식: Streamable HTTP</li>
                <li>인증: OAuth 2.1 (클라이언트 자동 등록 지원)</li>
                <li>
                  연결 시 이 앱의 로그인 화면으로 이동하고, 승인 화면에서 허용하면 연결이 완료됩니다.
                </li>
                <li>도구는 로그인한 계정 권한으로 실행됩니다. 수정 도구는 관리자 계정에서만 성공합니다.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="font-serif text-xl font-semibold">2. 제공 도구 ({tools.length}개)</h2>
          {tools.map((tool) => {
            const doc = TOOL_DOCS[tool.name];
            const props = (tool.inputSchema?.properties ?? {}) as Record<
              string,
              { type?: string; description?: string; enum?: string[] }
            >;
            const required = ((tool.inputSchema as { required?: string[] })?.required ?? []) as string[];
            const annotations = (tool.annotations ?? {}) as Record<string, boolean>;

            return (
              <Card key={tool.name} id={tool.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{tool.name}</code>
                    {Object.entries(annotations)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <Badge key={k} variant="secondary" className="font-normal">
                          {ANNOTATION_LABELS[k] ?? k}
                        </Badge>
                      ))}
                  </CardTitle>
                  <CardDescription>{doc?.summary ?? tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h3 className="mb-2 font-medium">입력 파라미터</h3>
                    {Object.keys(props).length === 0 ? (
                      <p className="text-muted-foreground">없음</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-muted-foreground">
                            <tr className="border-b">
                              <th className="py-1.5 pr-3 font-medium">이름</th>
                              <th className="py-1.5 pr-3 font-medium">타입</th>
                              <th className="py-1.5 pr-3 font-medium">필수</th>
                              <th className="py-1.5 font-medium">설명</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(props).map(([key, schema]) => (
                              <tr key={key} className="border-b last:border-0 align-top">
                                <td className="py-1.5 pr-3 font-mono">{key}</td>
                                <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                  {schema.enum ? schema.enum.join(" | ") : schema.type}
                                </td>
                                <td className="py-1.5 pr-3 text-muted-foreground">
                                  {required.includes(key) ? "필수" : "선택"}
                                </td>
                                <td className="py-1.5 text-muted-foreground">{schema.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {doc && (
                    <>
                      <div>
                        <h3 className="mb-2 font-medium">입력 예시</h3>
                        <CodeBlock code={doc.input} />
                      </div>
                      <div>
                        <h3 className="mb-2 font-medium">출력 예시</h3>
                        <CodeBlock code={doc.output} />
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">사용 예: </span>
                        {doc.prompt}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold">3. 참고 사항</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              모든 응답은 텍스트(JSON 문자열)와 구조화된 결과를 함께 반환합니다. 위 출력 예시는 구조화된 결과
              기준입니다.
            </li>
            <li>
              실패 시 <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">isError: true</code>와 함께
              사유가 텍스트로 반환됩니다 (예: 권한 없음, 책을 찾을 수 없음).
            </li>
            <li>한글 검색어와 태그는 자동으로 NFC로 정규화되어 처리됩니다.</li>
            <li>숨김 처리된 책은 관리자 계정으로 연결했을 때만 조회됩니다.</li>
            <li>도구를 추가하거나 수정하면 이 문서의 파라미터 표는 MCP manifest에서 자동으로 갱신됩니다.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}