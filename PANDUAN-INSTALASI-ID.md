# Panduan instalasi TABUNGANKU v2.0

Ikuti berurutan. Jangan hapus project GitHub Pages atau Worker lama. Paket ini menambahkan integrasi pada project Cloudflare Pages yang sudah aktif.

## A. Buat database Google Sheets
1. Login ke akun Google pribadi yang akan menjadi pemilik data.
2. Buat Google Spreadsheet baru bernama `DATABASE TABUNGANKU`.
3. Dari spreadsheet, buka **Extensions → Apps Script**.
4. Hapus kode contoh di editor, lalu salin seluruh isi file `google-apps-script/Code.gs` dari ZIP ini ke `Code.gs`.
5. Klik ikon roda gigi **Project Settings**. Atur Time zone menjadi `(GMT+07:00) Jakarta` / `Asia/Jakarta`.
6. Kembali ke editor. Pada dropdown fungsi, pilih `setupTabunganku`, lalu klik **Run**.
7. Saat pertama kali, Google meminta izin. Pilih akun pemilik spreadsheet, tinjau izin Sheets dan Drive, lalu Allow.
8. Setelah eksekusi selesai, buka **Execution log**. Salin token panjang setelah teks `COPY THIS ONCE TO CLOUDFLARE SECRET GAS_API_SECRET:`. Jangan kirim token ini ke siapa pun dan jangan masukkan ke GitHub.
9. Kembali ke spreadsheet. Pastikan muncul tab `MASTER_TABUNGAN`, `TRANSAKSI`, dan `APP_META`.

## B. Deploy Apps Script sebagai API
1. Di editor Apps Script, klik **Deploy → New deployment**.
2. Klik ikon roda gigi / Select type, pilih **Web app**.
3. Description: `TABUNGANKU private API`.
4. Execute as: **Me**.
5. Who has access: **Anyone**. Ini diperlukan karena pemanggilnya Cloudflare server, bukan browser yang login Google. Akses tetap diperiksa memakai token acak yang panjang pada setiap request. Jangan pernah membagikan URL `/exec` atau token.
6. Klik **Deploy**, selesaikan otorisasi bila diminta.
7. Salin **Web app URL** yang berakhir `/exec`. Simpan untuk langkah C.

## C. Tambahkan konfigurasi rahasia Cloudflare
1. Buka Cloudflare Dashboard → **Workers & Pages** → pilih project **Pages** TABUNGANKU (bukan Worker lama).
2. Buka **Settings → Variables and Secrets**.
3. Tambahkan variable biasa:
   - Name: `GAS_WEB_APP_URL`
   - Value: URL Web app `/exec` dari langkah B.
4. Tambahkan secret terenkripsi:
   - Name: `GAS_API_SECRET`
   - Value: token dari Execution log langkah A.
   - Pilih **Encrypt** / Secret, bukan plain text variable.
5. Simpan. Pastikan kedua variabel berada pada environment **Production**.
6. Buka tab **Deployments** lalu lakukan **Retry deployment** pada deployment terakhir atau buat commit kecil di GitHub untuk memicu deployment baru. Function baru dan secrets aktif setelah deployment.

## D. Upload paket v2.0 ke repository GitHub
1. Ekstrak `tabunganku-v2.0-google-sheets-drive.zip` di komputer.
2. Buka repository GitHub `iamanastronaut24-cpu/tabunganku`.
3. Upload seluruh isi folder paket ke **root repository**, termasuk folder `functions` dan `google-apps-script`.
4. Saat GitHub meminta konfirmasi, pilih **Commit changes**.
5. Jangan menghapus file lama yang tidak diganti. File `index.html`, `sw.js`, `manifest.webmanifest`, dan `icon.svg` dari paket ini menggantikan versi sebelumnya.
6. Cloudflare Pages akan otomatis deploy dari branch `main`.

## E. Uji koneksi
1. Buka `https://tabunganku-5qv.pages.dev/`.
2. Hard refresh (Ctrl+Shift+R) atau tutup dan buka ulang PWA.
3. Status di kanan atas seharusnya berubah menjadi `Cloud tersambung`.
4. Buat satu tujuan tabungan uji, lalu tunggu status `Tersinkron`.
5. Buka Google Spreadsheet. Tujuan tersebut harus muncul pada `MASTER_TABUNGAN`.
6. Buat setoran uji kecil, pastikan tercatat pada `TRANSAKSI` dan saldo terbarui.
7. Setelah uji berhasil, hapus data uji melalui transaksi/koreksi yang sesuai atau reset database secara hati-hati.

## F. Backup mingguan
`setupTabunganku()` memasang trigger mingguan setiap Minggu sekitar pukul 03.00 menurut timezone project. Google dapat menjalankan trigger dalam rentang waktu yang sedikit bergeser. Saat backup pertama, Apps Script membuat folder Drive `TABUNGANKU Backups`, lalu membuat salinan spreadsheet di folder tersebut.

## Catatan sinkronisasi dan offline
- Perubahan disimpan ke browser terlebih dahulu. Saat offline, snapshot masuk antrean lokal dan dikirim saat koneksi kembali.
- Sinkronisasi menggunakan nomor revisi. Jika Google Sheets berubah dari perangkat lain saat perangkat ini offline, aplikasi menahan antrean untuk mencegah penimpaan data. Jangan hapus data browser; lakukan rekonsiliasi terlebih dahulu.
- Untuk mengurangi konflik, jangan mengedit dari dua perangkat secara bersamaan. Satu perangkat menjadi perangkat utama untuk input.
- Offline queue disimpan di browser/perangkat. Jika browser dihapus sebelum antrean tersinkron, transaksi antrean bisa hilang. Pastikan status `Tersinkron` sebelum membersihkan data browser.
- Endpoint Apps Script diset `Anyone` agar server Cloudflare dapat memanggilnya. Keamanan endpoint bergantung pada token acak yang hanya disimpan di Script Properties dan Cloudflare Secret. Jangan pernah memasukkan token ke kode frontend atau repository.
- Paket ini belum aktif terhubung sampai semua langkah setup selesai. ChatGPT tidak dapat mengakses akun Google, GitHub, atau Cloudflare untuk mengonfigurasi deployment secara langsung.
