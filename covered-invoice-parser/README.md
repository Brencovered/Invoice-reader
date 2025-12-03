# Covered Invoice Parser (Woolworths v1)

This repo parses Woolworths online **Tax Invoice** PDFs and maps the line items
into a structure compatible with the `grocery_items` table used by Covered.

It is tuned to the standard Woolworths tax invoice layout, where items are
listed in a table with columns `Line | Description | Ordered | Supplied | Price | Amount`,
and a possible "Substitutions" section.

## Setup

```bash
git init
npm install
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEFAULT_USER_ID etc.
```

Place a sample invoice into:

```text
sample-data/280749993.pdf
```

(or any other path you like).

## Run

Default sample path:

```bash
npm run parse
```

Custom path:

```bash
npm run parse:custom -- /absolute/or/relative/path/to/invoice.pdf
```

The script will:

1. Read the PDF.
2. Extract text using `pdf-parse`.
3. Parse Woolworths line items and meta.
4. Map them into `grocery_items`-shaped rows.
5. Print the rows to the console.
6. If Supabase env vars are set, insert rows into your `grocery_items` table.

## Notes

- Category mapping is basic (e.g. `Fruit & Vegetables` → `Fruit/Veg`).
  You can expand `mapCategory` in `saveToSupabase.ts` to align with your taxonomy.
- Units are set to `"each"` for now.
- `invoice_id` is populated from the `Invoice/Order Number` on the PDF.
- The parser expects the Woolworths tax invoice format as of late 2025.

You can extend this project to support:
- More retailers (add more parsers).
- Better unit / weight handling.
- Web API / Next.js endpoints for upload from the Covered app.
