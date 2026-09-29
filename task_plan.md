# Task Plan — UI Dashboard Tindak Lanjut Temuan BPK

## Goal

Mengimplementasikan UI tahap pertama dashboard monitoring temuan BPK USK pada codebase `/Users/kiram/Code/keuangan/src/`, dengan mengikuti gaya visual dan komponen bawaan codebase serta struktur informasi dari prototype.

## Status

`in_progress`

## Phases

### Phase 1 — Discovery codebase dan pemetaan UI

Status: `complete`

- Membaca `AGENTS.md`, `CLAUDE.md`, `package.json`, dan konfigurasi UI.
- Memetakan route dashboard, layout/sidebar/header, theme, komponen card/table/chart/drawer, dan pola mock data.
- Mengonfirmasi stack Next.js App Router, shadcn/ui, Recharts, React Query, nuqs, dan TanStack Table.

### Phase 2 — Model tampilan dan data mock BPK

Status: `complete`

- `src/features/overview/components/bpk-overview-data.ts` berisi tipe, konstanta, 22 dummy temuan, 10 aktivitas admin, dan helper murni (`formatRupiah`, `getStatusPriority`, `getOverviewMetrics`, `getFindingsByYear`).

- Definisikan tipe data temuan yang mengikuti kolom XLSX.
- Siapkan data mock kecil untuk KPI, grafik tahunan, aktivitas admin, tabel, drawer, dan halaman detail.
- Pastikan filter dan pagination berfungsi memakai TanStack Table/state pattern yang sudah ada.

### Phase 3 — Dashboard overview

Status: `complete`

- `/dashboard/overview` dirender ulang sebagai Dashboard Temuan BPK: empat KPI, bar chart tahunan, panel aktivitas admin, enam filter fungsional, tabel 10 baris, dan drawer ringkasan (lihat Deferred Implementation Brief di bawah).

- Ganti konten demo overview menjadi Dashboard Temuan BPK.
- Tambahkan empat KPI card jumlah + rupiah.
- Tambahkan bar chart Temuan per Tahun.
- Tambahkan panel Aktivitas Admin yang bisa di-scroll tanpa scrollbar terlihat.
- Tambahkan filter dan tabel 10 baris per halaman.

### Phase 4 — Drawer dan halaman detail

Status: `complete`

- Drawer ringkasan dari Phase 3 tetap dipakai; tombol `Detail`/`Lihat Detail` kini menavigasi ke route asli.
- Route `/dashboard/overview/temuan/[id]` menampilkan satu halaman panjang tanpa tab: Ringkasan Temuan, Informasi Pemeriksaan, Dokumen Pendukung (daftar + pratinjau), Diskusi, dan Riwayat Aktivitas.
- Field `pic` dihapus dari tipe `BpkFinding`, seluruh dummy data, drawer, dan context.md karena tidak dibutuhkan.
- Aksi `Edit Temuan`, `Unggah Berkas`, dan kirim komentar memakai seam `canManageFindings` yang dibagi dari `src/features/overview/permissions.ts` dan masih disabled sampai RBAC Phase 5.

### Phase 5 — Admin actions dan audit timeline UI

Status: `complete`

- Form tambah/edit temuan (TanStack Form + Zod, `requireRole('editor')`), soft delete + restore (admin).
- Impor XLSX (SheetJS) satu transaksi + savepoint per baris, diff kolom resmi saja, ringkasan `import_batches`, berkas sumber di `storage/imports/`.
- Lampiran: unggah (validasi magic bytes, maks 10 MB) ke `storage/attachments/`, pratinjau/unduh lewat route handler terautentikasi, hapus lampiran.
- Diskusi komentar (editor/admin) terpisah dari `activities`; halaman detail membaca data DB (`getFindingDetail`).
- Pengaturan akses: halaman `/dashboard/access` (admin-only, item nav `access: { role: 'admin' }`) untuk mengubah role; perubahan role dicatat ke `activities`.
- Pembeda tampilan admin vs user di overview: admin melihat panel **Aktivitas Admin**, role lain melihat grafik **Nilai Temuan per Tahun** (nominal uang).

### Phase 6 — Verifikasi

Status: `complete`

- `bun run typecheck`, `bun run lint` (0 error; 5 warning pre-existing di `evilcharts/*`), `bun run format:check`, `bun run build` semua lulus.
- `bun run test`: 15 test lulus (unit: diff, import mapping, file sniffing; integrasi: transaksi impor terhadap DB nyata, termasuk idempotensi, kolom internal tidak tertimpa, dan cleanup tanpa residu).
- Seed idempotent (jalan kedua `inserted=0`); DB dev bersih setelah test (22 temuan, 9 aktivitas seed, 0 residu).
- Smoke `next start`: `/` → 307 sign-in, `/sign-in` 200, `/dashboard/*` → 307, `/api/users` 200, `/api/attachments/<id>` → 401 `signed-out`, `grep DATABASE_URL .next/static` kosong.
- Terverifikasi nyata: jalur bootstrap admin membuat baris `users` (email pemilik, role `admin`) saat pertama membuka dashboard.
- Belum terverifikasi otomatis (butuh sesi login Clerk): interaksi browser penuh (form create/edit, impor berkas asli, unggah/pratinjau lampiran, komentar di UI, ubah role via halaman akses, drawer/filter/pagination, dark mode).

### Phase 7 — Infrastruktur data (PostgreSQL + Drizzle + service layer)

Status: `implemented` — 8 commit dieksekusi di branch `feat/data-infra-findings`; verifikasi manual di browser (login asli) menunggu konfirmasi pemilik produk. Lihat `progress.md` dan `docs/data.md`.

Branch: `feat/data-infra-findings` dari `891ff72`, dikerjakan di worktree tunggal `/Users/kiram/Code/keuangan`.

- Tambahkan PostgreSQL lokal + Drizzle (schema, migrasi SQL auditable, seed 22 temuan).
- Tabel: `users`, `findings`, `activities`, `comments`, `attachments`, `import_batches`.
- RBAC server (`src/lib/rbac.ts`): `requireAuth()`, `requireRole()`; role dari `users.role`, bukan Clerk metadata.
- Pindahkan seluruh data baca overview (KPI, grafik, aktivitas, tabel) ke service/query layer.
- Siapkan `getFindingDetail(id)` untuk halaman detail tanpa mengubah UI Phase 4.
- Revisi brief: `status_priority` dihapus (pakai `CASE`), unique key jadi partial, `kode_display` dibuat trigger, prefetch `await Promise.all`, `currentUser()` untuk email, aktivitas tanpa limit, nama kolom eksplisit + `dotenv`.

## Decisions

- Fokus UI pertama: BPK saja.
- Prototype mengatur susunan informasi; theme, color, border, font, dan komponen mengikuti codebase.
- Dummy data dipakai terlebih dahulu.
- Nilai temuan dibaca sebagai angka dari sumber data, tanpa LLM.
- Deadline/overdue ditunda.
- Clerk Organizations tidak diwajibkan untuk single-tenant USK; gunakan Clerk Auth + role aplikasi yang diperiksa di server.
- Tombol Tambah Temuan dan Impor XLSX membutuhkan login dan permission aksi.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `task_plan.md` tidak ditemukan saat update | 1 | Dipulihkan di root codebase dan disinkronkan dengan progress terbaru |
| Filter Tahun tidak menyaring apa pun (0 baris) | 1 | Kolom `number` dengan `filterFn: 'auto'` memakai `inNumberRange` bawaan TanStack sehingga filter string dari Select tidak cocok; kolom `tahun` diberi `filterFn` eksplisit yang membandingkan `String(value)` |
| Pupup `Drawer` base-ui tidak pernah ter-mount di jsdom | 1 | Verifikasi drawer dipindahkan ke Chrome sungguhan; uji headless hanya dipakai untuk data/helper |

## Definition of Done

- Dashboard overview BPK menampilkan empat KPI, bar chart tahunan, aktivitas admin, filter, dan tabel.
- Filter dan pagination berfungsi pada dummy data.
- UI mengikuti primitives/theme codebase.
- Drawer dan halaman detail tersedia setelah fase berikutnya.
- Verifikasi yang tersedia selesai atau kegagalannya tercatat.

---

## Deferred Implementation Brief — BPK Overview UI

Status: `implemented` — Phase 2 dan Phase 3 selesai untuk route `/dashboard/overview`. Sisa pekerjaan: Phase 4 (route detail `/dashboard/overview/temuan/[id]`, dokumen/PDF, diskusi, timeline) dan Phase 5 (impor XLSX serta aksi admin nyata). Tombol `Detail` dan `Lihat Detail` masih placeholder disabled sampai route detail dikerjakan.

Bagian ini adalah brief implementasi untuk agent yang mengerjakan UI overview. Kerjakan hanya setelah fitur lain yang sedang aktif selesai, dan jangan mengubah file di luar daftar scope tanpa alasan teknis yang jelas.

### Outcome yang harus terlihat

Route `/dashboard/overview` menjadi Dashboard Temuan BPK dengan layout informasi dari prototype, tetapi memakai shell, theme, warna, typography, border, radius, spacing, dan komponen bawaan codebase.

Urutan konten:

1. Header dari `PageContainer`:
   - title: `Dashboard Temuan BPK`
   - description: `Ringkasan tindak lanjut hasil pemeriksaan`
2. Empat kartu KPI dalam grid responsive.
3. Satu row dengan grafik batang `Temuan per Tahun` dan panel `Aktivitas Admin` berbanding lebar 3:1.
4. Card `Daftar Temuan` dengan filter fungsional, tabel, pagination 10 baris, dan drawer ringkasan saat row dipilih.

### Scope file yang boleh dan perlu diubah

1. `src/app/dashboard/overview/layout.tsx`
   - Ganti konten demo Revenue/Customers/Area/Pie/Sales dengan satu feature component BPK.
   - Gunakan `PageContainer` dan props `pageTitle`/`pageDescription`; jangan membuat heading manual jika `PageContainer` dapat menangani heading.
   - Import component baru dari `@/features/overview/components/bpk-overview`.
   - Parallel-route slot lama (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`) tidak perlu dihapus dalam pekerjaan ini. Layout baru boleh mengabaikan slot tersebut, tetapi route `/dashboard/overview` wajib tetap dirender dan harus diverifikasi.

2. Buat `src/features/overview/components/bpk-overview-data.ts`
   - Hanya berisi type, constant, dummy data, dan helper data murni. Tidak ada React component.
   - Export type berikut atau ekuivalen yang konsisten:

     ```ts
     export type BpkStatus =
       | 'Sesuai Rekomendasi'
       | 'Belum Sesuai'
       | 'Belum Ditindaklanjuti'
       | 'Sudah Ditindaklanjuti'
       | 'Tidak Dapat Ditindaklanjuti';

     export interface BpkFinding {
       id: string;
       noSatker: string;
       tahun: number;
       judulPemeriksaan: string;
       kodeTemuan: string;
       kodeRekomendasi: string;
       uraianTemuan: string;
       uraianRekomendasi: string;
       nilaiTemuan: number;
       status: BpkStatus;
       deskripsiTindakLanjut: string;
       alasanDitolak?: string;
       tanggalTindakLanjut?: string;
       tanggalTerakhirUpdate: string;
       unitKerja: string;
       pic: string;
     }

     export interface AdminActivity {
       id: string;
       occurredAt: string;
       actorEmail: string;
       action: 'Impor XLSX' | 'Tambah Temuan' | 'Perbarui Temuan' | 'Hapus Temuan' | 'Unggah Berkas';
       findingId?: string;
       detail?: string;
     }
     ```

   - Sediakan minimal 20–25 dummy temuan agar pagination 10 row dapat diuji pada minimal tiga halaman.
   - Data harus mencakup lima status di atas, beberapa tahun pemeriksaan, unit kerja/PIC berbeda, nilai temuan numerik, dan uraian yang cukup untuk drawer.
   - Sediakan minimal 8 aktivitas admin. Jangan memasukkan komentar sebagai `AdminActivity`.
   - Nilai rupiah disimpan sebagai `number`, tidak sebagai string berformat.
   - Export helper murni:
     - `formatRupiah(value: number): string` memakai `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
     - `getStatusPriority(status: BpkStatus): number` untuk urutan default: Belum Ditindaklanjuti, Belum Sesuai, Sudah Ditindaklanjuti, Sesuai Rekomendasi, Tidak Dapat Ditindaklanjuti.
     - `getOverviewMetrics(findings: BpkFinding[])` yang mengembalikan jumlah dan total nilai untuk empat KPI: Total Temuan, Sesuai Rekomendasi, Belum Sesuai, Belum Ditindaklanjuti.
     - `getFindingsByYear(findings: BpkFinding[])` untuk data grafik batang.

3. Buat `src/features/overview/components/bpk-overview.tsx`
   - Tambahkan `'use client'` karena memakai table state, filter, pagination, dan drawer.
   - Reuse import internal berikut, bukan library lain atau copy primitive baru:
     - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` dari `@/components/ui/card`.
     - `Badge` dari `@/components/ui/badge`.
     - `Button` dari `@/components/ui/button`.
     - `Input` dari `@/components/ui/input`.
     - `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` dari `@/components/ui/select`.
     - `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` dari `@/components/ui/table`.
     - `DataTablePagination` dari `@/components/ui/table/data-table-pagination`.
     - `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle` dari `@/components/ui/drawer`.
     - `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig` dari `@/components/ui/chart`.
     - Semua icon hanya dari `@/components/icons`.

### TanStack Table: perilaku wajib

- Pakai `useReactTable`, `getCoreRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, dan `getSortedRowModel` dari `@tanstack/react-table`.
- Definisikan `ColumnDef<BpkFinding>[]` secara memoized.
- Gunakan `initialState.pagination.pageSize = 10`.
- Tabel menampilkan kolom: `ID`, `Status`, `Tahun`, `Kode Temuan`, `Kode Rekomendasi`, `Judul Pemeriksaan`, `Nilai Temuan`, `Aksi`.
- `Nilai Temuan` selalu memakai `formatRupiah` dan disejajarkan ke kanan.
- Status ditampilkan dengan `Badge` dan token/theme bawaan. Jangan membuat hex color baru atau theme CSS tambahan.
- Data awal harus diurutkan berdasarkan `getStatusPriority`, lalu `tanggalTerakhirUpdate` paling lama terlebih dahulu. Jangan melakukan mutasi terhadap array dummy asal.
- Klik baris membuka drawer. Elemen interaktif di dalam baris harus memanggil `event.stopPropagation()` agar tidak memicu drawer dua kali.
- Tombol `Detail` harus disiapkan sebagai navigasi ke route detail masa depan `/dashboard/overview/temuan/[id]`. Jika route detail belum dikerjakan pada fase ini, jangan membuat link mati yang mengarah ke 404; gunakan button disabled/placeholder yang eksplisit atau selesaikan route pada Phase 4 dalam pekerjaan yang sama.

### Filter: perilaku wajib

Sediakan semua filter ini di atas tabel dan jadikan fungsional terhadap dummy data:

1. Input `Cari ID / kode` untuk mencocokkan `id`, `kodeTemuan`, dan `kodeRekomendasi`.
2. Select `Status`.
3. Select `Tahun`.
4. Input atau Select `Kode Temuan`.
5. Input atau Select `Kode Rekomendasi`.
6. Input `Judul Pemeriksaan` dengan pencocokan sebagian, case-insensitive.

- Perubahan filter harus mengembalikan page index ke halaman pertama.
- Reset filter tidak wajib dibuat pada iterasi ini.
- KPI dan grafik tahap awal dihitung dari seluruh dummy dataset; filter hanya menyaring tabel. Jika produk kelak membutuhkan dashboard terfilter, jadikan sebagai keputusan terpisah agar arti KPI tidak berubah tanpa sengaja.
- Jangan gunakan server fetch atau React Query untuk dummy data overview ini. Migrasi ke service/query layer dilakukan saat backend atau impor XLSX tersedia.

### Layout dan component detail

#### KPI cards

- Gunakan grid `grid-cols-1`, lalu `md:grid-cols-2`, lalu `lg:grid-cols-4`.
- Empat card hanya: Total Temuan, Sesuai Rekomendasi, Belum Sesuai, Belum Ditindaklanjuti.
- Setiap card menampilkan jumlah temuan sebagai angka utama dan total nilai rupiah sebagai informasi kedua.
- Jangan tampilkan kartu Sudah Ditindaklanjuti atau Tidak Dapat Ditindaklanjuti pada overview awal. Kedua status tetap harus tersedia dalam data, filter, tabel, dan drawer.
- Jangan menambahkan klaim tren seperti `+12%` karena dummy data tidak memiliki pembanding yang valid.

#### Grafik dan Aktivitas Admin

- Gunakan container responsive `grid-cols-1 lg:grid-cols-4`; grafik `lg:col-span-3`, aktivitas `lg:col-span-1`, sehingga proporsi desktop 3:1.
- Grafik memakai `BarChart`, `Bar`, `XAxis`, dan tooltip dari Recharts melalui `ChartContainer` bawaan. Gunakan `var(--chart-1)` atau token chart aktif, bukan warna hard-coded.
- Judul grafik: `Temuan per Tahun`. Sumbu X adalah tahun; nilai bar adalah jumlah temuan.
- Panel aktivitas berbentuk list, bukan chart/timeline visual kompleks. Setiap item menampilkan tanggal, email pelaku, jenis aksi, dan ID temuan bila ada.
- Maksimal tinggi panel harus selaras secara visual dengan tinggi grafik dan mendukung `overflow-y-auto`. Sembunyikan scrollbar secara lokal dengan utility class, misalnya `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`; jangan mengubah CSS global.
- Tampilkan semua dummy activity dalam area scroll; jangan menambahkan tombol `Lihat semua`.

#### Card tabel dan permission placeholder

- Card tabel memiliki action `Tambah Temuan` dan `Impor XLSX`, sesuai prototype.
- Kedua aksi belum melakukan mutation atau upload nyata dalam tahap dummy.
- Jangan menganggap setiap user login memiliki permission. Buat satu seam lokal yang mudah diganti, misalnya `const canManageFindings = false`, atau props/context permission yang setara. Ketika nilainya false, sembunyikan action atau tampilkan disabled dengan alasan yang jelas. Saat RBAC selesai, seam ini diganti oleh pemeriksaan server/client role yang sebenarnya.
- Jangan mengimplementasikan Clerk Organization atau ubah konfigurasi Clerk dalam pekerjaan overview dummy ini.

#### Drawer ringkasan

- Gunakan controlled state, misalnya `const [selectedFinding, setSelectedFinding] = React.useState<BpkFinding | null>(null)`.
- Drawer membuka dari sisi kanan dengan `swipeDirection='right'` atau primitive setara yang sudah ada.
- Isi drawer: status, tahun, kode temuan, kode rekomendasi, nilai temuan, judul pemeriksaan, uraian temuan ringkas, Unit Kerja, PIC, tanggal update terakhir, dan dua/lebih aktivitas terakhir yang terkait.
- Sediakan tombol close yang accessible dan tombol `Lihat Detail` sesuai aturan route detail pada bagian TanStack Table.
- Drawer tidak memuat composer komentar, form upload, atau preview PDF. Ketiganya masuk halaman detail pada Phase 4.

### Non-goals untuk pekerjaan overview ini

- Tidak ada impor XLSX nyata, parsing Excel, database, API, React Query query baru, atau mutation.
- Tidak ada deadline/overdue.
- Tidak ada AI/LLM.
- Tidak ada perubahan global theme, `globals.css`, `theme.css`, font, atau palette color.
- Tidak ada perubahan pada Clerk, Organization, Billing, sidebar global, header global, atau konfigurasi navigasi kecuali diperlukan untuk route BPK yang benar-benar sudah diimplementasikan.
- Tidak perlu menghapus komponen demo lama (`area-graph.tsx`, `bar-graph.tsx`, `pie-graph.tsx`, `recent-sales.tsx`) selama tidak lagi dirender oleh overview baru.

### Verifikasi yang wajib dilakukan agent implementasi

1. Jalankan `bun run typecheck` setelah component utama selesai.
2. Jalankan `bun run lint` setelah perbaikan typecheck.
3. Jalankan `bun run build` bila environment dapat menjalankannya tanpa konfigurasi eksternal tambahan.
4. Uji manual di `/dashboard/overview`:
   - empat KPI terlihat dan total rupiah terformat `Rp`;
   - bar chart tampil;
   - semua activity dapat di-scroll di card;
   - enam filter menyaring data;
   - pagination menunjukkan 10 row dan dapat berpindah halaman;
   - klik row membuka drawer;
   - close drawer berfungsi;
   - responsif pada lebar mobile/tablet/desktop;
   - dark/light theme codebase tidak menghasilkan warna atau border asing.
5. Catat file yang diubah, hasil command, dan error bila ada di `progress.md`; update status Phase 2/3 di `task_plan.md` setelah pekerjaan selesai.

---

## Implementation Brief — Infrastruktur Data (PostgreSQL + Drizzle + Service Layer)

Status: `planned`. **Belum ada kode yang dieksekusi.** Dokumen ini adalah spesifikasi untuk diperiksa lebih dulu oleh agent lain; implementasi dimulai setelah spec ini disetujui.

- Branch kerja: `feat/data-infra-findings`, dibuat dari `891ff72` (branch `phase-4-detail-temuan`, Phase 4 sudah `complete`).
- **Satu worktree saja**: pekerjaan fase ini dilakukan di `/Users/kiram/Code/keuangan` pada branch tersebut. Tidak ada worktree terpisah.
- Konsekuensi: `package.json` / `bun.lock` / `bpk-overview.tsx` berubah di branch yang sama dengan pekerjaan Phase 5. Agent lain sebaiknya tidak menjalankan `bun install`/`bun add` bersamaan, dan wajib mengambil commit tooling pertama sebelum melanjutkan.
- Kondisi basis yang sudah berubah karena `59aa11d`: field `pic` **sudah dihapus** dari `BpkFinding` dan `context.md`; `src/app/dashboard/overview/page.tsx` **sudah ada**; `overview/layout.tsx` sudah pass-through; halaman detail `/dashboard/overview/temuan/[id]` sudah ada dan masih membaca mock data.

### 1. Keputusan yang mengikat

| # | Keputusan | Asal |
|---|---|---|
| D1 | PostgreSQL **lokal** di device (tanpa Supabase/Neon/RLS). | koreksi R1-1, R1-23 |
| D2 | Drizzle ORM + `drizzle-kit`; migrasi SQL diaudit dan di-commit di `drizzle/`. | R1-2, koreksi R1-4 |
| D3 | Driver `postgres` (postgres.js), koneksi langsung lokal, tanpa pooler, tanpa opsi khusus Supabase. | koreksi R1-3 |
| D4 | Env cukup `DATABASE_URL`; tanpa `DATABASE_URL_DIRECT`; dilarang `NEXT_PUBLIC_*`. | koreksi R1-6, koreksi R1-23 |
| D5 | Naming: kolom `snake_case` di DB, `camelCase` di TS, ditulis sebagai **alias eksplisit** (`noSatker: text('no_satker')`); nama tabel plural. Tidak memakai opsi `casing` Drizzle (Kit maupun runtime). | R1-5, koreksi 7 |
| D6 | PK `uuid` + **partial** unique natural key `(no_satker, tahun, kode_temuan, kode_rekomendasi) WHERE deleted_at IS NULL` + `kode_display` partial unique. | R1-7, koreksi 2 |
| D7 | `findings.status` = `text` + `CHECK` berisi 5 nilai `BPK_STATUSES` (menggantikan usulan awal `pgEnum`, agar satu gaya dengan `activities`). Sudah ditetapkan, bukan pertanyaan terbuka. | R1-8 + koreksi R2-5 |
| D8 | `nilai_temuan numeric(18,2)`; DTO mempertahankan `numeric` sebagai **string** (tidak dikonversi ke `number`) dan semua penjumlahan dilakukan di SQL. | R1-9 + tambahan T3 |
| D9 | `timestamptz` untuk momen peristiwa; `tanggal_tindak_lanjut date`; `alasan_ditolak text`. | R1-10, R2-10 |
| D10 | `unit_kerja` tetap teks denormalisasi. **Tidak ada kolom `pic`** — field itu sudah dihapus Phase 4. | R1-11 dikoreksi oleh `59aa11d` |
| D11 | Urutan prioritas status dihitung saat query memakai `CASE` di `ORDER BY`; **tidak ada kolom `status_priority`** dan tidak ada index khusus untuk sort (dataset ±100–200 baris). | R1-12, dikoreksi |
| D12 | Soft delete `deleted_at`; default semua query mengecualikan baris terhapus; `includeDeleted` khusus admin; restore nanti lewat `restoreFinding()` + `requireRole('admin')`, bukan SQL manual. | R1-16, koreksi R2-12 |
| D13 | `activities` append-only; `action text + CHECK`; `entity_type`, `entity_id`, `metadata jsonb`, `actor_user_id` (FK nullable) + `actor_email` (snapshot), `occurred_at`. | koreksi R2-5, koreksi R2-22 |
| D14 | Komentar **tidak** masuk `activities`; halaman detail tetap punya dua section terpisah: **Diskusi** (comments) dan **Riwayat Aktivitas** (activities). | koreksi R2-5 |
| D15 | `users.role` = sumber kebenaran role aplikasi; Clerk `publicMetadata` tidak lagi dipakai untuk role aplikasi. | koreksi R2-3 |
| D16 | `ensureCurrentUser()` lazy upsert: insert bila belum ada (role `user`, atau `admin` bila email ada di `INITIAL_ADMIN_EMAILS`); role yang sudah ada **tidak pernah** ditimpa. `auth()` hanya memberi `userId`, jadi email/nama diambil lewat `currentUser()` hanya pada jalur pembuatan baris atau pencatatan aktor. | koreksi R2-4, R2-15, tambahan T2 |
| D17 | RBAC server `src/lib/rbac.ts`: `requireAuth()` + `requireRole('editor' \| 'admin')`; setiap mutation wajib memanggilnya di server. | koreksi R2-3 |
| D18 | Impor XLSX: upsert **langsung** (tanpa staging/preview), satu transaksi per impor, diff before/after per temuan di `activities`, ringkasan di `import_batches`. | R2-1 (A) |
| D19 | Baris yang hilang dari XLSX tidak dihapus/ditandai; hanya jejak `last_seen_in_import_at`. | R2-2 (B) |
| D20 | Semua akses DB lewat Drizzle di server Next.js; tanpa RLS; permission diperiksa di aplikasi sebelum query/mutation. | koreksi R1-23 |
| D21 | Return service = data polos (tanpa envelope `success`); error domain `NotFoundError` / `ForbiddenError` / `ValidationError` diterjemahkan menjadi pesan aman untuk toast; detail error DB tidak pernah bocor ke UI. | koreksi R2-9 |
| D22 | Agregasi KPI/grafik = query SQL langsung; tanpa materialized view / tabel counter. | R2-6 |
| D23 | Seluruh data baca (KPI, grafik, aktivitas, tabel) pindah ke DB + React Query. **Tidak ada mutation placeholder**; mutation hanya dibuat saat fitur Phase 5 benar-benar dikerjakan. | koreksi R2-7 |
| D24 | `getFindingDetail(id)` + `findingDetailOptions(id)` disiapkan sekarang (finding, attachments, comments, activities sebagai koleksi terpisah); UI Phase 4 tidak diubah. | koreksi R2-8 |
| D25 | Lampiran **tidak di-seed** (tidak ada metadata yatim yang pasti 404); `bpk-finding-detail.tsx` sudah punya empty state. Upload/storage = Phase 5 (file di `storage/attachments/`, di luar `public/`). | R2-16, koreksi R1-15 |
| D26 | Seed idempotent & non-destruktif (`on conflict do nothing`): 22 temuan + 10 aktivitas + komentar; `users` tidak di-seed. | R1-17, R2-16 |
| D27 | Role dikirim ke client lewat server component (`appRole` prop ke `AppSidebar` + KBar); `use-nav` memakai `appRole`; mutation tetap diverifikasi ulang di server. | R2-15 |
| D28 | Script pakai Bun (`tsx` bukan dependency); **tanpa** `db:reset` sampai ada script aman yang menolak `NODE_ENV=production` dan butuh `--force`. | koreksi R2-13 |
| D29 | Urutan merge: Phase 4 sudah masuk; branch ini di-rebase di atas branch yang memuat Phase 5 saat Phase 5 selesai. `main` tidak disentuh. | R2-14 (diperbarui) |
| D30 | Unique natural key dan `kode_display` dibuat **partial** (`WHERE deleted_at IS NULL`) supaya temuan soft-deleted bisa ditambah/diimpor ulang. Seed dan impor memakai target conflict berpredikat sama. | koreksi 2 |
| D31 | `kode_display` dibuat **database-side**: `SEQUENCE` + trigger `BEFORE INSERT` (format `BPK-{tahun}-{seq}`), sehingga temuan manual dan impor tetap mendapat kode; seed boleh mengirim nilai eksplisit. | koreksi 3 |
| D32 | Prefetch server memakai `await Promise.all([...])` sebelum `dehydrate()`; **bukan** pola `void` dari `AGENTS.md`, karena hydration state bisa terbentuk sebelum query selesai. | koreksi 4 |
| D33 | `updated_at` di-set ulang pada setiap update lewat `.$onUpdate()`; `tanggal_terakhir_update` tetap field data SILAHAP dan tidak pernah disentuh otomatis. | tambahan T2 |
| D34 | Panel aktivitas overview menampilkan **semua** aktivitas (parameter limit opsional, default tanpa limit) dengan area scroll tanpa scrollbar terlihat; drawer tetap memakai limit 3. | koreksi 6 |
| D35 | Nama kolom eksplisit di `schema.ts` (tanpa `casing` Drizzle); CLI migrasi memuat `.env.local` secara eksplisit lewat `dotenv.config({ path: '.env.local' })`, tanpa membuat file `.env` berisi secret. | koreksi 7 |
| D36 | Bootstrap admin pertama: `dashboard/layout.tsx` boleh membuat baris user **hanya** bila baris belum ada dan email Clerk ada di `INITIAL_ADMIN_EMAILS`. Ini satu-satunya pengecualian aturan "read tidak membuat row". | tambahan T1 |

### 2. Scope file

**File baru**

| File | Isi |
|---|---|
| `drizzle.config.ts` | Konfigurasi drizzle-kit: dialect postgresql, `schema: './src/db/schema.ts'`, `out: './drizzle'`, `dbCredentials.url` dari `DATABASE_URL`; memuat `.env.local` lewat `dotenv` eksplisit (§8). |
| `src/db/client.ts` | Instance `drizzle(postgres(DATABASE_URL))` — **tanpa** opsi `casing` — dengan guard `import 'server-only'`, export `db`. |
| `src/db/schema.ts` | Enam tabel + constraint + index dengan nama kolom eksplisit (§3). |
| `src/db/mappers.ts` | Konversi row Drizzle → DTO JSON-safe (`numeric` tetap string, `Date` → ISO string, `date` → `YYYY-MM-DD`); tidak ada konversi uang ke `number`. |
| `src/db/seed.ts` | Seed idempotent 22 temuan + aktivitas + komentar (§4). |
| `drizzle/*.sql` + `drizzle/meta/**` | Hasil `drizzle-kit generate`; **semua** di-commit. Satu migrasi tambahan ditulis manual untuk `SEQUENCE` + trigger `kode_display` (D31); partial unique index ditulis di `schema.ts` bila API Drizzle mendukung `.where()`, kalau tidak ikut ke migrasi manual. |
| `src/features/findings/utils/format.ts` | `formatRupiah(value: string)`, `formatDate`, `formatDateTime`, `formatFileSize` untuk komponen baru. File mock tetap utuh untuk halaman detail, jadi ada duplikasi sementara sampai fase cleanup. |
| `src/lib/rbac.ts` | `requireAuth()`, `requireRole()`, `getAppRole()`, `ensureCurrentUser()`, parsing `INITIAL_ADMIN_EMAILS` (§6). |
| `src/lib/errors.ts` | `NotFoundError`, `ForbiddenError`, `ValidationError`, `UnauthenticatedError` + `toUserMessage()` untuk toast. |
| `src/features/findings/api/types.ts` | Tipe kanonik: `Finding`, `FindingStatus`, `FindingFilters`, `FindingsPage`, `FindingDetail`, `OverviewMetric`, `YearlyFinding`, `Activity`, `Comment`, `Attachment`. |
| `src/features/findings/api/service.ts` | Server actions (`'use server'`) + Drizzle + guard RBAC (§5). |
| `src/features/findings/api/queries.ts` | Query key factory + `queryOptions` (§5). |
| `src/features/overview/components/bpk-kpi-cards.tsx` | Client; `useSuspenseQuery(overviewMetricsQueryOptions())`. |
| `src/features/overview/components/bpk-year-chart.tsx` | Client; `useSuspenseQuery(findingsByYearQueryOptions())`. |
| `src/features/overview/components/bpk-activity-panel.tsx` | Client; `useSuspenseQuery(recentActivitiesQueryOptions())` — tanpa limit (D34). |
| `src/features/overview/components/bpk-findings-table.tsx` | Client; nuqs filter state + `useSuspenseQuery(findingsQueryOptions(filters))` + TanStack Table manual pagination/filtering/sorting + drawer. |
| `src/features/overview/components/bpk-overview-skeletons.tsx` | Satu file berisi empat fallback: KPI, chart, aktivitas, tabel. |
| `src/app/dashboard/overview/loading.tsx` | Route-level skeleton (pola sama dengan `users/loading.tsx`). |

**File diubah**

| File | Perubahan |
|---|---|
| `package.json` | Dependency `drizzle-orm`, `postgres`; devDependency `drizzle-kit`, `dotenv`; script `db:*` (§8). |
| `bun.lock` | Ikut berubah. |
| `env.example.txt` | Tambah `DATABASE_URL`, `INITIAL_ADMIN_EMAILS`. |
| `.env.local` (tidak di-commit) | Nilai `DATABASE_URL` + email admin awal. |
| `src/app/dashboard/overview/page.tsx` | Jadi async; `searchParamsCache.parse` + prefetch empat query + `HydrationBoundary` + empat `Suspense` + komposisi komponen baru. |
| `src/features/overview/components/bpk-overview.tsx` | Menjadi komposisi tipis; isi KPI/chart/aktivitas/tabel pindah ke file baru; sumber data dari React Query. |
| `src/lib/searchparams.ts` | Tambah parser filter temuan (§7). |
| `src/app/dashboard/layout.tsx` | Baca `appRole` dari DB (`getAppRole()`), kirim ke `KBar` + `AppSidebar`. |
| `src/components/layout/app-sidebar.tsx`, `src/components/kbar/index.tsx` | Terima prop `appRole` dan teruskan ke hook nav. |
| `src/hooks/use-nav.ts` | Hook filtering menerima `appRole` eksplisit; `useAppRole()` (Clerk) di-deprecate. |
| `AGENTS.md`, `docs/nav-rbac.md` | Role aplikasi bersumber dari tabel `users.role`, bukan Clerk metadata. |
| `task_plan.md`, `progress.md` | Status + catatan verifikasi. |

**Dilarang disentuh di fase ini**

- `src/features/overview/components/bpk-finding-detail.tsx` dan `src/app/dashboard/overview/temuan/[id]/page.tsx` (UI Phase 4 — tetap membaca mock sampai fase lanjutan).
- `src/features/overview/permissions.ts` (tetap dipakai detail page; hanya dipakai ulang, tidak diubah).
- `src/features/overview/components/bpk-status-badge.tsx`.
- `src/features/products/**`, `src/features/users/**` (tetap mock).
- `src/app/dashboard/overview/@*/**` (slot paralel lama).
- `src/styles/**`, `globals.css`, theme/font.

### 3. Skema database

Target database lokal: `keuangan` (mis. `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/keuangan`). Prasyarat manual sebelum migrasi: database sudah dibuat (`createdb keuangan`), user punya hak DDL.

#### 3.1 `users`

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `clerk_user_id` | `text` | no | — | unique; dari Clerk `auth().userId` |
| `email` | `text` | no | — | index; dibanding lowercase untuk `INITIAL_ADMIN_EMAILS` |
| `name` | `text` | yes | — | dari Clerk |
| `role` | `text` | no | `'user'` | `CHECK (role IN ('user','editor','admin'))` |
| `created_at` / `updated_at` | `timestamptz` | no | `now()` | |

Index: `UNIQUE (clerk_user_id)`, `INDEX (email)`. Catatan: role **tidak** ditulis balik ke Clerk metadata.

#### 3.2 `import_batches` (audit impor XLSX)

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `file_name` | `text` | no | — | nama file asli |
| `file_hash` | `text` | no | — | SHA-256 hex; index |
| `storage_path` | `text` | yes | — | lokasi file sumber (dev: `storage/imports/...`) |
| `uploaded_by_user_id` | `uuid` | yes | — | FK `users(id)` on delete set null |
| `uploaded_by_email` | `text` | no | — | snapshot |
| `started_at` | `timestamptz` | no | `now()` | |
| `finished_at` | `timestamptz` | yes | — | null saat `pending` |
| `status` | `text` | no | `'pending'` | `CHECK IN ('pending','completed','completed_with_errors','failed')` |
| `rows_total` / `rows_created` / `rows_updated` / `rows_unchanged` / `rows_failed` | `integer` | no | `0` | |
| `error_summary` | `text` | yes | — | ringkas, tanpa stack trace |
| `created_at` / `updated_at` | `timestamptz` | no | `now()` | |

Index: `INDEX (started_at DESC)`, `INDEX (file_hash)`.
Catatan: tabel ini **dibuat sekarang** tetapi baru ditulis saat fitur impor Phase 5 dikerjakan.

#### 3.3 `findings`

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `kode_display` | `text` | no | trigger | unique **partial** (`WHERE deleted_at IS NULL`); seed mengisi nilai `id` mock (`BPK-2024-001`), temuan manual/impor dibuat trigger (§3.8) |
| `no_satker` | `text` | no | — | bagian identitas impor |
| `tahun` | `integer` | no | — | index |
| `kode_temuan` | `text` | no | — | |
| `kode_rekomendasi` | `text` | no | — | |
| `judul_pemeriksaan` | `text` | no | — | |
| `uraian_temuan` | `text` | no | — | |
| `uraian_rekomendasi` | `text` | no | — | |
| `nilai_temuan` | `numeric(18,2)` | no | `0` | tetap string sampai render (D8/T3); dijumlahkan di SQL, bukan di JS |
| `status` | `text` | no | — | `CHECK` 5 nilai `BPK_STATUSES` |
| `deskripsi_tindak_lanjut` | `text` | no | `''` | |
| `alasan_ditolak` | `text` | yes | — | |
| `tanggal_tindak_lanjut` | `date` | yes | — | date-only |
| `tanggal_terakhir_update` | `timestamptz` | no | — | |
| `unit_kerja` | `text` | no | — | denormalisasi |
| `last_seen_in_import_at` | `timestamptz` | yes | — | di-set saat impor menemukan baris ini |
| `last_import_batch_id` | `uuid` | yes | — | FK `import_batches(id)` on delete set null |
| `deleted_at` | `timestamptz` | yes | — | soft delete; index |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | di-set ulang lewat `.$onUpdate()` pada setiap update (D33) |

Index/constraint:

- `UNIQUE INDEX (no_satker, tahun, kode_temuan, kode_rekomendasi) WHERE deleted_at IS NULL` — identitas impor (partial, D30).
- `UNIQUE INDEX (kode_display) WHERE deleted_at IS NULL`.
- `INDEX (status)`, `INDEX (tahun)`, `INDEX (deleted_at)`, `INDEX (last_import_batch_id)`.
- Tidak ada index untuk sort: `ORDER BY CASE status ... END, tanggal_terakhir_update` dievaluasi langsung (dataset kecil, D11).

#### 3.4 `activities` (append-only)

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `entity_type` | `text` | no | — | `CHECK IN ('finding','import_batch','user')` |
| `entity_id` | `uuid` | no | — | polimorfik (lihat §13 butir 3) |
| `action` | `text` | no | — | `CHECK IN ('Impor XLSX','Tambah Temuan','Perbarui Temuan','Hapus Temuan','Pulihkan Temuan','Unggah Berkas','Perbarui Peran Pengguna')` |
| `metadata` | `jsonb` | no | `'{}'::jsonb` | diff before/after, mis. `{ "status": { "from": "Belum Sesuai", "to": "Sesuai Rekomendasi" } }` |
| `actor_user_id` | `uuid` | yes | — | FK `users(id)` on delete set null; null untuk data seed |
| `actor_email` | `text` | no | — | snapshot; tetap terbaca bila user dihapus |
| `occurred_at` | `timestamptz` | no | `now()` | |

Index: `INDEX (entity_type, entity_id, occurred_at DESC)`, `INDEX (occurred_at DESC)`, `INDEX (actor_user_id)`.
Aturan implementasi: tidak ada `UPDATE`/`DELETE` pada tabel ini dari aplikasi; komentar tidak ditulis ke sini (D14).

#### 3.5 `comments`

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `finding_id` | `uuid` | no | — | FK `findings(id)` on delete cascade |
| `author_user_id` | `uuid` | yes | — | FK `users(id)` on delete set null |
| `author_email` | `text` | no | — | snapshot |
| `author_name` | `text` | yes | — | |
| `body` | `text` | no | — | |
| `created_at` / `updated_at` | `timestamptz` | no | `now()` | |

Index: `INDEX (finding_id, created_at)`.

#### 3.6 `attachments`

| Kolom | Tipe | Null | Default | Catatan |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `finding_id` | `uuid` | no | — | FK `findings(id)` on delete cascade |
| `file_name` | `text` | no | — | nama asli untuk tampilan |
| `storage_path` | `text` | no | — | `attachments/{findingId}/{uuid}.{ext}` |
| `file_type` | `text` | no | — | `CHECK IN ('pdf','xlsx','docx','image')` |
| `mime_type` | `text` | yes | — | hasil validasi magic bytes saat upload |
| `size_bytes` | `bigint` | no | — | |
| `uploaded_by_user_id` | `uuid` | yes | — | FK `users(id)` on delete set null |
| `uploaded_by_email` | `text` | no | — | snapshot |
| `uploaded_at` | `timestamptz` | no | `now()` | |

Index: `INDEX (finding_id, uploaded_at)`. Tidak di-seed (D25); belum ada baris sama sekali setelah fase ini.

#### 3.7 Catatan Drizzle

- Nama kolom ditulis **eksplisit** di `schema.ts` (`noSatker: text('no_satker')`, dst.). Tidak memakai `casing: 'snake_case'` di Drizzle Kit maupun di runtime client, karena opsi itu dipakai pada konteks introspeksi dan mudah menimbulkan ketidaksesuaian (D35). Alternatif `snakeCase.table()` dari `drizzle-orm/casing` diperbolehkan, tetapi brief ini menstandarkan alias eksplisit.
- `numeric` mengembalikan string dan **tetap string** sampai render (D8/T3); tidak ada `Number()` di jalur data. Penjumlahan dilakukan di SQL (`SUM`).
- `date` → pakai mode string (`'YYYY-MM-DD'`).
- `timestamptz` dikembalikan sebagai `Date` → mapper mengubah ke `toISOString()` supaya nilai tetap serializable di server action boundary.
- `CHECK` constraint dideklarasikan di definisi tabel (bukan `pgEnum`) sesuai D7/D13.

#### 3.8 Objek database di luar `drizzle-kit generate`

Dua hal tidak bisa (atau tidak sepenuhnya bisa) diekspresikan lewat generate, jadi ditulis sebagai migrasi SQL manual yang dijalankan setelah migrasi generate dan tetap di-commit:

1. **Sequence + trigger `kode_display`** (D31):
   - `CREATE SEQUENCE findings_kode_display_seq;`
   - Fungsi + trigger `BEFORE INSERT ON findings` yang aktif hanya `WHEN (NEW.kode_display IS NULL)`: isi `'BPK-' || NEW.tahun || '-' || lpad(nextval('findings_kode_display_seq')::text, 3, '0')`.
   - Bila format itu bentrok dengan partial unique index, ambil `nextval` berikutnya dan ulangi (maksimum 100 kali) — numbering boleh punya lubang, yang penting unik di antara baris aktif.
2. **Partial unique index** (D30): diutamakan dideklarasikan di `schema.ts` lewat `uniqueIndex(...).where(...)` dengan predikat `deleted_at is null`. Bila versi Drizzle yang terpasang tidak mendukung predikat pada index, pindahkan ke migrasi manual yang sama.

Aturan: `drizzle-kit generate` tidak mengintrospeksi trigger/sequence, jadi objek pada poin 1 hanya boleh diubah lewat migrasi manual baru. Jangan menjalankan regenerate/drop tanpa memeriksa SQL yang dihasilkan.

### 4. Seed

`src/db/seed.ts` dijalankan dengan `bun run src/db/seed.ts` (Bun bisa menjalankan TS langsung).

- Sumber: `src/features/overview/components/bpk-overview-data.ts` — `BPK_FINDINGS`, `BPK_ADMIN_ACTIVITIES`, `BPK_COMMENTS`. `BPK_ATTACHMENTS` **tidak** dipakai.
- Perilaku: **upsert non-destruktif** — `INSERT ... ON CONFLICT (no_satker, tahun, kode_temuan, kode_rekomendasi) WHERE deleted_at IS NULL DO NOTHING` (target conflict berpredikat sama dengan index parsial, D30). Implementasi Drizzle: `onConflictDoNothing({ target: [...], targetWhere: ... })` dengan predikat `deleted_at is null`; bila versi terpasang belum mendukung `targetWhere`, jalankan raw SQL lewat `db.execute`. Tidak pernah meng-update baris yang ada dan tidak pernah menghapus.
- Pemetaan: `id` mock → `kode_display` (dikirim eksplisit; trigger tidak perlu bekerja); `pic` sudah tidak ada; `deleted_at = null`; `last_seen_in_import_at = null`; `last_import_batch_id = null`.
- Aktivitas seed: `actor_user_id = null`, `actor_email` dari mock, `entity_type = 'finding'`, `entity_id` = uuid temuan hasil insert (perlu select ulang id berdasarkan `kode_display`), `metadata = '{}'`.
- Komentar seed: `author_user_id = null`, `author_email` + `author_name` dari mock (D26).
- `users` tidak di-seed: baris user lahir dari `ensureCurrentUser()` saat ada mutation (D16).
- Output: ringkasan jumlah `inserted / skipped` per tabel, dan jalan kedua harus menghasilkan `inserted = 0`.

### 5. Service & query layer

`src/features/findings/api/service.ts` — file pertama dengan `'use server'`; hanya boleh meng-export fungsi async; tipe diimpor dengan `import type`.

| Fungsi | Guard | Return |
|---|---|---|
| `listFindings(filters)` | `requireAuth()` | `{ items: Finding[]; total: number; page: number; perPage: number; pageCount: number }` |
| `getOverviewMetrics()` | `requireAuth()` | `OverviewMetric[]` (bentuk sama dengan `getOverviewMetrics` mock: `key`, `label`, `status`, `count`, `totalNilai`); `count` = `number`, `totalNilai` = **string** (D8/T3) |
| `getFindingsByYear()` | `requireAuth()` | `{ tahun: number; jumlah: number }[]` |
| `listRecentActivities(limit?)` | `requireAuth()` | `Activity[]` (urut `occurred_at DESC`); **tanpa limit** bila parameter tidak diberikan — dipakai panel overview (D34) |
| `getFindingDetail(id)` | `requireAuth()` | `{ finding: Finding; attachments: Attachment[]; comments: Comment[]; activities: Activity[] }` — empat koleksi terpisah; `NotFoundError` bila tidak ada / sudah dihapus |
| `listFindingActivities(findingId, limit?)` | `requireAuth()` | `Activity[]` (dipakai drawer) |

Semua filter di atas dijalankan di SQL, bukan di memori:

| Param URL | Kolom SQL | Operator |
|---|---|---|
| `q` | `kode_display`, `no_satker`, `kode_temuan`, `kode_rekomendasi` | `ILIKE %q%` (OR) |
| `status` | `status` | `=` (salah satu nilai `BPK_STATUSES`) |
| `tahun` | `tahun` | `=` |
| `kodeTemuan` | `kode_temuan` | `=`, fallback `ILIKE` bila perlu pencarian parsial |
| `kodeRekomendasi` | `kode_rekomendasi` | `=`, fallback `ILIKE` |
| `judul` | `judul_pemeriksaan` | `ILIKE %judul%` |
| `page` / `perPage` | — | `LIMIT`/`OFFSET` + query `COUNT(*)` terpisah dengan `WHERE` yang sama |
| `sort` | whitelist: `default` (`ORDER BY CASE status WHEN ... END ASC, tanggal_terakhir_update ASC` — D11), `nilai_asc`/`nilai_desc`, `tahun_asc`/`tahun_desc`, `update_asc`/`update_desc` | `ORDER BY` |
| `includeDeleted` | `deleted_at` | `includeDeleted = true` hanya bila `requireRole('admin')`, selain itu `ForbiddenError` |

- Default (tanpa `includeDeleted`) selalu menambahkan `deleted_at IS NULL` (D12).
- KPI, grafik, dan panel aktivitas **tidak** mengikuti filter tabel (kontrak Phase 3 dipertahankan: filter hanya menyaring tabel).
- Urutan prioritas status didefinisikan **satu kali** di `src/features/findings/api/types.ts` (`STATUS_PRIORITY` + pembangkit ekspresi SQL `CASE`) supaya tidak terduplikasi antara query, filter, dan UI (D11).
- DTO uang tetap string di seluruh jalur data (`Finding.nilaiTemuan`, `OverviewMetric.totalNilai`); komponen baru memformat dengan `formatRupiah` dari `src/features/findings/utils/format.ts`.

`src/features/findings/api/queries.ts`:

```ts
findingKeys = {
  all: ['findings'],
  list: (filters) => [...all, 'list', filters],
  detail: (id) => [...all, 'detail', id],
  metrics: () => [...all, 'metrics'],
  yearly: () => [...all, 'yearly'],
  activities: (limit?) => [...all, 'activities', limit ?? 'all'],
  findingActivities: (id, limit) => [...all, 'finding-activities', id, limit]
}
```

Plus `findingsQueryOptions(filters)`, `overviewMetricsQueryOptions()`, `findingsByYearQueryOptions()`, `recentActivitiesQueryOptions(limit?)`, `findingDetailOptions(id)`, dan `findingActivitiesOptions(id, limit)` (dipakai `useQuery` **non-suspense** di drawer).

Error: `src/lib/errors.ts` — server action menangkap error domain dan melempar pesan aman; UI menampilkan `toast.error(toUserMessage(error))`. Tidak ada pesan Postgres mentah ke client.

### 6. RBAC & identitas

`src/lib/rbac.ts`:

| Fungsi | Perilaku |
|---|---|
| `requireAuth()` | `auth()` Clerk → `{ userId }` saja — **`auth()` tidak menyediakan email**. Bila `userId` kosong → `UnauthenticatedError` (atau redirect di jalur halaman). |
| `getAppRole()` | `requireAuth()` → `SELECT role FROM users WHERE clerk_user_id = $1`. **Tidak** memanggil `currentUser()` dan tidak membuat row; mengembalikan `{ role, exists }`; tanpa baris → `{ role: 'user', exists: false }` (R2-15). |
| `ensureCurrentUser()` | Panggil `getAppRole()`; bila `exists` → kembalikan baris apa adanya **tanpa menulis role**. Bila belum ada → `currentUser()` (Clerk, satu panggilan API) untuk `email` + `name` → insert dengan role `'admin'` bila email lowercase ada di `INITIAL_ADMIN_EMAILS`, selain itu `'user'`. `currentUser()` hanya dipanggil di jalur ini. |
| `requireActorIdentity()` | Untuk mencatat pelaku (komentar/aktivitas): `ensureCurrentUser()` → `{ userId, email, name }` supaya `actor_email`/`author_email` snapshot selalu terisi. |
| `requireRole(min)` | `getAppRole()` → bandingkan rank (`user` 0 < `editor` 1 < `admin` 2). Cukup → selesai (tanpa `currentUser()`). Kurang → `ensureCurrentUser()` lalu baca ulang (jalur bootstrap admin) → masih kurang → `ForbiddenError`. |

- Urutan pada mutation: `requireRole('editor' \| 'admin')` (di dalamnya sudah termasuk `requireAuth()` dan logika bootstrap) → transaksi DB; `requireActorIdentity()` dipanggil sekali untuk mengisi pelaku.
- `INITIAL_ADMIN_EMAILS` = daftar dipisah koma, dibandingkan lowercase setelah `trim()`; hanya berlaku saat baris user pertama kali dibuat.
- `currentUser()` tidak pernah dipanggil di jalur baca murni (`getAppRole()`), supaya setiap render dashboard tidak menambah panggilan API Clerk.
- Guard di layout `auth.protect()` tetap ada dan tidak diganti.

### 7. Perubahan UI minimal

`src/app/dashboard/overview/page.tsx` (server):

1. Jadikan `async` dan terima `searchParams`; panggil `searchParamsCache.parse(searchParams)` (pola `users/page.tsx`).
2. Bangun `filters` dari cache, lalu `await Promise.all([ ... ])` untuk empat `prefetchQuery` (tabel dengan filter, metrik, tahunan, aktivitas) **sebelum** `dehydrate()`. Pola `void` dari `AGENTS.md` sengaja tidak dipakai di halaman ini: `dehydrate()` yang berjalan sebelum promise selesai bisa menghasilkan hydration state tanpa data (D32). `Suspense` tetap dipertahankan untuk perubahan filter dari sisi klien.
3. Bungkus dengan `HydrationBoundary state={dehydrate(queryClient)}`, komposisi:

```
<BpkKpiCards />          // Suspense: skeleton KPI
<BpkYearChart />         // Suspense: skeleton chart
<BpkActivityPanel />     // Suspense: skeleton aktivitas
<Suspense fallback={<BpkTableSkeleton />}>
  <BpkFindingsTable />   // pemilik filter nuqs + tabel + pagination + drawer
</Suspense>
```

Alasan pemisahan komponen: hanya query tabel yang bergantung pada filter. Dengan begitu, perubahan filter hanya men-suspend area tabel (skeleton), sementara KPI/grafik/aktivitas tetap ter-mount karena query key-nya statis.

`src/lib/searchparams.ts` — tambah parser (tanpa mengubah key yang sudah ada milik users):

`q`, `status`, `tahun`, `kodeTemuan`, `kodeRekomendasi`, `judul`, `includeDeleted` (boolean, hanya berguna untuk admin).

`BpkFindingsTable` (client):

- Filter dari `useQueryStates` nuqs (`shallow` default `true`), key query React Query dibangun dari filter yang sama.
- Setiap perubahan filter mengembalikan `page` ke 1.
- TanStack Table memakai `manualPagination`, `manualFiltering`, `manualSorting`, `pageCount` dari server, `getCoreRowModel` saja; `getFilteredRowModel`/`getPaginationRowModel`/`getSortedRowModel` **tidak** dipakai lagi karena filter/pagination/sort sudah di SQL.
- Kolom, badge status (`StatusBadge`), aksi, dan drawer tetap seperti sekarang; drawer mengambil aktivitas per temuan lewat `useQuery(findingActivitiesOptions(id, 3))` saat dibuka.
- `canManage` diterima sebagai prop dari server (`getAppRole() !== 'user'`); `permissions.ts` tetap ada untuk detail page sampai Phase 5.

`src/app/dashboard/layout.tsx` + nav:

- Layout: setelah `auth.protect()`, `const { role, exists } = await getAppRole()`; bila `!exists` **dan** email Clerk ada di `INITIAL_ADMIN_EMAILS` → `ensureCurrentUser()` lalu `getAppRole()` ulang (jalur bootstrap admin pertama, D36). Role hasil akhir dikirim ke `<KBar appRole={appRole}>` dan `<AppSidebar appRole={appRole} />`. Ini satu-satunya tempat pembacaan yang boleh membuat baris user, dan hanya untuk email di allowlist.
- `use-nav.ts`: `useFilteredNavItems(items, appRole)` / `useFilteredNavGroups(groups, appRole)`; `useAppRole()` (Clerk) ditandai deprecated dan tidak dipakai lagi oleh sidebar/KBar.
- Dokumentasi: `AGENTS.md` (bagian Navigation & RBAC + Authentication Patterns) dan `docs/nav-rbac.md` diperbarui — role aplikasi berasal dari `users.role`; Clerk hanya identitas.

### 8. Konfigurasi, env, script

`drizzle.config.ts` (D35):

```ts
import { config } from 'dotenv';
config({ path: '.env.local' }); // eksplisit; tidak membuat file .env berisi secret

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! }
});
```

- Tanpa opsi `casing` (nama kolom eksplisit di `schema.ts`).

Env (`.env.local`, tidak di-commit):

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/keuangan
INITIAL_ADMIN_EMAILS=admin@example.com
```

Script (`package.json`):

```jsonc
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "bun run src/db/seed.ts",
"db:studio": "drizzle-kit studio"
```

- Tanpa `db:reset` (D28).
- Dependency baru: `drizzle-orm`, `postgres` (runtime) + `drizzle-kit`, `dotenv` (dev). `dotenv` hanya untuk CLI migrasi; runtime Next memuat `.env.local` sendiri, dan `bun run src/db/seed.ts` juga (Bun memuat `.env.local` otomatis).
- `server-only` dipakai di `src/db/client.ts`; bila paket belum bisa di-resolve, tambahkan sebagai dependency (§13 butir 6).
- `next.config.ts`: hanya bila bundling gagal, tambahkan `serverExternalPackages: ['postgres']` (§13 butir 6).

### 9. Urutan commit yang disarankan

1. `chore(db): add drizzle tooling, local postgres client and schema`
2. `feat(db): generate initial migration with partial unique keys` (SQL + `drizzle/meta`)
3. `feat(db): add the kode_display sequence and trigger as a hand-written migration`
4. `feat(db): seed 22 findings, admin activities and comments from the dummy dataset`
5. `feat(rbac): resolve application role from the users table with server-side guards`
6. `feat(findings): add findings service and query layer with server-side filters`
7. `refactor(overview): read BPK dashboard data from the database through React Query`
8. `docs: document database setup and update role source in AGENTS.md and nav-rbac`

Setiap commit harus lolos `typecheck` + `lint`; commit 7 baru boleh dibuat setelah commit 6 terpasang.

### 10. Verifikasi wajib

Database:

1. `bun run db:generate` → periksa SQL: **tidak ada kolom `status_priority`**, semua `CHECK`, partial unique index ber-`WHERE deleted_at IS NULL` untuk natural key dan `kode_display`, index lain, FK `on delete` benar.
2. `bun run db:migrate` di database `keuangan` kosong → sukses; jalankan ulang → no-op.
3. Migrasi manual (§3.8) ikut terpasang: `INSERT INTO findings (...)` tanpa `kode_display` → terisi `BPK-{tahun}-{nnn}`.
4. `bun run db:seed` dua kali → jalan kedua `inserted = 0`.
5. Sanity SQL vs mock: `COUNT(*)` = 22; distribusi per status dan `SUM(nilai_temuan)` sama dengan hasil `getOverviewMetrics(BPK_FINDINGS)`/`getFindingsByYear(BPK_FINDINGS)`; bandingkan sebagai nilai numeric exact (bukan float).
6. Uji partial unique: insert baris dengan natural key yang sama saat baris aktif → gagal; soft-delete baris tersebut → insert natural key yang sama → berhasil. `kode_display` berperilaku sama.
7. Uji `updated_at`: update satu baris → `updated_at` naik dan `tanggal_terakhir_update` tidak berubah (D33).
8. `bun run db:studio` → spot check enam tabel.

Aplikasi:

9. `bun run typecheck`, `bun run lint`, `bun run format:check`, `bun run build`.
10. `bun run dev`, lalu di `/dashboard/overview`: 4 KPI sesuai angka DB, bar chart per tahun, panel aktivitas menampilkan **semua** aktivitas dan bisa di-scroll tanpa scrollbar terlihat, keenam filter menyaring lewat SQL, pagination 10 baris + 3 halaman, sort, klik baris membuka drawer (dengan aktivitas per temuan), tombol `Detail` menavigasi ke halaman detail (masih mock).
11. Hydration: pada load pertama, KPI/grafik/aktivitas tidak memicu request ulang dari klien (bukti `await Promise.all` sebelum `dehydrate()` bekerja, D32).
12. URL shareable: salin URL dengan filter + `page=2`, buka ulang → hasil sama; ganti filter → `page` kembali 1.
13. Drawer/detail: halaman detail Phase 4 **tidak berubah** perilakunya (regression check).
14. RBAC: tanpa baris `users` → nav role `user`, `canManage = false`; email yang terdaftar di `INITIAL_ADMIN_EMAILS` → setelah satu kali load dashboard baris user muncul dengan role `admin` dan nav berubah (D36); `listFindings({ includeDeleted: true })` dengan role `user` → `ForbiddenError`.
15. Tidak ada kebocoran kredensial: `grep -r "DATABASE_URL" .next/static` kosong; tidak ada `NEXT_PUBLIC_DATABASE_URL`; file `.env` tidak dibuat.
16. Build tidak mengeksekusi query DB saat prerender; bila ada route yang mencoba, tandai route sebagai dinamis.
17. Regresi: `/dashboard/users`, `/dashboard/product`, `/sign-in`, `/sign-up`, `/api/users` tetap normal.

Catat hasil di `progress.md` (termasuk angka KPI sebelum/sesudah) dan update status Phase 7 di `task_plan.md`.

### 11. Non-goals

- Tidak ada mutation (tambah/edit/hapus/impor/upload/komentar/restore) — D23.
- Tidak ada kolom maupun index `status_priority` (D11).
- Tidak ada rewiring UI halaman detail ke DB — D24.
- Tidak ada impor XLSX, parsing Excel, atau upload lampiran; `import_batches` + `attachments` dibuat kosong.
- Tidak ada storage/folder `storage/attachments/` di fase ini (Phase 5).
- Tidak ada perubahan UI produk/users, theme, sidebar global di luar plumbing `appRole`.
- Tidak ada RLS, Supabase, pooler, atau provider storage eksternal.
- Tidak ada webhook Clerk; role hanya dari DB.
- Tidak ada `db:reset`, tidak ada AI/LLM, tidak ada deadline/overdue.

### 12. Koordinasi & merge

- Branch: `feat/data-infra-findings` dari `891ff72`; dikerjakan di worktree tunggal `/Users/kiram/Code/keuangan` (tidak ada worktree kedua).
- Hanya satu agent/pekerja yang menjalankan `db:migrate` pada database dev `keuangan` supaya tidak ada migrasi beradu.
- File yang paling mungkin berkonflik dengan Phase 5: `src/features/overview/components/bpk-overview.tsx`, `src/app/dashboard/overview/page.tsx`, `package.json`, `bun.lock`, `task_plan.md`, `progress.md`.
- Urutan: Phase 5 selesai dulu → branch ini di-rebase di tempat (satu-satunya worktree) → selesaikan konflik di sisi sini → merge ke `phase-4-detail-temuan`. `main` tidak disentuh.
- Follow-up (di luar fase ini): pindahkan halaman detail + drawer ke `findingDetailOptions`, lalu hapus data dummy (`BPK_FINDINGS`, `BPK_ADMIN_ACTIVITIES`, `BPK_COMMENTS`, `BPK_ATTACHMENTS`) dan pindahkan formatter/tipe ke `src/features/findings/`.

### 13. Hal yang perlu dikonfirmasi reviewer

1. **`activities.entity_id` polimorfik tanpa FK** (sesuai D13) berarti tidak ada jaminan integritas referensial. Alternatif: tambah `finding_id` + `import_batch_id` (FK nullable). Brief ini mengikuti instruksi apa adanya.
2. **Partial unique juga diterapkan pada `kode_display`** (turunan koreksi 2) supaya kode bisa dipakai lagi setelah soft delete — konfirmasi.
3. **Trigger + sequence `kode_display`** (D31): pendekatan trigger vs generator di service; format `BPK-{tahun}-{nnn}`; lubang nomor diperbolehkan.
4. **Bootstrap admin lewat pembacaan layout** (D36): konfirmasi pengecualian "read boleh membuat row" ini, dan bahwa ia hanya berlaku untuk email di `INITIAL_ADMIN_EMAILS`.
5. **DTO uang string** (D8/T3): `Finding.nilaiTemuan` dan `OverviewMetric.totalNilai` bertipe `string`; komponen baru memakai `formatRupiah` dari `src/features/findings/utils/format.ts` sehingga ada duplikasi formatter dengan file mock sampai fase cleanup.
6. **`server-only` + `serverExternalPackages: ['postgres']`**: cek saat implementasi; jangan menambah keduanya tanpa bukti error.
7. **Duplikasi tipe `BpkFinding` ↔ `Finding`** sampai fase cleanup: diterima sebagai utang teknis sementara, atau disatukan sekarang (berisiko menyentuh UI detail Phase 4)?
8. **Pemecahan `bpk-overview.tsx` menjadi empat komponen + skeleton**: cek apakah sejalan dengan rencana Phase 5 supaya tidak dua kali refactor.
9. **Nama database dev** (`keuangan`) dan siapa pemilik migrasi — konfirmasi sebelum `db:migrate` pertama dijalankan.
