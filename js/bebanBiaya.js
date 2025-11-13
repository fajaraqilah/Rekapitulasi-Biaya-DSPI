import { supabase } from './supabaseClient.js';
import { formatCurrency, exportToExcel, exportToPDF } from './utils.js';

// Mapping module names to database categories
const moduleCategoryMap = {
    'audit': 'Beban Biaya Audit',
    'konsultan': 'Beban Biaya Konsultan',
    'iuran': 'Beban Biaya Iuran',
    'tamu': 'Beban Biaya Tamu',
    'rapat': 'Beban Biaya Rapat'
};

let currentContainer = null;
let currentModule = null;
let currentCategoryName = null;

// Function to load Beban Biaya content
export async function loadBebanBiayaContent(container, module) {
    try {
        // Map kategori
        const categoryName = moduleCategoryMap[module] || module;
        
        // Store references for later use
        currentContainer = container;
        currentModule = module;
        currentCategoryName = categoryName;
        
        // Render initial UI with subcategory dropdown
        renderInitialContent(container, module, categoryName);
        
        // Populate subcategory dropdown
        setTimeout(async () => {
            await populateSubcategoryDropdown(categoryName);
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
function renderInitialContent(container, module, categoryName) {
    container.innerHTML = `
        <div class="bpd-container">
            <div class="bpd-header">
                <h2 class="bpd-title">${categoryName}</h2>
                <div class="export-buttons">
                    <button id="exportExcel" class="export-button excel hidden">Excel</button>
                    <button id="exportPDF" class="export-button pdf hidden">PDF</button>
                </div>
            </div>
            
            <!-- Subcategory Dropdown -->
            <div class="mb-4">
                <label class="form-label">Subkategori</label>
                <select id="subKategoriSelect" class="form-control" required>
                    <option value="">-- Pilih Subkategori --</option>
                </select>
            </div>
            
            <!-- Summary Cards Container -->
            <div id="summaryCardsContainer"></div>
            
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
                    <div class="md:col-span-2">
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Transaction</button>
                    </div>
                </form>
            </div>
            
            <!-- Toggle Form Button (Admin Only) -->
            <div class="mb-4">
                <button id="toggleFormBtn" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 hidden">Add New Transaction</button>
            </div>
            
            <!-- Transactions Table Container -->
            <div id="transactionsTableContainer"></div>
        </div>
    `;
    
    // Set up initial event listeners
    setupInitialEventListeners(module, categoryName);
}

// Function to populate subcategory dropdown
async function populateSubcategoryDropdown(categoryName) {
    const subSelect = document.getElementById('subKategoriSelect');
    if (subSelect) {
        try {
            const { data: subList, error: subError } = await supabase
                .from('beban_biaya_master')
                .select('subkategori')
                .eq('kategori', categoryName);

            if (!subError && subList?.length > 0) {
                // Remove duplicates
                const uniqueSubs = [...new Set(subList.map(s => s.subkategori))];
                
                // Clear existing options except the default
                subSelect.innerHTML = '<option value="">-- Pilih Subkategori --</option>';
                
                // Add options to dropdown
                uniqueSubs.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub;
                    option.textContent = sub;
                    subSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating subcategory dropdown:', error);
        }
    }
}

// Function to set up initial event listeners
function setupInitialEventListeners(module, categoryName) {
    // Subcategory dropdown change event
    const subSelect = document.getElementById('subKategoriSelect');
    if (subSelect) {
        subSelect.addEventListener('change', async function() {
            if (this.value) {
                // Show the "Add Transaction" button immediately when a subcategory is selected
                const toggleFormBtn = document.getElementById('toggleFormBtn');
                if (toggleFormBtn) {
                    toggleFormBtn.classList.remove('hidden');
                }
                
                await loadSubcategoryData(module, categoryName, this.value);
            } else {
                // Clear data when no subcategory is selected
                document.getElementById('summaryCardsContainer').innerHTML = '';
                document.getElementById('transactionsTableContainer').innerHTML = '';
                document.getElementById('exportExcel').classList.add('hidden');
                document.getElementById('exportPDF').classList.add('hidden');
                
                // Hide the "Add Transaction" button when no subcategory is selected
                const toggleFormBtn = document.getElementById('toggleFormBtn');
                if (toggleFormBtn) {
                    toggleFormBtn.classList.add('hidden');
                }
            }
        });
    }
    
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
                await handleFormSubmit(module, categoryName, selectedSubKategori);
            });
        }
    }
}

// Function to load data for a specific subcategory
async function loadSubcategoryData(module, categoryName, subKategori) {
    try {
        // 1️⃣ Fetch summary data from view
        const { data: summaryData, error: summaryError } = await supabase
            .from('vw_ringkasan_beban_biaya')
            .select('*')
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori)
            .single();

        if (summaryError) throw summaryError;

        // 2️⃣ Fetch transactions for this subcategory
        const { data: transactionData, error: transactionError } = await supabase
            .from('beban_biaya_transaksi')
            .select(`
                id,
                tanggal_kegiatan,
                nama_kegiatan,
                jumlah_orang,
                biaya_kegiatan,
                created_at
            `)
            .eq('master_id', summaryData.master_id)
            .order('tanggal_kegiatan', { ascending: false });

        if (transactionError) throw transactionError;

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
            <div class="summary-cards">
                <div class="summary-card">
                    <h3 class="summary-card-header">Jumlah Awal</h3>
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
            <div class="transactions-table-container">
                <h3 class="transactions-table-title">Daftar Transaksi - ${subKategori}</h3>
                <div class="table-container">
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Kegiatan</th>
                                <th>Jumlah Orang</th>
                                <th>Biaya</th>
                                <th>Jumlah Transaksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactionData.map(transaction => `
                                <tr>
                                    <td>${transaction.tanggal_kegiatan || '-'}</td>
                                    <td>${transaction.nama_kegiatan || '-'}</td>
                                    <td>${transaction.jumlah_orang || '-'}</td>
                                    <td>${formatCurrency(transaction.biaya_kegiatan)}</td>
                                    <td>1</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Show export buttons only when there are transactions
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPDF');
    
    if (exportExcelBtn && exportPdfBtn && transactionData && transactionData.length > 0) {
        exportExcelBtn.classList.remove('hidden');
        exportPdfBtn.classList.remove('hidden');
        
        // Update export button event listeners
        exportExcelBtn.onclick = () => {
            exportToExcel(transactionData, `${currentModule}_${subKategori}_transactions`);
        };
        
        exportPdfBtn.onclick = () => {
            exportToPDF(transactionData, `${currentCategoryName} - ${subKategori} Transactions`);
        };
    } else if (exportExcelBtn && exportPdfBtn) {
        // Hide export buttons when there are no transactions
        exportExcelBtn.classList.add('hidden');
        exportPdfBtn.classList.add('hidden');
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
        
        // Fetch the correct master_id using both kategori and subkategori
        const { data: masterData, error: masterError } = await supabase
            .from('beban_biaya_master')
            .select('id')
            .eq('kategori', categoryName)
            .eq('subkategori', subKategori)
            .single();

        if (masterError || !masterData) {
            alert(`Master record not found for ${subKategori}`);
            return;
        }
        
        // Insert new transaction with master_id reference
        const { error: insertError } = await supabase
            .from('beban_biaya_transaksi')
            .insert([{
                master_id: masterData.id,
                tanggal_kegiatan: tanggalKegiatan,
                nama_kegiatan: namaKegiatan,
                jumlah_orang: jumlahOrang,
                biaya_kegiatan: biayaKegiatan
            }]);

        if (insertError) throw insertError;
        
        // Show success message
        alert('Transaction added successfully!');
        
        // Reset form
        document.getElementById('transactionForm').reset();
        
        // Hide form
        document.getElementById('transactionFormContainer').classList.add('hidden');
        
        // Refresh data
        await loadSubcategoryData(module, categoryName, subKategori);
        
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Error adding transaction: ' + error.message);
    }
}