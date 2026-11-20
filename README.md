# TABUNGANKU v2.0 — Google Sheets + Drive

Frontend mempertahankan UI v1.2, dengan sinkronisasi cloud melalui Cloudflare Pages Functions, Google Apps Script, Google Sheets, dan backup mingguan Google Drive.

## Isi paket
- `index.html`: aplikasi PWA, data lokal dan antrean sinkronisasi offline.
- `sw.js`, `manifest.webmanifest`, `icon.svg`: dukungan PWA/offline.
- `functions/api/sync.js`: proxy same-origin Cloudflare ke Apps Script. Secret tidak dikirim ke browser.
- `google-apps-script/Code.gs`: backend Sheets, validasi token, optimistic revision check, backup mingguan.

## Arsitektur keamanan
1. Browser hanya memanggil `/api/sync` di domain Cloudflare.
2. Cloudflare Pages Function menyimpan `GAS_API_SECRET` sebagai encrypted secret dan meneruskannya ke Apps Script.
3. Apps Script memeriksa token sebelum membaca/menulis spreadsheet.
4. Jangan pernah memasukkan token ke `index.html`, GitHub, atau membagikannya di chat.
5. Endpoint Apps Script perlu di-deploy sebagai `Anyone` agar Cloudflare dapat memanggilnya tanpa login Google; token acak yang panjang menjadi kontrol akses backend. Jika token bocor, rotasi dengan menjalankan ulang setup token/ubah Script Properties dan perbarui Cloudflare secret.

## Setup Google Sheets dan Apps Script
1. Buat Google Spreadsheet baru, misalnya `DATABASE TABUNGANKU`.
2. Dari spreadsheet, pilih Extensions → Apps Script.
3. Ganti isi `Code.gs` dengan file `google-apps-script/Code.gs` dari paket ini.
4. Di Project Settings, atur timezone project ke `Asia/Jakarta`.
5. Pilih fungsi `setupTabunganku` lalu klik Run. Berikan izin Google Sheets, Drive, dan trigger.
6. Buka Execution log. Salin nilai setelah `COPY THIS ONCE TO CLOUDFLARE SECRET GAS_API_SECRET:`. Simpan rahasia ini dengan aman.
7. Deploy → New deployment → pilih Web app.
8. Execute as: Me. Who has access: Anyone. Deploy, lalu salin URL yang berakhiran `/exec`.

`setupTabunganku()` membuat sheet `MASTER_TABUNGAN`, `TRANSAKSI`, `APP_META`, menyimpan Spreadsheet ID dan secret di Script Properties, serta memasang trigger backup setiap Minggu sekitar pukul 03.00 waktu project. Backup pertama juga dapat dibuat dari fungsi `weeklyBackup` dengan menjalankan manual.

## Setup Cloudflare Pages
1. Unggah/commit seluruh isi paket ini ke root repository GitHub yang terhubung ke Cloudflare Pages. Pastikan `functions/` berada di root sejajar dengan `index.html`.
2. Di Cloudflare Dashboard → Workers & Pages → project Pages TABUNGANKU → Settings → Variables and Secrets.
3. Tambahkan variable `GAS_WEB_APP_URL` berisi URL Web App `/exec`.
4. Tambahkan **encrypted secret** `GAS_API_SECRET` berisi token dari Execution log Apps Script.
5. Simpan lalu lakukan redeploy project Pages.
6. Buka website Cloudflare dan periksa indikator sinkronisasi di kanan atas. Saat konfigurasi benar akan berubah menjadi `Cloud tersambung`.

## Cara kerja data dan offline queue
- Setiap perubahan disimpan lokal terlebih dahulu, lalu snapshot antrean dikirim saat online.
- Ketika online kembali, aplikasi mencoba sinkronisasi otomatis.
- Revision check mencegah snapshot lama menimpa data server yang sudah berubah. Jika terjadi konflik, aplikasi menahan antrean dan menampilkan peringatan; jangan hapus data browser sebelum rekonsiliasi.
- Untuk satu pemilik, gunakan satu perangkat untuk mengedit pada satu waktu agar konflik lintas perangkat dapat dihindari.
- Offline queue bukan pengganti backup. Jangan hapus data browser sebelum transaksi antrean tersinkron.

## Backup mingguan
Apps Script memasang trigger time-driven setiap Minggu sekitar pukul 03.00 (waktu eksekusi dapat sedikit bergeser menurut Google). Salinan spreadsheet dibuat ke folder Drive `TABUNGANKU Backups`.

## Catatan penting
- Paket ini belum terhubung ke akun Google kamu sampai langkah setup dan deployment di atas dilakukan.
- Paket ini tidak mengakses atau mengubah akun Google/GitHub/Cloudflare secara otomatis.
- Google Apps Script dan Cloudflare Free memiliki kuota/batas layanan. Gratis bukan jaminan tanpa batas atau gratis selamanya; periksa kuota resmi masing-masing layanan.
- Untuk pemakaian pribadi, jangan bagikan URL endpoint Apps Script atau secret. Jangan memasukkan kredensial bank.
