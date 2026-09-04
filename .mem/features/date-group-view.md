---
name: Year/month grouped view
description: Main page sort option "dateGroup" groups books by readDate into year (large) > month (small) sections
type: feature
---
SortOption includes "dateGroup" ("연/월별"). In Index.tsx, when selected, books are grouped by readDate into year sections (h2, large) then month subsections (h3, small), sorted newest first. Books without readDate go to a trailing "날짜 미지정" group. When grouping, mainSort status-priority is bypassed (sorted purely by readDate). Synced via ?sort=dateGroup URL param.
