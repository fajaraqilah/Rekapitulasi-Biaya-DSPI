## 🧠 AI AGENT PROMPT — Refactor Frontend Budget Logic (Over Budget Allowed)

**Role**
You are a senior frontend engineer with strong Supabase and PostgreSQL trigger knowledge.

---

### 📌 Context

I have a working budget system in Supabase using **database triggers**.

Tables involved:

* `beban_biaya_master` → contains `jumlah_awal` and `jumlah_akhir`
* `beban_biaya_transaksi` → stores expense transactions
* Budget **is allowed to go negative** (over budget)
* Budget calculation and consistency are handled **ONLY by database triggers**

However, my **frontend JavaScript still blocks transactions** with an error like:

```
Insufficient budget! Required: Rp 60.000.000, Available: Rp 50.000.000
```

This validation happens **before inserting data**, so the database trigger never runs.

---

### 🎯 Objective

Refactor the frontend logic so that:

1. Transactions can be added **even when budget is insufficient**
2. Frontend **never blocks insert/update/delete** due to budget checks
3. Budget calculations (`jumlah_akhir`, remaining budget) are **NOT handled in frontend**
4. Frontend only:

   * Sends transaction data
   * Displays warnings (optional)
   * Refreshes data after insert/update/delete

---

### 🧩 Constraints

* Use **plain JavaScript** (no framework)
* Do **NOT** change database schema or triggers
* Do **NOT** calculate remaining budget in frontend
* Keep UI warnings allowed, but **no hard stop (`return`, `throw`)**

---

### 🛠️ What to Do

1. Identify and remove or refactor code patterns like:

   ```js
   if (biaya > remainingBudget) {
     alert("Insufficient budget");
     return;
   }
   ```

2. Replace them with **non-blocking warnings**, e.g.:

   ```js
   if (biaya > remainingBudget) {
     showToast("⚠️ Budget exceeded. Remaining budget will be negative.");
   }
   ```

3. Ensure transaction insert always runs:

   ```js
   await supabase.from('beban_biaya_transaksi').insert(...)
   ```

4. After insert/update/delete:

   * Re-fetch `beban_biaya_master`
   * Re-render UI (Remaining Budget, tables, charts)

---

### 📦 Expected Output

* Explanation of **why frontend validation breaks the system**
* Exact frontend code sections that must be removed or changed
* Clean, refactored JavaScript examples:

  * Add transaction
  * Edit transaction
  * Delete transaction
* Best practice summary:

  > “Frontend = UX, Backend = Rules”

---

### 🧠 Key Principle (Do Not Violate)

> **Database is the single source of truth for budget logic.
> Frontend must never enforce budget constraints.**

