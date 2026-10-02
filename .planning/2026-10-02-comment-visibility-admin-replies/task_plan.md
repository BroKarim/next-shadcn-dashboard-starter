# Task Plan — Pembatasan Edit Nilai Temuan & Komentar Privat

## Goal

Di branch baru, batasi perubahan data temuan oleh admin hanya pada `nilaiTemuan`, jadikan komentar hanya terlihat oleh admin dan penulisnya, serta tambahkan tanggapan admin terhadap komentar. Semua aturan harus enforced server-side dan UI mengikuti aturan yang sama.

## Decisions

- `updateFindingValue(kodeDisplay, nilaiTemuan)` menjadi satu-satunya mutation field temuan yang diekspos untuk admin.
- UI admin tidak lagi menampilkan tambah/import/hapus/pulihkan temuan; lampiran tetap merupakan resource terpisah dan dapat dikelola admin.
- Komentar tetap dapat dibuat semua user signed-in; pembacaan difilter server-side ke admin atau penulis komentar.
- Satu komentar memiliki paling banyak satu tanggapan admin yang dapat diperbarui admin.

## Phases

- [x] Phase 1 — Audit alur temuan, komentar, role, dan schema
- [x] Phase 2 — Ubah model database/API dan migrasi komentar + tanggapan admin
- [x] Phase 3 — Terapkan otorisasi edit `nilaiTemuan` saja dan selaraskan UI
- [x] Phase 4 — Terapkan visibilitas komentar dan fitur tanggapan admin
- [x] Phase 5 — Test, typecheck, lint, format, build, dan review diff

## Verification

- `bun run db:migrate` berhasil menerapkan migrasi reply admin.
- `bun run db:seed` idempotent: 0 insert, 22 temuan, 9 aktivitas, 3 komentar existing.
- `bun run test`: 25 pass.
- `bun run typecheck`: pass.
- `bun run format:check`: pass.
- `bun run build`: pass.
- `bun run lint`: 0 error; 5 warning pre-existing pada `src/components/evilcharts/*`.
- `git diff --check`: pass.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `format:check` gagal pada source baru dan metadata Drizzle | 1 | Jalankan `bun run format`; verifikasi ulang berhasil.
| Lint memperingatkan helper `isUniqueViolation` tidak terpakai setelah aksi delete/restore dihapus | 1 | Hapus helper; warning tersisa hanya lima warning pre-existing di `evilcharts/*`. |
