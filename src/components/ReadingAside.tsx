import { useEffect, useRef, useState } from "react";

export function ReadingAside({ title }: { title: string }) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    const aside = asideRef.current;
    if (!marker || !aside) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      setStuck(false);
      if (!desktop.matches) return;

      const offset = parseFloat(getComputedStyle(aside).top) || 0;
      observer = new IntersectionObserver(
        ([entry]) => {
          setStuck(
            !entry.isIntersecting &&
              entry.boundingClientRect.top < (entry.rootBounds?.top ?? offset),
          );
        },
        { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
      );
      observer.observe(marker);
    };
    observe();
    desktop.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      desktop.removeEventListener("change", observe);
    };
  }, [title]);

  return (
    <div className="reading-aside-column">
      <span
        ref={markerRef}
        className="reading-sticky-marker"
        aria-hidden="true"
      />
      <aside ref={asideRef} className="reading-aside" data-stuck={stuck}>
        <p className="mono-label">THE READING JOURNAL</p>
        <h2 id="notes-heading" className="reading-heading">
          <span className="sr-only">
            {stuck ? title : "책 속에서, 내 생각으로."}
          </span>
          <span className="reading-heading-intro" aria-hidden="true">
            책 속에서,
            <br /> 내 생각으로.
          </span>
          <span className="reading-heading-book" aria-hidden="true">
            {title}
          </span>
        </h2>
        <p>
          읽으며 남긴 문장과 생각을
          <br />
          차분히 따라가 보세요.
        </p>
        <a href="#main-content">도서 정보로 ↑</a>
      </aside>
    </div>
  );
}
