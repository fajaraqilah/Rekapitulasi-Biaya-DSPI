// Utility functions for the DSPI dashboard
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Global Success Modal Utility
export function showSuccessModal(message, title = 'Berhasil!') {
    // Prevent document scrolling when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fadeIn backdrop-blur-sm';
    overlay.id = 'successModalOverlay';

    // Create modal content
    const content = document.createElement('div');
    content.className = 'bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all animate-scaleIn flex flex-col items-center text-center border border-gray-100';

    // Checkmark icon with ring animation
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'relative mb-6';

    iconWrapper.innerHTML = `
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounceOnce">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <div class="absolute inset-0 w-20 h-20 bg-green-500 rounded-full opacity-20 animate-ping"></div>
    `;

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-2xl font-bold text-gray-800 mb-3 tracking-tight';
    titleEl.textContent = title;

    const messageEl = document.createElement('p');
    messageEl.className = 'text-gray-500 mb-8 leading-relaxed font-medium';
    messageEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-100';
    closeBtn.textContent = 'Selesai';

    const closeModal = () => {
        overlay.classList.remove('animate-fadeIn');
        overlay.classList.add('animate-fadeOut');
        document.body.style.overflow = originalStyle;
        setTimeout(() => overlay.remove(), 300);
    };

    closeBtn.onclick = closeModal;

    content.appendChild(iconWrapper);
    content.appendChild(titleEl);
    content.appendChild(messageEl);
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Auto close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    };
}

// Global Confirmation Modal Utility
export function showConfirmModal(message, title = 'Konfirmasi Hapus') {
    return new Promise((resolve) => {
        // Prevent document scrolling when modal is open
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fadeIn backdrop-blur-sm';
        overlay.id = 'confirmModalOverlay';

        // Create modal content
        const content = document.createElement('div');
        content.className = 'bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all animate-scaleIn flex flex-col items-center text-center border border-gray-100';

        // Warning icon
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'mb-6';
        iconWrapper.innerHTML = `
            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
        `;

        const titleEl = document.createElement('h3');
        titleEl.className = 'text-2xl font-bold text-gray-800 mb-3 tracking-tight';
        titleEl.textContent = title;

        const messageEl = document.createElement('p');
        messageEl.className = 'text-gray-500 mb-8 leading-relaxed font-medium';
        messageEl.textContent = message;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex gap-3 w-full';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-95 focus:outline-none';
        cancelBtn.textContent = 'Batal';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'flex-1 py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95 focus:outline-none';
        confirmBtn.textContent = 'Hapus';

        const close = (result) => {
            overlay.classList.remove('animate-fadeIn');
            overlay.classList.add('animate-fadeOut');
            document.body.style.overflow = originalStyle;
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 300);
        };

        cancelBtn.onclick = () => close(false);
        confirmBtn.onclick = () => close(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) close(false);
        };

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        content.appendChild(iconWrapper);
        content.appendChild(titleEl);
        content.appendChild(messageEl);
        content.appendChild(btnContainer);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    });
}

// Global Toast Utility for errors and info
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-xl mb-3 flex items-center justify-between min-w-[300px] animate-fadeIn transform transition-all hover:scale-102`;

    toast.innerHTML = `
        <span class="font-medium">${message}</span>
        <button class="ml-4 hover:opacity-70 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('animate-fadeOut');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('button').onclick = removeToast;

    // Auto remove after 5 seconds
    setTimeout(removeToast, 5000);
}

// Format currency in IDR
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format number with thousand separator dots
export function formatNumberWithDots(value) {
    if (value === null || value === undefined || value === '') return '';

    // Remove all non-digit characters except decimals
    let numberString = value.toString().replace(/[^\d]/g, '');

    // Format with dots
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Setup number formatting on input fields as user types
export function setupNumberFormatting(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function (e) {
        // Get cursor position
        let cursorPosition = this.selectionStart;
        let oldLength = this.value.length;

        // Format the value
        let formattedValue = formatNumberWithDots(this.value);
        this.value = formattedValue;

        // Adjust cursor position
        let newLength = this.value.length;
        cursorPosition = cursorPosition + (newLength - oldLength);
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
}

// Parse formatted number string back to Float/Integer
export function parseFormattedNumber(value) {
    if (!value) return 0;
    // Remove all dots
    return parseFloat(value.toString().replace(/\./g, '')) || 0;
}

// Format date
export function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Export to Excel
export function exportToExcel(data, filename) {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Export to file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export to PDF
export function exportToPDF(data, title) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Prepare table data
    if (data.length > 0) {
        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Get rows
        const rows = data.map(obj => headers.map(header => obj[header]));

        // Add table with improved formatting
        doc.autoTable({
            head: [headers], // Filtered headers
            body: rows,      // Filtered rows
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                // Use columnStyles for all columns instead of fixed widths
                columnStyles: {
                    '*': { // Apply to all columns
                        cellPadding: 2,
                        minCellWidth: 15, // Minimum width if needed
                        // cellWidth: 'auto' is default, let AutoTable calculate
                    }
                }
            },
            headStyles: {
                fillColor: [22, 160, 133],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center', // Apply alignment here too, potentially redundant with didParseCell
                valign: 'middle'
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                halign: 'center' // Optional: center align body text if desired
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            // Remove the specific index columnStyles
            // columnStyles: { ... },
            didParseCell: function (data) {
                // Keep header alignment
                if (data.section === 'head') {
                    data.cell.styles.halign = 'center';
                    data.cell.styles.valign = 'middle';
                }
            },
            margin: { top: 30 },
            // Optional: Add tableWidth for better control
            // tableWidth: 'wrap', // or 'auto' or a specific value like 180
        });
    }

    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Filter data by date range
export function filterByDateRange(data, startDate, endDate, dateField = 'date') {
    if (!startDate || !endDate) return data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= start && itemDate <= end;
    });
}

// Check if user is admin
export async function isAdmin(supabase) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        // Get user profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return profile.role === 'admin';
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
}

// Get current user role
export async function getUserRole(supabase) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Get user profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return profile.role;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated(supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// Logout function
export async function logout(supabase) {
    await supabase.auth.signOut();
    window.location.href = './login';
}

// Mobile menu toggle function
export function initMobileMenu() {
    // Get DOM elements
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Check if elements exist
    if (!mobileMenuButton || !sidebar || !sidebarOverlay) {
        console.warn('Mobile menu elements not found');
        return;
    }

    // Toggle mobile menu
    mobileMenuButton.addEventListener('click', () => {
        // Toggle sidebar visibility
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('visible');

        // Toggle overlay visibility
        sidebarOverlay.classList.toggle('visible');

        // Update ARIA attributes for accessibility
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
    });

    // Close menu when overlay is clicked
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('visible');
        sidebar.classList.add('hidden');
        sidebarOverlay.classList.remove('visible');

        // Update ARIA attributes for accessibility
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        if (mobileMenuButton) {
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });

    // Close menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            // On desktop/tablet, ensure sidebar is visible (except on mobile)
            sidebar.classList.remove('hidden');
            sidebar.classList.add('visible');
            sidebarOverlay.classList.remove('visible');

            // Update ARIA attributes for accessibility
            const mobileMenuButton = document.getElementById('mobileMenuButton');
            if (mobileMenuButton) {
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            }
        }
    });
}
// Desktop sidebar toggle function
export function initDesktopMenu() {
    // Get DOM elements
    const desktopMenuButton = document.getElementById('desktopMenuButton');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const header = document.querySelector('.header');

    // Check if elements exist
    if (!desktopMenuButton || !sidebar || !content || !header) {
        console.warn('Desktop menu elements not found');
        return;
    }

    // Toggle desktop sidebar
    desktopMenuButton.addEventListener('click', () => {
        // Toggle sidebar collapsed state
        sidebar.classList.toggle('collapsed');

        // Toggle content expanded state
        content.classList.toggle('expanded');

        // Toggle header expanded state
        header.classList.toggle('expanded');

        // Update ARIA attributes for accessibility
        const isExpanded = desktopMenuButton.getAttribute('aria-expanded') === 'true';
        desktopMenuButton.setAttribute('aria-expanded', !isExpanded);
    });
}

// Pagination helper function
export function applyPagination(tableId, dataArray, searchFilter = null) {
    // Default pagination settings
    let currentPage = 1;
    let entriesPerPage = 10;
    let filteredData = dataArray;
    let renderCallback = null;

    // Apply search filter if provided
    if (searchFilter && typeof searchFilter === 'function') {
        filteredData = dataArray.filter(searchFilter);
    }

    // Get table elements
    const tableContainer = document.getElementById(tableId);
    if (!tableContainer) {
        console.warn(`Table container with ID ${tableId} not found`);
        return;
    }

    // Create or get pagination elements
    let entriesSelect = tableContainer.querySelector('.entries-select');
    let paginationContainer = tableContainer.querySelector('.table-pagination');
    let entriesInfo = tableContainer.querySelector('.entries-info');

    // Create elements if they don't exist
    if (!entriesSelect) {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'flex flex-wrap items-center justify-between mb-4 gap-4';

        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'flex items-center gap-2';
        entriesContainer.innerHTML = `
            <label class="text-sm">Show</label>
            <select class="entries-select border rounded px-2 py-1">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
            </select>
            <span class="text-sm">entries</span>
        `;

        controlsContainer.appendChild(entriesContainer);
        tableContainer.insertBefore(controlsContainer, tableContainer.firstChild);
        entriesSelect = controlsContainer.querySelector('.entries-select');
    }

    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'table-pagination flex flex-wrap justify-between items-center mt-4 gap-2';
        tableContainer.appendChild(paginationContainer);
    }

    if (!entriesInfo) {
        entriesInfo = document.createElement('div');
        entriesInfo.className = 'entries-info text-sm text-gray-600';
        paginationContainer.appendChild(entriesInfo);
    }

    // Event listener for entries select
    entriesSelect.addEventListener('change', function () {
        entriesPerPage = this.value === 'all' ? 'all' : parseInt(this.value);
        currentPage = 1;
        renderTable();
    });

    // Function to set render callback
    function setRenderCallback(callback) {
        renderCallback = callback;
    }

    // Function to render table with pagination
    function renderTable() {
        // Apply search filter if provided
        if (searchFilter && typeof searchFilter === 'function') {
            filteredData = dataArray.filter(searchFilter);
        } else {
            filteredData = dataArray;
        }

        // Calculate pagination
        const totalEntries = filteredData.length;
        const totalPages = entriesPerPage === 'all' ? 1 : Math.ceil(totalEntries / entriesPerPage);

        // Ensure current page is within bounds
        if (currentPage > totalPages) currentPage = totalPages || 1;
        if (currentPage < 1) currentPage = 1;

        // Slice data for current page
        let pageData;
        if (entriesPerPage === 'all') {
            pageData = filteredData;
        } else {
            const startIndex = (currentPage - 1) * entriesPerPage;
            const endIndex = startIndex + entriesPerPage;
            pageData = filteredData.slice(startIndex, endIndex);
        }

        // Update entries info
        if (entriesPerPage === 'all') {
            entriesInfo.textContent = `Showing all ${totalEntries} entries`;
        } else {
            const startEntry = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
            const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);
            entriesInfo.textContent = `Showing ${startEntry}–${endEntry} of ${totalEntries} entries`;
        }

        // Render pagination controls
        renderPaginationControls(totalPages);

        // Call render callback if provided
        if (renderCallback && typeof renderCallback === 'function') {
            renderCallback(pageData);
        }

        // Return page data for table rendering
        return pageData;
    }

    // Function to render pagination controls
    function renderPaginationControls(totalPages) {
        // Clear existing pagination
        const buttonsContainer = paginationContainer.querySelector('.pagination-buttons') || document.createElement('div');
        buttonsContainer.className = 'pagination-buttons flex flex-wrap items-center gap-1';

        // Clear the container
        buttonsContainer.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = `px-3 py-1 rounded text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        prevButton.textContent = 'Prev';
        prevButton.disabled = currentPage === 1;
        if (currentPage > 1) {
            prevButton.addEventListener('click', () => {
                currentPage--;
                renderTable();
            });
        }
        buttonsContainer.appendChild(prevButton);

        // Page numbers (show max 5 pages around current page)
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust start page if needed
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page button (if not already shown)
        if (startPage > 1) {
            const firstButton = document.createElement('button');
            firstButton.className = `px-3 py-1 rounded text-sm ${1 === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
            firstButton.textContent = '1';
            if (1 !== currentPage) {
                firstButton.addEventListener('click', () => {
                    currentPage = 1;
                    renderTable();
                });
            }
            buttonsContainer.appendChild(firstButton);

            // Ellipsis if needed
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 py-1 text-gray-500';
                ellipsis.textContent = '...';
                buttonsContainer.appendChild(ellipsis);
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `px-3 py-1 rounded text-sm ${i === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
            pageButton.textContent = i;
            if (i !== currentPage) {
                pageButton.addEventListener('click', () => {
                    currentPage = i;
                    renderTable();
                });
            }
            buttonsContainer.appendChild(pageButton);
        }

        // Last page button (if not already shown)
        if (endPage < totalPages) {
            // Ellipsis if needed
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 py-1 text-gray-500';
                ellipsis.textContent = '...';
                buttonsContainer.appendChild(ellipsis);
            }

            const lastButton = document.createElement('button');
            lastButton.className = `px-3 py-1 rounded text-sm ${totalPages === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
            lastButton.textContent = totalPages;
            if (totalPages !== currentPage) {
                lastButton.addEventListener('click', () => {
                    currentPage = totalPages;
                    renderTable();
                });
            }
            buttonsContainer.appendChild(lastButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = `px-3 py-1 rounded text-sm ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages || totalPages === 0;
        if (currentPage < totalPages) {
            nextButton.addEventListener('click', () => {
                currentPage++;
                renderTable();
            });
        }
        buttonsContainer.appendChild(nextButton);

        // Add buttons container to pagination container if not already there
        if (!paginationContainer.querySelector('.pagination-buttons')) {
            paginationContainer.appendChild(buttonsContainer);
        }
    }

    // Initial render
    renderTable();

    // Return object with methods to control pagination
    return {
        render: renderTable,
        getCurrentPage: () => currentPage,
        getTotalPages: () => entriesPerPage === 'all' ? 1 : Math.ceil(filteredData.length / entriesPerPage),
        getFilteredData: () => filteredData,
        setPage: (page) => {
            currentPage = page;
            return renderTable();
        },
        setRenderCallback: setRenderCallback,
        updateData: (newData) => {
            dataArray = newData;
            currentPage = 1;
            renderTable();
        }
    };
}
