1. Remaining Budget Not Restored After Data Deletion

Description:
When a budget is added, the data is successfully reflected on the frontend. However, an issue occurs in the Remaining Budget calculation. If a record is deleted from the database (for example, due to incorrect data input), the Remaining Budget does not return to its previous value and is not refreshed correctly.

Expected Behavior:
If data is removed from the database, the Remaining Budget should increase accordingly based on the total cost stored in the Daftar Data BPD table. The budget state should always reflect the current sum of valid BPD records.

Actual Behavior:
After deleting data, the Remaining Budget remains unchanged, causing an inconsistency between the budget and the actual BPD records.

Impact:

Budget calculations become inaccurate

Users may assume budget is exhausted when it is not

Risk of incorrect financial reporting

Root Cause (Suspected):

Missing logic to handle budget rollback when BPD data is deleted

Remaining Budget is reduced on insert but not restored on delete

2. BPD 2025 and BPD 2026 Data Not Properly Separated

Description:
The display logic for the BPD 2025 and BPD 2026 menus is not correctly segmented by year. During testing, when new data is added for the year 2026, the charts, filters, and the Daftar Data BPD table in the BPD 2025 page also increase and reflect the new data.

Expected Behavior:

The BPD 2025 page should only display data related to the year 2025

The BPD 2026 page should only display data related to the year 2026

Charts, filters, and tables should be strictly filtered based on the selected year

Actual Behavior:

Data added for 2026 also appears in the BPD 2025 view

Filters and charts are not isolated by year

Impact:

Data mixing between years

Incorrect reporting and visualization

User confusion when reviewing annual BPD data

Root Cause (Suspected):

Missing or incorrect year-based filtering logic

periode_awal and periode_akhir are not properly evaluated against the selected year

✅ Summary

These issues indicate that:

Budget state management (Remaining Budget) lacks proper synchronization with data deletion events

Year-based filtering logic for BPD data is incomplete or incorrectly implemented

Both problems directly affect data accuracy, financial integrity, and user trust in the BPD system.