# Context — Dashboard Tindak Lanjut Temuan BPK USK

## Tujuan Produk

Membangun dashboard internal USK untuk memantau tindak lanjut temuan BPK yang sumber resminya berasal dari ekspor XLSX SILAHAP. SILAHAP tetap menjadi sistem pemerintah dan sumber data resmi; dashboard ini memudahkan rektorat, pimpinan, SPI, keuangan, dan unit kerja melihat progres tanpa akses langsung ke SILAHAP.

Fokus tahap pertama hanya BPK. KAP/Management Letter belum masuk scope UI awal.

## Keputusan Produk yang Sudah Disepakati

- Satu baris tabel mewakili satu temuan dan satu rekomendasi.
- Kolom utama: ID, Status, Tahun, Kode Temuan, Kode Rekomendasi, Judul Pemeriksaan, Nilai Temuan, dan Aksi.
- Identitas pencocokan impor: `NoSatker + Tahun + Kode Temuan + Kode Rekomendasi`.
- Admin dapat mengunggah XLSX, menambah temuan manual, memperbarui data, menghapus temuan, mengunggah berkas, mengatur pengguna, dan memberi hak edit.
- User biasa dapat melihat seluruh data secara read-only. Hak edit diberikan admin jika diperlukan.
- User dengan hak edit dapat mengubah data operasional seperti Unit Kerja, catatan, komentar, dan lampiran.
- Komentar hanya dapat ditulis admin atau user yang memiliki hak edit; user read-only hanya dapat membaca.
- Perubahan admin/user dan aktivitas penting dicatat pada timeline dengan tanggal dan email pelaku. Aktivitas komentar tidak dimasukkan ke timeline aktivitas admin.
- Jika impor XLSX menemukan identitas yang sama, kolom resmi SILAHAP yang berubah diperbarui: Status Tindak Lanjut, Alasan Ditolak, Deskripsi Tindak Lanjut, Tanggal Tindak Lanjut, Tanggal Terakhir Update, dan Nilai Temuan. Data internal seperti komentar, lampiran, dan catatan tidak boleh hilang.
- Nilai Temuan selalu numerik, sehingga tidak membutuhkan AI untuk ekstraksi nominal.
- Deadline/overdue belum masuk tahap awal.

## Scope UI Tahap Pertama

### Dashboard utama

- Sidebar dan header.
- Judul halaman: `Dashboard Temuan BPK`; subtitle: `Ringkasan tindak lanjut hasil pemeriksaan`.
- Empat kartu status; setiap kartu menampilkan jumlah temuan dan total rupiah:
  - Total Temuan
  - Sesuai Rekomendasi
  - Belum Sesuai
  - Belum Ditindaklanjuti
- Grafik batang Temuan per Tahun.
- Panel Aktivitas Admin di samping grafik dengan proporsi sekitar 1:3; berbentuk list berisi tanggal, email, dan aksi admin seperti impor XLSX, tambah temuan, update temuan, hapus, dan unggah berkas. Komentar tidak ditampilkan di panel ini. Jika item banyak, panel dapat di-scroll dengan scrollbar disembunyikan; belum perlu tombol `Lihat semua`.
- Filter di atas tabel: ID/kode, Status, Tahun, Kode Temuan, Kode Rekomendasi, dan Judul Pemeriksaan.
- Tabel temuan dengan tombol Detail dan 10 baris per halaman memakai stack data table yang sudah ada.
- Pada tahap dummy, filter dan pagination harus benar-benar berfungsi memakai TanStack Table dan pola state yang sudah ada.
- Tombol `Tambah Temuan` dan `Impor XLSX` membutuhkan login serta permission aksi; login saja tidak otomatis memberi hak aksi.
- Temuan diurutkan default berdasarkan prioritas status, kemudian pembaruan paling lama.

### Drawer ringkasan

Menekan baris temuan membuka drawer ringkasan cepat. Drawer berisi status, identitas temuan, nilai rupiah, judul, uraian singkat, Unit Kerja, pembaruan terakhir, aktivitas terakhir, dan tombol `Lihat Detail`. Drawer tidak menjadi tempat utama komentar atau preview PDF.

### Halaman detail temuan

Satu halaman panjang tanpa tab, dengan urutan:

1. Ringkasan temuan dan tombol edit.
2. Informasi pemeriksaan: judul, uraian temuan, uraian rekomendasi, deskripsi tindak lanjut.
3. Dokumen pendukung: upload, daftar file, dan lihat/preview PDF.
4. Diskusi: komentar dan composer untuk admin/editor.
5. Riwayat aktivitas: perubahan data resmi/internal, impor, tambah, hapus, dan upload berkas dengan tanggal serta email.

## Prinsip Implementasi UI

- Ikuti struktur komponen, layout, theme, warna, border, radius, tipografi, spacing, dan pola interaksi yang sudah ada di codebase target `/Users/kiram/Code/keuangan/src/`.
- Prototype hanya menjadi referensi susunan informasi dan alur interaksi. Jangan menyalin theme, warna, atau komponen visual prototype jika berbeda dari codebase.
- Gunakan komponen UI reusable yang sudah tersedia di codebase sebelum membuat komponen baru.
- Pertahankan pola responsive, aksesibilitas, loading, empty state, dan error state yang sudah digunakan codebase.
- Data pada prototype bersifat ilustratif; implementasi memakai data SILAHAP atau mock data yang mengikuti bentuk data tersebut.

## Referensi Prototype

- [Dashboard](prototypes/dashboard.png)
- [Dashboard dengan drawer](prototypes/dashboard-drawer.png)
- [Halaman detail temuan](prototypes/detail-temuan.png)

## Target Codebase

- Source UI: `/Users/kiram/Code/keuangan/src/`
- Planning workspace saat ini: `/Users/kiram/Documents/ChatGPT/SILAHAP/`
- Sebelum mengubah source, baca instruksi repository dan petakan route/layout/component yang sudah ada.
