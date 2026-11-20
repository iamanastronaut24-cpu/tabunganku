# Tabunganku v1.1 - Offline-first PWA

Aplikasi pengelolaan berbagai tujuan tabungan pribadi.

## Cara mencoba lokal
- Buka `index.html` di browser untuk uji coba dasar.
- Untuk fitur instalasi PWA dan offline cache, jalankan melalui hosting HTTPS atau server lokal (mis. VS Code Live Server).

## Hosting gratis
Aplikasi ini berupa file statis dan dapat di-host di GitHub Pages tanpa biaya hosting. Buat repository GitHub, unggah seluruh isi folder ini ke root repository, lalu aktifkan Settings → Pages → Deploy from a branch → main → /(root). Setelah aktif, buka URL GitHub Pages dari HP/laptop.

## Instalasi
- Android/Chrome: buka URL aplikasi, pilih menu browser → Install app / Add to Home Screen.
- Desktop Chrome/Edge: gunakan ikon Install di address bar jika tersedia.

## Fitur
- Dashboard saldo total dan progres tabungan.
- Membuat banyak tujuan tabungan dengan target dan tenggat.
- Setor, tarik, dan transfer antar-tabungan.
- Filter jangka pendek, menengah, dan panjang.
- Riwayat transaksi, rencana setoran, dan insight.
- Data tersimpan di browser/perangkat (localStorage).
- Ekspor dan pulihkan backup JSON.
- PWA cache untuk penggunaan offline setelah kunjungan online pertama.

## Batasan penting
Tidak ada akun/login atau sinkronisasi antarperangkat. Data hanya ada di browser/perangkat tempat data dimasukkan. Ekspor backup secara berkala dan simpan file di tempat aman. Menghapus data browser dapat menghapus data aplikasi. Hosting gratis bergantung pada kebijakan penyedia dan tidak dapat dijamin gratis selamanya.
