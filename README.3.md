Siap 💪 — berikut ini **prompt Qoder lengkap (dalam bahasa Inggris)** yang bisa langsung kamu tempel ke AI Editor (Qoder) untuk **memperbarui file `bebanBiaya.js`**, memperbaiki masalah *“Could not find master record”*, serta menambahkan fitur pemilihan *subkategori dinamis* agar transaksi masuk ke `master_id` yang benar.

---

## 🧠 QODER PROMPT — Update `bebanBiaya.js`

````markdown
### 🧩 Context
We are updating the file `bebanBiaya.js` in a Supabase-powered web dashboard for SPI (Internal Audit Division).  
The current issue:  
When adding a new transaction in "Beban Biaya Audit" or other categories, Supabase throws an error:

> "Could not find master record for category: Beban Biaya Audit"

This happens because the code searches `beban_biaya_master` using only the `kategori` column,  
while there are multiple subcategories for the same category (e.g., "Assessment IACM", "QAIP", etc.).

---

### 🎯 Goal
Revise the code logic to:
1. Dynamically populate subcategories from `beban_biaya_master` based on the current category.
2. Update the form to include a `<select>` dropdown for subcategory selection.
3. Fetch the correct `master_id` using both `kategori` and `subkategori` before inserting a new transaction.
4. Add form validation to ensure subcategory is selected.
5. Automatically refresh the data table after inserting a transaction successfully.

---

### ⚙️ Technical Details
**Database tables in Supabase:**
- `beban_biaya_master`:  
  Columns → `id`, `tahun`, `kategori`, `subkategori`, `jumlah_awal`, `jumlah_akhir`
- `beban_biaya_transaksi`:  
  Columns → `id`, `master_id`, `tanggal_kegiatan`, `nama_kegiatan`, `jumlah_orang`, `biaya_kegiatan`
- `vw_ringkasan_beban_biaya`:  
  Used for dashboard summary display.
- `profiles`:  
  For role-based access (`admin` or `user`).

---

### 🧩 Requirements for Qoder

Please modify the existing `bebanBiaya.js` file with the following updates:

#### 1️⃣ Add subcategory dropdown in the form UI
Inside the HTML form for adding a transaction, insert:

```html
<div>
  <label class="block text-sm font-medium text-gray-700">Subkategori</label>
  <select id="subKategori" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
    <option value="">-- Pilih Subkategori --</option>
  </select>
</div>
````

#### 2️⃣ Populate the subcategory dropdown dynamically

After the form is rendered, fetch the subcategories from Supabase:

```js
const subSelect = document.getElementById('subKategori');
if (subSelect) {
  const { data: subList, error: subError } = await supabase
    .from('beban_biaya_master')
    .select('subkategori')
    .eq('kategori', categoryName);

  if (!subError && subList?.length > 0) {
    subSelect.innerHTML += subList
      .map(s => `<option value="${s.subkategori}">${s.subkategori}</option>`)
      .join('');
  }
}
```

#### 3️⃣ Fix the transaction insert logic

Replace the old query that only searched by category:

```js
const { data: masterData, error: masterError } = await supabase
  .from('beban_biaya_master')
  .select('id')
  .eq('kategori', categoryName)
  .single();
```

with this new logic:

```js
const subKategori = document.getElementById('subKategori').value;

if (!subKategori) {
  alert("Please select a subcategory first!");
  return;
}

const { data: masterData, error: masterError } = await supabase
  .from('beban_biaya_master')
  .select('id')
  .eq('kategori', categoryName)
  .eq('subkategori', subKategori)
  .single();

if (masterError || !masterData) {
  throw new Error(`No master record found for ${categoryName} → ${subKategori}`);
}
```

Then, use `masterData.id` when inserting:

```js
await supabase.from('beban_biaya_transaksi').insert([
  {
    master_id: masterData.id,
    tanggal_kegiatan,
    nama_kegiatan,
    jumlah_orang,
    biaya_kegiatan
  }
]);
```

#### 4️⃣ Refresh data after successful insert

After successful insert, re-fetch both summary and transaction data:

```js
await loadBebanBiayaContent(container, module);
```

---

### ✅ Deliverables

* Update `bebanBiaya.js` with the new dropdown, dynamic fetching, and fixed insert logic.
* Ensure the error “Could not find master record…” no longer appears.
* Confirm transactions are inserted under the correct `master_id`.
* The UI should now allow selecting and saving transactions per subcategory.

---

### 💬 Notes

* Keep Tailwind styling consistent with the current layout.
* Do **not** modify the BPD (Perjalanan Dinas) section — only apply changes to Beban Biaya modules.
* Maintain `renderBebanBiayaContent` and `handleFormSubmit` as separate functions, but update their logic as described.

---

### 🔄 Final Check

After this update, when a user:

1. Opens “Beban Biaya Audit” → dropdown lists all its subcategories.
2. Chooses one subcategory (e.g., "Assessment IACM").
3. Adds a transaction → the system links it to the correct master ID in `beban_biaya_master`.
4. The table refreshes and shows updated data immediately.

