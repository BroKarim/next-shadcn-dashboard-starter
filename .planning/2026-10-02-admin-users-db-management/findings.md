# Findings — Users Terintegrasi Database

## Audit

- `src/features/users/**` masih sepenuhnya memakai `src/constants/mock-api-users.ts` dengan id number dan field template `phone/status`.
- Tabel DB `users` hanya memiliki `id uuid`, `clerkUserId`, `email`, `name`, `role`, `createdAt`, `updatedAt`; tidak ada phone/status.
- `src/features/access/api/service.ts` sudah memiliki list user DB dan `setUserRole()` admin-only, termasuk audit dan larangan self-demote.
- `src/app/dashboard/access/page.tsx` sudah memiliki guard server-side admin-only dan dapat dijadikan referensi pola route.
- Nav `/dashboard/users` saat ini belum memiliki `access: { role: 'admin' }` sehingga perlu diperbaiki.
- Delete user lokal harus memakai `users.id` uuid, dilakukan admin-only, dan melarang penghapusan akun sendiri agar admin area tidak terkunci.

## Implementation decision

- Canonical user service akan memakai PostgreSQL/Drizzle dan mengembalikan DTO `id`, `clerkUserId`, `email`, `name`, `role`, `createdAt`, `updatedAt`.
- Search, role filter, sort, pagination dijalankan di SQL.
- Users page memakai `setUserRole()` yang sudah ada untuk perubahan role dan mutation baru `deleteUser()` untuk penghapusan lokal.
- `Hapus Pengguna` akan dicatat di `activities`; check constraint/action type perlu migrasi baru.
- User page tidak menyediakan tambah user karena pembuatan identity dilakukan oleh Clerk; daftar menampilkan user yang sudah ter-bootstrap di tabel lokal.
