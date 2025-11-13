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