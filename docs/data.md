# Data Layer — PostgreSQL + Drizzle

Referensi teknis untuk lapisan data dashboard Temuan BPK. Spesifikasi lengkap:
`task_plan.md → Implementation Brief — Infrastruktur Data`.

## Setup

1. PostgreSQL lokal berjalan di `localhost:5432` (dev ini memakai Homebrew `postgresql@17`).
2. Buat database: `createdb -h localhost -U kiram keuangan` (sekali saja).
3. Isi `.env.local` (tidak di-commit):

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/keuangan
INITIAL_ADMIN_EMAILS=  # dipisah koma; hanya berlaku saat baris user pertama dibuat
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `bun run db:generate` | Generate SQL dari `src/db/schema.ts` ke `drizzle/` — review SQL-nya sebelum commit |
| `bun run db:migrate` | Menerapkan semua migrasi (memuat `.env.local` via `dotenv` di `drizzle.config.ts`) |
| `bun run db:seed` | Seed idempotent 22 temuan + aktivitas + komentar dari dataset dummy (`on conflict do nothing`) |
| `bun run db:studio` | Drizzle Studio untuk melihat data |

Tanpa `db:reset`. Untuk mulai dari nol: drop database `keuangan`, buat lagi, `db:migrate`, `db:seed`.

## Struktur

```
drizzle.config.ts             Konfigurasi CLI (dotenv eksplisit, tanpa opsi `casing`)
src/db/schema.ts              Enam tabel: users, import_batches, findings, activities, comments, attachments
src/db/client.ts              Koneksi `postgres` + Drizzle, dijaga `server-only`
src/db/seed.ts                Seed CLI (punya koneksi sendiri; `server-only` tidak berlaku di CLI bun)
src/lib/rbac.ts               requireAuth / requireRole / getAppRoleWithBootstrap / ensureCurrentUser
src/lib/errors.ts             Domain errors + toUserMessage untuk toast
src/features/findings/api/    types → service (server actions) → queries (key factory + options)
src/features/findings/utils/  formatRupiah (string) dst.
```

## Konvensi penting

- **Nama kolom eksplisit** (`noSatker: text('no_satker')`); opsi `casing` Drizzle tidak dipakai.
- **Uang = `numeric(18,2)`, DTO string** — dijumlahkan di SQL (`SUM`), tidak pernah dikonversi ke `number` di jalur data; diformat hanya saat render.
- **Soft delete**: `deleted_at`; semua unique business key bersifat partial (`WHERE deleted_at IS NULL`); restore hanya lewat `restoreFinding()` + `requireRole('admin')` (Phase 5).
- **`kode_display`** dibuat oleh trigger database (`BPK-{tahun}-{seq}`) bila tidak dikirim eksplisit — objek ini hanya boleh diubah lewat migrasi manual.
- **`activities` append-only**; komentar tidak masuk tabel ini.
- **Role aplikasi**: `users.role` adalah sumber kebenaran; `INITIAL_ADMIN_EMAILS` hanya berpengaruh saat baris user pertama dibuat.
- **Server actions** (`'use server'`) wajib memanggil `requireRole()` sebelum mutasi; return = data polos; error domain diterjemahkan `toUserMessage()`.
- **Prefetch halaman** memakai `await Promise.all([...])` sebelum `dehydrate()` (deviasi disengaja dari pola `void` — lihat D32).
