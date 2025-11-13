# 🧭 Project Task: DSPI Internal Cost Report Dashboard (Rincian Biaya SPI)

## 🧩 Project Overview
Build a **clean, data-focused dashboard website** for the **Internal Audit Division (DSPI)** to display financial reports and operational cost details for the years **2025 and 2026**.  
The system should provide clear, minimal, and responsive interfaces — optimized for both data visibility and usability by internal officers and administrators.

---

## 🧱 Tech Stack
- **Frontend:** HTML5, TailwindCSS, Vanilla JavaScript (ES6)
- **Backend / Database:** Supabase (PostgreSQL + Realtime API)
- **Chart Library:** Chart.js (for Pie Chart in BPD module)
- **Export Library:** SheetJS (Excel) & jsPDF (PDF)

---

## ⚙️ Supabase Database Tables
The database is already created and includes:

| Table / View | Description |
|---------------|-------------|
| `beban_biaya_master` | Master list for expense categories |
| `beban_biaya_transaksi` | Transaction logs for each expense category |
| `bpd_master` | Detailed travel cost records (BPD) |
| `profiles` | User profiles and roles (admin / user) |
| `vw_bpd_summary_by_auditor` | View summarizing top 3 auditor spending |
| `vw_ringkasan_beban_biaya` | View summarizing expense totals (awal & akhir) |

---

## 🧭 Navigation Structure

### Header Menu (no sidebar)
```

| 2025 | 2026 |

```

When clicking **2025**, a dropdown appears:
```

* Beban Biaya Perjalanan Dinas (BPD)
* Beban Biaya Audit
* Beban Jasa Profesional (Konsultan)
* Beban Biaya Iuran, Sumbangan & Retribusi
* Beban Biaya Tamu
* Beban Biaya Rapat

```

> Each submenu will dynamically load content into the main area without page reload (SPA style).

---

## 👥 User Roles

| Role | Access & Features |
|-------|--------------------|
| **User** | View summary cards (Initial Amount, Final Amount). Click a sub-item to view details only. |
| **Admin** | View summary cards and **access input form** to record new transactions (date, activity name, number of people, and cost). System automatically recalculates Final Amount = Initial Amount - Total Cost. |

---

## 📊 Data Presentation Rules

### 1. **BPD (Biaya Perjalanan Dinas)**
- Display summary data from `vw_bpd_summary_by_auditor`
- Include a **Pie Chart (Top 3 Auditors)** by total accommodation cost
- Show details per record:
  - Audit name, requester, audit type, SPD number, BPD number, period, costs (departure, lodging, return, realization)

### 2. **Other Expense Categories (Audit, Konsultan, Iuran, Tamu, Rapat)**
- Display data from `vw_ringkasan_beban_biaya`
- Show **summary cards**:
  - “Initial Amount”
  - “Final Amount”
- For admin users: include a **form** with fields:
  - Date of activity
  - Activity name
  - Number of people
  - Cost (auto updates final amount)

---

## ⚡ Required Features

| Feature | Description |
|----------|-------------|
| 🔄 **Auto-refresh** | Realtime updates via Supabase Realtime API |
| 📤 **Export Data** | Export table data to Excel and PDF |
| 🔍 **Date Filter** | Filter transactions by date range |
| 🧮 **Auto Calculation** | Final amount auto-updates on data input |
| 📈 **Pie Chart** | Show top 3 spenders (auditors) dynamically |
| 🧾 **Responsive UI** | Layout adapts cleanly to desktop/tablet screens |

---

## 🗂️ Folder Structure

```

dspi-dashboard/
│
├── index.html
├── js/
│   ├── supabaseClient.js
│   ├── bpd.js
│   ├── bebanBiaya.js
│   └── utils.js
│
├── css/
│   └── style.css
└── assets/
└── logo.png

````

---

## 📄 File Responsibilities

### `index.html`
- Header navigation (2025 & 2026)
- Dropdown submenus
- Main content container (`#content`)
- Minimal Tailwind design, clean white background

### `supabaseClient.js`
- Initialize Supabase connection:
  ```js
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
  export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
````

### `bpd.js`

* Fetch summary data from `vw_bpd_summary_by_auditor`
* Render a pie chart (Top 3 auditors)
* Display detailed BPD records

### `bebanBiaya.js`

* Fetch from `vw_ringkasan_beban_biaya`
* Display cards (Initial/Final)
* Render input form (admin)
* Handle data insertion and automatic recalculation

### `utils.js`

* Format currency and dates
* Handle export (Excel, PDF)
* Filter by date range
* Handle role-based view (admin/user)

---

## 🚀 Development Workflow

1. **Initialize Project**

   * Create HTML structure with Tailwind
   * Setup Supabase connection in `supabaseClient.js`

2. **Implement Header Navigation**

   * Header with 2025 & 2026 buttons
   * Dropdown menus with click-to-load feature (using JS DOM manipulation)

3. **Integrate Supabase Data**

   * Fetch BPD summary and expense data
   * Render dynamically inside `#content`

4. **Add Admin Features**

   * Add transaction form
   * Insert new data via Supabase
   * Update and recalculate final amount automatically

5. **Implement Utilities**

   * Auto-refresh via Supabase Realtime
   * Export (Excel, PDF)
   * Date filter

6. **Enhance UI**

   * Apply consistent Tailwind theme (white background, soft shadows, rounded corners)
   * Add loading states, responsive design

---

## 🎯 Design Goals

* Clean, minimal UI (no unnecessary charts or cards)
* Easy to read and navigate for DSPI officers
* Real-time and accurate data presentation
* Mobile-friendly but optimized for desktop

---

## ✅ Output Expectation

A fully functional dashboard website connected to Supabase:

* Users can view real-time financial data
* Admins can input new expense records
* Data automatically updates and exports on demand

