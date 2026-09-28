# Progress Log

## 2026-09-25

- Mengaktifkan workflow `planning-with-files` untuk pekerjaan UI bertahap.
- Membaca struktur awal codebase target `/Users/kiram/Code/keuangan/`.
- Menemukan pola layout, theme, dan komponen UI reusable yang perlu dipakai.
- Membuat `context.md`, `task_plan.md`, `findings.md`, dan `progress.md` di workspace planning.
- Membaca instruksi repository (`AGENTS.md`, `CLAUDE.md`), `package.json`, global styles, route tree, dan komponen layout/UI relevan.
- Mengonfirmasi pola implementasi: Next.js App Router, feature modules, shadcn/ui, Recharts, React Query, nuqs, TanStack Table, dan theme CSS variables.
- Menyelesaikan Phase 1: discovery codebase dan pemetaan UI.
- Fase berikutnya: model tampilan dan data mock BPK.
- Existing overview and chart patterns were inspected; the target UI can reuse the dashboard shell, four-card grid, and themed Recharts bar chart pattern.
- Reviewed Clerk usage: the dashboard currently uses `auth.protect()`, while Organizations are part of the starter's workspace/billing features. Recorded the recommendation to avoid making Organization membership a requirement for the single-USK BPK workflow.
- Confirmed overview copy, scroll behavior for the activity panel, 10-row pagination, and permission-gated add/import actions during grilling.
- Confirmed that filters and pagination should be functional against dummy data using existing TanStack Table/state patterns.
- Memperbarui `task_plan.md` menjadi rencana terurut untuk simplifikasi template sebelum implementasi UI BPK.
- Menambahkan fase cleanup Sentry, demo feature, product mock, Clerk Organization/Billing, dashboard shell/theme, orphan dependency sweep, lalu fase implementasi BPK dan verifikasi.
- Mendokumentasikan guardrail untuk menjaga Clerk auth, data table, React Query, nuqs, Recharts, form/upload primitives, serta perubahan uncommitted pengguna.
- Mencatat gap pada helper cleanup Sentry: beberapa error boundary masih mengimpor Sentry sehingga helper tidak boleh dijalankan mentah.

## 2026-09-25 — Sesi cleanup template (branch `chore/template-cleanup`)

- Perubahan pengguna di-commit lebih dulu di branch `dev` (skill Clerk + `skills-lock.json`, route `/sign-in` & `/sign-up` + `ClerkProvider`, file planning).
- Fork `BroKarim/next-shadcn-dashboard-starter` dibuat, remote `fork` ditambahkan, branch kerja `chore/template-cleanup` dibuat dari `dev`. Belum ada push ke remote (fork masih berisi konten upstream).
- Phase 2-7 rencana cleanup template (versi 12 fase) dieksekusi:
  - Sentry dihapus lengkap: dependency, `src/instrumentation*.ts`, `next.config.ts`, keenam error boundary, env, Dockerfile, `.vscode/launch.json`, dokumentasi. Gap helper cleanup.js terkonfirmasi (4 boundary tidak punya template, dan template-nya mengganti UI error) sehingga template dikembalikan ke bentuk asli lalu Sentry dilepas manual dengan patch minimal + `console.error`; tombol retry tetap utuh.
  - Demo template dihapus: AI chat, kanban, chat/messaging (+ primitive khusus chat), notification center, halaman contoh forms/react-query/icons, beserta dependency `ai`, `@ai-sdk/react`, `@shadcn/helpers`, `@dnd-kit/*`, `zustand`, `motion`, `uuid`.
  - Product demo, `src/constants/mock-api.ts`, `src/app/api/products` dihapus; helper `delay` dipindah ke `src/lib/utils.ts` agar overview slot tetap jalan; `mock-api-users.ts` ditandai sebagai data sementara; `sort-by` dihapus.
  - Clerk menjadi single-tenant: route workspaces/billing/exclusive, `org-switcher.tsx`, dan `config/infoconfig.ts` dihapus; `use-nav.ts` memakai application role dari `publicMetadata.role` (`user`/`editor`/`admin`, default `user`); nav menyisakan Dashboard/Users/Profile; `ClerkProvider` tunggal di `components/layout/providers.tsx`; canonical auth ditetapkan `/sign-in` + `/sign-up` (route pengguna dipertahankan) dan `src/app/auth/*` duplikat dihapus beserta penyelarasan env/Docker/docs.
  - Shell & theme: KBar + SearchInput + GitHub CTA dihapus; React Query Devtools hanya dirender di development; satu brand theme `vercel` (9 file CSS theme + `theme-selector.tsx` dihapus); `font.config.ts` dipangkas 16 font Google menjadi Geist + Geist Mono; orphan sweep memakai reachability graph; dependency yatim dihapus (`embla-carousel-react`, `react-resizable-panels`, `react-responsive`, `vaul`, `@shadcn/react`) dan `transpilePackages: ['geist']` dibuang.
  - `scripts/cleanup.js` + `scripts/cleanup-templates/` dihapus (stale dan berisiko setelah theme/Clerk disederhanakan), entry `cleanup` di `package.json` dihapus, ignore oxlint/oxfmt diarahkan ke folder skill agent sehingga `bun run lint` bersih.
  - Dokumentasi disinkronkan: README ditulis ulang, AGENTS.md/CLAUDE.md/`docs/*`/`env.example.txt` dibersihkan dari referensi mati (Sentry, Organizations/Billing, product, kbar, multi-theme, cleanup script).
- Verifikasi: `bun run typecheck` lulus, `bun run lint` 0 warning, `bun run build` lulus (route tersisa: `/`, `/api/users`, `/dashboard`, `/dashboard/overview`, `/dashboard/profile`, `/dashboard/users`, `/sign-in`, `/sign-up`), smoke test `next start`: `/` → 307 `/sign-in`, `/sign-in` → 200, `/dashboard/overview` → 307 `/sign-in?redirect_url=…`, `/api/users` → 200.
- Catatan: `task_plan.md` di disk berubah di tengah sesi (dari rencana cleanup 12 fase menjadi rencana UI 6 fase + brief overview). Status fase sengaja TIDAK ditulis ke file tersebut agar tidak menimpa pekerjaan sesi lain; ringkasan hasil ada di sini dan di `findings.md`.
- Pekerjaan UI BPK (model data mock, overview, drawer, detail, admin actions) belum dikerjakan sesuai instruksi "jangan ada UI yang diubah".

## 2026-09-25 — Koreksi: tiga fitur template dipertahankan

- Atas permintaan pengguna, tiga hal yang sebelumnya ikut dihapus dipulihkan di branch `chore/template-cleanup`:
  - halaman Product (`src/app/dashboard/product`, `src/features/products`, `src/app/api/products`, `src/constants/mock-api.ts`, item nav + breadcrumb + image host `api.slingacademy.com`);
  - command search di header (`src/components/kbar/*`, `src/components/search-input.tsx`, dependency `kbar`, provider `KBar` di `app/dashboard/layout.tsx`);
  - `ThemeSelector` di header beserta 10 theme bawaan (`src/styles/themes/*.css`, `theme.config.ts`, `font.config.ts` 16 font, `theme.css`).
- `src/config/infoconfig.ts` dipulihkan hanya untuk konten Product; konten Workspaces/Team/Billing tetap terhapus tanpa consumer.
- Sisanya tetap seperti hasil cleanup (Sentry, AI chat, kanban, chat, notifications, Organizations/Billing, CtaGithub, orphan deps, `scripts/cleanup.js`).
- Dokumentasi disesuaikan kembali: README, AGENTS.md (theming 10 theme, struktur route/feature/kbar), `docs/themes.md` dikembalikan ke versi multi-theme.
- Verifikasi ulang: `bun run typecheck` lulus, `bun run lint` 0 warning, `bun run build` lulus (route `product`, `api/products` kembali ada), smoke test: `/sign-in` 200, `/dashboard/product` 307 ke sign-in, `/api/products` 200.

## 2026-09-25 — Phase 2 & 3: Deferred Implementation Brief (BPK Overview UI)

Branch: `feat/bpk-overview-ui` (dibuat dari `chore/template-cleanup`).

- `src/features/overview/components/bpk-overview-data.ts` (baru): tipe `BpkFinding`/`AdminActivity`/`BpkStatus`, 22 dummy temuan (lima status, tahun 2019-2024, 6 unit kerja, 6 PIC), 10 aktivitas admin, serta helper murni `formatRupiah`, `formatDateTime`, `formatDate`, `getStatusPriority`, `getOverviewMetrics`, `getFindingsByYear`, `getActivitiesForFinding`, plus konstanta `BPK_YEARS`/`BPK_KODE_TEMUAN`/`BPK_KODE_REKOMENDASI`. Tidak ada React, fetch, atau React Query di file ini.
- `src/features/overview/components/bpk-overview.tsx` (baru): komponen client berisi empat KPI card, bar chart `Temuan per Tahun` (`var(--chart-1)`), panel `Aktivitas Admin` dengan scroll tanpa scrollbar, card `Daftar Temuan` dengan enam filter fungsional, tabel TanStack 10 baris/halaman, dan drawer ringkasan bertipe `swipeDirection='right'`. Data tabel diurutkan `getStatusPriority` lalu `tanggalTerakhirUpdate` paling lama tanpa memutasi array dummy. Seam permission lokal `canManageFindings = false` menonaktifkan `Tambah Temuan` dan `Impor XLSX` dengan alasan yang terlihat.
- `src/app/dashboard/overview/layout.tsx`: konten demo diganti `PageContainer` (`pageTitle='Dashboard Temuan BPK'`, `pageDescription='Ringkasan tindak lanjut hasil pemeriksaan'`) + `BpkOverview`. Slot paralel lama dibiarkan ada tetapi tidak lagi dirender.
- `src/components/icons.tsx`: menambahkan ikon registry `eye` (dipakai tombol ringkasan baris).
- Tombol `Detail` (kolom Aksi) dan `Lihat Detail` (drawer) sengaja disabled dengan `title` penjelas karena route `/dashboard/overview/temuan/[id]` adalah Phase 4 — tidak ada link mati ke 404.
- Verifikasi yang dijalankan:
  - `bun run typecheck` lulus, `bun run lint` 0 warning/0 error, `bun run format` bersih, `bun run build` lulus (route `/dashboard/overview` tetap ada, tanpa route sementara).
  - Smoke test `next start`: `/sign-in` 200, `/dashboard/overview` 307 ke sign-in, `/dashboard/product` 307, `/api/users` 200.
  - Verifikasi browser sungguhan (Chrome via Playwright + halaman harness sementara yang sudah dihapus): 50/50 check lulus — empat KPI dan total rupiah, chart tampil dengan bar per tahun, panel aktivitas dapat di-scroll, keenam filter menyaring data (cari ID/kode, status, tahun, kode temuan, kode rekomendasi, judul), pagination 10 baris + 3 halaman, klik baris membuka drawer berisi seluruh field ringkasan, tombol close drawer berfungsi, klik tombol `Detail` yang disabled tidak membuka drawer, layout responsif 1440/800/390 tanpa overflow horizontal, dan mode gelap mengubah token permukaan tanpa error console.
  - Bug nyata yang ditemukan lewat verifikasi browser: filter `Tahun` selalu menghasilkan 0 baris karena kolom `number` memakai `filterFn: 'auto'` TanStack (`inNumberRange`, butuh tuple `[min, max]`). Diperbaiki dengan `filterFn` eksplisit pada kolom `tahun`.
- Belum dikerjakan (sesuai brief): route detail, impor XLSX/aksi admin nyata, deadline/overdue, AI, dan migrasi ke service/query layer.

## 2026-09-28 — Phase 4: halaman detail temuan

Branch: `phase-4-detail-temuan` (dibuat dari `echart` setelah commit chart ECharts).

- Penghapusan PIC: field `pic` dihapus dari tipe `BpkFinding`, 22 entri dummy, drawer ringkasan, dan referensi di `context.md`. `task_plan.md` brief Phase 2 dibiarkan sebagai catatan historis.
- `src/features/overview/components/bpk-overview-data.ts`: tambah tipe `BpkFileType`/`BpkAttachment`/`BpkComment`, dummy `BPK_ATTACHMENTS` (5 berkas) dan `BPK_COMMENTS` (3 komentar), plus helper murni `formatFileSize`, `getFindingById`, `getAttachmentsForFinding`, `getCommentsForFinding`. `getActivitiesForFinding` kini menerima `limit` opsional (tanpa limit = semua).
- `src/features/overview/components/bpk-status-badge.tsx` (baru): `StatusBadge` diekstrak dari overview agar dipakai overview dan halaman detail.
- `src/features/overview/permissions.ts` (baru): seam `canManageFindings = false` + `MANAGE_ACTIONS_DISABLED_REASON` dibagi ke overview dan detail.
- `src/features/overview/components/bpk-finding-detail.tsx` (baru, client): halaman panjang berisi Ringkasan Temuan (Tahun, Kode Temuan, Kode Rekomendasi, Nilai, Unit Kerja, Update Terakhir), Informasi Pemeriksaan, Dokumen Pendukung (daftar berkas + pratinjau PDF mock), Diskusi (daftar komentar + composer), dan Riwayat Aktivitas (timeline). Aksi mutasi disabled lewat seam permission.
- Route `/dashboard/overview/temuan/[id]` (server component) memakai `PageContainer` dengan status badge + tombol `Edit Temuan` di header, dan `notFound()` bila id tidak ada.
- Restrukturisasi route overview: `layout.tsx` dijadikan pass-through, header + `BpkOverview` dipindah ke `page.tsx` baru agar route bersarang punya header sendiri.
- Tombol `Detail` (tabel) dan `Lihat Detail` (drawer) kini `<Link>` yang menavigasi ke route detail (memakai `buttonVariants`, bukan tombol di dalam anchor).
- Verifikasi:
  - `bun run typecheck` lulus, `bun run lint` 0 error pada `src/features/overview` + `src/app/dashboard/overview`, `bun run build` lulus dengan route `/dashboard/overview` dan `/dashboard/overview/temuan/[id]`.
  - Render SSR halaman detail diverifikasi lewat route harness sementara (sudah dihapus): 200 dan memuat "Ringkasan Temuan", "Informasi Pemeriksaan", "Dokumen Pendukung", "Diskusi", "Riwayat Aktivitas", nama berkas, komentar, dan aktivitas; string "PIC" tidak ada. Overview juga diverifikasi 200 lewat harness sementara.
  - Belum ada verifikasi klik di Chrome sungguhan (ekstensi Playwriter tidak terhubung saat sesi ini).
- Belum dikerjakan: Phase 5 (impor XLSX, edit/hapus nyata, RBAC server-side) dan Phase 6 (verifikasi akhir).
