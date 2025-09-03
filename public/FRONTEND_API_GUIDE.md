# Panduan API untuk Frontend (Perubahan & Fitur Baru)

Dokumen ini bertujuan untuk memberikan panduan bagi pengembang frontend mengenai perubahan dan penambahan pada API backend. Tujuannya adalah untuk mempermudah adaptasi frontend terhadap evolusi backend.

---

## 1. Perubahan pada Model Item (Endpoint: `/api/items`)

Model `Item` telah diperluas untuk mendukung manajemen bahan baku dan produk jadi.

### Field Baru pada Objek Item:

Setiap objek item yang diterima dari endpoint `/api/items` (GET, POST, PUT) kini memiliki field-field berikut:

*   `stockUnit` (String): Satuan utama item saat disimpan atau dibeli (misal: "kg", "liter", "pcs"). Menggantikan `unit` lama.
*   `consumptionUnit` (String): Satuan item saat digunakan dalam resep (misal: "gram", "ml", "pcs").
*   `conversionFactor` (Number): Angka pengali untuk mengkonversi dari `stockUnit` ke `consumptionUnit` (misal: 1000 untuk kg ke gram).
*   `totalValue` (Number, Virtual): Nilai total stok item (`currentStock * averagePrice`). Field ini akan otomatis muncul dalam respons JSON.

### Contoh Objek Item (Respons GET /api/items):

```json
{
  "_id": "...",
  "sku": "BJK-001",
  "name": "Biji Kopi Arabika",
  "category": "Bahan Baku",
  "brand": "Generic",
  "description": "Biji kopi Arabika premium",
  "stockUnit": "kg",
  "consumptionUnit": "gram",
  "conversionFactor": 1000,
  "currentStock": 4.985,
  "basePrice": 250000,
  "averagePrice": 250000,
  "totalValue": 1246250, // Field virtual
  "createdBy": { "_id": "...", "username": "...", "email": "..." },
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 2. Manajemen Resep (Bill of Materials) - Endpoint Baru: `/api/recipes`

Fitur baru untuk mendefinisikan bahan-bahan yang dibutuhkan untuk membuat suatu produk jadi.

### Model Resep:

Sebuah resep menghubungkan satu `productId` (item produk jadi) dengan array `ingredients` (bahan baku).

```javascript
// Struktur Data Resep
{
  "product": "ID_ITEM_PRODUK_JADI", // ID item yang dijual (misal: Kopi Susu)
  "ingredients": [
    {
      "item": "ID_ITEM_BAHAN_BAKU_1", // ID item bahan baku (misal: Biji Kopi)
      "quantity": 15 // Jumlah bahan baku ini dalam consumptionUnit-nya (misal: 15 gram)
    },
    {
      "item": "ID_ITEM_BAHAN_BAKU_2", // ID item bahan baku (misal: Susu UHT)
      "quantity": 150 // Jumlah bahan baku ini dalam consumptionUnit-nya (misal: 150 ml)
    }
  ]
}
```

### Endpoint Resep:

*   **`POST /api/recipes`**
    *   **Deskripsi:** Membuat resep baru.
    *   **Body Request:** Objek resep seperti struktur di atas.
    *   **Akses:** Admin Only.
    *   **Respons Sukses:** `201 Created`, objek resep yang dibuat.
    *   **Respons Error:** `400 Bad Request` (jika `productId` atau `ingredients` tidak valid, atau resep untuk produk tersebut sudah ada), `404 Not Found` (jika `productId` atau `item` bahan baku tidak ditemukan).

*   **`GET /api/recipes`**
    *   **Deskripsi:** Mengambil semua resep.
    *   **Akses:** Protected.
    *   **Respons Sukses:** `200 OK`, array objek resep (dengan `product` dan `ingredients.item` ter-populate).

*   **`GET /api/recipes/product/:productId`**
    *   **Deskripsi:** Mengambil resep untuk produk jadi tertentu.
    *   **Parameter:** `:productId` (ID item produk jadi).
    *   **Akses:** Protected.
    *   **Respons Sukses:** `200 OK`, objek resep (dengan `product` dan `ingredients.item` ter-populate).
    *   **Respons Error:** `404 Not Found` (jika resep tidak ditemukan).

*   **`PUT /api/recipes/:recipeId`**
    *   **Deskripsi:** Memperbarui resep yang sudah ada.
    *   **Parameter:** `:recipeId` (ID resep, bukan ID produk).
    *   **Body Request:** Objek dengan array `ingredients` yang diperbarui.
    *   **Akses:** Admin Only.
    *   **Respons Sukses:** `200 OK`, objek resep yang diperbarui.
    *   **Respons Error:** `400 Bad Request` (jika `ingredients` tidak valid), `404 Not Found` (jika resep atau item bahan baku tidak ditemukan).

*   **`DELETE /api/recipes/:recipeId`**
    *   **Deskripsi:** Menghapus resep.
    *   **Parameter:** `:recipeId` (ID resep).
    *   **Akses:** Admin Only.
    *   **Respons Sukses:** `200 OK`, pesan sukses.
    *   **Respons Error:** `404 Not Found` (jika resep tidak ditemukan).

---

## 3. Perubahan pada Transaksi (Endpoint: `/api/transactions`)

### `POST /api/transactions` (Tipe `keluar`):

*   **Perilaku Baru:** Jika `itemId` yang dikirim dalam request adalah produk jadi yang memiliki resep, maka sistem **tidak akan mengurangi `currentStock` dari `itemId` tersebut**. Sebaliknya, sistem akan:
    1.  Mencari resep terkait.
    2.  Mengurangi `currentStock` dari **setiap bahan baku** yang ada di resep, sesuai dengan `quantity` yang diminta dan `conversionFactor` masing-masing bahan baku.
    3.  Jika stok salah satu bahan baku tidak mencukupi, transaksi akan dibatalkan dan akan mengembalikan error `400 Bad Request` dengan pesan yang jelas (misal: "Stock bahan baku tidak cukup untuk 'Nama Bahan Baku'").
*   **Respons:** Tetap mengembalikan objek transaksi yang dibuat untuk produk jadi, namun pengurangan stok terjadi pada bahan baku.

---

## 4. Perubahan pada Impor CSV Item (Endpoint: `/api/items/import-csv`)

Format file CSV untuk impor item telah diperbarui.

### Kolom CSV yang Diperlukan:

*   `sku`
*   `name`
*   `category`
*   `brand`
*   `description` (Opsional)
*   `stockUnit` (Wajib, menggantikan `unit` lama)
*   `consumptionUnit` (Opsional, default ke `stockUnit` jika tidak ada)
*   `conversionFactor` (Opsional, default ke `1` jika tidak ada)
*   `basePrice`

### Contoh Baris CSV:

```csv
sku,name,category,brand,description,stockUnit,consumptionUnit,conversionFactor,basePrice
BJK-001,Biji Kopi Arabika,Bahan Baku,Generic,"Biji kopi Arabika premium",kg,gram,1000,250000
PROD-001,Kopi Susu,Produk Jadi,Kedai Kopi,"Kopi susu gula aren signature",pcs,pcs,1,18000
```

---

Dokumen ini akan membantu tim frontend memahami dan mengadaptasi kode mereka sesuai dengan perubahan backend.