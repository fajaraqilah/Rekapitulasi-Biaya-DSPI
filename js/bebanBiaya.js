import { supabase } from './supabaseClient.js';
import { formatCurrency, exportToExcel, exportToPDF } from './utils.js';
import { applyPagination, isAdmin } from './utils.js';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Mapping module names to database categories
const moduleCategoryMap = {
    'audit': 'Beban Biaya Audit',
    'konsultan': 'Beban Biaya Jasa Profesional (Konsultan)',
    'iuran': 'Beban Biaya Iuran, Sumbangan & Retribusi',
    'tamu': 'Beban Biaya Tamu',
    'rapat': 'Beban Biaya Rapat'
};

let currentContainer = null;
let currentModule = null;
let currentCategoryName = null;
let currentYear = null;

// Function to load Beban Biaya content
export async function loadBebanBiayaContent(container, module, year = null) {
    try {
        // Check if user is admin
        const admin = await isAdmin(supabase);
        // Map kategori
        const categoryName = moduleCategoryMap[module] || module;
        
        // Store references for later use
        currentContainer = container;
        currentModule = module;
        currentCategoryName = categoryName;
        currentYear = year; // Store the year for later use
        
        // Render initial UI with subcategory dropdown
        renderInitialContent(container, module, categoryName, admin);
        
        // Populate subcategory dropdown
        setTimeout(async () => {
            await populateSubcategoryDropdown(categoryName, year);
        }, 100);
        
    } catch (error) {
        console.error('Error initializing Beban Biaya data:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error! </strong>
                <span class="block sm:inline">Failed to initialize data: ${error.message}</span>
            </div>
        `;
    }
}

// Function to render initial content with subcategory dropdown
function renderInitialContent(container, module, categoryName, admin) {
    container.innerHTML = `
        <div class="bpd-container">
            <div class="bpd-header">
                <h2 class="bpd-title">${categoryName}</h2>
            </div>
            
<!-- Premium Subkategori Dropdown -->
<div class="mb-6">
    <label class="block text-sm font-semibold text-gray-700 mb-2">
        Subkategori
    </label>

    <div class="relative group">
        <!-- Dropdown -->
        <select 
    id="subKategoriSelect"
    class="block w-full px-4 py-3 
           bg-white border border-gray-300 border-b-2 rounded-lg
           text-gray-700 cursor-pointer
           transition-all duration-200 ease-out
           hover:border-blue-400 hover:shadow-md
           focus:ring-2 focus:ring-blue-300 focus:border-blue-500
           appearance-none"
>

            <option value="" disabled selected hidden>-- Pilih Subkategori --</option>
        </select>

        <!-- Custom Arrow -->
        <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg id="dropdownArrow"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-500 transition-transform duration-200"
                viewBox="0 0 20 20" fill="currentColor"
            >
                <path fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clip-rule="evenodd" />
            </svg>
        </div>
    </div>
</div>

            
            <!-- Summary Cards Container -->
            <div id="summaryCardsContainer"></div>
            
            ${admin ? `
            <!-- Transaction Form (Admin Only) -->
            <div id="transactionFormContainer" class="card mb-6 hidden">
                <h3 class="card-header">Add New Transaction</h3>
                <form id="transactionForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Tanggal Kegiatan</label>
                        <input type="date" id="tanggalKegiatan" class="form-control" required>
                    </div>
                    <div>
                        <label class="form-label">Nama Kegiatan</label>
                        <input type="text" id="namaKegiatan" class="form-control" required>
                    </div>
                    <div>
                        <label class="form-label">Jumlah Orang</label>
                        <input type="number" id="jumlahOrang" class="form-control" min="1" required>
                    </div>
                    <div>
                        <label class="form-label">Biaya Kegiatan</label>
                        <input type="number" id="biayaKegiatan" class="form-control" min="0" step="0.01" required>
                    </div>
                    <div class="md:col-span-2 flex justify-end space-x-2">
                        <button type="button" id="cancelTransactionBtn" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Transaction</button>
                    </div>
                </form>
            </div>
            
            <!-- Toggle Form Button (Admin Only) -->
            <div class="mb-4 space-y-2">
                <button id="toggleFormBtn" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 hidden">Add New Transaction</button>
                <button id="setBudgetBtn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 hidden">Set Budget</button>
            </div>
            ` : ''}
            
            <!-- Transactions Table Container -->
            <div id="transactionsTableContainer"></div>
        </div>
    `;
    
    // Set up initial event listeners
    setupInitialEventListeners(module, categoryName, admin);
}

// Function to populate subcategory dropdown
async function populateSubcategoryDropdown(categoryName, year) {
    const subKategoriSelect = document.getElementById("subKategoriSelect");
const dropdownArrow = document.getElementById("dropdownArrow");

subKategoriSelect.addEventListener("click", () => {
    dropdownArrow.classList.toggle("rotate-180");
});
    const subSelect = document.getElementById('subKategoriSelect');
    if (subSelect) {    
        try {
            let query = supabase
                .from('beban_biaya_master')
                .select('subkategori')
                .eq('kategori', categoryName);

            // Add year filter if year is provided
            if (year) {
                query = query.eq('tahun', year);
            }

            const { data: subList, error: subError } = await query;

            // Define default subcategories based on the main category
            const defaultSubcategoriesByCategory = {
                'Beban Biaya Audit': [
                    'Assessment QAIP',
                    'Assesment RMI',
                    'Assessment IACM'
                ],
                'Beban Biaya Jasa Profesional (Konsultan)': [
                    'ICOFR',
                    'Konsultan BPK',
                    'Konsultan BPKP (Lainnya)'
                ],
                'Beban Biaya Iuran, Sumbangan & Retribusi': [
                    'Keanggotaan Asosiasi Auditor (FKSPI, AAI,dll)'
                ],
                'Beban Biaya Tamu': [
                    'Rapat Intern',
                    'Sosialisasi WBS',
                    'Sosialisasi SMAP',
                    'Rapat Closing Meeting',
                    'Rapat BPK',
                    'Rapat KPK',
                    'Rapat Pra Meeting',
                    'Rapat Monitoring TL',
                    'Rapat PMO Audit dan MR',
                    'Rapat Komite Audit',
                    'Rapat BPKP'
                ],
                'Beban Biaya Rapat': [
                    'Counterpart KPK',
                    'Counterpart BPKP',
                    'Counterpart BPK',
                    'Counterpart SPI Holding'
                ]
            };
            
            // Get appropriate default subcategories for the current category
            const defaultSubcategories = defaultSubcategoriesByCategory[categoryName] || [
                'Subkategori 1',
                'Subkategori 2',
                'Subkategori 3',
                'Subkategori 4',
                'Subkategori 5'
            ];
            
            let uniqueSubs = [];
            if (!subError && subList?.length > 0) {
                // Remove duplicates from database results
                uniqueSubs = [...new Set(subList.map(s => s.subkategori))];
            }
            
            // Combine default subcategories with any additional subcategories from the database
            const allSubcategories = [...new Set([...defaultSubcategories, ...uniqueSubs])];
            
            // Clear existing options except the default
            subSelect.innerHTML = '<option value="" disabled hidden selected>-- Pilih Subkategori --</option>';
            
            // Add options to dropdown
            allSubcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating subcategory dropdown:', error);
            
            // If there's an error, still show default subcategories based on the category
            const defaultSubcategoriesByCategory = {
                'Beban Biaya Audit': [
                    'Audit Internal',
                    'Audit Eksternal',
                    'Laporan Keuangan',
                    'Verifikasi Dokumen',
                    'Konsultasi Audit'
                ],
                'Beban Biaya Jasa Profesional (Konsultan)': [
                    'Konsultan Teknis',
                    'Konsultan Manajemen',
                    'Konsultan Hukum',
                    'Konsultan Pajak',
                    'Konsultan SDM'
                ],
                'Beban Biaya Iuran, Sumbangan & Retribusi': [
                    'Iuran Profesi',
                    'Sumbangan Sosial',
                    'Retribusi Pemerintah',
                    'Keanggotaan Organisasi',
                    'Lisensi & Perizinan'
                ],
                'Beban Biaya Tamu': [
                    'Tamu Dinas',
                    'Tamu Internal',
                    'Tamu Eksternal',
                    'Makanan & Minuman',
                    'Akomodasi'
                ],
                'Beban Biaya Rapat': [
                    'Rapat Internal',
                    'Rapat Eksternal',
                    'Rapat Evaluasi',
                    'Rapat Koordinasi',
                    'Rapat Sosialisasi'
                ]
            };
            
            // Get appropriate default subcategories for the current category
            const defaultSubcategories = defaultSubcategoriesByCategory[categoryName] || [
                'Subkategori 1',
                'Subkategori 2',
                'Subkategori 3',
                'Subkategori 4',
                'Subkategori 5'
            ];
            
            // Clear existing options except the default
            subSelect.innerHTML = '<option value="" disabled hidden selected>-- Pilih Subkategori --</option>';
            
            // Add default options to dropdown
            defaultSubcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subSelect.appendChild(option);
            });
        }
    }
}
// Function to set up initial event listeners
function setupInitialEventListeners(module, categoryName, admin) {
    // Subcategory dropdown change event
    const subSelect = document.getElementById('subKategoriSelect');
    if (subSelect) {
        subSelect.addEventListener('change', async function() {
            if (this.value) {
                // Show the "Add Transaction" and "Set Budget" buttons immediately when a subcategory is selected (only for admin)
                if (admin) {
                    const toggleFormBtn = document.getElementById('toggleFormBtn');
                    const setBudgetBtn = document.getElementById('setBudgetBtn');
                    if (toggleFormBtn) {
                        toggleFormBtn.classList.remove('hidden');
                    }
                    if (setBudgetBtn) {
                        setBudgetBtn.classList.remove('hidden');
                    }
                }
                
                await loadSubcategoryData(module, categoryName, this.value, currentYear);
            } else {
                // Clear data when no subcategory is selected
                document.getElementById('summaryCardsContainer').innerHTML = '';
                document.getElementById('transactionsTableContainer').innerHTML = '';
                document.getElementById('exportExcel').classList.add('hidden');
                document.getElementById('exportPDF').classList.add('hidden');
                
                // Hide the "Add Transaction" and "Set Budget" buttons when no subcategory is selected (only for admin)
                if (admin) {
                    const toggleFormBtn = document.getElementById('toggleFormBtn');
                    const setBudgetBtn = document.getElementById('setBudgetBtn');
                    if (toggleFormBtn) {
                        toggleFormBtn.classList.add('hidden');
                    }
                    if (setBudgetBtn) {
                        setBudgetBtn.classList.add('hidden');
                    }
                }
            }
        });
    }
    
    // Set up event listeners for admin users only
    if (admin) {
        // Form toggle button
        const toggleFormBtn = document.getElementById('toggleFormBtn');
        const formContainer = document.getElementById('transactionFormContainer');
        
        if (toggleFormBtn && formContainer) {
            toggleFormBtn.addEventListener('click', () => {
                formContainer.classList.toggle('hidden');
            });
            
            // Form submission
            const form = document.getElementById('transactionForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedSubKategori = document.getElementById('subKategoriSelect').value;
                    if (!selectedSubKategori || selectedSubKategori === '') {
                        alert('Please select a subcategory first');
                        return;
                    }
                    await handleFormSubmit(module, categoryName, selectedSubKategori);
                });
            }
            
            // Cancel button
            const cancelBtn = document.getElementById('cancelTransactionBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    // Hide the form
                    formContainer.classList.add('hidden');
                    // Reset the form
                    form.reset();
                });
            }
        }
        
        // Budget button
        const setBudgetBtn = document.getElementById('setBudgetBtn');
        if (setBudgetBtn) {
            setBudgetBtn.addEventListener('click', () => {
                const selectedSubKategori = document.getElementById('subKategoriSelect').value;
                if (selectedSubKategori && selectedSubKategori !== '') {
                    openBudgetModal(module, categoryName, selectedSubKategori);
                } else {
                    alert('Please select a subcategory first');
                }
            });
        }
    }
}

// Function to load data for a specific subcategory
async function loadSubcategoryData(module, categoryName, subKategori, year = null) {
    try {
        // 1️⃣ Fetch master data directly from beban_biaya_master table
            let masterQuery = supabase
            .from('beban_biaya_master')
            .select('id, tahun, kategori, subkategori, jumlah_awal, jumlah_akhir')
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori);

        // Add year filter if year is provided
        if (year) {
            masterQuery = masterQuery.eq('tahun', year);
        } else {
        }

        const { data: masterData, error: masterError } = await masterQuery.single();

        if (masterError) {
            // Check if the error is due to no rows found
            if (masterError.code === 'PGRST116' || masterError.message.includes('Row not found')) {
                // If no master data exists, create empty data structure
                console.log(`No master data found for category: ${categoryName}, subcategory: ${subKategori}, year: ${year}. Using empty data.`);
                
                // Create a default empty summary structure
                const emptySummaryData = {
                    jumlah_awal: 0,
                    total_pemakaian: 0,
                    jumlah_akhir: 0,
                    jumlah_transaksi: 0,
                    master_id: null // Will be used to fetch transactions
                };
                
                // Since there's no master_id, we can't fetch transactions
                const emptyTransactionData = [];
                
                // Update UI with empty data
                updateUIWithSubcategoryData(emptySummaryData, emptyTransactionData, subKategori);
                return;
            } else {
                // If it's a different error, throw it
                throw masterError;
            }
        }

        // Calculate total transactions and total usage from transactions
        let transactionData = [];
        let totalPemakaian = 0;
        let jumlahTransaksi = 0;
        
        // Fetch transactions for this master record
        const transactionResult = await supabase
            .from('beban_biaya_transaksi')
            .select('*')
            .eq('master_id', masterData.id)
            .order('tanggal_kegiatan', { ascending: false });
        
        if (!transactionResult.error) {
            transactionData = transactionResult.data;
            totalPemakaian = transactionData.reduce((sum, trans) => sum + (trans.biaya_kegiatan || 0), 0);
            jumlahTransaksi = transactionData.length;
        }

        // Create summary data structure
        const summaryData = {
            master_id: masterData.id,
            jumlah_awal: masterData.jumlah_awal || 0,
            total_pemakaian: totalPemakaian,
            jumlah_akhir: (masterData.jumlah_akhir !== undefined && masterData.jumlah_akhir !== null && masterData.jumlah_akhir !== '') ? masterData.jumlah_akhir : (masterData.jumlah_awal - totalPemakaian),
            jumlah_transaksi: jumlahTransaksi,
            tahun: masterData.tahun,
            kategori: masterData.kategori,
            subkategori: masterData.subkategori
        };

        // 3️⃣ Update UI with data
        updateUIWithSubcategoryData(summaryData, transactionData, subKategori);
        
    } catch (error) {
        console.error('Error loading subcategory data:', error);
        // Show error in the summary cards container
        document.getElementById('summaryCardsContainer').innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                <strong class="font-bold">Error! </strong>
                <span class="block sm:inline">Failed to load subcategory data: ${error.message}</span>
            </div>
        `;
    }
}
// Function to update UI with subcategory data
function updateUIWithSubcategoryData(summaryData, transactionData, subKategori) {
    // Update summary cards
    const summaryCardsContainer = document.getElementById('summaryCardsContainer');
    if (summaryData && summaryCardsContainer) {
        summaryCardsContainer.innerHTML = `
           <div class="grid grid-cols-4 md:grid-cols-4 gap-4 mb-4">
                <div class="summary-card">
                    <h3 class="summary-card-header">Anggaran</h3>
                    <p class="summary-card-value positive">${formatCurrency(summaryData.jumlah_awal)}</p>
                </div>
                <div class="summary-card">
                    <h3 class="summary-card-header">Total Pemakaian</h3>
                    <p class="summary-card-value negative">${formatCurrency(summaryData.total_pemakaian)}</p>
                </div>
                <div class="summary-card">
                    <h3 class="summary-card-header">Jumlah Akhir</h3>
                    <p class="summary-card-value neutral">${formatCurrency(summaryData.jumlah_akhir)}</p>
                </div>
                <div class="summary-card">
                    <h3 class="summary-card-header">Jumlah Transaksi</h3>
                    <p class="summary-card-value neutral">${summaryData.jumlah_transaksi || 0}</p>
                </div>
            </div>
        `;
    }
    
    // Update transactions table
    const transactionsTableContainer = document.getElementById('transactionsTableContainer');
    if (transactionData && transactionsTableContainer) {
        transactionsTableContainer.innerHTML = `
            <div class="transactions-table-container" id="bebanBiayaTableContainer">
                <div class="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <h3 class="transactions-table-title">Daftar Transaksi - ${subKategori}</h3>
                    <div class="flex items-center space-x-2">
                        <input type="text" id="bebanBiayaSearchInput" class="form-control border rounded px-2 py-1" placeholder="Cari data..." style="width: 200px;">
                        <div class="export-buttons">
                    <button id="exportExcel" class="export-button excel hidden">Excel</button>
                    <button id="exportPDF" class="export-button pdf hidden">PDF</button>
                </div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Kegiatan</th>
                                <th>Jumlah Orang</th>
                                <th>Biaya</th>
                                <th>Jumlah Transaksi</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bebanBiayaTableBody">
                            <!-- Table rows will be populated by pagination -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Apply pagination to the table
        const pagination = applyPagination('bebanBiayaTableContainer', transactionData, (record) => {
            // This filter function will be used for search functionality
            const searchTerm = document.getElementById('bebanBiayaSearchInput')?.value.toLowerCase() || '';
            if (!searchTerm) return true;
            
            return (
                (record.tanggal_kegiatan && record.tanggal_kegiatan.toLowerCase().includes(searchTerm)) ||
                (record.nama_kegiatan && record.nama_kegiatan.toLowerCase().includes(searchTerm)) ||
                (record.jumlah_orang && record.jumlah_orang.toString().includes(searchTerm)) ||
                (record.biaya_kegiatan && record.biaya_kegiatan.toString().includes(searchTerm))
            );
        });
        
        // Function to render table rows
        function renderTableRows(data) {
            const tableBody = document.getElementById('bebanBiayaTableBody');
            if (!tableBody) return;
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No data available</td></tr>';
                return;
            }
            
            tableBody.innerHTML = data.map(transaction => `
                <tr>
                    <td>${transaction.tanggal_kegiatan || '-'}</td>
                    <td>${transaction.nama_kegiatan || '-'}</td>
                    <td>${transaction.jumlah_orang || '-'}</td>
                    <td>${formatCurrency(transaction.biaya_kegiatan)}</td>
                    <td>1</td>
                    <td class="actions-cell">
                        ${admin ? `
                            <button class="edit-btn text-blue-500 hover:text-blue-700 cursor-pointer mr-2" onclick="openEditTransactionModal('${transaction.id}', '${transaction.tanggal_kegiatan}', '${transaction.nama_kegiatan}', '${transaction.jumlah_orang}', '${transaction.biaya_kegiatan}', '${module}', '${categoryName}', '${subKategori}', ${currentYear})">✏️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }
        
        // Set the render callback for pagination
        pagination.setRenderCallback(renderTableRows);
        
        // Initial table render
        pagination.render();
        
        // Add search functionality
        const searchInput = document.getElementById('bebanBiayaSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Re-render pagination with new search term
                pagination.render();
            });
        }
    }
    
    // Show export buttons only when there are transactions
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPDF');
    
    if (exportExcelBtn && exportPdfBtn && transactionData && transactionData.length > 0) {
        exportExcelBtn.classList.remove('hidden');
        exportPdfBtn.classList.remove('hidden');
        
        // Update export button event listeners
        exportExcelBtn.onclick = () => {
            // Filter data to include only required columns
            const filteredData = (window.currentTransactionData || transactionData).map(record => ({
                'Tanggal Kegiatan': record.tanggal_kegiatan,
                'Nama Kegiatan': record.nama_kegiatan,
                'Jumlah Orang': record.jumlah_orang,
                'Biaya Kegiatan': record.biaya_kegiatan
            }));
            exportToExcel(filteredData, `${currentModule}_${subKategori}_transactions`);
        };
        
        exportPdfBtn.onclick = () => {
            // Filter data to include only required columns
            const filteredData = (window.currentTransactionData || transactionData).map(record => ({
                'Tanggal Kegiatan': record.tanggal_kegiatan,
                'Nama Kegiatan': record.nama_kegiatan,
                'Jumlah Orang': record.jumlah_orang,
                'Biaya Kegiatan': record.biaya_kegiatan
            }));
            exportToPDF(filteredData, `${currentCategoryName} - ${subKategori} Transactions`);
        };
    } else if (exportExcelBtn && exportPdfBtn) {
        // Hide export buttons when there are no transactions
        exportExcelBtn.classList.add('hidden');
        exportPdfBtn.classList.add('hidden');
    }
    
    // Store the current transaction data for later use
    if (transactionData) {
        window.currentTransactionData = transactionData;
    }
}

// Function to open budget management modal
export function openBudgetModal(module, categoryName, subKategori) {
    // Create modal HTML
    const modalHtml = `
        <div id="budgetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Set Budget for ${categoryName} - ${subKategori}</h3>
                    <button id="closeBudgetModal" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="budgetForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input type="number" id="budgetYear" class="form-control w-full" value="${new Date().getFullYear()}" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" id="budgetCategory" class="form-control w-full" value="${categoryName}" readonly>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                        <input type="text" id="budgetSubcategory" class="form-control w-full" value="${subKategori}" readonly>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Budget Amount (Anggaran)</label>
                        <input type="number" id="budgetAmount" class="form-control w-full" step="0.01" placeholder="Enter budget amount" required>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelBudgetBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save Budget</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
    document.getElementById('cancelBudgetBtn').addEventListener('click', closeBudgetModal);
    document.getElementById('budgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBudget(module, categoryName, subKategori);
    });
}

// Function to close budget modal
function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.remove();
    }
}

// Function to save budget
async function saveBudget(module, categoryName, subKategori) {
    // Add null checks for form elements
    const yearElement = document.getElementById('budgetYear');
    const amountElement = document.getElementById('budgetAmount');
    
    if (!yearElement || !amountElement) {
        alert('Budget form elements not found. Please try again.');
        return;
    }
    
    const year = yearElement.value;
    const amount = parseFloat(amountElement.value);
    
    if (!year || isNaN(amount)) {
        alert('Please enter valid year and budget amount');
        return;
    }
    
    // Ensure amount is a positive number
    if (amount < 0) {
        alert('Budget amount must be a positive number');
        return;
    }
    
    try {
        // Check if a master record already exists
        const { data: existingMaster, error: fetchError } = await supabase
            .from('beban_biaya_master')
            .select('id, jumlah_awal, jumlah_akhir')
            .eq('tahun', year)
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error fetching existing master record:', fetchError);
            throw fetchError;
        }
        
        let result;
        if (existingMaster) {
            // Update existing record - preserve the difference between initial and remaining amounts
            // Calculate the difference to adjust jumlah_akhir accordingly
            const amountDifference = amount - existingMaster.jumlah_awal;
            const newJumlahAkhir = (existingMaster.jumlah_akhir !== undefined && existingMaster.jumlah_akhir !== null) 
                ? existingMaster.jumlah_akhir + amountDifference
                : amount; // If jumlah_akhir is null, set it to the new budget amount
            result = await supabase
                .from('beban_biaya_master')
                .update({
                    jumlah_awal: amount,
                    jumlah_akhir: newJumlahAkhir,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingMaster.id);
            
            // Verify the update by fetching the record again
            const { data: verifyData, error: verifyError } = await supabase
                .from('beban_biaya_master')
                .select('jumlah_awal, jumlah_akhir')
                .eq('id', existingMaster.id)
                .single();
            
            if (verifyError) {
                console.error('Error verifying update:', verifyError);
            }   
            if (result.error) {
                console.error('Error updating master record:', result.error);
                throw result.error;
            }
        } else {
            // Create new master record with budget
            console.log('Creating new master record with jumlah_awal:', amount);
            
            console.log('About to insert new record with jumlah_awal:', amount);
            result = await supabase
                .from('beban_biaya_master')
                .insert([{
                    tahun: year,
                    kategori: categoryName,
                    subkategori: subKategori,
                    jumlah_awal: amount,
                    jumlah_akhir: amount, // Initially, final amount equals initial
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
            console.log('Insert result:', result);
                        
            // Verify the insert by fetching the newly created record
            if (!result.error && result.data && result.data.length > 0) {
                const newRecordId = result.data[0].id;
                const { data: verifyData, error: verifyError } = await supabase
                    .from('beban_biaya_master')
                    .select('jumlah_awal, jumlah_akhir')
                    .eq('id', newRecordId)
                    .single();
                            
                if (verifyError) {
                    console.error('Error verifying insert:', verifyError);
                } else {
                    console.log('Verification after insert - jumlah_awal:', verifyData.jumlah_awal, 'jumlah_akhir:', verifyData.jumlah_akhir);
                }
            }
                        
            if (result.error) {
                console.error('Error inserting new master record:', result.error);
                throw result.error;
            }
        }
        alert('Budget saved successfully!');
        closeBudgetModal();
        
        // Small delay to ensure data is properly saved before refreshing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Refresh the current view to show updated budget
        if (subKategori) {
            await loadSubcategoryData(module, categoryName, subKategori, parseInt(year));
        }
        
    } catch (error) {
        console.error('Error saving budget:', error);
        alert('Error saving budget: ' + error.message);
    }
}

// Function to open edit transaction modal
function openEditTransactionModal(transactionId, tanggalKegiatan, namaKegiatan, jumlahOrang, biayaKegiatan, module, categoryName, subKategori, year) {
    // Create modal HTML
    const modalHtml = `
        <div id="editTransactionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Edit Transaction</h3>
                    <button id="closeEditTransactionModal" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="editTransactionForm" class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Kegiatan</label>
                        <input type="date" id="editTanggalKegiatan" class="form-control w-full" value="${tanggalKegiatan}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                        <input type="text" id="editNamaKegiatan" class="form-control w-full" value="${namaKegiatan}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Orang</label>
                        <input type="number" id="editJumlahOrang" class="form-control w-full" min="1" value="${jumlahOrang}" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Biaya Kegiatan</label>
                        <input type="number" id="editBiayaKegiatan" class="form-control w-full" min="0" step="0.01" value="${biayaKegiatan}" required>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelEditTransactionBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Update Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    document.getElementById('closeEditTransactionModal').addEventListener('click', closeEditTransactionModal);
    document.getElementById('cancelEditTransactionBtn').addEventListener('click', closeEditTransactionModal);
    document.getElementById('editTransactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleEditTransactionSubmit(transactionId, tanggalKegiatan, biayaKegiatan, module, categoryName, subKategori, year);
    });
}

// Function to close edit transaction modal
function closeEditTransactionModal() {
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.remove();
    }
}

// Function to handle edit transaction submission
async function handleEditTransactionSubmit(transactionId, oldTanggalKegiatan, oldBiayaKegiatan, module, categoryName, subKategori, year) {
    // Get form values
    const tanggalKegiatan = document.getElementById('editTanggalKegiatan').value;
    const namaKegiatan = document.getElementById('editNamaKegiatan').value;
    const jumlahOrang = parseInt(document.getElementById('editJumlahOrang').value);
    const biayaKegiatan = parseFloat(document.getElementById('editBiayaKegiatan').value);
    
    try {
        // Validate form fields
        if (!tanggalKegiatan || !namaKegiatan || !jumlahOrang || !biayaKegiatan) {
            alert("Please fill in all required fields!");
            return;
        }
        
        if (biayaKegiatan < 0) {
            alert("Transaction amount must be a positive number!");
            return;
        }
        
        // Fetch the current master record to check budget
        const { data: masterData, error: masterError } = await supabase
            .from('beban_biaya_master')
            .select('id, jumlah_awal, jumlah_akhir')
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori)
            .eq('tahun', year)
            .single();

        if (masterError) {
            console.error('Error fetching master record:', masterError);
            if (masterError.code === 'PGRST116') {
                alert(`Master record not found for ${subKategori}.`);
            } else {
                alert(`Error accessing budget data: ${masterError.message}`);
            }
            return;
        }
        
        if (!masterData) {
            alert(`Master record not found for ${subKategori}.`);
            return;
        }
        
        // Calculate the budget adjustment based on the difference between old and new biaya
        const biayaDifference = biayaKegiatan - oldBiayaKegiatan;
        
        // Update the transaction record
        const { error: updateError } = await supabase
            .from('beban_biaya_transaksi')
            .update({
                tanggal_kegiatan: tanggalKegiatan,
                nama_kegiatan: namaKegiatan,
                jumlah_orang: jumlahOrang,
                biaya_kegiatan: biayaKegiatan
            })
            .eq('id', transactionId);

        if (updateError) {
            console.error('Error updating transaction:', updateError);
            throw updateError;
        }
        
        // Note: Budget calculations are handled by database triggers, so we don't manually update jumlah_akhir here
        
        console.log('Transaction updated successfully');
        
        // Show success message
        alert('Transaction updated successfully!');
        
        // Close the modal
        closeEditTransactionModal();
        
        // Small delay to ensure data is properly saved before refreshing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Refresh data
        await loadSubcategoryData(module, categoryName, subKategori, year);
        
    } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Error updating transaction: ' + error.message);
    }
}

// Function to handle form submission
async function handleFormSubmit(module, categoryName, subKategori) {
    // Get form values
    const tanggalKegiatan = document.getElementById('tanggalKegiatan').value;
    const namaKegiatan = document.getElementById('namaKegiatan').value;
    const jumlahOrang = parseInt(document.getElementById('jumlahOrang').value);
    const biayaKegiatan = parseFloat(document.getElementById('biayaKegiatan').value);
    
    try {
        // Validate subcategory selection
        if (!subKategori) {
            alert("Please select a subcategory first!");
            return;
        }
        
        // Validate form fields
        if (!tanggalKegiatan || !namaKegiatan || !jumlahOrang || !biayaKegiatan) {
            alert("Please fill in all required fields!");
            return;
        }
        
        if (biayaKegiatan < 0) {
            alert("Transaction amount must be a positive number!");
            return;
        }
        
        // Fetch the correct master_id using both kategori and subkategori
        const { data: masterData, error: masterError } = await supabase
            .from('beban_biaya_master')
            .select('id, jumlah_awal, jumlah_akhir')
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori)
            .eq('tahun', currentYear)
            .single();

        if (masterError) {
            console.error('Error fetching master record:', masterError);
            if (masterError.code === 'PGRST116') {
                alert(`Master record not found for ${subKategori}. Please set a budget first.`);
            } else {
                alert(`Error accessing budget data: ${masterError.message}`);
            }
            return;
        }
        
        if (!masterData) {
            alert(`Master record not found for ${subKategori}. Please set a budget first.`);
            return;
        }
        
        // Insert new transaction with master_id reference
        const { data: transactionResult, error: insertError } = await supabase
            .from('beban_biaya_transaksi')
            .insert([{
                master_id: masterData.id,
                tanggal_kegiatan: tanggalKegiatan,
                nama_kegiatan: namaKegiatan,
                jumlah_orang: jumlahOrang,
                biaya_kegiatan: biayaKegiatan
            }]);

        if (insertError) {
            console.error('Error inserting transaction:', insertError);
            throw insertError;
        }
        
        // Note: Budget calculations are handled by database triggers, so we don't manually update jumlah_akhir here
        
        console.log('Transaction added successfully');
        
        // Show success message
        alert('Transaction added successfully!');
        
        // Reset form
        document.getElementById('transactionForm').reset();
        
        // Hide form
        document.getElementById('transactionFormContainer').classList.add('hidden');
        
        // Small delay to ensure data is properly saved before refreshing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Refresh data
        await loadSubcategoryData(module, categoryName, subKategori, currentYear);
        
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Error adding transaction: ' + error.message);
    }
}