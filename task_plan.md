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
