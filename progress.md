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

## 2026-09-28 — Phase 7: Infrastruktur Data (PostgreSQL + Drizzle + service layer)

Branch: `feat/data-infra-findings` (dari `891ff72`, berisi Phase 4), worktree tunggal `/Users/kiram/Code/keuangan`.

- Dependency baru: `drizzle-orm@0.45.2`, `postgres@3.4.9`, dev: `drizzle-kit@0.31.10`, `dotenv@18.0.1`. `server-only` sudah tersedia transitive.
- Database lokal `keuangan` dibuat (`createdb -h localhost -U kiram keuangan`); `DATABASE_URL` + `INITIAL_ADMIN_EMAILS` (kosong) ditambahkan ke `.env.local`.
- Skema enam tabel di `src/db/schema.ts` dengan nama kolom eksplisit (tanpa opsi `casing`); migrasi `drizzle/0000_*` di-commit setelah SQL direview (partial unique `WHERE deleted_at IS NULL` diekspresikan drizzle-kit dengan benar).
- Migrasi manual `drizzle/0001_*`: sequence + trigger `kode_display` (`BPK-{tahun}-{seq}`, retry maks 100 kali saat bentrok). Diuji: insert tanpa `kode_display` → `BPK-2025-001`.
- Uji DB lewat psql: duplikat natural key saat aktif → gagal; soft delete → insert ulang natural key yang sama → berhasil; `updated_at` naik via Drizzle `$onUpdate` dan `tanggal_terakhir_update` tidak tersentuh.
- `src/db/seed.ts` idempotent: jalan pertama 22 temuan + 9 aktivitas + 3 komentar; jalan kedua semua `inserted=0`. Satu aktivitas mock (`Impor XLSX` tanpa `findingId`) sengaja tidak di-seed — aktivitas level batch akan lahir dari `import_batches` nyata saat fitur impor (Phase 5).
- Catatan API Drizzle: `onConflictDoNothing` memakai `where` untuk predikat partial index (`targetWhere` hanya ada di `onConflictDoUpdate`).
- `src/lib/rbac.ts` + `src/lib/errors.ts`: `requireAuth()` (Clerk `userId` saja), `getAppRole()` → `{ role, exists }`, `ensureCurrentUser()` (lazy upsert, role tidak pernah ditimpa; email dari `currentUser()` hanya di jalur pembuatan baris), `requireActorIdentity()`, `requireRole()`, dan `getAppRoleWithBootstrap()` (pengecualian bootstrap D36).
- `src/features/findings/api/` (types/service/queries) + `src/features/findings/utils/format.ts`: server actions dengan filter/pagination/sort di SQL; sort default `CASE status` + `tanggal_terakhir_update ASC` (tanpa kolom `status_priority`); uang tetap string end-to-end.
- Bug yang tertangkap saat uji: metrik `total` awalnya menunjuk `row=null` → 0; diperbaiki dengan agregat keseluruhan terpisah. Semua KPI kini identik dengan helper mock (total 22, nilai Rp17.341.700.000).
- UI overview dipecah: `bpk-kpi-cards`, `bpk-year-chart`, `bpk-activity-panel` (tanpa limit, D34), `bpk-findings-table` (nuqs `q/status/tahun/kodeTemuan/kodeRekomendasi/judul` + page/perPage; debounce via nuqs `limitUrlUpdates: debounce(400)`; TanStack manual* via hook `useDataTable`), skeleton di `bpk-overview-skeletons`. `bpk-overview.tsx` menjadi komposisi; `overview/page.tsx` async + `await Promise.all` prefetch ×4 sebelum `dehydrate()` (D32); `overview/loading.tsx` baru.
- Drawer memakai `useQuery(findingActivitiesOptions(id, 3))` non-suspense; kolom `ID` dan link detail kini memakai `kodeDisplay` (uuid tetap jadi row id internal).
- Role plumbing: `dashboard/layout.tsx` memanggil `getAppRoleWithBootstrap()` dan mengirim `appRole` ke `KBar` + `AppSidebar`; `useFilteredNavGroups/Items` menerima `appRole` eksplisit; `useAppRole()` (Clerk) ditandai deprecated. `overview/page.tsx` menghitung `canManage` dari role DB.
- Dokumentasi: `docs/data.md` baru; `AGENTS.md` + `docs/nav-rbac.md` diperbarui (role dari DB, bukan Clerk metadata; snippet requireRole diganti referensi `src/lib/rbac.ts`).
- Lint: 0 error; 5 warning tersisa semua di `src/components/evilcharts/*` (pre-existing Phase 3/4; ditambah komentar `oxlint-disable` ber-scope di `echarts-legend.tsx` yang sebelumnya membuat `bun run lint` gagal).
- Build lulus; semua route dinamis (ƒ) sehingga build tidak menyentuh DB. Smoke test `next start` (port 3100): `/` → 307 sign-in, `/sign-in` 200, `/dashboard/overview|users|product` → 307, `/api/users` 200. `grep DATABASE_URL .next/static` → 0 file.
- Verifikasi yang masih menunggu: uji manual di browser dengan login Clerk sungguhan (KPI/chart/panel/filters/pagination/drawer/dark mode), RBAC end-to-end dengan email di `INITIAL_ADMIN_EMAILS`, dan pengujian `includeDeleted` admin-only lewat service (butuh mutation Phase 5 atau pengecualian sementara).

## 2026-09-29 — Phase 5 & 6: Admin actions, mutation nyata, verifikasi

Branch: `feat/admin-actions` (dari `87057ad`). Satu worktree.

- **Pembeda admin vs user** (permintaan pemilik produk): `BpkOverview` menerima `appRole`; `admin` melihat panel **Aktivitas Admin**, role lain melihat grafik baru **Nilai Temuan per Tahun** (`SUM(nilai_temuan)`, sumbu ringkas rupiah via `formatRupiahCompact`, tooltip memakai label seri karena chart bersama tidak punya value formatter). Prefetch di `overview/page.tsx` kini kondisional mengikuti role.
- **CRUD temuan**: `finding-form-sheet.tsx` (TanStack Form + Zod `findingSchema`), `createFinding`/`updateFinding` (diff per kolom → `activities`), soft delete + restore (admin-only) dengan dialog konfirmasi dan penanda "Terhapus" + switch "Tampilkan yang dihapus" (memakai `includeDeleted` yang server-nya menjaga `requireRole('admin')`).
- **Impor XLSX**: `xlsx` (SheetJS). Inti transaksi diekstrak ke `import-core.ts` agar bisa diuji; savepoint per baris; hanya 6 kolom resmi yang ditimpa; `import_batches` + berkas sumber di `storage/imports/`. UI `import-xlsx-sheet.tsx` menampilkan ringkasan + baris dilewati.
- **Lampiran**: validasi magic bytes (`file-type.ts`, tolak ekstensi yang bertentangan — bug ditemukan test: PNG bernama `.pdf` awalnya lolos), maks 10 MB, simpan di `storage/attachments/{findingId}/{uuid}`, route handler `/api/attachments/[id]` (401 bila belum login), pratinjau PDF/gambar + unduh.
- **Komentar**: composer di halaman detail (editor/admin), hapus komentar sendiri; admin boleh menghapus komentar siapa pun. Komentar tidak masuk `activities` (D14).
- **Halaman detail** dipindah dari mock ke DB: `fetchQuery(findingDetailOptions(id))` di server (judul/status header + hydration), komponen klien memakai `useSuspenseQuery`; seam lama `permissions.ts` dihapus.
- **Akses & Peran**: fitur baru `src/features/access/**` + route `/dashboard/access` + item nav dengan `access: { role: 'admin' }` (item nav pertama yang benar-benar ter-gate, jadi sidebar admin dan user kini berbeda). `setUserRole` melarang menurunkan role sendiri dan mencatat `Perbarui Peran Pengguna`.
- **Testing**: `bun run test` (Bun runner, preload `.env.local`, `--conditions=react-server`) — 15 test: unit diff impor/aktivitas, sniffing berkas, dan **integrasi** transaksi impor (idempotent, official-only, savepoint, cleanup tanpa residu). `bunfig.toml` + `src/test-setup.ts` baru; script `test` ditambahkan.
- **Verifikasi (Phase 6)**: typecheck lulus; lint 0 error (5 warning pre-existing `evilcharts/*`); format bersih; build lulus; seed idempotent; smoke `next start` (`/dashboard/access` 307, `/api/attachments/<id>` 401 `signed-out`, `/api/users` 200) dan tanpa kebocoran `DATABASE_URL` ke bundle klien. Jalur bootstrap admin terbukti nyata: baris `users` pemilik instance dibuat dengan role `admin`.
- Catatan proses: pemeriksaan pertama terhadap route baru sempat menyesatkan (404) karena proses `next start` lama masih memegang port; setelah server dijalankan ulang di port bersih hasilnya benar.
- Sisa untuk pengujian manual pemilik produk: interaksi browser penuh dengan sesi Clerk asli (form, impor berkas nyata, unggah/pratinjau lampiran, komentar, ubah role, drawer/filter/pagination, dark mode).

## 2026-09-30 — Phase 8 (lanjutan) & Phase 9: verifikasi browser, perbaikan bug, trim template

Branch Phase 8: `feat/import-guards-cleanup` (dari `6bf1518`). Branch Phase 9: `feat/browser-verification-fixes` (dari `508ee1f`). Satu worktree.

### Phase 8 — guard impor, cleanup mock, verifikasi teknis

- **Guard impor** (`5901559`, dirapikan `835342b`): `findBatchByFileHash()` (mengabaikan batch `failed`) + server action `checkImportFileHash` + warning inline non-blocking (SHA-256 dihitung lokal dengan `crypto.subtle`, tanpa unggah); `ImportSummary.staleActiveRows` menghitung baris aktif dengan `last_import_batch_id != batch ini` (NULL/seed dikecualikan; baris yang savepoint-nya rollback tidak dihitung lewat `notInArray`). Race condition ditutup dengan token `requestRef`.
- **Cleanup mock** (`5b9c66a`): `getFindingFilterOptions()` (satu query `array_agg(DISTINCT … ORDER BY …)`) + key `filterOptions` di bawah `findingKeys.all`; dataset seed pindah ke `src/db/fixtures/findings.ts`; `bpk-overview-data.ts` dihapus.
- **Verifikasi teknis** (`ffa98ba`, dok): typecheck, lint, format, build lulus; 16 → (setelah Phase 9) 19 test; seed idempotent; sanity opsi filter 6 tahun / 22 kode.
- Keputusan: "preview sebelum commit" untuk impor dinyatakan **di luar scope** (D18 + `context.md` baris 19); diganti ringkasan pasca-impor + diff `activities`.

### Phase 9 — temuan verifikasi browser (Playwright, build produksi, sesi Clerk asli)

Urutan kerja: fix actor → fix form → simplifikasi role → trim template → perf → verifikasi → dokumentasi. Commit: `3ab5615`, `127fa7f`, `c18321c`, `922f50d`, `9c48d30`, `c51a83f`, `96af646`, `433acd2`, `9cd746e`, `8faf3fe`.

- **Bug blocker 1 — semua aksi tulis 500** (`3ab5615`): `requireActorIdentity()` mengembalikan Clerk id (`user_...`) padahal kolom FK bertipe `uuid` mengacu `users.id` → komentar, lampiran, CRUD temuan, impor gagal `22P02`. Helper kini mengembalikan `{ id: users.id, email, name }`; `ImportActor.userId` → `id`; proteksi self-demote `setUserRole` (uuid vs Clerk id) ikut diperbaiki. Dikunci `src/lib/rbac.test.ts` (Clerk di-mock via `mock.module`, DB nyata) — termasuk insert komentar + lampiran (replikasi error user).
- **Bug blocker 2 — `formContext` crash** (`127fa7f`): `form.SubmitButton` dirender tanpa `<form.AppForm>`; dibungkus sesuai `docs/forms.md`.
- **Kebijakan role (D37)** (`c18321c`): aplikasi internal → hanya `user` + `admin`. Admin boleh segalanya; `user` baca semua + **boleh komentar** (hapus komentar sendiri; admin hapus semua). Aksi kelola data admin-only. Migrasi `drizzle/0002_tearful_triathlon.sql`: `UPDATE role='admin' WHERE role='editor'` lalu CHECK `('user','admin')`. `context.md`, `AGENTS.md`, `docs/nav-rbac.md`, `docs/clerk_setup.md`, `env.example.txt`, `README.md` diselaraskan. Helper baru `getCurrentUserId()` untuk URL/komponen.
- **Bug — daftar tidak refresh** (`9cd746e`): call-site meng-override `onSuccess` sehingga invalidasi `mutationOptions` hilang; invalidasi dipindah ke `onSettled` (findings, access, users).
- **Trim template** (`922f50d`, `9c48d30`, `c51a83f`): 16 Google Fonts → Geist + Geist Mono (tema discord/light-green/astro-vista/zen dialihkan); Infobar/InfoSidebar/InfoButton/infoconfig dan KBar (Cmd+K + `search-input` + dependensi `kbar`) dihapus; halaman `/dashboard/product` + `features/products/**` + `constants/mock-api.ts` + nav/breadcrumb dihapus. `/dashboard/users` dipertahankan (keputusan pemilik).
- **Perf — overview 3 detik** (`96af646`): slot parallel-route sisa template `@area_stats/@bar_stats/@pie_stats/@sales` masih terdaftar; `@sales` menunggu `delay(3000)` di setiap request. Slot + komponen demo dihapus; delay mock users (800ms) dihapus; boundary error route ditulis ulang tanpa `stats-error`. Terukur **3.01s → 0.02s** (prod), route lain < 0.2s.
- **Noise log** (`96af646`): `auth.protect()` pada instance Clerk dev lolos (`dev-browser-missing`) sehingga render paralel memanggil `requireAuth()` saat signed-out → `UnauthenticatedError` di log. Layout + halaman detail + halaman akses redirect eksplisit; `getAppRoleWithBootstrap()`/`getCurrentUserId()` mengembalikan default aman. Log bersih.
- **Code review** (`8faf3fe`): temuan review diterapkan — hapus endpoint demo `/api/users` yang tidak terautentikasi dan tak terpakai, prop `isAdmin` mati, `useAppRole` mati, host gambar `slingacademy`, perbandingan author komentar lewat email → `users.id` (`authorUserId` ditambahkan ke `FindingComment`), guard signed-out di halaman akses, dan penyelarasan dokumentasi.
- **Verifikasi browser nyata** (Playwright + Chrome sesi asli): komentar (kirim + auto-refresh), lampiran PDF (unggah + pratinjau + `GET /api/attachments/{id}` 200), form edit (submit sukses), impor XLSX (ringkasan `completed` + warning duplikat batch), soft delete/restore + toggle "tampilkan yang dihapus", dan peran `user` (komentar boleh; Unggah/Edit disabled; nav "Akses & Peran" tersembunyi). Data uji dibersihkan; DB kembali 22 temuan / 9 aktivitas / 3 komentar; storage bersih.
- **Test**: `bun run test` → **19 lulus** (16 lama + 2 actor + 1 FK komentar/lampiran). Typecheck, lint (0 error; 5 warning pre-existing `evilcharts/*`), format, build semuanya lulus.
- Catatan lingkungan: MCP Playwriter sempat gagal karena cache npx rusak (`@xmorse/playwright-core` hilang); dipasang ulang di cache npx sehingga pengujian browser bisa jalan.
- Sisa: merge `feat/admin-actions` → `dev` → `main` dan branch `feat/browser-verification-fixes`; deploy ditunda.
