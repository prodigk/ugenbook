

## Plan: 메인 페이지 상단 캐러셀 카드 영역 추가

### 요구사항 정리

검색창 위에 가로 캐러셀을 배치하여 **작성중 2권 + 대기 1권** (총 3권)을 하이라이트 카드로 노출합니다.

**각 카드 구성:**
- 왼쪽: 책 표지 이미지 (없으면 제목 표시)
- 오른쪽 정보:
  - 제목
  - 카테고리 (Badge)
  - 상태 (Badge)
  - 작가
  - 마크다운 본문 미리보기 (있으면 1-2줄, frontmatter 제거 후)
- 카드 클릭 시 `/book/:id` 상세페이지로 이동

### 구현 계획

**1. 새 컴포넌트 생성: `src/components/FeaturedCarousel.tsx`**
- props: `books: Book[]` (이미 필터링된 작성중/대기 도서 목록)
- 기존 `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` 컴포넌트 활용
- 각 카드는 `Link`로 감싸서 상세페이지 연결
- 카드 레이아웃: `flex` 가로 배치 (왼쪽 표지 `aspect-[2/3]`, 오른쪽 텍스트 영역)
- 본문 미리보기: frontmatter 제거 후 첫 80자 정도를 `line-clamp-2`로 표시
- 반응형: 모바일에서는 1장씩, md 이상에서는 카드 너비 조절

**2. `src/pages/Index.tsx` 수정**
- `visibleBooks`에서 작성중 2권 + 대기 1권을 `updatedAt` 최신순으로 선별하는 `useMemo` 추가
- `<SearchFilter>` 위에 `<FeaturedCarousel>` 배치
- 해당 도서가 없으면 캐러셀 영역 미표시

### 카드 디자인 세부

```text
┌──────────────────────────────────────┐
│ ┌────────┐  제목 (font-serif bold)   │
│ │ 표지   │  카테고리 | 상태 (Badge)  │
│ │ 이미지 │  작가명                   │
│ │        │  본문 미리보기 1-2줄...   │
│ └────────┘                           │
└──────────────────────────────────────┘
```

- 기존 상태별 스타일 유지 (작성중: amber 계열 ring, 대기: muted ring)
- hover 시 살짝 scale-up 효과

