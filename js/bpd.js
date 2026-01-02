import { supabase } from './supabaseClient.js';
import { formatCurrency, exportToExcel, exportToPDF } from './utils.js';
import { applyPagination, isAdmin } from './utils.js';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Function to apply year filter to a query
// A record overlaps with a year if: periode_awal <= year-12-31 AND periode_akhir >= year-01-01
function applyYearFilter(query, year) {
    if (!year) return query;
    return query
        .lte('periode_awal', `${year}-12-31`)  // periode_awal <= year-12-31
        .gte('periode_akhir', `${year}-01-01`); // periode_akhir >= year-01-01
}

// Function to open budget management modal for BPD
export function openBPDBudgetModal(categoryName, subKategori) {
    // Create modal DOM for BPD budget management
    const modal = document.createElement('div');
    modal.id = 'budgetModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-full max-w-md';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-4';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = 'Set BPD Budget';
    
    const closeButton = document.createElement('button');
    closeButton.id = 'closeBudgetModal';
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-6 h-6');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    
    svg.appendChild(path);
    closeButton.appendChild(svg);
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(closeButton);
    
    const form = document.createElement('form');
    form.id = 'bpdBudgetForm';
    
    const yearDiv = document.createElement('div');
    yearDiv.className = 'mb-4';
    
    const yearLabel = document.createElement('label');
    yearLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    yearLabel.textContent = 'Year';
    
    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.id = 'bpdBudgetYear';
    yearInput.className = 'form-control w-full';
    yearInput.value = new Date().getFullYear();
    yearInput.min = '2000';
    yearInput.max = '2100';
    yearInput.required = true;
    
    yearDiv.appendChild(yearLabel);
    yearDiv.appendChild(yearInput);
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'mb-4';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    categoryLabel.textContent = 'Category';
    
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.id = 'bpdBudgetCategory';
    categoryInput.className = 'form-control w-full';
    categoryInput.value = 'BPD';
    categoryInput.readOnly = true;
    
    categoryDiv.appendChild(categoryLabel);
    categoryDiv.appendChild(categoryInput);
    
    const budgetDiv = document.createElement('div');
    budgetDiv.className = 'mb-4';
    
    const budgetLabel = document.createElement('label');
    budgetLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    budgetLabel.textContent = 'Budget Amount';
    
    const budgetInput = document.createElement('input');
    budgetInput.type = 'number';
    budgetInput.id = 'bpdBudgetAmount';
    budgetInput.className = 'form-control w-full';
    budgetInput.step = '0.01';
    budgetInput.placeholder = 'Enter budget amount';
    budgetInput.min = '0';
    budgetInput.required = true;
    
    budgetDiv.appendChild(budgetLabel);
    budgetDiv.appendChild(budgetInput);
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex justify-end space-x-3';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'cancelBudgetBtn';
    cancelBtn.className = 'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50';
    cancelBtn.textContent = 'Cancel';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
    submitBtn.textContent = 'Save Budget';
    
    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(submitBtn);
    
    form.appendChild(yearDiv);
    form.appendChild(categoryDiv);
    form.appendChild(budgetDiv);
    form.appendChild(buttonDiv);
    
    modalContent.appendChild(headerDiv);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
    document.getElementById('cancelBudgetBtn').addEventListener('click', closeBudgetModal);
    document.getElementById('bpdBudgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBPDBudget();
    });
}

// Function to close budget modal
function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.remove();
    }
}

// Function to open BPD edit modal
export function openBPDEditModal(record, container, year = null) {
    // Create modal DOM for BPD edit
    const modal = document.createElement('div');
    modal.id = 'editBPDModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-4';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = 'Edit BPD - ' + (record.nama_audit || 'Unknown');
    
    const closeButton = document.createElement('button');
    closeButton.id = 'closeEditBPDModal';
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-6 h-6');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    
    svg.appendChild(path);
    closeButton.appendChild(svg);
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(closeButton);
    
    const form = document.createElement('form');
    form.id = 'editBPDForm';
    
    const formGrid = document.createElement('div');
    formGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    
    // Create form fields with current values
    const fields = [
        { label: 'Nama Audit', id: 'editNamaAudit', type: 'text', value: record.nama_audit, required: true },
        { label: 'Nama Pemesan', id: 'editNamaPemesan', type: 'text', value: record.nama_pemesan, required: true },
        { label: 'Jenis Audit', id: 'editJenisAudit', type: 'text', value: record.jenis_audit, required: true },
        { label: 'Nomor SPD', id: 'editNoSpd', type: 'text', value: record.no_spd, required: true },
        { label: 'Nomor BPD', id: 'editNoBpd', type: 'text', value: record.no_bpd, required: true },
        { label: 'Periode Awal', id: 'editPeriodeAwal', type: 'date', value: record.periode_awal, required: true },
        { label: 'Periode Akhir', id: 'editPeriodeAkhir', type: 'date', value: record.periode_akhir, required: true },
        { label: 'Lama Audit (hari)', id: 'editLamaAudit', type: 'number', value: record.lama_audit, min: '1', required: true },
        { label: 'Biaya Berangkat', id: 'editBiayaBerangkat', type: 'number', value: record.biaya_berangkat, min: '0', step: '0.01', required: true },
        { label: 'Biaya Penginapan', id: 'editBiayaPenginapan', type: 'number', value: record.biaya_penginapan, min: '0', step: '0.01', required: true },
        { label: 'Biaya Pulang', id: 'editBiayaPulang', type: 'number', value: record.biaya_pulang, min: '0', step: '0.01', required: true },
        { label: 'Total Akomodasi', id: 'editTotalAkomodasi', type: 'number', value: record.total_akomodasi, min: '0', step: '0.01', readonly: true },
        { label: 'Rincian Biaya Dinas', id: 'editRincianBiayaDinas', type: 'number', value: record.rincian_biaya_dinas, min: '0', step: '0.01', required: true },
        { label: 'Total Akomodasi + Biaya Dinas', id: 'editTotalAkomodasiBiayaDinas', type: 'number', value: record.total_akomodasi_biaya_dinas, min: '0', step: '0.01', readonly: true },
        { label: 'Realisasi', id: 'editRealisasi', type: 'number', value: record.realisasi, min: '0', step: '0.01', required: true }
    ];
    
    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        
        const fieldLabel = document.createElement('label');
        fieldLabel.className = 'form-label';
        fieldLabel.textContent = field.label;
        
        const fieldInput = document.createElement('input');
        fieldInput.type = field.type;
        fieldInput.id = field.id;
        fieldInput.className = 'form-control';
        fieldInput.value = field.value || '';
        if (field.required) fieldInput.required = true;
        if (field.min) fieldInput.min = field.min;
        if (field.step) fieldInput.step = field.step;
        if (field.readonly) fieldInput.readOnly = true;
        
        fieldDiv.appendChild(fieldLabel);
        fieldDiv.appendChild(fieldInput);
        
        if (field.id === 'editLamaAudit') {
            const periodError = document.createElement('div');
            periodError.id = 'editPeriodeError';
            periodError.className = 'text-red-500 text-sm mt-1 hidden';
            periodError.textContent = 'Periode akhir harus setelah atau sama dengan periode awal';
            fieldDiv.appendChild(periodError);
        }
        
        formGrid.appendChild(fieldDiv);
    });
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex justify-end space-x-3 mt-4';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'cancelEditBPD';
    cancelBtn.className = 'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50';
    cancelBtn.textContent = 'Cancel';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
    submitBtn.textContent = 'Update';
    
    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(submitBtn);
    
    form.appendChild(formGrid);
    form.appendChild(buttonDiv);
    
    modalContent.appendChild(headerDiv);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeEditBPDModal').addEventListener('click', closeEditBPDModal);
    document.getElementById('cancelEditBPD').addEventListener('click', closeEditBPDModal);
    
    // Add form submission handler
    document.getElementById('editBPDForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleEditSubmit(record.id, record.total_akomodasi_biaya_dinas, container, year);
    });
    
    // Add auto-calculation for total fields
    setupEditFormCalculations();
    
    // Add form validation
    setupEditFormValidation();
    
    // Initial calculation
    calculateEditTotals();
}

// Function to close edit BPD modal
function closeEditBPDModal() {
    const modal = document.getElementById('editBPDModal');
    if (modal) {
        modal.remove();
    }
}

// Function to save BPD budget
async function saveBPDBudget() {
    const yearElement = document.getElementById('bpdBudgetYear');
    const amountElement = document.getElementById('bpdBudgetAmount');
    
    if (!yearElement || !amountElement) {
        alert('Budget form elements not found. Please try again.');
        return;
    }
    
    const year = parseInt(yearElement.value);
    const amount = parseFloat(amountElement.value);
    
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
        alert('Please enter a valid year (2000-2100)');
        return;
    }
    
    if (!amount || isNaN(amount) || amount < 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    try {
        // Check if a budget record already exists for this year
        const { data: existingBudget, error: fetchError } = await supabase
            .from('bpd_budget_master')
            .select('id, budget_awal, budget_sisa')
            .eq('tahun', year)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error fetching existing budget record:', fetchError);
            throw fetchError;
        }
        
        let result;
        if (existingBudget) {
            // Update existing budget record
            const amountDifference = amount - existingBudget.budget_awal;
            const newBudgetSisa = existingBudget.budget_sisa + amountDifference;
            
            result = await supabase
                .from('bpd_budget_master')
                .update({
                    budget_awal: amount,
                    budget_sisa: newBudgetSisa,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingBudget.id);
            
            if (result.error) throw result.error;
            
            // Add a budget adjustment transaction
            await supabase
                .from('bpd_budget_transactions')
                .insert([{
                    bpd_budget_id: existingBudget.id,
                    transaction_type: 'adjustment',
                    amount: amountDifference,
                    description: `Budget adjustment from ${formatCurrency(existingBudget.budget_awal)} to ${formatCurrency(amount)}`
                }]);
        } else {
            // Create new budget record
            result = await supabase
                .from('bpd_budget_master')
                .insert([{
                    tahun: year,
                    kategori: 'BPD',
                    budget_awal: amount,
                    budget_sisa: amount,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
        }
        
        if (result.error) throw result.error;
        
        alert('BPD Budget saved successfully!');
        closeBudgetModal();
        
        // Reload BPD content to reflect changes
        const container = document.querySelector('.bpd-container')?.closest('[id]') || document.querySelector('#app');
        if (container) {
            // Check if we're in a year-specific view
            const yearParam = new URLSearchParams(window.location.search).get('year');
            if (yearParam) {
                await loadBPDContentByYear(container, parseInt(yearParam));
            } else {
                await loadBPDContent(container);
            }
        }
        
    } catch (error) {
        console.error('Error saving BPD budget:', error);
        alert('Error saving BPD budget: ' + error.message);
    }
}

let currentBPDData = [];
let currentChartData = [];
let refreshInterval;
let realtimeSubscription;

// Function to show toast notifications
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded shadow-lg text-white font-medium transform transition duration-300 ease-in-out toast toast-${type}`;
    toast.textContent = message;
    
    if (type === 'success') {
        toast.classList.add('bg-green-500');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
    } else {
        toast.classList.add('bg-blue-500');
    }
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Function to fetch BPD data
// Fetches all BPD data for chart, summary cards, and table
async function fetchBpdData(year = null) {
    try {
        // Fetch all BPD data for the pie chart
        let query = supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(100);
        
        // Apply year filter if provided
        if (year) {
            query = applyYearFilter(query, year);
        }
        
        const { data: allBPDData, error: allBpdError } = await query;
        
        if (allBpdError) throw allBpdError;
        
        // Aggregate data by nama_audit for the pie chart
        const aggregatedData = {};
        allBPDData.forEach(record => {
            const auditName = record.nama_audit || 'Unknown';
            const cost = parseFloat(record.total_akomodasi_biaya_dinas) || 0;
            if (aggregatedData[auditName]) {
                aggregatedData[auditName] += cost;
            } else {
                aggregatedData[auditName] = cost;
            }
        });
        
        // Convert to array format for chart
        const chartData = Object.keys(aggregatedData).map(auditName => ({
            nama_audit: auditName,
            total_biaya: aggregatedData[auditName]
        }));
        
        // Fetch top 3 highest BPD costs
        let top3Query = supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(3);
        
        // Apply year filter if provided
        if (year) {
            top3Query = applyYearFilter(top3Query, year);
        }
        
        const { data: top3, error: top3Error } = await top3Query;
        
        if (top3Error) throw top3Error;
        
        // Fetch bottom 3 lowest BPD costs
        let bottom3Query = supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: true })
            .limit(3);
        
        // Apply year filter if provided
        if (year) {
            bottom3Query = applyYearFilter(bottom3Query, year);
        }
        
        const { data: bottom3, error: bottom3Error } = await bottom3Query;
        
        if (bottom3Error) throw bottom3Error;
        
        // Fetch detailed BPD records
        let bpdDataQuery = supabase
            .from('bpd_master')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply year filter if provided
        if (year) {
            bpdDataQuery = applyYearFilter(bpdDataQuery, year);
        }
        
        const { data: bpdData, error: bpdError } = await bpdDataQuery;
        
        if (bpdError) throw bpdError;
        
        // Fetch budget information
        let budgetQuery = supabase
            .from('bpd_budget_master')
            .select('*')
            .order('tahun', { ascending: false });
        
        // Apply year filter if provided
        if (year) {
            budgetQuery = budgetQuery.eq('tahun', year);
        }
        
        const { data: budgetData, error: budgetError } = await budgetQuery;
        
        if (budgetError) {
            console.error('Error fetching budget data:', budgetError);
            // Continue without budget data if there's an error
        }
        
        return {
            chartData,
            top3,
            bottom3,
            bpdData,
            budgetData: budgetData || []
        };
    } catch (error) {
        console.error('Error fetching BPD data:', error);
        throw error;
    }
}

// Function to load BPD content
export async function loadBPDContent(container, year = null) {
    try {
        // Check if user is admin
        const admin = await isAdmin(supabase);
        // Clear any existing refresh interval
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        
        // Unsubscribe from any existing realtime subscription
        if (realtimeSubscription) {
            await supabase.removeChannel(realtimeSubscription);
        }
        
        // Fetch initial data
        const { chartData, top3, bottom3, bpdData, budgetData } = await fetchBpdData(year);
        
        // Store references to current data
        currentBPDData = bpdData;
        currentChartData = chartData;
        
        // Calculate budget summary based on budgetData
        let totalBudget = 0;
        let totalSpent = 0;
        let remainingBudget = 0;
        
        if (budgetData && budgetData.length > 0) {
            // Calculate total budget from all budget records
            budgetData.forEach(budget => {
                totalBudget += parseFloat(budget.budget_awal) || 0;
                remainingBudget += parseFloat(budget.budget_sisa) || 0;
            });
            
            // Calculate total spent from bpd records
            bpdData.forEach(record => {
                totalSpent += parseFloat(record.total_akomodasi_biaya_dinas) || 0;
            });
        }
        
        // Render the UI
        container.innerHTML = `
            <div class="bpd-container">
                <div class="bpd-header flex flex-wrap items-center justify-between">
                    <h2 class="bpd-title">BPD (Biaya Perjalanan Dinas)${year ? ' ' + year : ''}</h2>
                    ${admin ? '<button id="setBPDBudgetBtn" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Set Budget</button>' : ''}
                </div>
                
                <!-- Budget Summary Cards -->
                <div class="grid grid-cols-4 md:grid-cols-4 gap-4 mb-4">
                    <div class="summary-card">
                        <h3 class="summary-card-header">Total Budget${year ? ' ' + year : ''}</h3>
                        <p class="summary-card-value positive">${formatCurrency(totalBudget)}</p>
                    </div>
                    <div class="summary-card">
                        <h3 class="summary-card-header">Total Spent${year ? ' ' + year : ''}</h3>
                        <p class="summary-card-value negative">${formatCurrency(totalSpent)}</p>
                    </div>
                    <div class="summary-card">
                        <h3 class="summary-card-header">Remaining Budget${year ? ' ' + year : ''}</h3>
                        <p class="summary-card-value neutral">${formatCurrency(remainingBudget)}</p>
                    </div>
                    <div class="summary-card">
                        <h3 class="summary-card-header">Budget Utilization</h3>
                        <p class="summary-card-value neutral">${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) + '%' : '0%'}</p>
                    </div>
                </div>
                
                <!-- Chart Section -->
                <div class="chart-container">
                    <h3 class="chart-header">Total Biaya per Audit${year ? ' - ' + year : ''}</h3>
                    <div class="chart-wrapper">
                        <canvas id="bpdChart"></canvas>
                    </div>
                </div>
                    <div class="grid grid-cols-2 md:grid-cols-2 gap-2 mb-5">

                    <!-- TOP 3 -->
                    <div class="summary-card">
                        <h3 class="summary-card-header mb-4">Top 3 Highest BPD${year ? ' ' + year : ''} 🔺</h3>

                        <div class="space-y-4">
                            ${top3.map((record, index) => `
                            <div class="bg-gradient-to-r from-red-50 to-red-100 shadow rounded-lg p-4 border border-red-200">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-semibold text-gray-800">${record.nama_audit || 'Unknown'}</h4>
                                    <span class="text-sm text-gray-600">#${index + 1}</span>
                                </div>
                                <p class="text-xl font-bold text-red-600 mt-2">
                                    ${formatCurrency(record.total_akomodasi_biaya_dinas || 0)}
                                </p>
                            </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- BOTTOM 3 -->
                    <div class="summary-card">
                        <h3 class="summary-card-header mb-4">Bottom 3 Lowest BPD${year ? ' ' + year : ''} 🔻</h3>

                        <div class="space-y-4">
                            ${bottom3.map((record, index) => `
                            <div class="bg-gradient-to-r from-green-50 to-green-100 shadow rounded-lg p-4 border border-green-200">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-semibold text-gray-800">${record.nama_audit || 'Unknown'}</h4>
                                    <span class="text-sm text-gray-600">#${index + 1}</span>
                                </div>
                                <p class="text-xl font-bold text-green-600 mt-2">
                                    ${formatCurrency(record.total_akomodasi_biaya_dinas || 0)}
                                </p>
                            </div>
                            `).join('')}
                        </div>
                    </div>

                </div>
                
                <!-- BPD Records Table with Add Data Button -->
                <div class="transactions-table-container" id="bpdTableContainer">
                    <div class="transactions-table-header flex flex-wrap items-center justify-between gap-4">
                        <h3 class="transactions-table-title">Daftar Data BPD${year ? ' ' + year : ''}</h3>
                        <div class="flex flex-wrap items-center gap-2">
                            <input type="text" id="searchInput" class="form-control border rounded px-2 py-1" placeholder="Cari data..." style="width: 300px;">
                            <button id="exportExcelTable" class="export-button excel">Excel</button>
                            <button id="exportPDFTable" class="export-button pdf">PDF</button>
                            ${admin ? '<button id="addDataBtn" class="add-transaction-button">+ Tambah Data</button>' : ''}
                        </div>
                    </div>
                    <!-- Add Data Form (hidden by default) -->
                    ${admin ? `
                    <div id="addDataFormContainer" class="hidden mt-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 class="text-lg font-bold mb-4">Tambah Data BPD${year ? ' ' + year : ''}</h4>
                        <form id="addDataForm" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">Nama Audit</label>
                                    <input type="text" id="namaAudit" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Nama Pemesan</label>
                                    <input type="text" id="namaPemesan" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Jenis Audit</label>
                                    <input type="text" id="jenisAudit" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Nomor SPD</label>
                                    <input type="text" id="noSpd" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Nomor BPD</label>
                                    <input type="text" id="noBpd" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Periode Awal</label>
                                    <input type="date" id="periodeAwal" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Periode Akhir</label>
                                    <input type="date" id="periodeAkhir" class="form-control" required>
                                </div>
                                <div>
                                    <label class="form-label">Lama Audit (hari)</label>
                                    <input type="number" id="lamaAudit" class="form-control" min="1" required>
                                    <div id="periodeError" class="text-red-500 text-sm mt-1 hidden">Periode akhir harus setelah atau sama dengan periode awal</div>
                                </div>
                                <div>
                                    <label class="form-label">Biaya Berangkat</label>
                                    <input type="number" id="biayaBerangkat" class="form-control" min="0" step="0.01" required>
                                </div>
                                <div>
                                    <label class="form-label">Biaya Penginapan</label>
                                    <input type="number" id="biayaPenginapan" class="form-control" min="0" step="0.01" required>
                                </div>
                                <div>
                                    <label class="form-label">Biaya Pulang</label>
                                    <input type="number" id="biayaPulang" class="form-control" min="0" step="0.01" required>
                                </div>
                                <div>
                                    <label class="form-label">Total Akomodasi</label>
                                    <input type="number" id="totalAkomodasi" class="form-control" min="0" step="0.01" readonly>
                                </div>
                                <div>
                                    <label class="form-label">Rincian Biaya Dinas</label>
                                    <input type="number" id="rincianBiayaDinas" class="form-control" min="0" step="0.01" required>
                                </div>
                                <div>
                                    <label class="form-label">Total Akomodasi + Biaya Dinas</label>
                                    <input type="number" id="totalAkomodasiBiayaDinas" class="form-control" min="0" step="0.01" readonly>
                                </div>
                                <div>
                                    <label class="form-label">Realisasi</label>
                                    <input type="number" id="realisasi" class="form-control" min="0" step="0.01" required>
                                </div>
                            </div>
                            <div class="flex justify-end space-x-2 pt-4">
                                <button type="button" id="cancelAddDataBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Simpan</button>
                            </div>
                        </form>
                    </div>
                    ` : ''}
                    <div class="table-container">
                        <table class="transactions-table">
                            <thead>
                                <tr>
                                    <th>Nama Audit</th>
                                    <th>Nama Pemesan</th>
                                    <th>Jenis Audit</th>
                                    <th>No SPD</th>
                                    <th>No BPD</th>
                                    <th>Periode</th>
                                    <th>Lama Audit</th>
                                    <th>Total Biaya</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="bpdTableBody">
                                <!-- Table rows will be populated by pagination -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
        `;
        
        // Initialize chart after a short delay to ensure DOM is fully rendered
        setTimeout(() => {
            initBPDChart(chartData);
        }, 100);
        
        // Apply pagination to the table
        const pagination = applyPagination('bpdTableContainer', bpdData, (record) => {
            // This filter function will be used for search functionality
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            if (!searchTerm) return true;
            
            return (
                (record.nama_audit && record.nama_audit.toLowerCase().includes(searchTerm)) ||
                (record.nama_pemesan && record.nama_pemesan.toLowerCase().includes(searchTerm)) ||
                (record.jenis_audit && record.jenis_audit.toLowerCase().includes(searchTerm)) ||
                (record.no_spd && record.no_spd.toLowerCase().includes(searchTerm)) ||
                (record.no_bpd && record.no_bpd.toLowerCase().includes(searchTerm))
            );
        });
        
        // Function to render table rows
        function renderTableRows(data) {
            const tableBody = document.getElementById('bpdTableBody');
            if (!tableBody) return;
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No data available</td></tr>';
                return;
            }
            
            // Clear existing content
            tableBody.innerHTML = '';
            
            // Create table rows using DOM API
            data.forEach(record => {
                const row = document.createElement('tr');
                
                const namaAuditCell = document.createElement('td');
                namaAuditCell.textContent = record.nama_audit || '-';
                
                const namaPemesanCell = document.createElement('td');
                namaPemesanCell.textContent = record.nama_pemesan || '-';
                
                const jenisAuditCell = document.createElement('td');
                jenisAuditCell.textContent = record.jenis_audit || '-';
                
                const noSpdCell = document.createElement('td');
                noSpdCell.textContent = record.no_spd || '-';
                
                const noBpdCell = document.createElement('td');
                noBpdCell.textContent = record.no_bpd || '-';
                
                const periodeCell = document.createElement('td');
                periodeCell.textContent = (record.periode_awal || '-') + ' S.d ' + (record.periode_akhir || '-');
                
                const lamaAuditCell = document.createElement('td');
                lamaAuditCell.textContent = (record.lama_audit || '-') + ' Hari';
                
                const totalBiayaCell = document.createElement('td');
                totalBiayaCell.textContent = formatCurrency(record.total_akomodasi_biaya_dinas || 0);
                
                // Create actions cell for admin users
                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell';

                // Check if user is admin to show edit button (delete is temporarily disabled per task requirements)
                isAdmin(supabase).then(isAdmin => {
                    if (isAdmin) {
                        // Edit button
                        const editButton = document.createElement('button');
                        editButton.className = 'edit-btn text-blue-500 hover:text-blue-700 cursor-pointer mr-2';
                        editButton.innerHTML = '✏️'; // Edit icon
                        editButton.title = 'Edit';
                        editButton.onclick = () => openBPDEditModal(record, container, year);
                        actionsCell.appendChild(editButton);
                        
                        // Delete button (temporarily disabled per task requirements)
                        // const deleteButton = document.createElement('button');
                        // deleteButton.className = 'delete-btn text-red-500 hover:text-red-700 cursor-pointer';
                        // deleteButton.innerHTML = '🗑️'; // Trash icon
                        // deleteButton.title = 'Delete';
                        // deleteButton.onclick = () => handleDeleteRecord(record.id, container, year);
                        // actionsCell.appendChild(deleteButton);
                    }
                });

                row.appendChild(namaAuditCell);
                row.appendChild(namaPemesanCell);
                row.appendChild(jenisAuditCell);
                row.appendChild(noSpdCell);
                row.appendChild(noBpdCell);
                row.appendChild(periodeCell);
                row.appendChild(lamaAuditCell);
                row.appendChild(totalBiayaCell);
                row.appendChild(actionsCell); // Add actions cell

                tableBody.appendChild(row);
            });
        }

        // Set the render callback for pagination
        pagination.setRenderCallback(renderTableRows);

        // Initial table render
        pagination.render();
        
        // Add event listeners for table export buttons
        document.getElementById('exportExcelTable').addEventListener('click', () => {
            // Filter data to include only required columns (nama_audit to realisasi)
            const filteredData = bpdData.map(record => ({
                'Nama Audit': record.nama_audit,
                'Nama Pemesan': record.nama_pemesan,
                'Jenis Audit': record.jenis_audit,
                'No SPD': record.no_spd,
                'No BPD': record.no_bpd,
                'Periode Awal': record.periode_awal,
                'Periode Akhir': record.periode_akhir,
                'Lama Audit': record.lama_audit,
                'Biaya Berangkat': record.biaya_berangkat,
                'Biaya Penginapan': record.biaya_penginapan,
                'Biaya Pulang': record.biaya_pulang,
                'Total Akomodasi': record.total_akomodasi,
                'Rincian Biaya Dinas': record.rincian_biaya_dinas,
                'Total Akomodasi + Biaya Dinas': record.total_akomodasi_biaya_dinas,
                'Realisasi': record.realisasi
            }));
            exportToExcel(filteredData, `BPD_Records${year ? '_' + year : ''}`);
        });
        
        document.getElementById('exportPDFTable').addEventListener('click', () => {
            // Filter data to include only required columns (nama_audit to realisasi)
            const filteredData = bpdData.map(record => ({
                'Nama Audit': record.nama_audit,
                'Nama Pemesan': record.nama_pemesan,
                'Jenis Audit': record.jenis_audit,
                'No SPD': record.no_spd,
                'No BPD': record.no_bpd,
                'Periode Awal': record.periode_awal,
                'Periode Akhir': record.periode_akhir,
                'Lama Audit': record.lama_audit,
                'Biaya Berangkat': record.biaya_berangkat,
                'Biaya Penginapan': record.biaya_penginapan,
                'Biaya Pulang': record.biaya_pulang,
                'Total Akomodasi': record.total_akomodasi,
                'Rincian Biaya Dinas': record.rincian_biaya_dinas,
                'Total Akomodasi + Biaya Dinas': record.total_akomodasi_biaya_dinas,
                'Realisasi': record.realisasi
            }));
            exportToPDF(filteredData, `BPD Records${year ? ' ' + year : ''}`);
        });
        
        // Add search functionality
        const searchInputEl = document.getElementById('searchInput');
        if (searchInputEl) {
            searchInputEl.addEventListener('input', (e) => {
                // Re-render pagination with new search term
                pagination.render();
            });
        }
        
        // Add event listeners for budget button (only for admin users)
        if (admin) {
            const setBPDBudgetBtn = document.getElementById('setBPDBudgetBtn');
            if (setBPDBudgetBtn) {
                setBPDBudgetBtn.addEventListener('click', () => {
                    openBPDBudgetModal('BPD', year || 'All');
                });
            }
            
            // Add event listeners for inline form (only for admin users)
            const addDataBtn = document.getElementById('addDataBtn');
            if (addDataBtn) {
                addDataBtn.addEventListener('click', () => {
                    document.getElementById('addDataFormContainer').classList.remove('hidden');
                });
            }
            
            const cancelAddDataBtn = document.getElementById('cancelAddDataBtn');
            if (cancelAddDataBtn) {
                cancelAddDataBtn.addEventListener('click', () => {
                    document.getElementById('addDataFormContainer').classList.add('hidden');
                    // Reset form
                    document.getElementById('addDataForm').reset();
                });
            }
            
            const addDataForm = document.getElementById('addDataForm');
            if (addDataForm) {
                // Add form submission handler
                addDataForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleFormSubmit(container, year);
                    // Refresh the data after form submission
                    if (year) {
                        await loadBPDContentByYear(container, year);
                    } else {
                        await loadBPDContent(container, year);
                    }
                });
                
                // Add auto-calculation for total fields
                setupFormCalculations();
                
                // Add form validation
                setupFormValidation();
            }
        }
    } catch (error) {
        console.error('Error loading BPD content:', error);
        // Create error display elements
        const errorContainer = document.createElement('div');
        errorContainer.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative';
        errorContainer.setAttribute('role', 'alert');
        
        const errorStrong = document.createElement('strong');
        errorStrong.className = 'font-bold';
        errorStrong.textContent = 'Error! ';
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'block sm:inline';
        errorSpan.textContent = 'Failed to load BPD data: ' + error.message;
        
        errorContainer.appendChild(errorStrong);
        errorContainer.appendChild(errorSpan);
        
        container.innerHTML = '';
        container.appendChild(errorContainer);
    }
}

// Function to fetch BPD data filtered by year
async function fetchBpdDataByYear(year) {
    try {
        // Fetch BPD data for the specific year
        // Filter records where the year falls within the trip period
        const query = applyYearFilter(supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(100), year);
        
        const { data: allBPDData, error: allBpdError } = await query;
        
        if (allBpdError) throw allBpdError;
        
        // Aggregate data by nama_audit for the pie chart
        const aggregatedData = {};
        allBPDData.forEach(record => {
            const auditName = record.nama_audit || 'Unknown';
            const cost = parseFloat(record.total_akomodasi_biaya_dinas) || 0;
            if (aggregatedData[auditName]) {
                aggregatedData[auditName] += cost;
            } else {
                aggregatedData[auditName] = cost;
            }
        });
        
        // Convert to array format for chart
        const chartData = Object.keys(aggregatedData).map(auditName => ({
            nama_audit: auditName,
            total_biaya: aggregatedData[auditName]
        }));
        
        // Fetch top 3 highest BPD costs for the year
        const top3Query = applyYearFilter(supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(3), year);
        
        const { data: top3, error: top3Error } = await top3Query;
        
        if (top3Error) throw top3Error;
        
        // Fetch bottom 3 lowest BPD costs for the year
        const bottom3Query = applyYearFilter(supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas, periode_awal, periode_akhir')
            .order('total_akomodasi_biaya_dinas', { ascending: true })
            .limit(3), year);
        
        const { data: bottom3, error: bottom3Error } = await bottom3Query;
        
        if (bottom3Error) throw bottom3Error;
        
        // Fetch detailed BPD records for the year
        const bpdDataQuery = applyYearFilter(supabase
            .from('bpd_master')
            .select('*')
            .order('created_at', { ascending: false }), year);
        
        const { data: bpdData, error: bpdError } = await bpdDataQuery;
        
        if (bpdError) throw bpdError;
        
        // Fetch budget information for the specific year
        const { data: budgetData, error: budgetError } = await supabase
            .from('bpd_budget_master')
            .select('*')
            .eq('tahun', year);
        
        if (budgetError) {
            console.error('Error fetching budget data:', budgetError);
            // Continue without budget data if there's an error
        }
        
        return {
            chartData,
            top3,
            bottom3,
            bpdData,
            budgetData: budgetData || []
        };
    } catch (error) {
        console.error('Error fetching BPD data by year:', error);
        throw error;
    }
}

// Function to load BPD content filtered by year
export async function loadBPDContentByYear(container, year) {
    try {
        // Check if user is admin
        const admin = await isAdmin(supabase);
        // Clear any existing refresh interval
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        
        // Unsubscribe from any existing realtime subscription
        if (realtimeSubscription) {
            await supabase.removeChannel(realtimeSubscription);
        }
        
        // Fetch initial data filtered by year
        const { chartData, top3, bottom3, bpdData, budgetData } = await fetchBpdDataByYear(year);
        
        // Store references to current data
        currentBPDData = bpdData;
        currentChartData = chartData;
        
        // Calculate budget summary based on budgetData
        let totalBudget = 0;
        let totalSpent = 0;
        let remainingBudget = 0;
        
        if (budgetData && budgetData.length > 0) {
            // Calculate total budget from all budget records
            budgetData.forEach(budget => {
                totalBudget += parseFloat(budget.budget_awal) || 0;
                remainingBudget += parseFloat(budget.budget_sisa) || 0;
            });
            
            // Calculate total spent from bpd records for the specific year
            bpdData.forEach(record => {
                totalSpent += parseFloat(record.total_akomodasi_biaya_dinas) || 0;
            });
        }
        
        // Create the UI elements
        const bpdContainer = document.createElement('div');
        bpdContainer.className = 'bpd-container';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'bpd-header flex flex-wrap items-center justify-between';
        
        const title = document.createElement('h2');
        title.className = 'bpd-title';
        title.textContent = 'BPD (Biaya Perjalanan Dinas) ' + year;
        
        headerDiv.appendChild(title);
        
        if (admin) {
            const budgetBtn = document.createElement('button');
            budgetBtn.id = 'setBPDBudgetBtn';
            budgetBtn.className = 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600';
            budgetBtn.textContent = 'Set Budget';
            headerDiv.appendChild(budgetBtn);
        }
        
        bpdContainer.appendChild(headerDiv);
        
        // Budget Summary Cards
        const summaryGrid = document.createElement('div');
        summaryGrid.className = 'grid grid-cols-4 md:grid-cols-4 gap-4 mb-4';
        
        const totalBudgetCard = document.createElement('div');
        totalBudgetCard.className = 'summary-card';
        
        const totalBudgetHeader = document.createElement('h3');
        totalBudgetHeader.className = 'summary-card-header';
        totalBudgetHeader.textContent = 'Total Budget ' + year;
        
        const totalBudgetValue = document.createElement('p');
        totalBudgetValue.className = 'summary-card-value positive';
        totalBudgetValue.textContent = formatCurrency(totalBudget);
        
        totalBudgetCard.appendChild(totalBudgetHeader);
        totalBudgetCard.appendChild(totalBudgetValue);
        summaryGrid.appendChild(totalBudgetCard);
        
        const totalSpentCard = document.createElement('div');
        totalSpentCard.className = 'summary-card';
        
        const totalSpentHeader = document.createElement('h3');
        totalSpentHeader.className = 'summary-card-header';
        totalSpentHeader.textContent = 'Total Spent ' + year;
        
        const totalSpentValue = document.createElement('p');
        totalSpentValue.className = 'summary-card-value negative';
        totalSpentValue.textContent = formatCurrency(totalSpent);
        
        totalSpentCard.appendChild(totalSpentHeader);
        totalSpentCard.appendChild(totalSpentValue);
        summaryGrid.appendChild(totalSpentCard);
        
        const remainingBudgetCard = document.createElement('div');
        remainingBudgetCard.className = 'summary-card';
        
        const remainingBudgetHeader = document.createElement('h3');
        remainingBudgetHeader.className = 'summary-card-header';
        remainingBudgetHeader.textContent = 'Remaining Budget ' + year;
        
        const remainingBudgetValue = document.createElement('p');
        remainingBudgetValue.className = 'summary-card-value neutral';
        remainingBudgetValue.textContent = formatCurrency(remainingBudget);
        
        remainingBudgetCard.appendChild(remainingBudgetHeader);
        remainingBudgetCard.appendChild(remainingBudgetValue);
        summaryGrid.appendChild(remainingBudgetCard);
        
        const utilizationCard = document.createElement('div');
        utilizationCard.className = 'summary-card';
        
        const utilizationHeader = document.createElement('h3');
        utilizationHeader.className = 'summary-card-header';
        utilizationHeader.textContent = 'Budget Utilization';
        
        const utilizationValue = document.createElement('p');
        utilizationValue.className = 'summary-card-value neutral';
        utilizationValue.textContent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) + '%' : '0%';
        
        utilizationCard.appendChild(utilizationHeader);
        utilizationCard.appendChild(utilizationValue);
        summaryGrid.appendChild(utilizationCard);
        
        bpdContainer.appendChild(summaryGrid);
        
        // Chart Section
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartHeader = document.createElement('h3');
        chartHeader.className = 'chart-header';
        chartHeader.textContent = 'Total Biaya per Audit - ' + year;
        
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'bpdChart';
        
        chartWrapper.appendChild(canvas);
        chartContainer.appendChild(chartHeader);
        chartContainer.appendChild(chartWrapper);
        bpdContainer.appendChild(chartContainer);
        
        const topBottomGrid = document.createElement('div');
        topBottomGrid.className = 'grid grid-cols-2 md:grid-cols-2 gap-2 mb-5';
        
        // TOP 3 Section
        const top3Card = document.createElement('div');
        top3Card.className = 'summary-card';
        
        const top3Header = document.createElement('h3');
        top3Header.className = 'summary-card-header mb-4';
        top3Header.textContent = 'Top 3 Highest BPD ' + year + ' \u{1F53A}';
        
        const top3Content = document.createElement('div');
        top3Content.className = 'space-y-4';
        
        top3.forEach((record, index) => {
            const top3Item = document.createElement('div');
            top3Item.className = 'bg-gradient-to-r from-red-50 to-red-100 shadow rounded-lg p-4 border border-red-200';
            
            const top3ItemHeader = document.createElement('div');
            top3ItemHeader.className = 'flex justify-between items-center';
            
            const top3ItemTitle = document.createElement('h4');
            top3ItemTitle.className = 'font-semibold text-gray-800';
            top3ItemTitle.textContent = record.nama_audit || 'Unknown';
            
            const top3ItemNumber = document.createElement('span');
            top3ItemNumber.className = 'text-sm text-gray-600';
            top3ItemNumber.textContent = '#' + (index + 1);
            
            top3ItemHeader.appendChild(top3ItemTitle);
            top3ItemHeader.appendChild(top3ItemNumber);
            
            const top3ItemValue = document.createElement('p');
            top3ItemValue.className = 'text-xl font-bold text-red-600 mt-2';
            top3ItemValue.textContent = formatCurrency(record.total_akomodasi_biaya_dinas || 0);
            
            top3Item.appendChild(top3ItemHeader);
            top3Item.appendChild(top3ItemValue);
            top3Content.appendChild(top3Item);
        });
        
        top3Card.appendChild(top3Header);
        top3Card.appendChild(top3Content);
        topBottomGrid.appendChild(top3Card);
        
        // BOTTOM 3 Section
        const bottom3Card = document.createElement('div');
        bottom3Card.className = 'summary-card';
        
        const bottom3Header = document.createElement('h3');
        bottom3Header.className = 'summary-card-header mb-4';
        bottom3Header.textContent = 'Bottom 3 Lowest BPD ' + year + ' \u{1F53B}';
        
        const bottom3Content = document.createElement('div');
        bottom3Content.className = 'space-y-4';
        
        bottom3.forEach((record, index) => {
            const bottom3Item = document.createElement('div');
            bottom3Item.className = 'bg-gradient-to-r from-green-50 to-green-100 shadow rounded-lg p-4 border border-green-200';
            
            const bottom3ItemHeader = document.createElement('div');
            bottom3ItemHeader.className = 'flex justify-between items-center';
            
            const bottom3ItemTitle = document.createElement('h4');
            bottom3ItemTitle.className = 'font-semibold text-gray-800';
            bottom3ItemTitle.textContent = record.nama_audit || 'Unknown';
            
            const bottom3ItemNumber = document.createElement('span');
            bottom3ItemNumber.className = 'text-sm text-gray-600';
            bottom3ItemNumber.textContent = '#' + (index + 1);
            
            bottom3ItemHeader.appendChild(bottom3ItemTitle);
            bottom3ItemHeader.appendChild(bottom3ItemNumber);
            
            const bottom3ItemValue = document.createElement('p');
            bottom3ItemValue.className = 'text-xl font-bold text-green-600 mt-2';
            bottom3ItemValue.textContent = formatCurrency(record.total_akomodasi_biaya_dinas || 0);
            
            bottom3Item.appendChild(bottom3ItemHeader);
            bottom3Item.appendChild(bottom3ItemValue);
            bottom3Content.appendChild(bottom3Item);
        });
        
        bottom3Card.appendChild(bottom3Header);
        bottom3Card.appendChild(bottom3Content);
        topBottomGrid.appendChild(bottom3Card);
        
        bpdContainer.appendChild(topBottomGrid);
        
        // BPD Records Table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'transactions-table-container';
        tableContainer.id = 'bpdTableContainer';
        
        const tableHeader = document.createElement('div');
        tableHeader.className = 'transactions-table-header flex flex-wrap items-center justify-between gap-4';
        
        const tableTitle = document.createElement('h3');
        tableTitle.className = 'transactions-table-title';
        tableTitle.textContent = 'Daftar Data BPD ' + year;
        
        const tableControls = document.createElement('div');
        tableControls.className = 'flex flex-wrap items-center gap-2';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'searchInput';
        searchInput.className = 'form-control border rounded px-2 py-1';
        searchInput.placeholder = 'Cari data...';
        searchInput.style.width = '300px';
        
        const exportExcelBtn = document.createElement('button');
        exportExcelBtn.id = 'exportExcelTable';
        exportExcelBtn.className = 'export-button excel';
        exportExcelBtn.textContent = 'Excel';
        
        const exportPDFBtn = document.createElement('button');
        exportPDFBtn.id = 'exportPDFTable';
        exportPDFBtn.className = 'export-button pdf';
        exportPDFBtn.textContent = 'PDF';
        
        tableControls.appendChild(searchInput);
        tableControls.appendChild(exportExcelBtn);
        tableControls.appendChild(exportPDFBtn);
        
        if (admin) {
            const addDataBtn = document.createElement('button');
            addDataBtn.id = 'addDataBtn';
            addDataBtn.className = 'add-transaction-button';
            addDataBtn.textContent = '+ Tambah Data';
            tableControls.appendChild(addDataBtn);
        }
        
        tableHeader.appendChild(tableTitle);
        tableHeader.appendChild(tableControls);
        
        tableContainer.appendChild(tableHeader);
        
        // Add Data Form (if admin)
        if (admin) {
            const addFormContainer = document.createElement('div');
            addFormContainer.id = 'addDataFormContainer';
            addFormContainer.className = 'hidden mt-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50';
            
            const addFormTitle = document.createElement('h4');
            addFormTitle.className = 'text-lg font-bold mb-4';
            addFormTitle.textContent = 'Tambah Data BPD ' + year;
            
            const addForm = document.createElement('form');
            addForm.id = 'addDataForm';
            addForm.className = 'space-y-4';
            
            const formGrid = document.createElement('div');
            formGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
            
            // Create form fields
            const fields = [
                { label: 'Nama Audit', id: 'namaAudit', type: 'text', required: true },
                { label: 'Nama Pemesan', id: 'namaPemesan', type: 'text', required: true },
                { label: 'Jenis Audit', id: 'jenisAudit', type: 'text', required: true },
                { label: 'Nomor SPD', id: 'noSpd', type: 'text', required: true },
                { label: 'Nomor BPD', id: 'noBpd', type: 'text', required: true },
                { label: 'Periode Awal', id: 'periodeAwal', type: 'date', required: true },
                { label: 'Periode Akhir', id: 'periodeAkhir', type: 'date', required: true },
                { label: 'Lama Audit (hari)', id: 'lamaAudit', type: 'number', min: '1', required: true },
                { label: 'Biaya Berangkat', id: 'biayaBerangkat', type: 'number', min: '0', step: '0.01', required: true },
                { label: 'Biaya Penginapan', id: 'biayaPenginapan', type: 'number', min: '0', step: '0.01', required: true },
                { label: 'Biaya Pulang', id: 'biayaPulang', type: 'number', min: '0', step: '0.01', required: true },
                { label: 'Total Akomodasi', id: 'totalAkomodasi', type: 'number', min: '0', step: '0.01', readonly: true },
                { label: 'Rincian Biaya Dinas', id: 'rincianBiayaDinas', type: 'number', min: '0', step: '0.01', required: true },
                { label: 'Total Akomodasi + Biaya Dinas', id: 'totalAkomodasiBiayaDinas', type: 'number', min: '0', step: '0.01', readonly: true },
                { label: 'Realisasi', id: 'realisasi', type: 'number', min: '0', step: '0.01', required: true }
            ];
            
            fields.forEach(field => {
                const fieldDiv = document.createElement('div');
                
                const fieldLabel = document.createElement('label');
                fieldLabel.className = 'form-label';
                fieldLabel.textContent = field.label;
                
                const fieldInput = document.createElement('input');
                fieldInput.type = field.type;
                fieldInput.id = field.id;
                fieldInput.className = 'form-control';
                if (field.required) fieldInput.required = true;
                if (field.min) fieldInput.min = field.min;
                if (field.step) fieldInput.step = field.step;
                if (field.readonly) fieldInput.readOnly = true;
                
                fieldDiv.appendChild(fieldLabel);
                fieldDiv.appendChild(fieldInput);
                
                if (field.id === 'lamaAudit') {
                    const periodError = document.createElement('div');
                    periodError.id = 'periodeError';
                    periodError.className = 'text-red-500 text-sm mt-1 hidden';
                    periodError.textContent = 'Periode akhir harus setelah atau sama dengan periode awal';
                    fieldDiv.appendChild(periodError);
                }
                
                formGrid.appendChild(fieldDiv);
            });
            
            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'flex justify-end space-x-2 pt-4';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelAddDataBtn';
            cancelBtn.className = 'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50';
            cancelBtn.textContent = 'Cancel';
            
            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600';
            submitBtn.textContent = 'Simpan';
            
            buttonDiv.appendChild(cancelBtn);
            buttonDiv.appendChild(submitBtn);
            
            addForm.appendChild(formGrid);
            addForm.appendChild(buttonDiv);
            
            addFormContainer.appendChild(addFormTitle);
            addFormContainer.appendChild(addForm);
            
            tableContainer.appendChild(addFormContainer);
        }
        
        // Table
        const table = document.createElement('div');
        table.className = 'table-container';
        
        const tableElement = document.createElement('table');
        tableElement.className = 'transactions-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Nama Audit', 'Nama Pemesan', 'Jenis Audit', 'No SPD', 'No BPD', 'Periode', 'Lama Audit', 'Total Biaya', 'Actions'];
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        tableElement.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        tbody.id = 'bpdTableBody';
        
        // Add comment for table rows
        const comment = document.createComment('Table rows will be populated by pagination');
        tbody.appendChild(comment);
        
        tableElement.appendChild(tbody);
        table.appendChild(tableElement);
        tableContainer.appendChild(table);
        
        bpdContainer.appendChild(tableContainer);
        
        container.innerHTML = '';
        container.appendChild(bpdContainer);
        
        // Initialize chart after a short delay to ensure DOM is fully rendered
        setTimeout(() => {
            initBPDChart(chartData);
        }, 100);
        
        // Apply pagination to the table
        const pagination = applyPagination('bpdTableContainer', bpdData, (record) => {
            // This filter function will be used for search functionality
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            if (!searchTerm) return true;
            
            return (
                (record.nama_audit && record.nama_audit.toLowerCase().includes(searchTerm)) ||
                (record.nama_pemesan && record.nama_pemesan.toLowerCase().includes(searchTerm)) ||
                (record.jenis_audit && record.jenis_audit.toLowerCase().includes(searchTerm)) ||
                (record.no_spd && record.no_spd.toLowerCase().includes(searchTerm)) ||
                (record.no_bpd && record.no_bpd.toLowerCase().includes(searchTerm))
            );
        });
        
        // Function to render table rows
        function renderTableRows(data) {
            const tableBody = document.getElementById('bpdTableBody');
            if (!tableBody) return;
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No data available</td></tr>';
                return;
            }
            
            // Clear existing content
            tableBody.innerHTML = '';
            
            // Create table rows using DOM API
            data.forEach(record => {
                const row = document.createElement('tr');
                
                const namaAuditCell = document.createElement('td');
                namaAuditCell.textContent = record.nama_audit || '-';
                
                const namaPemesanCell = document.createElement('td');
                namaPemesanCell.textContent = record.nama_pemesan || '-';
                
                const jenisAuditCell = document.createElement('td');
                jenisAuditCell.textContent = record.jenis_audit || '-';
                
                const noSpdCell = document.createElement('td');
                noSpdCell.textContent = record.no_spd || '-';
                
                const noBpdCell = document.createElement('td');
                noBpdCell.textContent = record.no_bpd || '-';
                
                const periodeCell = document.createElement('td');
                periodeCell.textContent = (record.periode_awal || '-') + ' S.d ' + (record.periode_akhir || '-');
                
                const lamaAuditCell = document.createElement('td');
                lamaAuditCell.textContent = (record.lama_audit || '-') + ' Hari';
                
                const totalBiayaCell = document.createElement('td');
                totalBiayaCell.textContent = formatCurrency(record.total_akomodasi_biaya_dinas || 0);
                
                // Create actions cell for admin users
                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell';

                // Check if user is admin to show edit button (delete is temporarily disabled per task requirements)
                isAdmin(supabase).then(isAdmin => {
                    if (isAdmin) {
                        // Edit button
                        const editButton = document.createElement('button');
                        editButton.className = 'edit-btn text-blue-500 hover:text-blue-700 cursor-pointer mr-2';
                        editButton.innerHTML = '✏️'; // Edit icon
                        editButton.title = 'Edit';
                        editButton.onclick = () => openBPDEditModal(record, container, year);
                        actionsCell.appendChild(editButton);
                        
                        // Delete button (temporarily disabled per task requirements)
                        // const deleteButton = document.createElement('button');
                        // deleteButton.className = 'delete-btn text-red-500 hover:text-red-700 cursor-pointer';
                        // deleteButton.innerHTML = '🗑️'; // Trash icon
                        // deleteButton.title = 'Delete';
                        // deleteButton.onclick = () => handleDeleteRecord(record.id, container, year);
                        // actionsCell.appendChild(deleteButton);
                    }
                });

                row.appendChild(namaAuditCell);
                row.appendChild(namaPemesanCell);
                row.appendChild(jenisAuditCell);
                row.appendChild(noSpdCell);
                row.appendChild(noBpdCell);
                row.appendChild(periodeCell);
                row.appendChild(lamaAuditCell);
                row.appendChild(totalBiayaCell);
                row.appendChild(actionsCell); // Add actions cell

                tableBody.appendChild(row);
            });
        }

        // Set the render callback for pagination
        pagination.setRenderCallback(renderTableRows);

        // Initial table render
        pagination.render();
        
        // Add event listeners for table export buttons
        document.getElementById('exportExcelTable').addEventListener('click', () => {
            // Filter data to include only required columns (nama_audit to realisasi)
            const filteredData = bpdData.map(record => ({
                'Nama Audit': record.nama_audit,
                'Nama Pemesan': record.nama_pemesan,
                'Jenis Audit': record.jenis_audit,
                'No SPD': record.no_spd,
                'No BPD': record.no_bpd,
                'Periode Awal': record.periode_awal,
                'Periode Akhir': record.periode_akhir,
                'Lama Audit': record.lama_audit,
                'Biaya Berangkat': record.biaya_berangkat,
                'Biaya Penginapan': record.biaya_penginapan,
                'Biaya Pulang': record.biaya_pulang,
                'Total Akomodasi': record.total_akomodasi,
                'Rincian Biaya Dinas': record.rincian_biaya_dinas,
                'Total Akomodasi + Biaya Dinas': record.total_akomodasi_biaya_dinas,
                'Realisasi': record.realisasi
            }));
            exportToExcel(filteredData, 'BPD_Records_' + year);
        });
        
        document.getElementById('exportPDFTable').addEventListener('click', () => {
            // Filter data to include only required columns (nama_audit to realisasi)
            const filteredData = bpdData.map(record => ({
                'Nama Audit': record.nama_audit,
                'Nama Pemesan': record.nama_pemesan,
                'Jenis Audit': record.jenis_audit,
                'No SPD': record.no_spd,
                'No BPD': record.no_bpd,
                'Periode Awal': record.periode_awal,
                'Periode Akhir': record.periode_akhir,
                'Lama Audit': record.lama_audit,
                'Biaya Berangkat': record.biaya_berangkat,
                'Biaya Penginapan': record.biaya_penginapan,
                'Biaya Pulang': record.biaya_pulang,
                'Total Akomodasi': record.total_akomodasi,
                'Rincian Biaya Dinas': record.rincian_biaya_dinas,
                'Total Akomodasi + Biaya Dinas': record.total_akomodasi_biaya_dinas,
                'Realisasi': record.realisasi
            }));
            exportToPDF(filteredData, 'BPD Records ' + year);
        });
        
        // Add search functionality
        const searchInputEl = document.getElementById('searchInput');
        if (searchInputEl) {
            searchInputEl.addEventListener('input', (e) => {
                // Re-render pagination with new search term
                pagination.render();
            });
        }
        
        // Add event listeners for budget button (only for admin users)
        if (admin) {
            const setBPDBudgetBtn = document.getElementById('setBPDBudgetBtn');
            if (setBPDBudgetBtn) {
                setBPDBudgetBtn.addEventListener('click', () => {
                    openBPDBudgetModal('BPD', year);
                });
            }
            
            // Add event listeners for inline form (only for admin users)
            const addDataBtn = document.getElementById('addDataBtn');
            if (addDataBtn) {
                addDataBtn.addEventListener('click', () => {
                    document.getElementById('addDataFormContainer').classList.remove('hidden');
                });
            }
            
            const cancelAddDataBtn = document.getElementById('cancelAddDataBtn');
            if (cancelAddDataBtn) {
                cancelAddDataBtn.addEventListener('click', () => {
                    document.getElementById('addDataFormContainer').classList.add('hidden');
                    // Reset form
                    document.getElementById('addDataForm').reset();
                });
            }
            
            const addDataForm = document.getElementById('addDataForm');
            if (addDataForm) {
                // Add form submission handler
                addDataForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleFormSubmit(container);
                    // Refresh the data after form submission
                    await loadBPDContentByYear(container, year);
                });
                
                // Add auto-calculation for total fields
                setupFormCalculations();
                
                // Add form validation
                setupFormValidation();
            }
        }
    } catch (error) {
        console.error('Error loading BPD content:', error);
        
        // Create error display elements
        const errorContainer = document.createElement('div');
        errorContainer.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative';
        errorContainer.setAttribute('role', 'alert');
        
        const errorStrong = document.createElement('strong');
        errorStrong.className = 'font-bold';
        errorStrong.textContent = 'Error! ';
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'block sm:inline';
        errorSpan.textContent = 'Failed to load BPD data: ' + error.message;
        
        errorContainer.appendChild(errorStrong);
        errorContainer.appendChild(errorSpan);
        
        container.innerHTML = '';
        container.appendChild(errorContainer);
    }
}

// Function to initialize BPD chart
// Builds and updates the pie chart with numeric values directly on slices
function initBPDChart(chartData) {
    const canvas = document.getElementById('bpdChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Extract data for chart
    const labels = chartData.map(item => item.nama_audit);
    const data = chartData.map(item => item.total_biaya);
    
    // Check if we have valid data
    if (data.length === 0 || data.every(value => value === 0)) {
        console.warn('No valid data for chart');
        // Display a message in the chart area
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No data available for chart</p>';
        }
        return;
    }
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // Create new chart
    canvas.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',    // Blue
                    'rgba(16, 185, 129, 0.8)',     // Green
                    'rgba(245, 101, 101, 0.8)',    // Red
                    'rgba(139, 92, 246, 0.8)',     // Purple
                    'rgba(251, 191, 36, 0.8)',     // Yellow
                    'rgba(236, 72, 153, 0.8)',     // Pink
                    'rgba(6, 182, 212, 0.8)',      // Cyan
                    'rgba(161, 98, 7, 0.8)',       // Amber
                    'rgba(220, 38, 38, 0.8)',      // Red 600
                    'rgba(21, 128, 61, 0.8)'       // Green 700
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 101, 101, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(6, 182, 212, 1)',
                    'rgba(161, 98, 7, 1)',
                    'rgba(220, 38, 38, 1)',
                    'rgba(21, 128, 61, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: function(context) {
                            var width = context.chart.width;
                            var size = Math.round(width / 30); // Adjust this ratio as needed
                            // Ensure minimum and maximum font sizes
                            size = Math.max(size, 12);
                            size = Math.min(size, 18);
                            return {
                                size: size,
                                weight: 'bold'
                            };
                        }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return label + ': ' + formatCurrency(value);
                        }
                    }
                },
                // edit untuk jumlah irisan tiap chart
                datalabels: {
                    formatter: (value, ctx) => {
                        const dataArr = ctx.chart.data.datasets[0].data;
                        const total = dataArr.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1); //-- edit formula disini.
                        return percentage > 5
                            ? '(' + percentage + '%)'
                            : '';
                    },
                    color: '#fff',
                    font: function(context) {
                        var width = context.chart.width;
                        var size = Math.round(width / 24); // Adjust this ratio as needed
                        // Ensure minimum and maximum font sizes
                        size = Math.max(size, 12);
                        size = Math.min(size, 20);
                        return {
                            weight: 'bold',
                            size: size
                        };
                    },
                    anchor: 'center',
                    align: 'center'
                }
            },
            layout: {
                padding: 10
            }
        },
        plugins: [ChartDataLabels]
    });
    
    // Add resize event listener to update chart
    window.addEventListener('resize', function() {
        if (canvas.chart) {
            canvas.chart.resize();
        }
    });
}


// Function to set up form calculations
function setupFormCalculations() {
    // Get form elements
    const biayaBerangkat = document.getElementById('biayaBerangkat');
    const biayaPenginapan = document.getElementById('biayaPenginapan');
    const biayaPulang = document.getElementById('biayaPulang');
    const totalAkomodasi = document.getElementById('totalAkomodasi');
    const rincianBiayaDinas = document.getElementById('rincianBiayaDinas');
    const totalAkomodasiBiayaDinas = document.getElementById('totalAkomodasiBiayaDinas');
    
    // Function to calculate totals
    function calculateTotals() {
        const bb = parseFloat(biayaBerangkat.value) || 0;
        const bp = parseFloat(biayaPenginapan.value) || 0;
        const bpg = parseFloat(biayaPulang.value) || 0;
        const rbd = parseFloat(rincianBiayaDinas.value) || 0;
        
        const ta = bb + bp + bpg;
        const tabd = ta + rbd;
        
        totalAkomodasi.value = ta.toFixed(2);
        totalAkomodasiBiayaDinas.value = tabd.toFixed(2);
    }
    
    // Add event listeners to input fields
    [biayaBerangkat, biayaPenginapan, biayaPulang, rincianBiayaDinas].forEach(input => {
        input.addEventListener('input', calculateTotals);
    });
    
    // Initial calculation
    calculateTotals();
}

// Function to set up form validation
function setupFormValidation() {
    const periodeAwal = document.getElementById('periodeAwal');
    const periodeAkhir = document.getElementById('periodeAkhir');
    const periodeError = document.getElementById('periodeError');
    const lamaAudit = document.getElementById('lamaAudit');
    
    // Validate periode dates
    function validatePeriode() {
        const startDate = new Date(periodeAwal.value);
        const endDate = new Date(periodeAkhir.value);
        
        if (periodeAwal.value && periodeAkhir.value) {
            if (endDate < startDate) {
                periodeError.classList.remove('hidden');
                return false;
            } else {
                periodeError.classList.add('hidden');
                return true;
            }
        }
        return true;
    }
    
    // Calculate lama audit based on dates
    function calculateLamaAudit() {
        if (periodeAwal.value && periodeAkhir.value) {
            const startDate = new Date(periodeAwal.value);
            const endDate = new Date(periodeAkhir.value);
            
            // Calculate difference in days
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
            
            lamaAudit.value = diffDays;
        }
    }
    
    // Add event listeners
    periodeAwal.addEventListener('change', () => {
        validatePeriode();
        calculateLamaAudit();
    });
    
    periodeAkhir.addEventListener('change', () => {
        validatePeriode();
        calculateLamaAudit();
    });
}

// Function to set up edit form calculations
function setupEditFormCalculations() {
    // Get edit form elements
    const biayaBerangkat = document.getElementById('editBiayaBerangkat');
    const biayaPenginapan = document.getElementById('editBiayaPenginapan');
    const biayaPulang = document.getElementById('editBiayaPulang');
    const totalAkomodasi = document.getElementById('editTotalAkomodasi');
    const rincianBiayaDinas = document.getElementById('editRincianBiayaDinas');
    const totalAkomodasiBiayaDinas = document.getElementById('editTotalAkomodasiBiayaDinas');
    
    // Function to calculate totals
    function calculateEditTotals() {
        const bb = parseFloat(biayaBerangkat.value) || 0;
        const bp = parseFloat(biayaPenginapan.value) || 0;
        const bpg = parseFloat(biayaPulang.value) || 0;
        const rbd = parseFloat(rincianBiayaDinas.value) || 0;
        
        const ta = bb + bp + bpg;
        const tabd = ta + rbd;
        
        totalAkomodasi.value = ta.toFixed(2);
        totalAkomodasiBiayaDinas.value = tabd.toFixed(2);
    }
    
    // Add event listeners to input fields
    [biayaBerangkat, biayaPenginapan, biayaPulang, rincianBiayaDinas].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateEditTotals);
        }
    });
}

// Function to calculate totals for edit form
function calculateEditTotals() {
    // Get edit form elements
    const biayaBerangkat = document.getElementById('editBiayaBerangkat');
    const biayaPenginapan = document.getElementById('editBiayaPenginapan');
    const biayaPulang = document.getElementById('editBiayaPulang');
    const totalAkomodasi = document.getElementById('editTotalAkomodasi');
    const rincianBiayaDinas = document.getElementById('editRincianBiayaDinas');
    const totalAkomodasiBiayaDinas = document.getElementById('editTotalAkomodasiBiayaDinas');
    
    if (biayaBerangkat && biayaPenginapan && biayaPulang && totalAkomodasi && rincianBiayaDinas && totalAkomodasiBiayaDinas) {
        const bb = parseFloat(biayaBerangkat.value) || 0;
        const bp = parseFloat(biayaPenginapan.value) || 0;
        const bpg = parseFloat(biayaPulang.value) || 0;
        const rbd = parseFloat(rincianBiayaDinas.value) || 0;
        
        const ta = bb + bp + bpg;
        const tabd = ta + rbd;
        
        totalAkomodasi.value = ta.toFixed(2);
        totalAkomodasiBiayaDinas.value = tabd.toFixed(2);
    }
}

// Function to set up edit form validation
function setupEditFormValidation() {
    const periodeAwal = document.getElementById('editPeriodeAwal');
    const periodeAkhir = document.getElementById('editPeriodeAkhir');
    const periodeError = document.getElementById('editPeriodeError');
    const lamaAudit = document.getElementById('editLamaAudit');
    
    // Validate periode dates
    function validateEditPeriode() {
        if (periodeAwal && periodeAkhir && periodeError && lamaAudit) {
            const startDate = new Date(periodeAwal.value);
            const endDate = new Date(periodeAkhir.value);
            
            if (periodeAwal.value && periodeAkhir.value) {
                if (endDate < startDate) {
                    periodeError.classList.remove('hidden');
                    return false;
                } else {
                    periodeError.classList.add('hidden');
                    return true;
                }
            }
            return true;
        }
        return true;
    }
    
    // Calculate lama audit based on dates
    function calculateEditLamaAudit() {
        if (periodeAwal && periodeAkhir && lamaAudit) {
            if (periodeAwal.value && periodeAkhir.value) {
                const startDate = new Date(periodeAwal.value);
                const endDate = new Date(periodeAkhir.value);
                
                // Calculate difference in days
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
                
                lamaAudit.value = diffDays;
            }
        }
    }
    
    // Add event listeners
    if (periodeAwal && periodeAkhir) {
        periodeAwal.addEventListener('change', () => {
            validateEditPeriode();
            calculateEditLamaAudit();
        });
        
        periodeAkhir.addEventListener('change', () => {
            validateEditPeriode();
            calculateEditLamaAudit();
        });
    }
}

// Function to handle edit submission
// Handles BPD record updates with delta calculation and budget adjustment
async function handleEditSubmit(recordId, oldTotal, container, year = null) {
    try {
        // Validate form
        const periodeAwal = document.getElementById('editPeriodeAwal');
        const periodeAkhir = document.getElementById('editPeriodeAkhir');
        const periodeError = document.getElementById('editPeriodeError');

        const startDate = new Date(periodeAwal.value);
        const endDate = new Date(periodeAkhir.value);

        if (endDate < startDate) {
            periodeError.classList.remove('hidden');
            showToast('Periode akhir harus setelah atau sama dengan periode awal', 'error');
            return;
        }

        // Get form values
        const noSpdValue = document.getElementById('editNoSpd').value;
        const formData = {
            nama_audit: document.getElementById('editNamaAudit').value,
            nama_pemesan: document.getElementById('editNamaPemesan').value,
            jenis_audit: document.getElementById('editJenisAudit').value,
            no_spd: noSpdValue,
            no_bpd: document.getElementById('editNoBpd').value,
            periode_awal: document.getElementById('editPeriodeAwal').value,
            periode_akhir: document.getElementById('editPeriodeAkhir').value,
            lama_audit: parseInt(document.getElementById('editLamaAudit').value),
            biaya_berangkat: parseFloat(document.getElementById('editBiayaBerangkat').value),
            biaya_penginapan: parseFloat(document.getElementById('editBiayaPenginapan').value),
            biaya_pulang: parseFloat(document.getElementById('editBiayaPulang').value),
            total_akomodasi: parseFloat(document.getElementById('editTotalAkomodasi').value),
            rincian_biaya_dinas: parseFloat(document.getElementById('editRincianBiayaDinas').value),
            total_akomodasi_biaya_dinas: parseFloat(document.getElementById('editTotalAkomodasiBiayaDinas').value),
            realisasi: parseFloat(document.getElementById('editRealisasi').value)
        };
        
        // Validate that no negative values are submitted
        const negativeFields = Object.keys(formData).filter(key => {
            const value = formData[key];
            return (typeof value === 'number' && value < 0);
        });
        
        if (negativeFields.length > 0) {
            showToast('Nilai tidak boleh negatif', 'error');
            return;
        }
        
        // Check if no_spd already exists for other records
        const { data: existingData, error: checkError } = await supabase
            .from('bpd_master')
            .select('no_spd')
            .eq('no_spd', noSpdValue)
            .neq('id', recordId) // Exclude current record
            .limit(1);
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw checkError;
        }
        
        if (existingData && existingData.length > 0) {
            showToast('Error: Nomor SPD sudah ada dalam sistem. Silakan gunakan nomor yang berbeda.', 'error');
            return;
        }
        
        // Calculate the delta for budget adjustment
        const newTotal = parseFloat(formData.total_akomodasi_biaya_dinas);
        const delta = newTotal - oldTotal;
        
        // Update the record in Supabase
        const { error } = await supabase
            .from('bpd_master')
            .update(formData)
            .eq('id', recordId);
        
        if (error) throw error;
        
        // Update budget based on the delta if budget exists for the trip year
        if (delta !== 0) {
            const tripYear = new Date(formData.periode_awal).getFullYear();
            
            // Check if there's a budget for this year
            const { data: budgetData, error: budgetError } = await supabase
                .from('bpd_budget_master')
                .select('id, budget_awal, budget_sisa')
                .eq('tahun', tripYear)
                .single();
            
            if (!budgetError && budgetData) {
                // Update the budget with the delta
                // If delta > 0 (increased cost), reduce budget_sisa
                // If delta < 0 (decreased cost), increase budget_sisa
                const newRemainingBudget = budgetData.budget_sisa - delta;
                
                const updateResult = await supabase
                    .from('bpd_budget_master')
                    .update({
                        budget_sisa: newRemainingBudget,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', budgetData.id);
                
                if (updateResult.error) {
                    console.error('Error updating budget:', updateResult.error);
                } else {
                    // Add a budget transaction record for the adjustment
                    await supabase
                        .from('bpd_budget_transactions')
                        .insert([{
                            bpd_budget_id: budgetData.id,
                            transaction_type: 'adjustment',
                            amount: Math.abs(delta),
                            description: `Adjustment due to BPD cost edit for ${formData.nama_audit} (ID: ${recordId}). Delta: ${delta > 0 ? 'increased' : 'decreased'} by ${formatCurrency(Math.abs(delta))}`
                        }]);
                }
            }
        }
        
        // Show success message
        showToast('Data BPD berhasil diperbarui!', 'success');
        
        // Close the modal
        closeEditBPDModal();
        
        // Reload data
        if (year) {
            await loadBPDContentByYear(container, year);
        } else {
            await loadBPDContent(container, year);
        }
    } catch (error) {
        console.error('Error updating BPD data:', error);
        
        // Handle specific constraint violation error for duplicate no_spd
        if (error.message && error.message.includes('bpd_master_no_spd_key')) {
            showToast('Error: Nomor SPD sudah ada dalam sistem. Silakan gunakan nomor yang berbeda.', 'error');
        } else {
            showToast('Error updating BPD data: ' + error.message, 'error');
        }
    }
}

// Function to handle form submission
// Handles new data submission with validation and toast notifications
async function handleFormSubmit(container, year = null) {
    try {
        // Validate form
        const periodeAwal = document.getElementById('periodeAwal');
        const periodeAkhir = document.getElementById('periodeAkhir');
        const periodeError = document.getElementById('periodeError');

        const startDate = new Date(periodeAwal.value);
        const endDate = new Date(periodeAkhir.value);

        if (endDate < startDate) {
            periodeError.classList.remove('hidden');
            showToast('Periode akhir harus setelah atau sama dengan periode awal', 'error');
            return;
        }

        // Get form values
        const noSpdValue = document.getElementById('noSpd').value;
        const formData = {
            nama_audit: document.getElementById('namaAudit').value,
            nama_pemesan: document.getElementById('namaPemesan').value,
            jenis_audit: document.getElementById('jenisAudit').value,
            no_spd: noSpdValue,
            no_bpd: document.getElementById('noBpd').value,
            periode_awal: document.getElementById('periodeAwal').value,
            periode_akhir: document.getElementById('periodeAkhir').value,
            lama_audit: parseInt(document.getElementById('lamaAudit').value),
            biaya_berangkat: parseFloat(document.getElementById('biayaBerangkat').value),
            biaya_penginapan: parseFloat(document.getElementById('biayaPenginapan').value),
            biaya_pulang: parseFloat(document.getElementById('biayaPulang').value),
            total_akomodasi: parseFloat(document.getElementById('totalAkomodasi').value),
            rincian_biaya_dinas: parseFloat(document.getElementById('rincianBiayaDinas').value),
            total_akomodasi_biaya_dinas: parseFloat(document.getElementById('totalAkomodasiBiayaDinas').value),
            realisasi: parseFloat(document.getElementById('realisasi').value)
        };
        
        // Validate that no negative values are submitted
        const negativeFields = Object.keys(formData).filter(key => {
            const value = formData[key];
            return (typeof value === 'number' && value < 0);
        });
        
        if (negativeFields.length > 0) {
            showToast('Nilai tidak boleh negatif', 'error');
            return;
        }
        
        // Check if no_spd already exists
        const { data: existingData, error: checkError } = await supabase
            .from('bpd_master')
            .select('no_spd')
            .eq('no_spd', noSpdValue)
            .limit(1);
        
        if (checkError) {
            throw checkError;
        }
        
        if (existingData && existingData.length > 0) {
            showToast('Error: Nomor SPD sudah ada dalam sistem. Silakan gunakan nomor yang berbeda.', 'error');
            return;
        }
        
        // Insert data into Supabase
        const { error } = await supabase
            .from('bpd_master')
            .insert([formData]);
        
        // If successful insertion, update budget if budget exists for the year
        if (!error) {
            const tripYear = new Date(formData.periode_awal).getFullYear();
            const tripCost = parseFloat(formData.total_akomodasi_biaya_dinas);
            
            // Check if there's a budget for this year
            const { data: budgetData, error: budgetError } = await supabase
                .from('bpd_budget_master')
                .select('id, budget_awal, budget_sisa')
                .eq('tahun', tripYear)
                .single();
            
            if (!budgetError && budgetData) {
                // Update the budget with the new expense
                const newRemainingBudget = budgetData.budget_sisa - tripCost;
                
                const updateResult = await supabase
                    .from('bpd_budget_master')
                    .update({
                        budget_sisa: newRemainingBudget,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', budgetData.id);
                
                if (updateResult.error) {
                    console.error('Error updating budget:', updateResult.error);
                } else {
                    // Add a budget transaction record
                    await supabase
                        .from('bpd_budget_transactions')
                        .insert([{
                            bpd_budget_id: budgetData.id,
                            transaction_type: 'expense',
                            amount: tripCost,
                            description: 'Expense for trip: ' + formData.nama_audit + ' (' + formData.no_bpd + ')'
                        }]);
                }
            }
        }
        
        if (error) throw error;
        
        // Show success message
        showToast('Data BPD berhasil ditambahkan!', 'success');
        
        // Hide form
        document.getElementById('addDataFormContainer').classList.add('hidden');
        
        // Reset form
        document.getElementById('addDataForm').reset();
        
        // Reload data
        if (year) {
            await loadBPDContentByYear(container, year);
        } else {
            await loadBPDContent(container, year);
        }
    } catch (error) {
        console.error('Error adding BPD data:', error);

        // Handle specific constraint violation error for duplicate no_spd
        if (error.message && error.message.includes('bpd_master_no_spd_key')) {
            showToast('Error: Nomor SPD sudah ada dalam sistem. Silakan gunakan nomor yang berbeda.', 'error');
        } else {
            showToast('Error adding BPD data: ' + error.message, 'error');
        }
    }
}

// Function to handle record deletion
// Handles record deletion with budget restoration and toast notifications
async function handleDeleteRecord(recordId, container, year = null) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        return;
    }

    try {
        // Get the record to be deleted to access its cost value
        const { data: recordToDelete, error: fetchError } = await supabase
            .from('bpd_master')
            .select('total_akomodasi_biaya_dinas, periode_awal, no_bpd, nama_audit')
            .eq('id', recordId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        if (!recordToDelete) {
            throw new Error('Record not found');
        }

        const tripCost = parseFloat(recordToDelete.total_akomodasi_biaya_dinas);
        const tripYear = new Date(recordToDelete.periode_awal).getFullYear();

        // Delete the record from Supabase
        const { error: deleteError } = await supabase
            .from('bpd_master')
            .delete()
            .eq('id', recordId);

        if (deleteError) throw deleteError;

        // Restore the budget if budget exists for the year
        const { data: budgetData, error: budgetError } = await supabase
            .from('bpd_budget_master')
            .select('id, budget_awal, budget_sisa')
            .eq('tahun', tripYear)
            .single();

        if (!budgetError && budgetData) {
            // Update the budget by adding back the deleted cost
            const newRemainingBudget = budgetData.budget_sisa + tripCost;

            const updateResult = await supabase
                .from('bpd_budget_master')
                .update({
                    budget_sisa: newRemainingBudget,
                    updated_at: new Date().toISOString()
                })
                .eq('id', budgetData.id);

            if (updateResult.error) {
                console.error('Error updating budget:', updateResult.error);
            } else {
                // Add a budget transaction record for the restoration
                await supabase
                    .from('bpd_budget_transactions')
                    .insert([{
                        bpd_budget_id: budgetData.id,
                        transaction_type: 'refund',
                        amount: tripCost,
                        description: 'Refund for deleted trip: ' + recordToDelete.nama_audit + ' (' + recordToDelete.no_bpd + ')'
                    }]);
            }
        }

        // Show success message
        showToast('Data BPD berhasil dihapus!', 'success');

        // Reload data
        if (year) {
            await loadBPDContentByYear(container, year);
        } else {
            await loadBPDContent(container, year);
        }
    } catch (error) {
        console.error('Error deleting BPD data:', error);
        showToast('Error deleting BPD data: ' + error.message, 'error');
    }
}