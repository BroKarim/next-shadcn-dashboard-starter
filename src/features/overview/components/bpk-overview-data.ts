/**
 * BPK finding data for the overview dashboard.
 *
 * Pure data layer only: types, constants, dummy records and pure helpers.
 * The overview is still dummy-data driven (see task_plan.md) — no React, no
 * fetch, no React Query. Money is always stored as a plain number (rupiah) so
 * formatting stays a presentation concern.
 *
 * Dummy values are illustrative placeholders, not real BPK findings.
 */

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

export interface BpkOverviewMetric {
  key: 'total' | 'sesuai' | 'belumSesuai' | 'belumDitindaklanjuti';
  label: string;
  status: BpkStatus | null;
  count: number;
  totalNilai: number;
}

export interface BpkYearlyFinding {
  tahun: number;
  jumlah: number;
}

export const BPK_STATUSES: BpkStatus[] = [
  'Sesuai Rekomendasi',
  'Belum Sesuai',
  'Belum Ditindaklanjuti',
  'Sudah Ditindaklanjuti',
  'Tidak Dapat Ditindaklanjuti'
];

/**
 * Default review order: findings that still need action first, closed findings
 * last. Used as the primary table sort and mirrored by the status filter list.
 */
const STATUS_PRIORITY: Record<BpkStatus, number> = {
  'Belum Ditindaklanjuti': 0,
  'Belum Sesuai': 1,
  'Sudah Ditindaklanjuti': 2,
  'Sesuai Rekomendasi': 3,
  'Tidak Dapat Ditindaklanjuti': 4
};

export const BPK_FINDINGS: BpkFinding[] = [
  {
    id: 'BPK-2024-001',
    noSatker: 'USK-01',
    tahun: 2024,
    judulPemeriksaan: 'Pemeriksaan Kinerja atas Pengelolaan Aset Tetap',
    kodeTemuan: 'T-01',
    kodeRekomendasi: 'R-01',
    uraianTemuan:
      'Terdapat 34 unit peralatan laboratorium yang tidak tercatat pada kartu inventaris ruangan dan belum dilakukan penyusutan sejak tahun perolehan.',
    uraianRekomendasi:
      'Satuan kerja agar mencatat seluruh peralatan laboratorium ke dalam kartu inventaris ruangan dan melakukan penyusutan sesuai kebijakan akuntansi.',
    nilaiTemuan: 1_845_000_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Belum ada tanggapan dari satuan kerja.',
    tanggalTerakhirUpdate: '2024-09-18T09:15:00+07:00',
    unitKerja: 'Biro Umum',
    pic: 'Andi Pratama'
  },
  {
    id: 'BPK-2024-002',
    noSatker: 'USK-02',
    tahun: 2024,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Pendapatan BLU',
    kodeTemuan: 'T-02',
    kodeRekomendasi: 'R-02',
    uraianTemuan:
      'Penerimaan jasa layanan pendidikan sebanyak Rp620.000.000 belum disetorkan ke rekening BLU dan masih berada pada rekening operasional.',
    uraianRekomendasi:
      'Kepala satuan kerja agar menyetorkan seluruh penerimaan jasa layanan ke rekening BLU dan menertibkan pemisahan rekening operasional.',
    nilaiTemuan: 620_000_000,
    status: 'Belum Sesuai',
    deskripsiTindakLanjut:
      'Satuan kerja menyampaikan tanggapan namun bukti setor belum dilampirkan sehingga rekomendasi dinyatakan belum sesuai.',
    tanggalTerakhirUpdate: '2024-09-05T14:40:00+07:00',
    unitKerja: 'Biro Keuangan',
    pic: 'Siti Nurhaliza'
  },
  {
    id: 'BPK-2024-003',
    noSatker: 'USK-03',
    tahun: 2024,
    judulPemeriksaan: 'Pemeriksaan atas Belanja Barang dan Jasa',
    kodeTemuan: 'T-03',
    kodeRekomendasi: 'R-03',
    uraianTemuan:
      'Terdapat belanja perjalanan dinas yang dibayarkan tanpa surat tugas dan bukti pengeluaran yang lengkap sebesar Rp245.500.000.',
    uraianRekomendasi:
      'Satuan kerja agar melengkapi dokumen pertanggungjawaban perjalanan dinas dan menetapkan pengendalian sebelum pembayaran.',
    nilaiTemuan: 245_500_000,
    status: 'Sudah Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Dokumen surat tugas dan bukti pengeluaran telah dilengkapi dan diverifikasi oleh bagian keuangan.',
    tanggalTindakLanjut: '2024-08-22T00:00:00+07:00',
    tanggalTerakhirUpdate: '2024-08-22T11:05:00+07:00',
    unitKerja: 'Fakultas Teknik',
    pic: 'Budi Santoso'
  },
  {
    id: 'BPK-2024-004',
    noSatker: 'USK-04',
    tahun: 2024,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Kerja Sama',
    kodeTemuan: 'T-04',
    kodeRekomendasi: 'R-04',
    uraianTemuan:
      'Dua perjanjian kerja sama penelitian belum diperpanjang dan tidak memiliki berita acara evaluasi pelaksanaan.',
    uraianRekomendasi:
      'Satuan kerja agar melakukan evaluasi berkala dan menyusun berita acara atas seluruh perjanjian kerja sama yang masih berjalan.',
    nilaiTemuan: 380_000_000,
    status: 'Sesuai Rekomendasi',
    deskripsiTindakLanjut:
      'Evaluasi telah dilakukan dan berita acara telah disampaikan kepada pemeriksa pada tanggal 12 Juli 2024.',
    tanggalTindakLanjut: '2024-07-12T00:00:00+07:00',
    tanggalTerakhirUpdate: '2024-07-12T16:20:00+07:00',
    unitKerja: 'Lembaga Penelitian dan Pengabdian Masyarakat',
    pic: 'Dewi Anggraini'
  },
  {
    id: 'BPK-2023-005',
    noSatker: 'USK-05',
    tahun: 2023,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Persediaan',
    kodeTemuan: 'T-05',
    kodeRekomendasi: 'R-05',
    uraianTemuan:
      'Nilai persediaan pada kartu stok berbeda dengan hasil opname fisik sebesar Rp512.300.000 pada tiga gudang.',
    uraianRekomendasi:
      'Satuan kerja agar melakukan opname fisik berkala dan menyesuaikan pencatatan persediaan dengan hasil perhitungan fisik.',
    nilaiTemuan: 512_300_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Rekomendasi telah disampaikan, belum ada tindak lanjut tertulis.',
    tanggalTerakhirUpdate: '2024-06-30T08:50:00+07:00',
    unitKerja: 'Biro Umum',
    pic: 'Andi Pratama'
  },
  {
    id: 'BPK-2023-006',
    noSatker: 'USK-06',
    tahun: 2023,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Keuangan BLU',
    kodeTemuan: 'T-06',
    kodeRekomendasi: 'R-06',
    uraianTemuan:
      'Penggunaan langsung penerimaan BLU untuk belanja pegawai tidak didukung perhitungan yang dapat diuji kebenarannya.',
    uraianRekomendasi:
      'Satuan kerja agar menyusun perhitungan penggunaan penerimaan BLU dan menyimpan dokumen pendukung pada berkas belanja pegawai.',
    nilaiTemuan: 1_120_000_000,
    status: 'Belum Sesuai',
    deskripsiTindakLanjut:
      'Perhitungan telah disampaikan namun belum memuat rincian per pegawai sehingga belum dapat diverifikasi.',
    tanggalTerakhirUpdate: '2024-05-17T10:30:00+07:00',
    unitKerja: 'Biro Keuangan',
    pic: 'Rina Kartika'
  },
  {
    id: 'BPK-2023-007',
    noSatker: 'USK-07',
    tahun: 2023,
    judulPemeriksaan: 'Pemeriksaan Kinerja atas Pengelolaan Sarana dan Prasarana',
    kodeTemuan: 'T-07',
    kodeRekomendasi: 'R-07',
    uraianTemuan:
      'Gedung laboratorium terpadu belum dimanfaatkan secara optimal dan biaya pemeliharaan tetap dibebankan setiap tahun.',
    uraianRekomendasi:
      'Satuan kerja agar menyusun rencana pemanfaatan gedung dan mengevaluasi kebutuhan biaya pemeliharaan.',
    nilaiTemuan: 2_400_000_000,
    status: 'Tidak Dapat Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Pemanfaatan gedung bergantung pada kebijakan induk di luar kewenangan satuan kerja.',
    alasanDitolak:
      'Pemenuhan rekomendasi berada di luar kewenangan satuan kerja karena menunggu penetapan pemanfaatan oleh pimpinan universitas.',
    tanggalTerakhirUpdate: '2024-04-08T13:45:00+07:00',
    unitKerja: 'Fakultas Teknik',
    pic: 'Budi Santoso'
  },
  {
    id: 'BPK-2023-008',
    noSatker: 'USK-08',
    tahun: 2023,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Sistem Informasi',
    kodeTemuan: 'T-08',
    kodeRekomendasi: 'R-08',
    uraianTemuan:
      'Hak akses pengguna sistem informasi keuangan belum dilakukan peninjauan berkala dan masih terdapat akun pegawai yang telah mutasi.',
    uraianRekomendasi:
      'Satuan kerja agar melakukan peninjauan hak akses secara berkala dan menonaktifkan akun pegawai yang telah pindah tugas.',
    nilaiTemuan: 96_000_000,
    status: 'Sudah Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Sebanyak 27 akun telah dinonaktifkan dan prosedur peninjauan hak akses telah ditetapkan.',
    tanggalTindakLanjut: '2024-03-27T00:00:00+07:00',
    tanggalTerakhirUpdate: '2024-03-27T09:00:00+07:00',
    unitKerja: 'UPT Perpustakaan',
    pic: 'Joko Susilo'
  },
  {
    id: 'BPK-2022-009',
    noSatker: 'USK-09',
    tahun: 2022,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Aset Tetap',
    kodeTemuan: 'T-09',
    kodeRekomendasi: 'R-09',
    uraianTemuan:
      'Terdapat 12 bidang tanah yang belum memiliki sertifikat atas nama universitas dan belum diinventarisasi secara memadai.',
    uraianRekomendasi:
      'Satuan kerja agar mengurus sertifikasi aset tanah dan menyajikan seluruh aset tanah pada laporan keuangan.',
    nilaiTemuan: 4_500_000_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Proses sertifikasi belum berjalan, belum ada dokumen tindak lanjut.',
    tanggalTerakhirUpdate: '2024-02-19T15:10:00+07:00',
    unitKerja: 'Biro Umum',
    pic: 'Andi Pratama'
  },
  {
    id: 'BPK-2022-010',
    noSatker: 'USK-10',
    tahun: 2022,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Penerimaan Negara Bukan Pajak',
    kodeTemuan: 'T-10',
    kodeRekomendasi: 'R-10',
    uraianTemuan:
      'Tarif layanan sewa ruang serbaguna belum mengacu pada peraturan tarif PNBP yang berlaku.',
    uraianRekomendasi:
      'Satuan kerja agar menyesuaikan tarif layanan dan menyampaikan usulan penetapan tarif kepada Kementerian Keuangan.',
    nilaiTemuan: 275_000_000,
    status: 'Belum Sesuai',
    deskripsiTindakLanjut:
      'Usulan tarif telah disampaikan namun bukti penerimaan usulan belum lengkap.',
    tanggalTerakhirUpdate: '2024-01-25T11:35:00+07:00',
    unitKerja: 'Biro Keuangan',
    pic: 'Siti Nurhaliza'
  },
  {
    id: 'BPK-2022-011',
    noSatker: 'USK-11',
    tahun: 2022,
    judulPemeriksaan: 'Pemeriksaan Kinerja atas Pengelolaan Pendidikan',
    kodeTemuan: 'T-11',
    kodeRekomendasi: 'R-11',
    uraianTemuan:
      'Jumlah mahasiswa aktif pada sistem akademik berbeda dengan data pelaporan kinerja pada dua program studi.',
    uraianRekomendasi:
      'Satuan kerja agar melakukan rekonsiliasi data akademik sebelum pelaporan kinerja tahunan.',
    nilaiTemuan: 0,
    status: 'Sesuai Rekomendasi',
    deskripsiTindakLanjut:
      'Rekonsiliasi telah dilakukan dan berita acara rekonsiliasi data telah disampaikan.',
    tanggalTindakLanjut: '2023-12-14T00:00:00+07:00',
    tanggalTerakhirUpdate: '2023-12-14T10:00:00+07:00',
    unitKerja: 'Fakultas Kedokteran',
    pic: 'Dewi Anggraini'
  },
  {
    id: 'BPK-2022-012',
    noSatker: 'USK-12',
    tahun: 2022,
    judulPemeriksaan: 'Pemeriksaan atas Belanja Modal',
    kodeTemuan: 'T-12',
    kodeRekomendasi: 'R-12',
    uraianTemuan:
      'Terdapat pengadaan peralatan yang terlambat diselesaikan dan belum dikenakan denda keterlambatan sebesar Rp88.200.000.',
    uraianRekomendasi:
      'Satuan kerja agar mengenakan denda keterlambatan sesuai kontrak dan menyetorkan ke kas negara.',
    nilaiTemuan: 488_200_000,
    status: 'Sudah Ditindaklanjuti',
    deskripsiTindakLanjut: 'Denda telah ditagih dan disetorkan ke kas negara pada 2 November 2023.',
    tanggalTindakLanjut: '2023-11-02T00:00:00+07:00',
    tanggalTerakhirUpdate: '2023-11-02T14:15:00+07:00',
    unitKerja: 'Fakultas Teknik',
    pic: 'Rina Kartika'
  },
  {
    id: 'BPK-2021-013',
    noSatker: 'USK-13',
    tahun: 2021,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Dana Hibah',
    kodeTemuan: 'T-13',
    kodeRekomendasi: 'R-13',
    uraianTemuan:
      'Dana hibah penelitian sebesar Rp350.000.000 dilaporkan tanpa bukti penggunaan yang lengkap pada tiga kegiatan.',
    uraianRekomendasi:
      'Satuan kerja agar melengkapi bukti penggunaan dana hibah dan menetapkan mekanisme verifikasi laporan kemajuan.',
    nilaiTemuan: 350_000_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Belum ada tanggapan sejak rekomendasi disampaikan.',
    tanggalTerakhirUpdate: '2023-09-08T09:25:00+07:00',
    unitKerja: 'Lembaga Penelitian dan Pengabdian Masyarakat',
    pic: 'Dewi Anggraini'
  },
  {
    id: 'BPK-2021-014',
    noSatker: 'USK-14',
    tahun: 2021,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Kas',
    kodeTemuan: 'T-14',
    kodeRekomendasi: 'R-14',
    uraianTemuan:
      'Terdapat selisih kas sebesar Rp17.400.000 pada dua unit kerja berdasarkan hasil pemeriksaan kas mendadak.',
    uraianRekomendasi:
      'Satuan kerja agar menyetorkan selisih kas dan meningkatkan pengendalian atas pengelolaan kas kecil.',
    nilaiTemuan: 17_400_000,
    status: 'Belum Sesuai',
    deskripsiTindakLanjut:
      'Setoran telah dilakukan sebagian sebesar Rp9.000.000 dan sisanya belum diselesaikan.',
    tanggalTerakhirUpdate: '2023-08-15T16:05:00+07:00',
    unitKerja: 'UPT Perpustakaan',
    pic: 'Joko Susilo'
  },
  {
    id: 'BPK-2021-015',
    noSatker: 'USK-15',
    tahun: 2021,
    judulPemeriksaan: 'Pemeriksaan Kinerja atas Pengelolaan Penelitian',
    kodeTemuan: 'T-15',
    kodeRekomendasi: 'R-15',
    uraianTemuan:
      'Luaran penelitian yang dijanjikan dalam proposal tidak seluruhnya tersedia dan belum ada evaluasi capaian.',
    uraianRekomendasi:
      'Satuan kerja agar melakukan evaluasi capaian luaran penelitian dan menetapkan sanksi atas ketidaksesuaian luaran.',
    nilaiTemuan: 640_000_000,
    status: 'Tidak Dapat Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Peneliti telah menyelesaikan kontrak dan tidak lagi memiliki kewajiban pelaporan pada satuan kerja.',
    alasanDitolak:
      'Hak dan kewajiban para pihak telah berakhir sesuai kontrak sehingga rekomendasi tidak dapat dilaksanakan.',
    tanggalTerakhirUpdate: '2023-07-21T13:30:00+07:00',
    unitKerja: 'Lembaga Penelitian dan Pengabdian Masyarakat',
    pic: 'Budi Santoso'
  },
  {
    id: 'BPK-2021-016',
    noSatker: 'USK-16',
    tahun: 2021,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Aset Tak Berwujud',
    kodeTemuan: 'T-16',
    kodeRekomendasi: 'R-16',
    uraianTemuan:
      'Perangkat lunak senilai Rp210.000.000 belum dicatat sebagai aset tak berwujud dan tidak memiliki dokumentasi lisensi.',
    uraianRekomendasi:
      'Satuan kerja agar mencatat perangkat lunak sebagai aset tak berwujud dan menyimpan dokumentasi lisensi.',
    nilaiTemuan: 210_000_000,
    status: 'Sesuai Rekomendasi',
    deskripsiTindakLanjut:
      'Pencatatan dan dokumentasi lisensi telah selesai diverifikasi pemeriksa.',
    tanggalTindakLanjut: '2023-06-09T00:00:00+07:00',
    tanggalTerakhirUpdate: '2023-06-09T15:45:00+07:00',
    unitKerja: 'UPT Perpustakaan',
    pic: 'Rina Kartika'
  },
  {
    id: 'BPK-2020-017',
    noSatker: 'USK-17',
    tahun: 2020,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Belanja Pegawai',
    kodeTemuan: 'T-17',
    kodeRekomendasi: 'R-17',
    uraianTemuan:
      'Terdapat pembayaran tunjangan kinerja yang tidak sesuai dengan kelas jabatan sebesar Rp154.800.000.',
    uraianRekomendasi:
      'Satuan kerja agar menghitung ulang tunjangan kinerja sesuai kelas jabatan dan menyetorkan kelebihan pembayaran.',
    nilaiTemuan: 154_800_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Perhitungan ulang belum dilakukan, belum ada dokumen tindak lanjut.',
    tanggalTerakhirUpdate: '2023-05-19T08:40:00+07:00',
    unitKerja: 'Biro Keuangan',
    pic: 'Siti Nurhaliza'
  },
  {
    id: 'BPK-2020-018',
    noSatker: 'USK-18',
    tahun: 2020,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Barang Milik Negara',
    kodeTemuan: 'T-18',
    kodeRekomendasi: 'R-18',
    uraianTemuan:
      'Kendaraan operasional yang sudah tidak digunakan belum diusulkan penghapusan dan masih tercatat pada neraca.',
    uraianRekomendasi:
      'Satuan kerja agar mengusulkan penghapusan kendaraan tidak digunakan sesuai ketentuan pengelolaan BMN.',
    nilaiTemuan: 780_000_000,
    status: 'Belum Sesuai',
    deskripsiTindakLanjut:
      'Usulan penghapusan telah disusun namun belum disampaikan kepada pengelola barang.',
    tanggalTerakhirUpdate: '2023-04-06T11:20:00+07:00',
    unitKerja: 'Biro Umum',
    pic: 'Andi Pratama'
  },
  {
    id: 'BPK-2020-019',
    noSatker: 'USK-19',
    tahun: 2020,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Sarana dan Prasarana',
    kodeTemuan: 'T-19',
    kodeRekomendasi: 'R-19',
    uraianTemuan:
      'Pekerjaan rehabilitasi ruang kelas belum sepenuhnya selesai sesuai spesifikasi kontrak.',
    uraianRekomendasi:
      'Satuan kerja agar meminta penyedia menyelesaikan pekerjaan sesuai spesifikasi dan melakukan pemeriksaan bersama.',
    nilaiTemuan: 1_650_000_000,
    status: 'Sudah Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Pekerjaan telah diselesaikan dan berita acara pemeriksaan bersama telah ditandatangani.',
    tanggalTindakLanjut: '2023-02-28T00:00:00+07:00',
    tanggalTerakhirUpdate: '2023-02-28T10:15:00+07:00',
    unitKerja: 'Fakultas Teknik',
    pic: 'Joko Susilo'
  },
  {
    id: 'BPK-2020-020',
    noSatker: 'USK-20',
    tahun: 2020,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Dana Masyarakat',
    kodeTemuan: 'T-20',
    kodeRekomendasi: 'R-20',
    uraianTemuan:
      'Dana masyarakat pada dua fakultas belum disajikan secara terpisah pada laporan keuangan satuan kerja.',
    uraianRekomendasi:
      'Satuan kerja agar menyajikan dana masyarakat secara terpisah dan menyusun pedoman pengelolaannya.',
    nilaiTemuan: 925_000_000,
    status: 'Tidak Dapat Ditindaklanjuti',
    deskripsiTindakLanjut:
      'Dana telah habis masa pengelolaannya dan disetor sesuai ketentuan yang berlaku.',
    alasanDitolak:
      'Saldo dana telah disetor seluruhnya sehingga tidak terdapat objek yang dapat disajikan kembali.',
    tanggalTerakhirUpdate: '2023-01-11T14:00:00+07:00',
    unitKerja: 'Fakultas Kedokteran',
    pic: 'Dewi Anggraini'
  },
  {
    id: 'BPK-2019-021',
    noSatker: 'USK-21',
    tahun: 2019,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Penerimaan BLU',
    kodeTemuan: 'T-21',
    kodeRekomendasi: 'R-21',
    uraianTemuan:
      'Biaya layanan akademik mahasiswa belum ditetapkan berdasarkan perhitungan tarif satuan biaya.',
    uraianRekomendasi:
      'Satuan kerja agar menyusun perhitungan tarif satuan biaya dan menetapkan tarif layanan akademik.',
    nilaiTemuan: 0,
    status: 'Sesuai Rekomendasi',
    deskripsiTindakLanjut:
      'Perhitungan tarif satuan biaya telah ditetapkan dan disampaikan kepada pemeriksa.',
    tanggalTindakLanjut: '2022-11-30T00:00:00+07:00',
    tanggalTerakhirUpdate: '2022-11-30T09:35:00+07:00',
    unitKerja: 'Biro Keuangan',
    pic: 'Rina Kartika'
  },
  {
    id: 'BPK-2019-022',
    noSatker: 'USK-22',
    tahun: 2019,
    judulPemeriksaan: 'Pemeriksaan atas Pengelolaan Sistem Informasi Akademik',
    kodeTemuan: 'T-22',
    kodeRekomendasi: 'R-22',
    uraianTemuan:
      'Prosedur pemulihan data belum diuji dan salinan cadangan basis data akademik tidak disimpan di luar lokasi.',
    uraianRekomendasi:
      'Satuan kerja agar menguji prosedur pemulihan data secara berkala dan menyimpan salinan cadangan di luar lokasi.',
    nilaiTemuan: 132_500_000,
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Belum ada tindak lanjut atas pengujian prosedur pemulihan data.',
    tanggalTerakhirUpdate: '2022-10-14T15:55:00+07:00',
    unitKerja: 'UPT Perpustakaan',
    pic: 'Joko Susilo'
  }
];

export const BPK_ADMIN_ACTIVITIES: AdminActivity[] = [
  {
    id: 'ACT-010',
    occurredAt: '2024-09-18T09:15:00+07:00',
    actorEmail: 'operator.bpk@usk.ac.id',
    action: 'Perbarui Temuan',
    findingId: 'BPK-2024-001',
    detail: 'Status diubah menjadi Belum Ditindaklanjuti setelah rapat tindak lanjut.'
  },
  {
    id: 'ACT-009',
    occurredAt: '2024-09-12T13:20:00+07:00',
    actorEmail: 'admin.bpk@usk.ac.id',
    action: 'Impor XLSX',
    detail: 'Impor 24 baris temuan periode pemeriksaan 2024.'
  },
  {
    id: 'ACT-008',
    occurredAt: '2024-09-05T14:40:00+07:00',
    actorEmail: 'verifikator.bpk@usk.ac.id',
    action: 'Perbarui Temuan',
    findingId: 'BPK-2024-002',
    detail: 'Tanggapan satuan kerja dicatat, bukti setor belum diterima.'
  },
  {
    id: 'ACT-007',
    occurredAt: '2024-09-02T10:05:00+07:00',
    actorEmail: 'operator.bpk@usk.ac.id',
    action: 'Unggah Berkas',
    findingId: 'BPK-2024-002',
    detail: 'Berkas tanggapan-satuan-kerja.pdf diunggah.'
  },
  {
    id: 'ACT-006',
    occurredAt: '2024-08-22T11:05:00+07:00',
    actorEmail: 'verifikator.bpk@usk.ac.id',
    action: 'Perbarui Temuan',
    findingId: 'BPK-2024-003',
    detail: 'Status diubah menjadi Sudah Ditindaklanjuti.'
  },
  {
    id: 'ACT-005',
    occurredAt: '2024-08-14T09:30:00+07:00',
    actorEmail: 'admin.bpk@usk.ac.id',
    action: 'Tambah Temuan',
    findingId: 'BPK-2024-004',
    detail: 'Temuan kerja sama penelitian ditambahkan secara manual.'
  },
  {
    id: 'ACT-004',
    occurredAt: '2024-07-12T16:20:00+07:00',
    actorEmail: 'verifikator.bpk@usk.ac.id',
    action: 'Perbarui Temuan',
    findingId: 'BPK-2024-004',
    detail: 'Berita acara evaluasi kerja sama diterima, status sesuai rekomendasi.'
  },
  {
    id: 'ACT-003',
    occurredAt: '2024-06-30T08:50:00+07:00',
    actorEmail: 'operator.bpk@usk.ac.id',
    action: 'Unggah Berkas',
    findingId: 'BPK-2023-005',
    detail: 'Kertas kerja opname persediaan diunggah.'
  },
  {
    id: 'ACT-002',
    occurredAt: '2024-05-17T10:30:00+07:00',
    actorEmail: 'verifikator.bpk@usk.ac.id',
    action: 'Perbarui Temuan',
    findingId: 'BPK-2023-006',
    detail: 'Catatan verifikasi ditambahkan pada temuan pengelolaan keuangan BLU.'
  },
  {
    id: 'ACT-001',
    occurredAt: '2024-04-08T13:45:00+07:00',
    actorEmail: 'admin.bpk@usk.ac.id',
    action: 'Hapus Temuan',
    findingId: 'BPK-2023-007',
    detail: 'Data uji ganda dihapus sebelum pengesahan rencana tindak lanjut.'
  }
];

function uniqueSorted<T>(values: T[]): T[] {
  return [...new Set(values)].toSorted((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}

/** Tahun pemeriksaan yang tersedia pada dataset dummy, urut menaik. */
export const BPK_YEARS: number[] = uniqueSorted(BPK_FINDINGS.map((finding) => finding.tahun));

/** Pilihan filter kode temuan, urut menaik. */
export const BPK_KODE_TEMUAN: string[] = uniqueSorted(
  BPK_FINDINGS.map((finding) => finding.kodeTemuan)
);

/** Pilihan filter kode rekomendasi, urut menaik. */
export const BPK_KODE_REKOMENDASI: string[] = uniqueSorted(
  BPK_FINDINGS.map((finding) => finding.kodeRekomendasi)
);

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Tanggal/waktu dummy diformat pada zona waktu tetap supaya markup hasil render
 * server dan client identik (menghindari hydration mismatch).
 */
export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

function sumNilaiTemuan(items: BpkFinding[]): number {
  return items.reduce((total, finding) => total + finding.nilaiTemuan, 0);
}

export function getStatusPriority(status: BpkStatus): number {
  return STATUS_PRIORITY[status];
}

export function getOverviewMetrics(findings: BpkFinding[]): BpkOverviewMetric[] {
  const countByStatus = (status: BpkStatus) =>
    findings.filter((finding) => finding.status === status);

  const sesuai = countByStatus('Sesuai Rekomendasi');
  const belumSesuai = countByStatus('Belum Sesuai');
  const belumDitindaklanjuti = countByStatus('Belum Ditindaklanjuti');

  return [
    {
      key: 'total',
      label: 'Total Temuan',
      status: null,
      count: findings.length,
      totalNilai: sumNilaiTemuan(findings)
    },
    {
      key: 'sesuai',
      label: 'Sesuai Rekomendasi',
      status: 'Sesuai Rekomendasi',
      count: sesuai.length,
      totalNilai: sumNilaiTemuan(sesuai)
    },
    {
      key: 'belumSesuai',
      label: 'Belum Sesuai',
      status: 'Belum Sesuai',
      count: belumSesuai.length,
      totalNilai: sumNilaiTemuan(belumSesuai)
    },
    {
      key: 'belumDitindaklanjuti',
      label: 'Belum Ditindaklanjuti',
      status: 'Belum Ditindaklanjuti',
      count: belumDitindaklanjuti.length,
      totalNilai: sumNilaiTemuan(belumDitindaklanjuti)
    }
  ];
}

export function getFindingsByYear(findings: BpkFinding[]): BpkYearlyFinding[] {
  const jumlahPerTahun = new Map<number, number>();

  findings.forEach((finding) => {
    jumlahPerTahun.set(finding.tahun, (jumlahPerTahun.get(finding.tahun) ?? 0) + 1);
  });

  return [...jumlahPerTahun.entries()]
    .map(([tahun, jumlah]) => ({ tahun, jumlah }))
    .toSorted((a, b) => a.tahun - b.tahun);
}

export function getActivitiesForFinding(
  activities: AdminActivity[],
  findingId: string,
  limit = 3
): AdminActivity[] {
  return activities
    .filter((activity) => activity.findingId === findingId)
    .toSorted((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, limit);
}
