# Stock Opname & Inventory Management API

Aplikasi backend ini menyediakan API untuk manajemen inventaris, transaksi, laporan bulanan, dan stock opname. Dilengkapi dengan sistem otentikasi pengguna berbasis peran (user dan admin).

## Fitur Utama

*   **Manajemen Pengguna & Otentikasi:**
    *   Registrasi dan Login pengguna.
    *   Manajemen profil pengguna.
    *   Peran pengguna (User, Admin) dengan otorisasi berbasis token JWT.
    *   Admin dapat melihat dan mengelola semua pengguna.
    *   Fungsi penghapusan data massal (khusus admin).
*   **Manajemen Item Inventaris:**
    *   CRUD (Create, Read, Update, Delete) item inventaris.
    *   Pencarian, filter, dan paginasi item.
    *   Ringkasan inventaris (total item, nilai total, item stok rendah).
    *   Saran SKU/nama untuk autocomplete.
    *   Import item dari file CSV.
*   **Manajemen Transaksi:**
    *   Pencatatan transaksi masuk, keluar, dan stok awal.
    *   Otomatis memperbarui stok item dan harga rata-rata.
    *   Pencarian dan filter transaksi berdasarkan tanggal, item, jenis, dan pengguna.
    *   Statistik transaksi harian dan keseluruhan.
*   **Laporan Bulanan:**
    *   Generasi laporan bulanan berdasarkan transaksi yang tercatat.
    *   Ringkasan pergerakan stok dan nilai item per bulan.
    *   Ekspor laporan ke format CSV.
*   **Stock Opname:**
    *   Pembuatan sesi stock opname dari laporan bulanan sebelumnya atau stok item saat ini.
    *   Pencatatan dan pembaruan stok fisik.
    *   Pembaruan massal stok fisik.
    *   Penyimpanan hasil opname yang secara otomatis membuat transaksi penyesuaian (adjustment) untuk menyelaraskan stok sistem dengan stok fisik.
    *   Ekspor data stock opname ke CSV.

## Alur Aplikasi (High-Level)

1.  **Manajemen Pengguna:**
    *   Pengguna mendaftar dan masuk ke sistem.
    *   Setelah otentikasi, pengguna mendapatkan token JWT untuk mengakses API yang dilindungi.
    *   Pengguna dapat melihat dan memperbarui profil mereka.
    *   Admin memiliki akses penuh untuk mengelola pengguna lain dan melakukan operasi sensitif seperti menghapus semua data.

2.  **Manajemen Item:**
    *   Admin dapat menambahkan item baru, memperbarui detail item, dan menghapus (soft delete) item dari inventaris.
    *   Fungsi import CSV memungkinkan penambahan item dalam jumlah besar.
    *   Pengguna dapat mencari dan melihat detail item.

3.  **Pencatatan Transaksi:**
    *   Admin mencatat setiap pergerakan stok (barang masuk, barang keluar, atau stok awal).
    *   Setiap transaksi secara otomatis memperbarui jumlah stok dan harga rata-rata item terkait.

4.  **Laporan Bulanan:**
    *   Pada akhir periode (misalnya, setiap bulan), admin dapat menghasilkan laporan bulanan.
    *   Laporan ini merangkum semua transaksi yang terjadi dalam bulan tersebut, menunjukkan stok awal, barang masuk, barang keluar, stok akhir, dan harga rata-rata tertimbang untuk setiap item.
    *   Laporan dapat dilihat dan diekspor untuk analisis lebih lanjut.

5.  **Stock Opname:**
    *   Admin memulai sesi stock opname untuk bulan tertentu. Data awal stock opname dapat diambil dari laporan bulanan sebelumnya atau dari stok sistem saat ini.
    *   Selama stock opname, stok fisik barang dihitung dan dicatat.
    *   Setelah perhitungan fisik selesai, admin dapat menyimpan hasilnya. Sistem akan secara otomatis membuat transaksi penyesuaian untuk setiap selisih antara stok sistem dan stok fisik, memastikan data inventaris selalu akurat.

## API Endpoints

Berikut adalah daftar endpoint API yang tersedia, dikelompokkan berdasarkan fungsionalitas:

### 1. Autentikasi & Pengguna (`/api/auth`)

*   `POST /api/auth/register`
*   `POST /api/auth/login`
*   `GET /api/auth/profile` (Protected)
*   `PUT /api/auth/profile` (Protected)
*   `PUT /api/auth/change-password` (Protected)
*   `GET /api/auth/users` (Admin Only)
*   `POST /api/auth/clear-data` (Admin Only, requires confirmation)

### 2. Item Inventaris (`/api/items`)

*   `POST /api/items` (Protected)
*   `GET /api/items` (Protected)
*   `GET /api/items/summary` (Protected)
*   `GET /api/items/suggestions` (Protected)
*   `GET /api/items/sku/:sku` (Protected)
*   `GET /api/items/:id` (Protected)
*   `PUT /api/items/:id` (Admin Only)
*   `DELETE /api/items/:id` (Admin Only)
*   `POST /api/items/import-csv` (Admin Only, multipart/form-data for file upload)

### 3. Laporan Bulanan (`/api/monthly-reports`)

*   `POST /api/monthly-reports/generate` (Admin Only)
*   `GET /api/monthly-reports/months` (Protected)
*   `GET /api/monthly-reports/:reportMonth` (Protected)
*   `GET /api/monthly-reports/:reportMonth/export` (Admin Only)
*   `DELETE /api/monthly-reports/:reportMonth` (Admin Only)

### 4. Stock Opname (`/api/stock-opnames`)

*   `POST /api/stock-opnames/create` (Admin Only)
*   `GET /api/stock-opnames/months` (Protected)
*   `GET /api/stock-opnames/:opnameMonth` (Protected)
*   `PUT /api/stock-opnames/:id/stock-fisik` (Admin Only)
*   `PUT /api/stock-opnames/bulk-update` (Admin Only)
*   `POST /api/stock-opnames/save-results` (Admin Only)
*   `GET /api/stock-opnames/:opnameMonth/export` (Admin Only)
*   `DELETE /api/stock-opnames/:opnameMonth` (Admin Only)

### 5. Transaksi (`/api/transactions`)

*   `POST /api/transactions` (Admin Only)
*   `GET /api/transactions` (Protected)
*   `GET /api/transactions/statistics` (Protected)
*   `GET /api/transactions/:id` (Protected)
*   `PUT /api/transactions/:id` (Admin Only)
*   `DELETE /api/transactions/:id` (Admin Only, requires confirmation)

## Instalasi & Penggunaan

1.  **Clone Repository:**
    ```bash
    git clone <URL_REPOSITORY_ANDA>
    cd backend-vercel
    ```
2.  **Instal Dependensi:**
    ```bash
    npm install
    ```
3.  **Konfigurasi Environment Variables:**
    Buat file `.env` di root proyek dan tambahkan variabel lingkungan yang diperlukan, contoh:
    ```
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/stockopname_db
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRES_IN=7d
    ```
    *   `PORT`: Port untuk menjalankan server.
    *   `MONGODB_URI`: URI koneksi ke database MongoDB Anda.
    *   `JWT_SECRET`: Kunci rahasia untuk penandatanganan token JWT (gunakan string yang kuat dan unik).
    *   `JWT_EXPIRES_IN`: Waktu kadaluarsa token JWT (misal: `7d` untuk 7 hari).
4.  **Jalankan Server:**
    ```bash
    npm start
    ```
    Atau dengan `nodemon` untuk pengembangan:
    ```bash
    npm run dev
    ```
    Server akan berjalan di `http://localhost:5000` (atau port yang Anda konfigurasi).

## Struktur Proyek

```
.
├── api/
│   ├── controllers/      # Logika bisnis untuk setiap endpoint
│   ├── models/           # Definisi skema database (Mongoose)
│   └── routes/           # Definisi rute API
├── node_modules/         # Dependensi proyek
├── uploads/              # Direktori untuk file yang diunggah (misal: CSV)
├── .gitignore            # File yang diabaikan oleh Git
├── items_example.csv     # Contoh file CSV untuk import item
├── package.json          # Metadata proyek dan dependensi
├── package-lock.json     # Lock file dependensi
├── README.md             # Dokumentasi proyek
├── seed.js               # Skrip untuk mengisi data awal (opsional)
├── server.js             # Titik masuk utama aplikasi
└── test_sku.js           # Contoh skrip pengujian (opsional)
```

---