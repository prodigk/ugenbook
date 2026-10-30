const TAG_ALIASES: Record<string, string> = {
  심리: "심리학",
  자기개발: "자기계발",
  인문: "인문학",
};

function canonicalTagName(tag: string): string {
  const name = tag.trim().normalize("NFC").replace(/^#+/, "").trim();
  return TAG_ALIASES[name.toLowerCase()] ?? name;
}

export function getDisplayTags(tags: string[], category?: string): string[] {
  const unique = new Map<string, { label: string; hasHash: boolean }>();
  const categoryKey = category ? canonicalTagName(category).toLowerCase() : "";

  for (const tag of tags) {
    const canonical = canonicalTagName(tag);
    if (!canonical) continue;

    const canonicalKey = canonical.toLowerCase();
    if (canonicalKey === "book" || canonicalKey === categoryKey) continue;

    const hasHash = tag.trim().startsWith("#");
    const existing = unique.get(canonicalKey);
    if (existing) {
      existing.hasHash ||= hasHash;
    } else {
      unique.set(canonicalKey, { label: canonical, hasHash });
    }
  }

  return [...unique.values()].map(({ label, hasHash }) =>
    hasHash ? `#${label}` : label,
  );
}
