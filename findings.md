# Findings — UI Dashboard BPK

## Discovery awal

- Workspace untuk planning dan prototype: `/Users/kiram/Documents/ChatGPT/SILAHAP/`.
- Codebase target: `/Users/kiram/Code/keuangan/`.
- Codebase memiliki `src/components/layout/app-sidebar.tsx`, `header.tsx`, `page-container.tsx`, `src/components/ui/card.tsx`, `table.tsx`, `chart.tsx`, `drawer.tsx`, `sheet.tsx`, dan komponen data table.
- Codebase memiliki konfigurasi theme di `src/components/themes/` serta stylesheet di `src/styles/`.
- Codebase tampak berbasis Next.js/TypeScript dari adanya `next.config.ts`, `src/app/`, dan `tsconfig.json`; detail implementasi perlu dikonfirmasi dari instruksi repository dan file package.
- Prototype raster tersimpan di `prototypes/` dan digunakan sebagai referensi susunan informasi saja.

## Codebase conventions

- Framework: Next.js App Router, TypeScript strict, React 19, Tailwind CSS v4, shadcn/ui New York style, Recharts.
- Package manager yang disarankan: Bun. Verifikasi utama tersedia melalui `bun run lint`, `bun run typecheck`, dan `bun run build`.
- Feature structure: route di `src/app/`, feature module di `src/features/`, reusable primitives di `src/components/ui/`.
- Data fetching mengikuti React Query dengan service/query layer per feature; mock data tidak diimpor langsung oleh komponen.
- Filter dan sort tabel menggunakan nuqs/search params; TanStack Table dan helper data table sudah tersedia.
- Page header menggunakan `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`).
- Icon hanya diimpor dari `@/components/icons`.
- Form memakai `useAppForm` dari `@/lib/form` dan field components bawaan.
- Format kode: single quotes, JSX single quotes, no trailing comma, 2 spaces. Formatter: oxfmt; linter: oxlint.
- Global theme memakai CSS custom properties/OKLCH. Komponen `Card` menggunakan `bg-card`, `text-card-foreground`, `ring-foreground/10`, dan radius bawaan. Jangan menambahkan palette hard-coded sebelum mengecek theme aktif.
- Komponen bawaan yang relevan sudah tersedia: `Card`, `Table`, `Chart`, `Drawer`, `Sheet`, `FilePreview`, `Pagination`, dan komponen data-table.
- Layout bawaan sudah memiliki `app-sidebar.tsx`, `header.tsx`, `page-container.tsx`, breadcrumbs, theme controls, dan notification center.
- Existing overview UI has a reusable four-card KPI row and a responsive `lg:grid-cols-7` chart layout; this is a close structural starting point for the BPK dashboard.
- Existing `BarGraph` already uses Recharts through `ChartContainer`, `ChartConfig`, tooltip, and CSS theme variables such as `var(--chart-1)`. Reuse that pattern for the yearly finding bar chart.
- Existing dashboard shell is protected by Clerk in `src/app/dashboard/layout.tsx` and already supplies sidebar/header. The BPK page should plug into this shell rather than recreate it.
- The overview route uses parallel route slots (`@bar_stats`, `@area_stats`, etc.) and also has an overview component; exact route entry files need mapping before implementation.

## Product decisions

- Satu temuan memiliki satu rekomendasi.
- Kunci impor: `NoSatker + Tahun + Kode Temuan + Kode Rekomendasi`.
- Admin/editor activity masuk timeline; komentar berada di Diskusi dan tidak masuk panel Aktivitas Admin.
- Kolom resmi dari XLSX yang dapat berubah saat impor: status, alasan ditolak, deskripsi tindak lanjut, tanggal tindak lanjut, tanggal terakhir update, dan nilai temuan.
- Internal fields harus tetap dipertahankan ketika XLSX diimpor ulang.

## Clerk architecture decision

- Use Clerk authentication for actions that change state: comment, edit, upload, import, delete, and user approval.
- Do not require Clerk Organizations for the BPK product unless the system will become multi-tenant or users must be isolated by independent organizations.
- A single USK institution can use application-level roles keyed by Clerk `userId`: `user`/read-only, `editor`, and `admin`. Enforce these roles on server actions/API routes; client-side navigation is only a UX layer.
- The current starter has `auth.protect()` on the whole `/dashboard` segment. If anonymous read-only access is approved, public BPK viewing needs a separate route outside that protected layout, while mutation routes remain protected.
- “Knowing the link” is not a reliable authorization boundary. Because audit amounts and documents may be sensitive, a safer product split is public or low-friction access only for approved summary data, with login required for detailed records, documents, comments, and all mutations.
- If account approval is needed, keep a pending/approved state in the app database or server-controlled Clerk metadata. Admin approval changes the application role; it does not require an Organization.
