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

Status: `pending`

- Siapkan UI impor XLSX, tambah temuan manual, edit, hapus, unggah berkas, dan pengaturan akses.
- Terapkan permission untuk aksi yang mengubah data.

### Phase 6 — Verifikasi

Status: `pending`

- Jalankan lint/typecheck/build yang tersedia.
- Cek responsive layout, loading, empty/error state, filter, pagination, dan drawer.
- Catat hasil verifikasi serta pekerjaan lanjutan.

### Phase 7 — Infrastruktur data (PostgreSQL + Drizzle + service layer)

Status: `planned` — spesifikasi lengkap ada di bagian **Implementation Brief — Infrastruktur Data** di bawah; belum ada kode yang dieksekusi.

Branch: `feat/data-infra-findings` dari `59aa11d`, worktree `/Users/kiram/Code/keuangan-data-infra`.

- Tambahkan PostgreSQL lokal + Drizzle (schema, migrasi SQL auditable, seed 22 temuan).
- Tabel: `users`, `findings`, `activities`, `comments`, `attachments`, `import_batches`.
- RBAC server (`src/lib/rbac.ts`): `requireAuth()`, `requireRole()`; role dari `users.role`, bukan Clerk metadata.
- Pindahkan seluruh data baca overview (KPI, grafik, aktivitas, tabel) ke service/query layer.
- Siapkan `getFindingDetail(id)` untuk halaman detail tanpa mengubah UI Phase 4.

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

- Branch kerja: `feat/data-infra-findings`, dibuat dari `59aa11d` (Phase 4 sudah `complete`).
- Worktree: `/Users/kiram/Code/keuangan-data-infra` (terpisah dari `/Users/kiram/Code/keuangan`).
- Alasan terpisah: fase ini menambah dependency (`drizzle-orm`, `postgres`, `drizzle-kit`) sehingga `package.json` + `bun.lock` berubah, dan ia memodifikasi `bpk-overview.tsx` + `overview/page.tsx` yang baru saja disentuh Phase 4. Folder utama tetap dipakai agent Phase 5.
- Kondisi basis yang sudah berubah karena `59aa11d`: field `pic` **sudah dihapus** dari `BpkFinding` dan `context.md`; `src/app/dashboard/overview/page.tsx` **sudah ada**; `overview/layout.tsx` sudah pass-through; halaman detail `/dashboard/overview/temuan/[id]` sudah ada dan masih membaca mock data.

### 1. Keputusan yang mengikat

| # | Keputusan | Asal |
|---|---|---|
| D1 | PostgreSQL **lokal** di device (tanpa Supabase/Neon/RLS). | koreksi R1-1, R1-23 |
| D2 | Drizzle ORM + `drizzle-kit`; migrasi SQL diaudit dan di-commit di `drizzle/`. | R1-2, koreksi R1-4 |
| D3 | Driver `postgres` (postgres.js), koneksi langsung lokal, tanpa pooler, tanpa opsi khusus Supabase. | koreksi R1-3 |
| D4 | Env cukup `DATABASE_URL`; tanpa `DATABASE_URL_DIRECT`; dilarang `NEXT_PUBLIC_*`. | koreksi R1-6, koreksi R1-23 |
| D5 | Naming: kolom `snake_case` di DB, `camelCase` di TS (`casing: 'snake_case'`); nama tabel plural. | R1-5 |
| D6 | PK `uuid` + unique natural key `(no_satker, tahun, kode_temuan, kode_rekomendasi)` + `kode_display` unique. | R1-7 |
| D7 | `findings.status` = `text` + `CHECK` berisi 5 nilai `BPK_STATUSES` (menggantikan usulan awal `pgEnum`, agar satu gaya dengan `activities`). | R1-8 + koreksi R2-5 (lihat §13 butir 1) |
| D8 | `nilai_temuan numeric(18,2)`. | R1-9 |
| D9 | `timestamptz` untuk momen peristiwa; `tanggal_tindak_lanjut date`; `alasan_ditolak text`. | R1-10, R2-10 |
| D10 | `unit_kerja` tetap teks denormalisasi. **Tidak ada kolom `pic`** — field itu sudah dihapus Phase 4. | R1-11 dikoreksi oleh `59aa11d` |
| D11 | `status_priority smallint` sebagai *generated column* (stored) dari `status`. | R1-12 |
| D12 | Soft delete `deleted_at`; default semua query mengecualikan baris terhapus; `includeDeleted` khusus admin; restore nanti lewat `restoreFinding()` + `requireRole('admin')`, bukan SQL manual. | R1-16, koreksi R2-12 |
| D13 | `activities` append-only; `action text + CHECK`; `entity_type`, `entity_id`, `metadata jsonb`, `actor_user_id` (FK nullable) + `actor_email` (snapshot), `occurred_at`. | koreksi R2-5, koreksi R2-22 |
| D14 | Komentar **tidak** masuk `activities`; halaman detail tetap punya dua section terpisah: **Diskusi** (comments) dan **Riwayat Aktivitas** (activities). | koreksi R2-5 |
| D15 | `users.role` = sumber kebenaran role aplikasi; Clerk `publicMetadata` tidak lagi dipakai untuk role aplikasi. | koreksi R2-3 |
| D16 | `ensureCurrentUser()` lazy upsert: insert bila belum ada (role `user`, atau `admin` bila email ada di `INITIAL_ADMIN_EMAILS`); role yang sudah ada **tidak pernah** ditimpa. Read tidak membuat row. | koreksi R2-4, R2-15 |
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

### 2. Scope file

**File baru**

| File | Isi |
|---|---|
| `drizzle.config.ts` | Konfigurasi drizzle-kit: dialect postgresql, `schema: './src/db/schema.ts'`, `out: './drizzle'`, `dbCredentials.url` dari `DATABASE_URL`. |
| `src/db/client.ts` | Instance `drizzle(postgres(DATABASE_URL), { casing: 'snake_case' })`, guard `import 'server-only'`, export `db`. |
| `src/db/schema.ts` | Enam tabel + enum nilai + constraint + index (§3). |
| `src/db/mappers.ts` | Konversi row Drizzle → DTO JSON-safe (numeric string → number, `Date` → ISO string, `date` → `YYYY-MM-DD`). |
| `src/db/seed.ts` | Seed idempotent 22 temuan + aktivitas + komentar (§4). |
| `drizzle/*.sql` + `drizzle/meta/**` | Hasil `drizzle-kit generate`; **semua** di-commit. |
| `src/lib/rbac.ts` | `requireAuth()`, `requireRole()`, `getAppRole()`, `ensureCurrentUser()`, parsing `INITIAL_ADMIN_EMAILS` (§6). |
| `src/lib/errors.ts` | `NotFoundError`, `ForbiddenError`, `ValidationError`, `UnauthenticatedError` + `toUserMessage()` untuk toast. |
| `src/features/findings/api/types.ts` | Tipe kanonik: `Finding`, `FindingStatus`, `FindingFilters`, `FindingsPage`, `FindingDetail`, `OverviewMetric`, `YearlyFinding`, `Activity`, `Comment`, `Attachment`. |
| `src/features/findings/api/service.ts` | Server actions (`'use server'`) + Drizzle + guard RBAC (§5). |
| `src/features/findings/api/queries.ts` | Query key factory + `queryOptions` (§5). |
| `src/features/overview/components/bpk-kpi-cards.tsx` | Client; `useSuspenseQuery(overviewMetricsQueryOptions())`. |
| `src/features/overview/components/bpk-year-chart.tsx` | Client; `useSuspenseQuery(findingsByYearQueryOptions())`. |
| `src/features/overview/components/bpk-activity-panel.tsx` | Client; `useSuspenseQuery(recentActivitiesQueryOptions(10))`. |
| `src/features/overview/components/bpk-findings-table.tsx` | Client; nuqs filter state + `useSuspenseQuery(findingsQueryOptions(filters))` + TanStack Table manual pagination/filtering/sorting + drawer. |
| `src/features/overview/components/bpk-overview-skeletons.tsx` | Satu file berisi empat fallback: KPI, chart, aktivitas, tabel. |
| `src/app/dashboard/overview/loading.tsx` | Route-level skeleton (pola sama dengan `users/loading.tsx`). |

**File diubah**

| File | Perubahan |
|---|---|
| `package.json` | Dependency `drizzle-orm`, `postgres`; devDependency `drizzle-kit`; script `db:*` (§8). |
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
| `kode_display` | `text` | no | — | unique; nilai `id` mock (`BPK-2024-001`) |
| `no_satker` | `text` | no | — | bagian identitas impor |
| `tahun` | `integer` | no | — | index |
| `kode_temuan` | `text` | no | — | |
| `kode_rekomendasi` | `text` | no | — | |
| `judul_pemeriksaan` | `text` | no | — | |
| `uraian_temuan` | `text` | no | — | |
| `uraian_rekomendasi` | `text` | no | — | |
| `nilai_temuan` | `numeric(18,2)` | no | `0` | dibaca sebagai string, dipetakan ke `number` |
| `status` | `text` | no | — | `CHECK` 5 nilai `BPK_STATUSES` |
| `deskripsi_tindak_lanjut` | `text` | no | `''` | |
| `alasan_ditolak` | `text` | yes | — | |
| `tanggal_tindak_lanjut` | `date` | yes | — | date-only |
| `tanggal_terakhir_update` | `timestamptz` | no | — | |
| `unit_kerja` | `text` | no | — | denormalisasi |
| `status_priority` | `smallint` | no | generated | `GENERATED ALWAYS AS (CASE status WHEN 'Belum Ditindaklanjuti' THEN 0 WHEN 'Belum Sesuai' THEN 1 WHEN 'Sudah Ditindaklanjuti' THEN 2 WHEN 'Sesuai Rekomendasi' THEN 3 ELSE 4 END) STORED` |
| `last_seen_in_import_at` | `timestamptz` | yes | — | di-set saat impor menemukan baris ini |
| `last_import_batch_id` | `uuid` | yes | — | FK `import_batches(id)` on delete set null |
| `deleted_at` | `timestamptz` | yes | — | soft delete; index |
| `created_at` / `updated_at` | `timestamptz` | no | `now()` | |

Index/constraint: `UNIQUE (no_satker, tahun, kode_temuan, kode_rekomendasi)`, `UNIQUE (kode_display)`, `INDEX (status)`, `INDEX (tahun)`, `INDEX (status_priority, tanggal_terakhir_update)`, `INDEX (deleted_at)`, `INDEX (last_import_batch_id)`.

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

- `casing: 'snake_case'` di `drizzle.config.ts` **dan** di `src/db/client.ts` supaya deklarasi schema boleh `camelCase`.
- `numeric` mengembalikan string → konversi ke `number` hanya di `mappers.ts` (nilai maksimum mock ~1,8 miliar, aman di bawah `Number.MAX_SAFE_INTEGER`).
- `date` → pakai mode string (`'YYYY-MM-DD'`).
- `timestamptz` dikembalikan sebagai `Date` → mapper mengubah ke `toISOString()` supaya nilai tetap serializable di server action boundary.
- Generated column memakai API `.generatedAlwaysAs()` pada definisi kolom (verifikasi dukungan versi Drizzle yang terpasang — §13 butir 2).
- `CHECK` constraint dideklarasikan di definisi tabel (bukan `pgEnum`) sesuai D7/D13.

### 4. Seed

`src/db/seed.ts` dijalankan dengan `bun run src/db/seed.ts` (Bun bisa menjalankan TS langsung).

- Sumber: `src/features/overview/components/bpk-overview-data.ts` — `BPK_FINDINGS`, `BPK_ADMIN_ACTIVITIES`, `BPK_COMMENTS`. `BPK_ATTACHMENTS` **tidak** dipakai.
- Perilaku: **upsert non-destruktif** — `insert ... on conflict do nothing` pada unique natural key `(no_satker, tahun, kode_temuan, kode_rekomendasi)`; tidak pernah meng-update baris yang sudah ada dan tidak pernah menghapus.
- Pemetaan: `id` mock → `kode_display`; `pic` sudah tidak ada; `status_priority` tidak diisi (generated); `deleted_at = null`; `last_seen_in_import_at = null`; `last_import_batch_id = null`.
- Aktivitas seed: `actor_user_id = null`, `actor_email` dari mock, `entity_type = 'finding'`, `entity_id` = uuid temuan hasil insert (perlu select ulang id berdasarkan `kode_display`), `metadata = '{}'`.
- Komentar seed: `author_user_id = null`, `author_email` + `author_name` dari mock (D26).
- `users` tidak di-seed: baris user lahir dari `ensureCurrentUser()` saat ada mutation (D16).
- Output: ringkasan jumlah `inserted / skipped` per tabel, dan jalan kedua harus menghasilkan `inserted = 0`.

### 5. Service & query layer

`src/features/findings/api/service.ts` — file pertama dengan `'use server'`; hanya boleh meng-export fungsi async; tipe diimpor dengan `import type`.

| Fungsi | Guard | Return |
|---|---|---|
| `listFindings(filters)` | `requireAuth()` | `{ items: Finding[]; total: number; page: number; perPage: number; pageCount: number }` |
| `getOverviewMetrics()` | `requireAuth()` | `OverviewMetric[]` (bentuk sama dengan `getOverviewMetrics` mock: `key`, `label`, `status`, `count`, `totalNilai`) |
| `getFindingsByYear()` | `requireAuth()` | `{ tahun: number; jumlah: number }[]` |
| `listRecentActivities(limit = 10)` | `requireAuth()` | `Activity[]` (urut `occurred_at DESC`) |
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
| `sort` | whitelist: `default` (`status_priority ASC, tanggal_terakhir_update ASC`), `nilai_asc`/`nilai_desc`, `tahun_asc`/`tahun_desc`, `update_asc`/`update_desc` | `ORDER BY` |
| `includeDeleted` | `deleted_at` | `includeDeleted = true` hanya bila `requireRole('admin')`, selain itu `ForbiddenError` |

- Default (tanpa `includeDeleted`) selalu menambahkan `deleted_at IS NULL` (D12).
- KPI, grafik, dan panel aktivitas **tidak** mengikuti filter tabel (kontrak Phase 3 dipertahankan: filter hanya menyaring tabel).

`src/features/findings/api/queries.ts`:

```ts
findingKeys = {
  all: ['findings'],
  list: (filters) => [...all, 'list', filters],
  detail: (id) => [...all, 'detail', id],
  metrics: () => [...all, 'metrics'],
  yearly: () => [...all, 'yearly'],
  activities: (limit) => [...all, 'activities', limit],
  findingActivities: (id, limit) => [...all, 'finding-activities', id, limit]
}
```

Plus `findingsQueryOptions(filters)`, `overviewMetricsQueryOptions()`, `findingsByYearQueryOptions()`, `recentActivitiesQueryOptions(limit)`, `findingDetailOptions(id)`, dan `findingActivitiesOptions(id, limit)` (dipakai `useQuery` **non-suspense** di drawer).

Error: `src/lib/errors.ts` — server action menangkap error domain dan melempar pesan aman; UI menampilkan `toast.error(toUserMessage(error))`. Tidak ada pesan Postgres mentah ke client.

### 6. RBAC & identitas

`src/lib/rbac.ts`:

| Fungsi | Perilaku |
|---|---|
| `requireAuth()` | `auth()` Clerk → `{ userId, email }`; `UnauthenticatedError`/redirect bila kosong. |
| `getAppRole()` | `requireAuth()` → `SELECT role FROM users WHERE clerk_user_id = $1`; **tidak membuat row**; tanpa baris → `'user'` (R2-15). |
| `ensureCurrentUser()` | `requireAuth()` → insert `users` bila belum ada: `role` = `'admin'` bila email (lowercase, trimmed) ada di `INITIAL_ADMIN_EMAILS`, selain itu `'user'`; bila baris sudah ada → kembalikan apa adanya **tanpa menulis role**. |
| `requireRole(min)` | `requireAuth()` → `ensureCurrentUser()` → baca role → bandingkan rank (`user` 0 < `editor` 1 < `admin` 2); kurang → `ForbiddenError`. |

- Urutan pada mutation: `requireAuth()` → `ensureCurrentUser()` → `requireRole('editor' \| 'admin')` → transaksi DB.
- `INITIAL_ADMIN_EMAILS` = daftar dipisah koma, dibandingkan lowercase; hanya berlaku saat baris user pertama kali dibuat.
- Guard di layout `auth.protect()` tetap ada dan tidak diganti.

### 7. Perubahan UI minimal

`src/app/dashboard/overview/page.tsx` (server):

1. Jadikan `async` dan terima `searchParams`; panggil `searchParamsCache.parse(searchParams)` (pola `users/page.tsx`).
2. Bangun `filters` dari cache, lalu `void queryClient.prefetchQuery(...)` untuk empat query: tabel (dengan filter), metrik, tahunan, aktivitas.
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

- Layout: setelah `auth.protect()`, `const appRole = await getAppRole()`; kirim ke `<KBar appRole={appRole}>` dan `<AppSidebar appRole={appRole} />`.
- `use-nav.ts`: `useFilteredNavItems(items, appRole)` / `useFilteredNavGroups(groups, appRole)`; `useAppRole()` (Clerk) ditandai deprecated dan tidak dipakai lagi oleh sidebar/KBar.
- Dokumentasi: `AGENTS.md` (bagian Navigation & RBAC + Authentication Patterns) dan `docs/nav-rbac.md` diperbarui — role aplikasi berasal dari `users.role`; Clerk hanya identitas.

### 8. Konfigurasi, env, script

`drizzle.config.ts`: `dialect: 'postgresql'`, `schema: './src/db/schema.ts'`, `out: './drizzle'`, `casing: 'snake_case'`, `dbCredentials.url: process.env.DATABASE_URL`.

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
- Dependency baru: `drizzle-orm`, `postgres` (runtime) + `drizzle-kit` (dev).
- `server-only` dipakai di `src/db/client.ts`; bila paket belum bisa di-resolve, tambahkan sebagai dependency (§13 butir 4).
- `next.config.ts`: hanya bila bundling gagal, tambahkan `serverExternalPackages: ['postgres']` (§13 butir 4).

### 9. Urutan commit yang disarankan

1. `chore(db): add drizzle tooling, local postgres client and schema`
2. `feat(db): generate and apply initial migration` (SQL + `drizzle/meta`)
3. `feat(db): seed 22 findings, admin activities and comments from the dummy dataset`
4. `feat(rbac): resolve application role from the users table with server-side guards`
5. `feat(findings): add findings service and query layer with server-side filters`
6. `refactor(overview): read BPK dashboard data from the database through React Query`
7. `docs: document database setup and update role source in AGENTS.md and nav-rbac`

Setiap commit harus lolos `typecheck` + `lint`; commit 6 baru boleh dibuat setelah commit 5 terpasang.

### 10. Verifikasi wajib

Database:

1. `bun run db:generate` → periksa SQL: generated column `status_priority`, semua `CHECK`, unique natural key, index, FK `on delete` benar.
2. `bun run db:migrate` di database `keuangan` kosong → sukses; jalankan ulang → no-op.
3. `bun run db:seed` dua kali → jalan kedua `inserted = 0`.
4. Sanity SQL vs mock: `COUNT(*)` = 22; distribusi per status dan `SUM(nilai_temuan)` sama dengan hasil `getOverviewMetrics(BPK_FINDINGS)`/`getFindingsByYear(BPK_FINDINGS)`.
5. `bun run db:studio` → spot check enam tabel.

Aplikasi:

6. `bun run typecheck`, `bun run lint`, `bun run format:check`, `bun run build`.
7. `bun run dev`, lalu di `/dashboard/overview`: 4 KPI sesuai angka DB, bar chart per tahun, panel aktivitas 10 item, keenam filter menyaring lewat SQL, pagination 10 baris + 3 halaman, sort, klik baris membuka drawer (dengan aktivitas per temuan), tombol `Detail` menavigasi ke halaman detail (masih mock).
8. URL shareable: salin URL dengan filter + `page=2`, buka ulang → hasil sama; ganti filter → `page` kembali 1.
9. Drawer/detail: halaman detail Phase 4 **tidak berubah** perilakunya (regression check).
10. RBAC: tanpa baris `users` → nav role `user`, `canManage = false`; setelah insert manual baris `users` role `admin` untuk `clerk_user_id` sendiri → nav dan flag berubah; `listFindings({ includeDeleted: true })` dengan role `user` → `ForbiddenError`.
11. Tidak ada kebocoran kredensial: `grep -r "DATABASE_URL" .next/static` kosong; tidak ada `NEXT_PUBLIC_DATABASE_URL`.
12. Build tidak mengeksekusi query DB saat prerender; bila ada route yang mencoba, tandai route sebagai dinamis.
13. Regresi: `/dashboard/users`, `/dashboard/product`, `/sign-in`, `/sign-up`, `/api/users` tetap normal.

Catat hasil di `progress.md` (termasuk angka KPI sebelum/sesudah) dan update status Phase 7 di `task_plan.md`.

### 11. Non-goals

- Tidak ada mutation (tambah/edit/hapus/impor/upload/komentar/restore) — D23.
- Tidak ada rewiring UI halaman detail ke DB — D24.
- Tidak ada impor XLSX, parsing Excel, atau upload lampiran; `import_batches` + `attachments` dibuat kosong.
- Tidak ada storage/folder `storage/attachments/` di fase ini (Phase 5).
- Tidak ada perubahan UI produk/users, theme, sidebar global di luar plumbing `appRole`.
- Tidak ada RLS, Supabase, pooler, atau provider storage eksternal.
- Tidak ada webhook Clerk; role hanya dari DB.
- Tidak ada `db:reset`, tidak ada AI/LLM, tidak ada deadline/overdue.

### 12. Koordinasi & merge

- Branch: `feat/data-infra-findings` dari `59aa11d`; worktree `/Users/kiram/Code/keuangan-data-infra`.
- Hanya satu agent/pekerja yang menjalankan `db:migrate` pada database dev `keuangan` supaya tidak ada migrasi beradu.
- File yang paling mungkin berkonflik dengan Phase 5: `src/features/overview/components/bpk-overview.tsx`, `src/app/dashboard/overview/page.tsx`, `package.json`, `bun.lock`, `task_plan.md`, `progress.md`.
- Urutan: Phase 5 selesai dulu → branch ini `git rebase` di atas hasilnya → selesaikan konflik di sisi sini → merge. `main` tidak disentuh.
- Follow-up (di luar fase ini): pindahkan halaman detail + drawer ke `findingDetailOptions`, lalu hapus data dummy (`BPK_FINDINGS`, `BPK_ADMIN_ACTIVITIES`, `BPK_COMMENTS`, `BPK_ATTACHMENTS`) dan pindahkan formatter/tipe ke `src/features/findings/`.

### 13. Hal yang perlu dikonfirmasi reviewer

1. **`findings.status`: `text` + `CHECK` (dipakai di brief ini, demi konsistensi dengan `activities`) atau tetap `pgEnum` seperti usulan awal Ronde 1?**
2. **`status_priority`: generated column (brief ini) atau kolom biasa yang di-set aplikasi?** Generated column lebih aman dari drift, tapi perlu memastikan versi Drizzle terpasang mendukung `.generatedAlwaysAs()` untuk Postgres.
3. **`activities.entity_id` polimorfik tanpa FK** (sesuai instruksi) berarti tidak ada jaminan integritas referensial. Alternatif: tambah `finding_id` + `import_batch_id` (FK nullable). Brief ini mengikuti instruksi apa adanya; alternatif dicatat untuk keputusan.
4. **`server-only` + `serverExternalPackages: ['postgres']`**: perlu dicek saat implementasi apakah bundler Next 16 butuh salah satunya; jangan menambah keduanya tanpa bukti error.
5. **Pemuatan env oleh `drizzle-kit`**: verifikasi apakah `drizzle-kit` membaca `.env.local`; bila tidak, jangan duplikasi secret ke `.env` tanpa persetujuan — pilih mekanisme lain (mis. `--env-file`).
6. **Duplikasi tipe `BpkFinding` ↔ `Finding`** sampai fase cleanup: disetujui sebagai utang teknis sementara, atau mau disatukan sekarang (berisiko menyentuh UI detail Phase 4)?
7. **Pemecahan `bpk-overview.tsx` menjadi empat komponen + skeleton**: cek apakah sejalan dengan rencana Phase 5 (supaya tidak dua kali refactor).
8. **Nama database dev** (`keuangan`) dan siapa pemilik migrasi — konfirmasi sebelum `db:migrate` pertama dijalankan.
