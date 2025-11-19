import { supabase } from './supabaseClient.js';
import { formatCurrency, exportToExcel, exportToPDF } from './utils.js';
import { applyPagination, isAdmin } from './utils.js';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
async function fetchBpdData() {
    try {
        // Fetch all BPD data for the pie chart
        const { data: allBPDData, error: allBpdError } = await supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(100);
        
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
        const { data: top3, error: top3Error } = await supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas')
            .order('total_akomodasi_biaya_dinas', { ascending: false })
            .limit(3);
        
        if (top3Error) throw top3Error;
        
        // Fetch bottom 3 lowest BPD costs
        const { data: bottom3, error: bottom3Error } = await supabase
            .from('bpd_master')
            .select('nama_audit, total_akomodasi_biaya_dinas')
            .order('total_akomodasi_biaya_dinas', { ascending: true })
            .limit(3);
        
        if (bottom3Error) throw bottom3Error;
        
        // Fetch detailed BPD records
        const { data: bpdData, error: bpdError } = await supabase
            .from('bpd_master')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (bpdError) throw bpdError;
        
        return {
            chartData,
            top3,
            bottom3,
            bpdData
        };
    } catch (error) {
        console.error('Error fetching BPD data:', error);
        throw error;
    }
}

// Function to load BPD content
export async function loadBPDContent(container) {
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
        const { chartData, top3, bottom3, bpdData } = await fetchBpdData();
        
        // Store references to current data
        currentBPDData = bpdData;
        currentChartData = chartData;
        
        // Render the UI
        container.innerHTML = `
            <div class="bpd-container">
                <div class="bpd-header">
                    <h2 class="bpd-title">BPD (Biaya Perjalanan Dinas)</h2>
                </div>
                
                <!-- Chart Section -->
                <div class="chart-container">
                    <h3 class="chart-header">Total Biaya per Audit</h3>
                    <div class="chart-wrapper">
                        <canvas id="bpdChart"></canvas>
                    </div>
                </div>
                    <div class="grid grid-cols-2 md:grid-cols-2 gap-2 mb-5">

                    <!-- TOP 3 -->
                    <div class="summary-card">
                        <h3 class="summary-card-header mb-4">Top 3 Highest BPD 🔺</h3>

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
                        <h3 class="summary-card-header mb-4">Bottom 3 Lowest BPD 🔻</h3>

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

                </div>
                
                <!-- BPD Records Table with Add Data Button -->
                <div class="transactions-table-container" id="bpdTableContainer">
                    <div class="transactions-table-header flex flex-wrap items-center justify-between gap-4">
                        <h3 class="transactions-table-title">Daftar Data BPD</h3>
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
                        <h4 class="text-lg font-bold mb-4">Tambah Data BPD</h4>
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
                                <button type="button" id="cancelAddDataBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Batal</button>
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
            
            tableBody.innerHTML = data.map(record => `
                <tr>
                    <td>${record.nama_audit || '-'}</td>
                    <td>${record.nama_pemesan || '-'}</td>
                    <td>${record.jenis_audit || '-'}</td>
                    <td>${record.no_spd || '-'}</td>
                    <td>${record.no_bpd || '-'}</td>
                    <td>${record.periode_awal || '-'} S.d ${record.periode_akhir || '-'}</td>
                    <td>${record.lama_audit || '-'} Hari</td>
                    <td>${formatCurrency(record.total_akomodasi_biaya_dinas || 0)}</td>
                </tr>
            `).join('');
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
            exportToExcel(filteredData, 'BPD_Records');
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
            exportToPDF(filteredData, 'BPD Records');
        });
        
        // Add search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Re-render pagination with new search term
                pagination.render();
            });
        }
        
        // Add event listeners for inline form (only for admin users)
        if (admin) {
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
                    await loadBPDContent(container);
                });
                
                // Add auto-calculation for total fields
                setupFormCalculations();
                
                // Add form validation
                setupFormValidation();
            }
        }
    } catch (error) {
        console.error('Error loading BPD content:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error! </strong>
                <span class="block sm:inline">Failed to load BPD data: ${error.message}</span>
            </div>
        `;
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
                            return `${label}: ${formatCurrency(value)}`;
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
                            ? `(${percentage}%)`
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

// Function to handle form submission
// Handles new data submission with validation and toast notifications
async function handleFormSubmit(container) {
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
        const formData = {
            nama_audit: document.getElementById('namaAudit').value,
            nama_pemesan: document.getElementById('namaPemesan').value,
            jenis_audit: document.getElementById('jenisAudit').value,
            no_spd: document.getElementById('noSpd').value,
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
        
        // Insert data into Supabase
        const { error } = await supabase
            .from('bpd_master')
            .insert([formData]);
        
        if (error) throw error;
        
        // Show success message
        showToast('Data BPD berhasil ditambahkan!', 'success');
        
        // Hide form
        document.getElementById('addDataFormContainer').classList.add('hidden');
        
        // Reset form
        document.getElementById('addDataForm').reset();
        
        // Reload data
        await loadBPDContent(container);
    } catch (error) {
        console.error('Error adding BPD data:', error);
        showToast('Error adding BPD data: ' + error.message, 'error');
    }
}