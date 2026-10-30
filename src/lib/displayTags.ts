const TAG_ALIASES: Record<string, string> = {
  심리: "심리학",
  자기개발: "자기계발",
  인문: "인문학",
};

export function getDisplayTags(tags: string[]): string[] {
  const unique = new Map<string, { label: string; hasHash: boolean }>();

  for (const tag of tags) {
    const trimmed = tag.trim().normalize("NFC");
    const hasHash = trimmed.startsWith("#");
    const name = trimmed.replace(/^#+/, "").trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (key === "book") continue;

    const canonical = TAG_ALIASES[key] ?? name;
    const canonicalKey = canonical.toLowerCase();
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
