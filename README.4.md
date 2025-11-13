## 🧠 QODER PROMPT — Final Revision for `bebanBiaya.js`

````markdown
### 🧩 CONTEXT
We are updating the file `bebanBiaya.js` for the SPI (Internal Audit Division) dashboard.  
The current goal is to make the “Beban Biaya” modules (Audit, Konsultan, Iuran, Tamu, Rapat) fully dynamic,  
so users can:
1. Select a **subcategory** (e.g. “Assessment IACM”) inside a main category (e.g. “Beban Biaya Audit”).
2. View the **summary data** (Jumlah Awal, Total Pemakaian, Jumlah Akhir) fetched from `vw_ringkasan_beban_biaya`.
3. View **transaction details** from `beban_biaya_transaksi`.
4. For admin users, add new transactions tied to the correct `master_id`.

The BPD (Perjalanan Dinas) section should remain **unchanged**.

---

### 🎯 OBJECTIVE
Revise the current logic and UI in `bebanBiaya.js` to:
- Dynamically load subcategories (`subkategori`) based on the selected category.
- Fetch corresponding summary data (`vw_ringkasan_beban_biaya`) and transactions (`beban_biaya_transaksi`).
- Ensure all new transactions are inserted with the correct `master_id`.
- Auto-refresh summary and transaction table after new data is added.
- Show validation messages when required fields are missing.

---

### ⚙️ DATABASE REFERENCE
#### 📘 `beban_biaya_master`
| Column | Type | Description |
|---------|-------|-------------|
| id | uuid | Primary key |
| tahun | integer | Year (2025 or 2026) |
| kategori | text | e.g., Beban Biaya Audit |
| subkategori | text | e.g., Assessment IACM |
| jumlah_awal | numeric | Initial budget |
| jumlah_akhir | numeric | Remaining budget |

#### 📘 `beban_biaya_transaksi`
| Column | Type | Description |
|---------|-------|-------------|
| id | uuid | Primary key |
| master_id | uuid | Foreign key → beban_biaya_master.id |
| tanggal_kegiatan | date | Activity date |
| nama_kegiatan | text | Activity name |
| jumlah_orang | integer | Number of participants |
| biaya_kegiatan | numeric | Cost spent |

#### 📘 `vw_ringkasan_beban_biaya`
View combining both tables, includes:
| master_id | tahun | kategori | subkategori | jumlah_awal | total_pemakaian | jumlah_akhir | jumlah_transaksi |

---

### 🧩 REQUIRED IMPLEMENTATION

#### 1️⃣ Add Subcategory Dropdown to the UI
Each “Beban Biaya” category should have a `<select>` dropdown listing its available subcategories.

Example HTML snippet to include above the transaction form:
```html
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700">Subkategori</label>
  <select id="subKategoriSelect" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
    <option value="">-- Pilih Subkategori --</option>
  </select>
</div>
````

#### 2️⃣ Populate Subcategory Dropdown Dynamically

After loading a category module (e.g. Audit, Konsultan, etc.),
fetch its subcategories from `beban_biaya_master`:

```js
const subSelect = document.getElementById('subKategoriSelect');
if (subSelect) {
  const { data: subList, error: subError } = await supabase
    .from('beban_biaya_master')
    .select('subkategori')
    .eq('kategori', categoryName);

  if (!subError && subList?.length > 0) {
    subSelect.innerHTML = '<option value="">-- Pilih Subkategori --</option>' +
      subList.map(s => `<option value="${s.subkategori}">${s.subkategori}</option>`).join('');
  }
}
```

---

#### 3️⃣ Load Summary Data for Selected Subcategory

When a user selects a subcategory, fetch summary data from the view:

```js
const subKategori = subSelect.value;
if (!subKategori) return;

const { data: summaryData, error: summaryError } = await supabase
  .from('vw_ringkasan_beban_biaya')
  .select('*')
  .eq('kategori', categoryName)
  .eq('subkategori', subKategori)
  .single();

if (summaryError) throw summaryError;
```

Render the summary as **cards** showing:

* Jumlah Awal
* Total Pemakaian
* Jumlah Akhir
  (using Tailwind clean layout)

---

#### 4️⃣ Fetch Transactions for Selected Subcategory

After fetching the summary, load all transaction records linked to its `master_id`:

```js
const { data: transaksiData, error: transaksiError } = await supabase
  .from('beban_biaya_transaksi')
  .select('*')
  .eq('master_id', summaryData.master_id)
  .order('tanggal_kegiatan', { ascending: false });

if (transaksiError) throw transaksiError;
```

Display them in a responsive table below the summary cards.

---

#### 5️⃣ Insert New Transaction (Admin Only)

When admin submits the transaction form:

* Ensure the selected subcategory is not empty.
* Retrieve `master_id` from `beban_biaya_master`.
* Insert the new record.
* Refresh summary and table after success.

```js
const { data: master, error: masterError } = await supabase
  .from('beban_biaya_master')
  .select('id')
  .eq('kategori', categoryName)
  .eq('subkategori', subKategori)
  .single();

if (masterError || !master) {
  alert(`Master record not found for ${subKategori}`);
  return;
}

const { error: insertError } = await supabase
  .from('beban_biaya_transaksi')
  .insert([{
    master_id: master.id,
    tanggal_kegiatan,
    nama_kegiatan,
    jumlah_orang,
    biaya_kegiatan
  }]);

if (!insertError) {
  alert('Transaction added successfully!');
  await loadBebanBiayaContent(container, module); // refresh data
}
```

---

#### 6️⃣ Auto Refresh and Error Handling

* After each transaction insert, reload the summary and transaction data.
* Show friendly alerts for missing subcategory or empty fields.
* Log errors to console for debugging.

---

### 🚫 DO NOT MODIFY

* The BPD (Biaya Perjalanan Dinas) module logic.
* Existing layout or header components.
* Role-based control logic (`admin` vs `user`).

---

### ✅ FINAL CHECK

After this update:

1. User selects *Beban Biaya Audit* → Dropdown shows 3 subcategories (Assessment IACM, QAIP, RMI).
2. User picks “Assessment IACM” → Summary and transaction data appear.
3. Admin adds new transaction → Linked correctly via `master_id`.
4. Summary updates automatically.
5. Other categories (Konsultan, Iuran, Tamu, Rapat) follow the same logic.
6. BPD section remains untouched.

