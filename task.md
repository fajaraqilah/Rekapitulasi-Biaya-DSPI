# ✅ **Prompt Qoder: Add “Show Entries” Pagination to All Tables**

**Task: Add a “Show Entries” dropdown and pagination system to every data table (BPD table, Beban Biaya table, and any other tables).**

### **Requirements:**

1. **Add a “Show Entries” selector** above each table with options:

   * 10
   * 25
   * 50
   * 100
   * All

   Example UI:

   ```
   Show [ 10 ▼ ] entries
   ```

2. When the user changes the selected value:

   * The table must re-render showing **only that number of rows**.
   * If “All” is selected, show all table rows.

3. Implement **client-side pagination** (no need to fetch again from Supabase):

   * Keep the full dataset in memory.
   * Slice the data depending on the chosen entry count.

4. Add **Next / Previous** pagination buttons under the table:

   * “Prev” (disabled on first page)
   * Page number
   * “Next” (disabled on last page)

   Example:

   ```
   Showing 1–10 of 85 entries  
   [Prev]  1 2 3 4 5  [Next]
   ```

5. Ensure it works for **all tables** in the workspace:

   * BPD table (`transactions-table-container`)
   * Beban Biaya tables
   * Any modular table loaded through JS

6. The feature must be **fully responsive** (mobile-friendly).

   * On small screens, dropdown and pagination should stack vertically.

7. Do not break existing features:

   * Search bar
   * Export Excel / PDF
   * Add Data button
   * Sorting (if any)
   * Real-time updates from Supabase

8. Implement reusable code:

   * Create a helper function like:

     ```js
     function applyPagination(tableId, dataArray) { ... }
     ```
   * This function should:

     * Handle dropdown changes
     * Handle slicing
     * Handle pagination navigation
     * Re-render the table body cleanly

9. Insert the dropdown **above the table**, aligned to the left:

   * Search box stays right-aligned
   * Export buttons stay right-aligned
   * Use Flexbox with wrapping for responsiveness

10. Make the UI clean using Tailwind classes.

---

### **Example Implementation Style (Qoder may follow this structure):**

* Add this HTML snippet above each table:

```html
<div class="flex flex-wrap items-center justify-between mb-4 gap-4">
  <div class="flex items-center gap-2">
    <label class="text-sm">Show</label>
    <select id="entriesSelect" class="border rounded px-2 py-1">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="all">All</option>
    </select>
    <span class="text-sm">entries</span>
  </div>
</div>
```

* Below the table, Qoder should generate pagination controls:

```html
<div id="tablePagination" class="flex justify-between items-center mt-4"></div>
```

---

### **Deliverables Qoder Should Produce:**

✔ Update HTML structure for all tables
✔ Implement JS pagination logic
✔ Add dropdown selector
✔ Add next/prev buttons
✔ Add “Showing X of Y entries” text
✔ Ensure compatibility with existing sorting/search/export features
✔ Make it responsive with Tailwind
✔ Apply automatically to all data tables in the system

