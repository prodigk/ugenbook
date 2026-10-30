import { describe, expect, it } from "vitest";
import { getDisplayTags } from "./displayTags";

describe("getDisplayTags", () => {
  it("uses one canonical label for equivalent tags", () => {
    expect(
      getDisplayTags([
        "#심리",
        "#심리학",
        "심리학",
        "자기개발",
        "자기계발",
        "#마케팅",
        "마케팅",
      ]),
    ).toEqual(["#심리학", "자기계발", "#마케팅"]);
  });

  it("normalizes whitespace, Unicode, case and hash prefixes", () => {
    expect(getDisplayTags([" 철학 ", "#철학", "Café", "#CAFÉ"])).toEqual([
      "#철학",
      "#Café",
    ]);
  });

  it("keeps distinct tags and hides the book marker", () => {
    expect(getDisplayTags(["book", "#BOOK", "문학", "소설", "", "#"])).toEqual([
      "문학",
      "소설",
    ]);
  });

  it("shows a category and its matching tag only once", () => {
    expect(getDisplayTags(["철학", "#철학", "자기계발"], "철학")).toEqual([
      "자기계발",
    ]);
    expect(getDisplayTags(["인문학", "#인문"], "인문")).toEqual([]);
  });
});
