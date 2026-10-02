# Task Plan — Users Terintegrasi Database

## Goal

Migrasikan halaman `/dashboard/users` dari mock ke tabel `users` PostgreSQL, batasi route dan navigasi hanya untuk admin, lalu sediakan aksi admin untuk menghapus user dan mengubah role menjadi `admin`.

## Decisions

- Sumber data canonical adalah tabel `users` lokal; Clerk tetap menjadi identity provider.
- Hapus user berarti menghapus row lokal `users`, dengan proteksi tidak dapat menghapus akun sendiri.
- Aksi role memakai `setUserRole` yang sudah memiliki proteksi server-side dan audit activity; UI menyediakan pilihan `user`/`admin`.
- `/dashboard/access` tetap dipertahankan sebagai halaman role management yang sudah ada; `/dashboard/users` menjadi daftar user database dengan search, filter, pagination, role, dan delete.
- Tidak ada tombol tambah user karena identity dibuat dari Clerk; user lokal muncul ketika bootstrap/login/mutasi pertama membuat row.

## Phases

- [x] Phase 1 — Audit dan desain API users berbasis DB
- [x] Phase 2 — Implementasi service, actions, query, mutation, dan tipe canonical
- [x] Phase 3 — Proteksi route/nav dan UI tabel users admin-only
- [x] Phase 4 — Delete user, role admin, audit, dan guardrails
- [x] Phase 5 — Test, typecheck, lint, format, build, review diff
- [x] Phase 6 — Perbaikan responsive overview saat sidebar expanded

## Verification

### Users feature

- `bun run db:generate` membuat `drizzle/0004_loving_wilson_fisk.sql` untuk menambah action audit `Hapus Pengguna`.
- `bun run db:migrate` berhasil diterapkan ke database lokal.
- `bun run test`: 29 pass.
- `bun run typecheck`: pass.
- `bun run format:check`: pass.
- `bun run lint`: 0 error; 5 warning pre-existing di `src/components/evilcharts/*`.
- `bun run build`: pass.
- `git diff --check`: pass.

### Overview responsive fix

- Playwright + Chrome temporary layout harness verified the main inset stays constrained to the viewport width when desktop sidebar is expanded after the fix.
- Temporary route `/layout-repro` removed.
- `typecheck`, `format:check`, `lint`, `build`, and `git diff --check` pass after removing stale `.next` generated types.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| TypeScript sort-column type mismatch | 1 | Replaced broad `SQL` sort type with explicit users-column union; typecheck passed.
| User service test selected the role-update audit before delete audit | 1 | Narrowed audit query by action `Hapus Pengguna`; all tests pass. |
