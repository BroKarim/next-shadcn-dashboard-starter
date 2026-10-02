# Findings — Pembatasan Edit & Komentar Privat

## Audit codebase

- Branch kerja dibuat dari `feat/browser-verification-fixes`: `feat/comment-visibility-admin-replies`.
- Role aplikasi saat ini hanya `user` dan `admin`; `admin` saat ini memegang semua aksi data.
- `updateFinding()` masih menerima `FindingFormValues` penuh dan `EDITABLE_FIELDS` berisi seluruh field temuan.
- UI edit memakai `FindingFormSheet` yang juga mendukung tambah temuan; tabel menampilkan Edit, Hapus, Impor XLSX, Tambah, Pulihkan untuk admin.
- Import XLSX saat ini mengubah enam kolom resmi, termasuk `nilaiTemuan`, dan server action masih dapat dipanggil admin.
- Komentar saat ini diambil tanpa filter role/penulis oleh `getFindingDetail()`; DTO hanya berisi body/author/timestamp.
- `createComment` mengizinkan semua role signed-in; `deleteComment` mengizinkan penulis sendiri atau admin.
- Schema `comments` belum memiliki kolom tanggapan admin. Desain yang dipilih: satu tanggapan admin per komentar (`admin_reply`, `admin_reply_at`, `admin_reply_by_user_id`, `admin_reply_by_email`) agar sederhana dan sesuai permintaan.
- `getFindingDetail()` akan membutuhkan actor lokal + role untuk memfilter: admin melihat semua komentar; user hanya komentar dengan `author_user_id` sendiri atau snapshot `author_email` yang sama. Dengan demikian komentar seed yang belum punya FK tetap dapat dilihat oleh penulisnya.
- Komentar baru tetap boleh dibuat oleh semua signed-in user; tanggapan hanya admin.
- Lampiran dan komentar adalah data terpisah dari kolom temuan. Rencana mempertahankan lampiran admin dan komentar user/admin, sambil menghapus akses UI/server untuk mutation temuan lain (create/import/delete/restore) agar satu-satunya perubahan field temuan adalah `nilaiTemuan`.
- Migrasi Drizzle perlu ditambahkan manual karena migrasi terakhir `0002_tearful_triathlon.sql`; snapshot/meta perlu diperbarui via `bun run db:generate` atau ditulis sesuai pola repo.
