# BMS — Business Management System

A small address book + invoice tracker: add, edit, search, sort and delete customers and invoices. Next.js 13, TypeScript, Tailwind.

**Demo:** https://vrdevil44.github.io/BMS-project/

## Demo data

The hosted demo has no backend. Data lives in your browser's `localStorage` (key `bms-demo-v1`), seeded with obviously fake records (example.com emails, 555 numbers). Use **Reset demo data** in the sidebar to restore the seed.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000/BMS-project
npm run build    # static export to ./out
```

## Optional: PocketBase backend

Data access goes through `src/data` (`list/get/create/update/remove`). To use a self-hosted [PocketBase](https://pocketbase.io) instead of localStorage:

1. Download PocketBase for your OS and run it from this repo root: `./pocketbase serve` (migrations in `pb_migrations/` create the `addressbook` and `invoicebook` collections).
2. Build/run with `NEXT_PUBLIC_BMS_BACKEND=pocketbase` (and optionally `NEXT_PUBLIC_POCKETBASE_URL`, default `http://127.0.0.1:8090`).
