# DSPI Internal Cost Report Dashboard

A dashboard for the Internal Audit Division (DSPI) to display financial reports and operational cost details.

## Project Overview

This dashboard provides a clean, data-focused website for DSPI to display financial reports and operational cost details for the years 2025 and 2026. The system offers clear, minimal, and responsive interfaces optimized for both data visibility and usability by internal officers and administrators.

## Tech Stack

- **Frontend:** HTML5, TailwindCSS, Vanilla JavaScript (ES6)
- **Backend / Database:** Supabase (PostgreSQL + Realtime API)
- **Chart Library:** Chart.js (for Pie Chart in BPD module)
- **Export Library:** SheetJS (Excel) & jsPDF (PDF)

## Setup Instructions

1. Clone or download this repository
2. Set up a Supabase project:
   - Go to [Supabase](https://app.supabase.io/)
   - Create a new project
   - Get your Project URL and API Key (anon key)
3. Configure Supabase:
   - Update `js/supabaseClient.js` with your Supabase Project URL and anon key
4. Create the required database tables and views:
   - Use the provided `supabase_setup.sql` file to create tables and views in your Supabase project
   - Execute the SQL commands in your Supabase SQL editor
5. Serve the files using a local server (required for ES modules to work)

## Database Schema

The dashboard expects the following tables and views in your Supabase database:

### Tables

1. `beban_biaya_master` - Master list for expense categories
2. `beban_biaya_transaksi` - Transaction logs for each expense category
3. `bpd_master` - Detailed travel cost records (BPD)
4. `profiles` - User profiles and roles (admin / user)

### Views

1. `vw_bpd_summary_by_auditor` - View summarizing top 3 auditor spending
2. `vw_ringkasan_beban_biaya` - View summarizing expense totals (awal & akhir)

## Running the Project

Since this project uses ES modules, you need to serve the files through a local server rather than opening [index.html](file:///c%3A/Users/ASUS/Documents/rincian%20biaya%20spi/index.html) directly in the browser.

You can use any local server. Here are a few options:

### Option 1: Using Python (if you have Python installed)
```bash
# For Python 3
python -m http.server 8000

# For Python 2
python -m SimpleHTTPServer 8000
```

### Option 2: Using Node.js (if you have Node.js installed)
```bash
# Install live-server globally (if not already installed)
npm install -g live-server

# Run live-server in the project directory
live-server
```

### Option 3: Using VS Code Live Server Extension
If you're using Visual Studio Code, you can install the "Live Server" extension and use it to serve the files.

After starting the server, open your browser and navigate to `http://localhost:8000` (or whatever port your server is using).

## Project Structure

```
dspi-dashboard/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── supabaseClient.js
│   ├── bpd.js
│   ├── bebanBiaya.js
│   └── utils.js
└── assets/
    └── logo.png
```

## Features

- **Auto-refresh:** Realtime updates via Supabase Realtime API
- **Export Data:** Export table data to Excel and PDF
- **Date Filter:** Filter transactions by date range
- **Auto Calculation:** Final amount auto-updates on data input
- **Pie Chart:** Show top 3 spenders (auditors) dynamically
- **Responsive UI:** Layout adapts cleanly to desktop/tablet screens

## User Roles

- **User:** View summary cards (Initial Amount, Final Amount). Click a sub-item to view details only.
- **Admin:** View summary cards and access input form to record new transactions (date, activity name, number of people, and cost). System automatically recalculates Final Amount = Initial Amount - Total Cost.

## Modules

1. **BPD (Biaya Perjalanan Dinas):**
   - Display summary data from `vw_bpd_summary_by_auditor`
   - Include a Pie Chart (Top 3 Auditors) by total accommodation cost
   - Show details per record

2. **Other Expense Categories:**
   - Display data from `vw_ringkasan_beban_biaya`
   - Show summary cards (Initial Amount, Final Amount)
   - For admin users: include a form with fields for new transactions

## Development Notes

- All JavaScript files are written as ES modules
- Tailwind CSS is loaded via CDN
- Chart.js is used for data visualization
- SheetJS and jsPDF are used for exporting data
- The dashboard is designed to be responsive and mobile-friendly