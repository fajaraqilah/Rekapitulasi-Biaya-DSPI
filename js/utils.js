// Utility functions for the DSPI dashboard

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
    const { jsPDF } = window.jspdf;
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
        
        // Add table
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 30,
            styles: {
                fontSize: 8
            },
            headStyles: {
                fillColor: [22, 160, 133]
            }
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

// Check if user is authenticated
export async function isAuthenticated(supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// Logout function
export async function logout(supabase) {
    await supabase.auth.signOut();
    window.location.href = './login.html';
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
        sidebar.classList.toggle('translate-x-0');
        sidebar.classList.toggle('-translate-x-full');
        
        // Toggle overlay visibility
        sidebarOverlay.classList.toggle('visible');
    });
    
    // Close menu when overlay is clicked
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.remove('visible');
    });
    
    // Close menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            sidebarOverlay.classList.remove('visible');
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
    entriesSelect.addEventListener('change', function() {
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
