Perfect — berarti sekarang kita akan buat **prompt Qoder (AI Editor)** lengkap untuk memperbarui workspace kamu, dengan fokus utama:

* ✅ **Perbaikan modul “Beban Biaya” (file `bebanbiaya.js`)**
* ✅ **Penambahan form login & autentikasi (terhubung ke Supabase Auth dan tabel `profiles`)**
* ✅ **Tanpa mengubah modul “BPD” karena sudah berfungsi dengan baik**
* ✅ **Mengacu ke struktur database yang kamu punya di Supabase**:

  * `beban_biaya_master`
  * `beban_biaya_transaksi`
  * `profiles`
  * `vw_ringkasan_beban_biaya`

Berikut **prompt lengkap** dalam format markdown yang bisa langsung kamu gunakan di **Qoder** 👇

---

# 🧩 QODER PROMPT — Update Workspace: Modul Beban Biaya & Login System

## 🎯 GOAL

Update the project to:

1. Fix and improve the **“Beban Biaya”** module (`bebanbiaya.js`)
2. Add a **Login Form** and authentication using **Supabase Auth**
3. Keep **BPD module** untouched

---

## ⚙️ CONTEXT

The project is a web-based internal monitoring tool built with **HTML + TailwindCSS + JavaScript** connected to **Supabase** as backend.

The app currently supports BPD (Biaya Perjalanan Dinas) and will now include a properly structured **Beban Biaya** module for financial records such as audit, meeting, and consultant expenses.

---

## 🧱 SUPABASE DATABASE STRUCTURE

### 🗂️ `beban_biaya_master`

Stores yearly total and summary per cost type.

| Column       | Type          | Description                                                                |
| ------------ | ------------- | -------------------------------------------------------------------------- |
| id           | uuid (PK)     | unique identifier                                                          |
| tahun        | integer       | year (2025 / 2026)                                                         |
| kategori     | text          | example: "Beban Biaya Audit", "Beban Biaya Rapat", "Beban Biaya Konsultan" |
| subkategori  | text          | example: “Assessment IACM”, “Meeting 1”, etc                               |
| jumlah_awal  | numeric(15,2) | initial allocated amount                                                   |
| jumlah_akhir | numeric(15,2) | remaining amount                                                           |
| created_at   | timestamptz   | timestamp                                                                  |
| updated_at   | timestamptz   | timestamp                                                                  |

---

### 🧾 `beban_biaya_transaksi`

Stores transaction logs for each spending related to `beban_biaya_master`.

| Column            | Type                              | Description                 |
| ----------------- | --------------------------------- | --------------------------- |
| id                | uuid (PK)                         | unique identifier           |
| master_id         | uuid (FK → beban_biaya_master.id) | reference to master record  |
| tanggal_transaksi | date                              | date of expense             |
| keterangan        | text                              | description                 |
| nominal           | numeric(15,2)                     | expense amount              |
| created_by        | uuid (FK → profiles.id)           | user who created the record |
| created_at        | timestamptz                       | timestamp                   |
| updated_at        | timestamptz                       | timestamp                   |

---

### 👤 `profiles`

Stores user role and name.
Connected to `auth.users`.

| Column     | Type                          | Description              |
| ---------- | ----------------------------- | ------------------------ |
| id         | uuid (PK, FK → auth.users.id) | same as auth user id     |
| full_name  | text                          | user name                |
| role       | text                          | either “admin” or “user” |
| created_at | timestamptz                   | timestamp                |

---

### 📊 `vw_ringkasan_beban_biaya`

View used for aggregated data display per category (for cards or dashboards).

| Column          | Example             |
| --------------- | ------------------- |
| kategori        | “Beban Biaya Audit” |
| total_transaksi | 15000000            |
| sisa_anggaran   | 35000000            |

---

## 🧭 FUNCTIONAL REQUIREMENTS

### 1️⃣ LOGIN SYSTEM

* Create a **login form** page using HTML + Tailwind + JavaScript.
* Use **Supabase Auth** for sign-in (`supabase.auth.signInWithPassword()`).
* On success, store the session in `localStorage`.
* Redirect user to `index.html` or main dashboard.
* If user role = `admin`, show admin-only controls (form input, export, delete).
* If user role = `user`, show read-only data.

### 2️⃣ BEBAN BIAYA MODULE (file: `bebanbiaya.js`)

#### a. Data Loading

* Fetch data from:

  * `vw_ringkasan_beban_biaya` (for summary cards)
  * `beban_biaya_master` (for master-level data)
  * `beban_biaya_transaksi` (for transaction details)
* Display summary cards for each category:

  * Beban Biaya Audit
  * Beban Biaya Konsultan
  * Beban Biaya Iuran
  * Beban Biaya Tamu
  * Beban Biaya Rapat
* Each card shows:

  * Tahun
  * Jumlah Awal
  * Jumlah Akhir
  * Total Transaksi (from transactions)
* Use Tailwind grid for responsive card layout.

#### b. Admin Features

* Admin can open a modal form to **add transactions**:

  * Select master category (dropdown)
  * Input date, description, and nominal
* Auto-refresh data after insert.
* Add filter by date range and year.
* Add **Export to CSV** button (for both summary and transaction data).

#### c. Auto Refresh

* Every 30 seconds, refresh data from Supabase and re-render cards and tables.

---

## 🧩 FILES TO UPDATE / CREATE

| File              | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `bebanbiaya.js`   | Rebuild with Supabase integration and proper role logic |
| `login.html`      | New login form UI                                       |
| `login.js`        | Handle Supabase Auth login, session save, and redirect  |
| *(Do not modify)* | `bpd.js` and all existing BPD-related files             |

---

## 🎨 UI / UX STYLE GUIDE

* TailwindCSS for layout and styling
* Responsive design using grid & cards
* Minimalist modern theme (light background, rounded corners)
* Use consistent button colors:

  * Blue for primary actions (Add, Save)
  * Gray for neutral (Cancel, Close)
* Modal form for adding transactions
* Loading spinner or skeleton UI when fetching data

---

## 💡 NOTES

* Keep database names consistent with Supabase (`beban_biaya_master`, `beban_biaya_transaksi`, `profiles`, `vw_ringkasan_beban_biaya`).
* Do **not** alter or remove `bpd.js` or any BPD module files.
* Ensure data fetching and policy respect user roles.
* Use `supabase.auth.getSession()` to determine the current user.
* If session expired → redirect to `login.html`.

---

## ✅ DELIVERABLE

After running this prompt, Qoder should:

1. Generate or update `bebanbiaya.js` to include all logic above.
2. Create new login page (`login.html` + `login.js`).
3. Ensure everything works with Supabase Auth and existing database structure.
4. Keep BPD module untouched.


