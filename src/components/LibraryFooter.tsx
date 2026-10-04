import { Link } from "react-router-dom";
export function LibraryFooter() {
  return (
    <footer className="library-footer container">
      <Link to="/">ugen / library.</Link>
      <p>읽고, 기록하고, 나누는 공간.</p>
      <span className="mono-label">A PERSONAL READING ARCHIVE</span>
    </footer>
  );
}
