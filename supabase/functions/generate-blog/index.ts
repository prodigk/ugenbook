import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, markdown } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const truncated = markdown.slice(0, 8000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `당신은 네이버 블로그 전문 작가입니다. 사용자가 제공한 독서 노트를 바탕으로 네이버 블로그에 올릴 수 있는 완성된 블로그 글을 작성해주세요.

작성 규칙:
1. 제목은 "📚 [도서명] - 읽고 나서" 형식으로 시작
2. 서두에 책을 읽게 된 계기나 한줄 소개를 자연스럽게 작성
3. 본문은 핵심 내용을 3~5개 섹션으로 나누어 정리하되, 독자가 읽기 쉽게 대화체로 작성
4. 각 섹션에 인상 깊은 구절이나 인사이트를 포함
5. 마무리에 총평과 추천 대상을 작성
6. 해시태그 5~7개를 마지막에 포함
7. 마크다운 형식으로 작성
8. 한국어로 작성
9. 전체 분량은 1500~2500자 내외`,
            },
            {
              role: "user",
              content: `도서 제목: ${title}\n저자: ${author}\n\n독서 노트:\n${truncated}`,
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "블로그 글 생성에 실패했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-blog error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
