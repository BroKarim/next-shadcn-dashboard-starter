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

## Cleanup template (branch `chore/template-cleanup`)

- Helper `scripts/cleanup.js` tidak aman dipakai mentah untuk Sentry: hanya menulis ulang `global-error.tsx` dan `@bar_stats/error.tsx` (empat boundary lain tetap mengimpor Sentry) dan template-nya mengganti UI statistik error menjadi komponen Card/Alert versi lama. Keputusan: helper dihapus, semua penghapusan diverifikasi dengan `rg` + reachability graph dari `src/app/**`.
- Reachability graph (bukan hitungan referensi langsung) menemukan dead island yang tidak terlihat dari grep sederhana: `features/auth/*` (form auth custom demo), `features/overview/components/overview.tsx`, `features/profile/utils/form-schema.ts`, `nav-main`/`nav-projects`/`nav-user`/`layout/user-nav`, `form-card-skeleton`, `use-debounce`, `hooks/use-mobile.tsx` (duplikat byte-identik dengan `.ts`), `lib/compose-refs`, dan primitive chat (`ui/message`, `ui/message-scroller`, `ui/bubble`, `ui/attachment`, `ui/marker`).
- Primitive generik tanpa consumer saat ini sengaja dipertahankan untuk UI BPK berikutnya: drawer, sheet, dialog, tabs, pagination, empty, alert-dialog, combobox, native-select, item, frame, hover-card, accordion, aspect-ratio, context-menu, direction, toast, button-group, input-otp, serta seluruh `components/forms/fields`.
- `vaul` dan `react-responsive` tidak punya consumer sama sekali — `ui/drawer.tsx` memakai `@base-ui/react/drawer`, bukan Vaul. `transpilePackages: ['geist']` juga menunjuk paket yang tidak terpasang (sudah dibuang).
- Gap yang BELUM ditutup (di luar scope cleanup, sengaja tidak diubah agar perilaku tidak bergeser): route `src/app/api/users` dan `src/app/api/users/[id]` tidak memanggil `auth.protect()`. Datanya masih faker, tetapi harus diproteksi saat Phase admin actions / server-side authorization dikerjakan.
- Branding metadata masih template: `src/app/layout.tsx` memakai judul "Shadcn Dashboard - Next.js Admin Dashboard Template" dan `src/app/dashboard/layout.tsx` "Next Shadcn Dashboard Starter". Menunggu keputusan penamaan produk.
- `src/components/icons.tsx` masih memuat ikon template (kanban, chat, product, dsb.). Registry dipertahankan utuh; pruning ikon belum dilakukan dan sebaiknya mengikuti komponen yang benar-benar dipakai.
- Environment: `.env.local` masih berisi kunci Clerk dummy (`pk_test_REPLACE_ME`) sehingga sign-in nyata belum bisa diuji end-to-end; jalankan `npx clerk@latest init` untuk instance dev.

## BPK overview UI (branch `feat/bpk-overview-ui`)

- `filterFn: 'auto'` TanStack pada kolom bertipe `number` TIDAK berarti "cocokkan nilai" — `getAutoFilterFn()` memilih `inNumberRange` yang mengharapkan tuple `[min, max]`, sehingga filter memakai nilai string dari `Select` selalu menghasilkan 0 baris. Setiap kolom numerik yang difilter dengan `Select`/`Input` harus punya `filterFn` eksplisit (dipakai di kolom `tahun`).
- Popup `Drawer` base-ui tidak pernah ter-mount di jsdom meskipun `open=true` (mounting via layout transition internal), jadi perilaku drawer harus diverifikasi di browser sungguhan. jsdom tetap berguna untuk helper murni dan markup non-portal.
- React 19 + jsdom: menyetel `input.value` lewat setter native lalu `dispatchEvent(new Event('input'))` tidak memicu `onChange` (value tracker), sehingga uji filter headless tidak dapat diandalkan — verifikasi input sebaiknya di browser.
- `React.useMemo` untuk `useReactTable` dan kolom: kolom didefinisikan dalam `useMemo` dengan dependensi handler; tabel dikendalikan (`state.columnFilters`) sementara sorting dibiarkan uncontrolled lewat `initialState.sorting` (`priority` lalu `updatedAt`), sehingga data dummy tidak pernah dimutasi.
- Slot paralel lama (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`) beserta komponen demo (`area-graph.tsx`, `bar-graph.tsx`, `pie-graph.tsx`, `recent-sales.tsx`, `*-skeleton.tsx`) masih ada di disk tetapi tidak lagi dirender oleh layout overview. Kandidat pembersihan Phase 4/6 bila dashboard demo tidak diperlukan lagi.
- Warna bar chart memakai `var(--chart-1)` token theme (pada theme `vercel` nilainya amber `oklch(0.81 0.17 75.35)`), bukan warna status temuan — sesuai aturan brief agar tidak menambah token warna baru.
- Seam permission masih lokal (`const canManageFindings = false`) sehingga `Tambah Temuan`/`Impor XLSX` tampil disabled; saat Phase 5 dikerjakan, seam ini diganti pemeriksaan role server/client yang sebenarnya. Route `/api/users` dan `/api/products` juga masih belum memanggil `auth.protect()`.
