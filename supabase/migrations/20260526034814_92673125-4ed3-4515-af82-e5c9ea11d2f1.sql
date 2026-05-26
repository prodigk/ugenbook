UPDATE public.books
SET author = regexp_replace(
  regexp_replace(author, '^\[\s*"?', ''),
  '"?\s*\]$', ''
)
WHERE author ~ '^\[.*\]$';

UPDATE public.books
SET author = btrim(author, '"''')
WHERE author ~ '^["''].*["'']$';