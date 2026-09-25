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

Status: `pending`

- Definisikan tipe data temuan yang mengikuti kolom XLSX.
- Siapkan data mock kecil untuk KPI, grafik tahunan, aktivitas admin, tabel, drawer, dan halaman detail.
- Pastikan filter dan pagination berfungsi memakai TanStack Table/state pattern yang sudah ada.

### Phase 3 — Dashboard overview

Status: `pending`

- Ganti konten demo overview menjadi Dashboard Temuan BPK.
- Tambahkan empat KPI card jumlah + rupiah.
- Tambahkan bar chart Temuan per Tahun.
- Tambahkan panel Aktivitas Admin yang bisa di-scroll tanpa scrollbar terlihat.
- Tambahkan filter dan tabel 10 baris per halaman.

### Phase 4 — Drawer dan halaman detail

Status: `pending`

- Tambahkan drawer ringkasan saat baris temuan ditekan.
- Tambahkan halaman detail panjang untuk informasi pemeriksaan, dokumen/PDF, diskusi, dan timeline.

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

## Definition of Done

- Dashboard overview BPK menampilkan empat KPI, bar chart tahunan, aktivitas admin, filter, dan tabel.
- Filter dan pagination berfungsi pada dummy data.
- UI mengikuti primitives/theme codebase.
- Drawer dan halaman detail tersedia setelah fase berikutnya.
- Verifikasi yang tersedia selesai atau kegagalannya tercatat.
