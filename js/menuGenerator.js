// Import Supabase client
import { supabase } from './supabaseClient.js';

// Function to generate dynamic menu based on beban_biaya_master table
export async function generateDynamicMenu() {
    try {
        // Fetch unique years and categories from beban_biaya_master table
        const { data, error } = await supabase
            .from('beban_biaya_master')
            .select('tahun, kategori')
            .order('tahun', { ascending: false });

        if (error) {
            console.error('Error fetching cost burden data for menu:', error);
            // Return default menu structure if there's an error
            return generateDefaultMenu();
        }

        // Create a map to store unique years and their categories
        const yearCategoryMap = new Map();

        // Add all years and their categories to the map
        if (data && data.length > 0) {
            data.forEach(item => {
                const year = item.tahun;
                const category = item.kategori;

                if (!yearCategoryMap.has(year)) {
                    yearCategoryMap.set(year, new Set());
                }
                yearCategoryMap.get(year).add(category);
            });
        }

        // Define default categories
        const defaultCategories = [
            { module: 'audit', name: 'Beban Biaya Audit' },
            { module: 'konsultan', name: 'Beban Biaya Konsultan' },
            { module: 'iuran', name: 'Beban Biaya Iuran, Sumbangan & Retribusi' },
            { module: 'tamu', name: 'Beban Biaya Tamu' },
            { module: 'rapat', name: 'Beban Biaya Rapat' }
        ];

        // Generate menu HTML
        let menuHTML = '';

        // Get all unique years from the data and also ensure we include default years like 2025 and 2026
        const dataYears = Array.from(yearCategoryMap.keys()).map(y => parseInt(y));
        const defaultYears = [2025, 2026];

        // Combine data years with default years and deduplicate
        const allYearsSet = new Set([...dataYears, ...defaultYears]);
        const allYears = Array.from(allYearsSet)
            .filter(y => y && !isNaN(y)) // Filter out invalid years
            .sort((a, b) => b - a);

        allYears.forEach(year => {
            // Add collapsible year header
            menuHTML += `
                <div class="sidebar-year-header text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-4 flex justify-between items-center cursor-pointer year-toggle" data-year="${year}">
                    <span>${year}</span>
                    <svg class="w-4 h-4 year-chevron" data-year="${year}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
                <div class="year-content hidden" id="year-content-${year}">
            `;

            // Add BPD menu item for this year (without budget button since BPD uses different table structure)
            menuHTML += `
            <a
              href="#"
              class="sidebar-menu-item"
              data-module="bpd"
              data-year="${year}"
              role="tab"
              aria-selected="false"
            >
              <svg aria-hidden="true" class="sidebar-menu-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              <span class="sidebar-menu-text">BPD ${year}</span>
            </a>
            `;

            // Add menu items for each category (excluding BPD which has different structure)
            defaultCategories.forEach(category => {
                // Determine module based on category name
                let module = category.module;

                menuHTML += `
            <a
              href="#"
              class="sidebar-menu-item"
              data-module="${module}"
              data-year="${year}"
              role="tab"
              aria-selected="false"
            >
              <svg aria-hidden="true" class="sidebar-menu-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                ${getCategoryIcon(module)}
              </svg>
              <span class="sidebar-menu-text">${category.name}</span>
            </a>

                `;
            });

            // Close the year content div
            menuHTML += `
                </div>
            `;
        });

        return menuHTML;
    } catch (error) {
        console.error('Unexpected error in generateDynamicMenu:', error);
        // Return default menu structure if there's an error
        return generateDefaultMenu();
    }
}

// Helper function to get appropriate icon for each category
function getCategoryIcon(module) {
    switch (module) {
        case 'audit':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>';
        case 'konsultan':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>';
        case 'iuran':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>';
        case 'tamu':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>';
        case 'rapat':
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>';
        default:
            return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
    }
}

// Function to generate default menu structure
function generateDefaultMenu() {
    // Create a menu with default years 2025 and 2026
    const defaultYears = [2025, 2026];
    let menuHTML = '';

    // Ensure years are valid
    const sanitizedYears = defaultYears.filter(y => y && !isNaN(y));

    const defaultCategories = [
        { module: 'audit', name: 'Beban Biaya Audit' },
        { module: 'konsultan', name: 'Beban Biaya Konsultan' },
        { module: 'iuran', name: 'Beban Biaya Iuran, Sumbangan & Retribusi' },
        { module: 'tamu', name: 'Beban Biaya Tamu' },
        { module: 'rapat', name: 'Beban Biaya Rapat' }
    ];

    defaultYears.forEach(year => {
        // Add collapsible year header
        menuHTML += `
            <div class="sidebar-year-header text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-4 flex justify-between items-center cursor-pointer year-toggle" data-year="${year}">
                <span>${year}</span>
                <svg class="w-4 h-4 year-chevron" data-year="${year}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
            <div class="year-content hidden" id="year-content-${year}">
        `;

        // Add BPD menu item for this year
        menuHTML += `
        <a
          href="#"
          class="sidebar-menu-item"
          data-module="bpd"
          data-year="${year}"
          role="tab"
          aria-selected="false"
        >
          <svg aria-hidden="true" class="sidebar-menu-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          <span class="sidebar-menu-text">BPD ${year}</span>
        </a>
        `;

        // Add menu items for each category
        defaultCategories.forEach(category => {
            // Determine module based on category name
            let module = category.module;

            menuHTML += `
        <a
          href="#"
          class="sidebar-menu-item"
          data-module="${module}"
          data-year="${year}"
          role="tab"
          aria-selected="false"
        >
          <svg aria-hidden="true" class="sidebar-menu-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            ${getCategoryIcon(module)}
          </svg>
          <span class="sidebar-menu-text">${category.name}</span>
        </a>

            `;
        });

        // Close the year content div
        menuHTML += `
            </div>
        `;
    });

    return menuHTML;
}