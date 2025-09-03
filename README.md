# Stock Opname System

## Deskripsi

Stock Opname System adalah aplikasi manajemen inventaris berbasis web yang dirancang untuk membantu pencatatan transaksi harian, pelaporan bulanan, dan proses stock opname. Aplikasi ini menyediakan fitur-fitur lengkap untuk mengelola item, pengguna, resep, serta memantau pergerakan stok secara efisien.

## Fitur Utama

-   **Transaksi Harian**: Pencatatan transaksi masuk dan keluar barang secara real-time.
-   **Laporan Bulanan**: Ringkasan akumulasi transaksi bulanan untuk analisis performa.
-   **Stock Opname**: Fitur untuk melakukan perhitungan fisik stok dan menyesuaikannya dengan data sistem.
-   **Daftar Item**: Manajemen data master item, termasuk SKU, nama, jenis, dan merek.
-   **Manajemen Pengguna**: Pengelolaan akun pengguna dengan peran (Admin, User) dan hak akses yang berbeda.
-   **Manajemen Resep**: Fitur untuk mengelola resep atau komposisi produk (jika relevan).
-   **Pengaturan Profil**: Pengguna dapat mengelola informasi profil mereka.

## Akun Demo

Untuk tujuan demonstrasi dan pengujian, Anda dapat menggunakan akun berikut:

### ADMIN
-   **Email**: `admin@inventory.com`
-   **Password**: `password123`

### USER
-   **Email**: `user1@inventory.com`
-   **Password**: `password123`

## Instalasi

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

1.  **Clone repository:**
    ```bash
    git clone <URL_REPOSITORY_ANDA>
    cd stock-opname-v2
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # atau
    yarn install
    ```

3.  **Jalankan aplikasi:**
    ```bash
    npm run dev
    # atau
    yarn dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

## Penggunaan

Setelah aplikasi berjalan:

1.  **Login**: Gunakan akun demo yang disediakan atau daftar akun baru (jika fitur registrasi diaktifkan).
2.  **Navigasi**: Gunakan tombol navigasi di bagian atas halaman untuk beralih antara fitur-fitur utama seperti Transaksi Harian, Laporan Bulanan, Stock Opname, dll.
3.  **Input Data**: Masukkan data transaksi, item, atau resep sesuai kebutuhan.
4.  **Manajemen**: Gunakan fitur manajemen pengguna untuk menambah, mengedit, atau menghapus akun pengguna.
5.  **Laporan**: Akses laporan bulanan untuk melihat ringkasan data.

---