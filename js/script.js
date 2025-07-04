// Enhanced Income Record Manager Script
const API_URL = 'http://localhost:5000/api/records';

// Global Variables
let currentPage = 1;
let rowsPerPage = 10;
let records = [];
let monthlyChart = null;
let filteredRecords = [];
let isFiltered = false;

// DOM Elements
const passwordModal = document.getElementById('passwordModal') ? 
    new bootstrap.Modal(document.getElementById('passwordModal')) : null;

// Configuration
const ADMIN_PASSWORD = "lulu123"; // Set your admin password here
const CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other'];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show password modal if on admin page
    if (window.location.pathname.includes('admin.html') && passwordModal) {
        passwordModal.show();
    }
    
    // Initialize the application
    initApp();
});

// Initialize the application
async function initApp() {
    await updateTable();
    initEventListeners();
    
    // Initialize charts if on pages that have them
    if (document.getElementById('monthlyChart')) {
        initCharts();
    }
}

// Initialize event listeners
function initEventListeners() {
    // Search functionality if search input exists
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').addEventListener('input', function(e) {
            searchRecords(e.target.value);
        });
    }
    
    // Form submission
    if (document.getElementById('incomeForm')) {
        document.getElementById('incomeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleFormSubmit();
        });
    }
    
    // Date range filter if exists
    if (document.getElementById('applyDateFilter')) {
        document.getElementById('applyDateFilter').addEventListener('click', function() {
            const startDate = document.getElementById('filterStartDate').value;
            const endDate = document.getElementById('filterEndDate').value;
            filterByDateRange(startDate, endDate);
        });
    }
}

// Fetch records from the server
async function fetchRecords() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch records');
        const data = await response.json();
        
        // Sort records by date in descending order (newest first)
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return data;
    } catch (error) {
        console.error('Error fetching records:', error);
        showAlert('Failed to load records. Please try again.', 'danger');
        return [];
    }
}

// Add a record to the server
async function addRecord(record) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        if (!response.ok) throw new Error('Failed to add record');
        return await response.json();
    } catch (error) {
        console.error('Error adding record:', error);
        throw error;
    }
}

// Delete a record from the server
async function deleteRecord(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete record');
    } catch (error) {
        console.error('Error deleting record:', error);
        throw error;
    }
}

// Update a record on the server
async function updateRecord(id, updatedRecord) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRecord)
        });
        if (!response.ok) throw new Error('Failed to update record');
        return await response.json();
    } catch (error) {
        console.error('Error updating record:', error);
        throw error;
    }
}

// Update the table with records from the server
async function updateTable() {
    try {
        records = await fetchRecords();
        filteredRecords = [...records];
        isFiltered = false;
        
        renderTable();
        updateDashboardStats();
        updatePaginationInfo();
        updateCharts();
        
        // Enable/disable pagination buttons
        updatePaginationButtons();
    } catch (error) {
        console.error('Error updating table:', error);
    }
}

// Render the table with records
function renderTable() {
    const tableBodyAdmin = document.getElementById('recordTable');
    const tableBodyUser = document.getElementById('userRecordTable');
    const recordsToRender = isFiltered ? filteredRecords : records;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRecords = recordsToRender.slice(startIndex, endIndex);
    
    // Update Admin Table
    if (tableBodyAdmin) {
        tableBodyAdmin.innerHTML = '';
        paginatedRecords.forEach((record) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.description}</td>
                <td>$${parseFloat(record.amount).toFixed(2)}</td>
                <td>${formatDate(record.date)}</td>
                <td>${record.category || 'Other'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editRecord('${record._id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete('${record._id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBodyAdmin.appendChild(row);
        });
    }
    
    // Update User Table
    if (tableBodyUser) {
        tableBodyUser.innerHTML = '';
        paginatedRecords.forEach((record) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.description}</td>
                <td>$${parseFloat(record.amount).toFixed(2)}</td>
                <td>${formatDate(record.date)}</td>
                <td>${record.category || 'Other'}</td>
            `;
            tableBodyUser.appendChild(row);
        });
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const recordsToCalculate = isFiltered ? filteredRecords : records;
    const totalAmountElement = document.getElementById('totalAmount');
    const totalAmountCardElement = document.getElementById('totalAmountCard');
    const recordsCountElement = document.getElementById('recordsCount');
    const avgAmountElement = document.getElementById('avgAmount');
    
    // Calculate total amount
    const total = recordsToCalculate.reduce((sum, record) => sum + parseFloat(record.amount), 0);
    const totalAmount = total.toFixed(2);
    
    // Update elements if they exist
    if (totalAmountElement) totalAmountElement.textContent = `$${totalAmount}`;
    if (totalAmountCardElement) totalAmountCardElement.textContent = `$${totalAmount}`;
    if (recordsCountElement) recordsCountElement.textContent = recordsToCalculate.length;
    
    // Calculate average if the element exists
    if (avgAmountElement && recordsToCalculate.length > 0) {
        const avg = total / recordsToCalculate.length;
        avgAmountElement.textContent = `$${avg.toFixed(2)}`;
    }
}

// Update pagination information
function updatePaginationInfo() {
    const pageInfoElement = document.getElementById('pageInfo');
    const recordsToPaginate = isFiltered ? filteredRecords : records;
    const totalPages = Math.ceil(recordsToPaginate.length / rowsPerPage);
    
    if (pageInfoElement) {
        pageInfoElement.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

// Update pagination buttons state
function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const recordsToPaginate = isFiltered ? filteredRecords : records;
    const totalPages = Math.ceil(recordsToPaginate.length / rowsPerPage);
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// Change rows per page
function changeRowsPerPage(value) {
    rowsPerPage = parseInt(value);
    currentPage = 1; // Reset to first page
    renderTable();
    updatePaginationInfo();
    updatePaginationButtons();
}

// Go to previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        updatePaginationInfo();
        updatePaginationButtons();
    }
}

// Go to next page
function nextPage() {
    const recordsToPaginate = isFiltered ? filteredRecords : records;
    const totalPages = Math.ceil(recordsToPaginate.length / rowsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        updatePaginationInfo();
        updatePaginationButtons();
    }
}

// Handle form submission
async function handleFormSubmit() {
    const description = document.getElementById('description').value.trim();
    const amount = document.getElementById('amount').value.trim();
    const date = document.getElementById('date').value;
    const category = document.getElementById('category') ? document.getElementById('category').value : 'Other';
    
    if (!description || !amount || !date) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    try {
        const record = { description, amount, date, category };
        await addRecord(record);
        
        // Reset form and update table
        if (document.getElementById('incomeForm')) document.getElementById('incomeForm').reset();
        await updateTable();
        
        showAlert('Record added successfully!', 'success');
    } catch (error) {
        console.error('Error adding record:', error);
        showAlert('Failed to add record. Please try again.', 'danger');
    }
}

// Confirm before deleting a record
function confirmDelete(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        deleteRecordAndUpdate(id);
    }
}

// Delete a record and update the table
async function deleteRecordAndUpdate(id) {
    try {
        await deleteRecord(id);
        await updateTable();
        showAlert('Record deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting record:', error);
        showAlert('Failed to delete record. Please try again.', 'danger');
    }
}

// Edit a record
async function editRecord(id) {
    try {
        const record = records.find(r => r._id === id);
        if (!record) return;
        
        // Fill the form with record data
        if (document.getElementById('description')) {
            document.getElementById('description').value = record.description;
            document.getElementById('amount').value = record.amount;
            document.getElementById('date').value = record.date;
            if (document.getElementById('category')) {
                document.getElementById('category').value = record.category || 'Other';
            }
            
            // Scroll to form
            document.getElementById('description').scrollIntoView({ behavior: 'smooth' });
            
            // Delete the old record after confirmation
            if (confirm('Edit this record? The old record will be replaced.')) {
                await deleteRecordAndUpdate(id);
            }
        }
    } catch (error) {
        console.error('Error editing record:', error);
        showAlert('Failed to edit record. Please try again.', 'danger');
    }
}

// Filter records by type
function filterRecords(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (type) {
        case 'today':
            filteredRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= today;
            });
            break;
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= weekAgo;
            });
            break;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filteredRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= monthAgo;
            });
            break;
        case 'all':
            filteredRecords = [...records];
            break;
        default:
            // Filter by category
            filteredRecords = records.filter(record => record.category === type);
    }
    
    isFiltered = true;
    currentPage = 1;
    renderTable();
    updateDashboardStats();
    updatePaginationInfo();
    updatePaginationButtons();
    updateCharts();
}

// Filter records by date range
function filterByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        showAlert('Please select both start and end dates.', 'warning');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day
    
    filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
    });
    
    isFiltered = true;
    currentPage = 1;
    renderTable();
    updateDashboardStats();
    updatePaginationInfo();
    updatePaginationButtons();
    updateCharts();
}

// Enhanced searchRecords function with additional checks
function searchRecords(query) {
    try {
        if (!query || typeof query !== 'string') {
            filteredRecords = [...records];
        } else {
            const lowerQuery = query.trim().toLowerCase();
            filteredRecords = records.filter(record => {
                // Check if record exists and has required properties
                if (!record || typeof record !== 'object') return false;
                
                const descMatch = record.description && 
                    typeof record.description === 'string' &&
                    record.description.toLowerCase().includes(lowerQuery);
                
                const catMatch = record.category && 
                    typeof record.category === 'string' &&
                    record.category.toLowerCase().includes(lowerQuery);
                
                return descMatch || catMatch;
            });
        }
        
        isFiltered = true;
        currentPage = 1;
        renderTable();
        updateDashboardStats();
        updatePaginationInfo();
        updatePaginationButtons();
        
    } catch (error) {
        console.error('Error in searchRecords:', error);
        // Fallback to showing all records if search fails
        filteredRecords = [...records];
        isFiltered = false;
        currentPage = 1;
        renderTable();
        updateDashboardStats();
        updatePaginationInfo();
        updatePaginationButtons();
    }
}

// Initialize charts
function initCharts() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Income',
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                data: []
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
    
    updateCharts();
}

// Update charts with current data
function updateCharts() {
    if (!monthlyChart) return;
    
    const recordsToChart = isFiltered ? filteredRecords : records;
    
    // Group by month
    const monthlyData = {};
    recordsToChart.forEach(record => {
        const date = new Date(record.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear] += parseFloat(record.amount);
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    // Update chart data
    monthlyChart.data.labels = sortedMonths;
    monthlyChart.data.datasets[0].data = sortedMonths.map(month => monthlyData[month]);
    monthlyChart.update();
}

// Export data
async function exportData() {
    try {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        
        let dataToExport = [...records];
        
        // Apply date filter if dates are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            dataToExport = dataToExport.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= start && recordDate <= end;
            });
        }
        
        if (format === 'csv') {
            exportToCSV(dataToExport);
        } else {
            exportToJSON(dataToExport);
        }
        
        // Close modal
        const exportModal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        exportModal.hide();
        
        showAlert('Export completed successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showAlert('Failed to export data. Please try again.', 'danger');
    }
}

// Export to CSV
function exportToCSV(data) {
    const headers = ['Description', 'Amount', 'Date', 'Category'];
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(record => {
        const values = [
            `"${record.description.replace(/"/g, '""')}"`,
            record.amount,
            record.date,
            record.category || 'Other'
        ];
        csvRows.push(values.join(','));
    });
    
    // Create CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Download file
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `income_records_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to JSON
function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Download file
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `income_records_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import data
async function importData() {
    try {
        const fileInput = document.getElementById('importFile');
        const format = document.querySelector('input[name="importFormat"]:checked').value;
        
        if (!fileInput.files.length) {
            showAlert('Please select a file to import.', 'warning');
            return;
        }
        
        const file = fileInput.files[0];
        const fileReader = new FileReader();
        
        fileReader.onload = async function(e) {
            try {
                let importedRecords = [];
                
                if (format === 'csv') {
                    importedRecords = parseCSV(e.target.result);
                } else {
                    importedRecords = JSON.parse(e.target.result);
                }
                
                // Validate imported records
                if (!Array.isArray(importedRecords)) {
                    throw new Error('Invalid data format');
                }
                
                // Add imported records
                for (const record of importedRecords) {
                    try {
                        await addRecord({
                            description: record.Description || record.description,
                            amount: record.Amount || record.amount,
                            date: record.Date || record.date,
                            category: record.Category || record.category || 'Other'
                        });
                    } catch (error) {
                        console.error('Error adding imported record:', error);
                    }
                }
                
                // Update table and close modal
                await updateTable();
                const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
                importModal.hide();
                
                showAlert(`Successfully imported ${importedRecords.length} records!`, 'success');
            } catch (error) {
                console.error('Error processing imported file:', error);
                showAlert('Failed to process imported file. Please check the format.', 'danger');
            }
        };
        
        if (format === 'csv') {
            fileReader.readAsText(file);
        } else {
            fileReader.readAsText(file);
        }
    } catch (error) {
        console.error('Error importing data:', error);
        showAlert('Failed to import data. Please try again.', 'danger');
    }
}

// Parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const record = {};
        
        for (let j = 0; j < headers.length; j++) {
            let value = values[j] || '';
            value = value.trim().replace(/"/g, '');
            record[headers[j]] = value;
        }
        
        result.push(record);
    }
    
    return result;
}

// Print records
function printRecords() {
    const recordsToPrint = isFiltered ? filteredRecords : records;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Income Records</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; } @page { size: auto; margin: 5mm; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="container mt-3">');
    printWindow.document.write('<h1 class="text-center mb-4">Income Records</h1>');
    
    // Print date range if filtered
    if (isFiltered && filteredRecords.length > 0) {
        const dates = filteredRecords.map(r => new Date(r.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        printWindow.document.write(`<p class="text-center mb-3"><strong>Date Range:</strong> ${formatDate(minDate)} to ${formatDate(maxDate)}</p>`);
    }
    
    printWindow.document.write('<table class="table table-bordered">');
    printWindow.document.write('<thead><tr><th>Description</th><th>Amount</th><th>Date</th><th>Category</th></tr></thead>');
    printWindow.document.write('<tbody>');
    
    recordsToPrint.forEach((record) => {
        printWindow.document.write(`
            <tr>
                <td>${record.description}</td>
                <td>$${parseFloat(record.amount).toFixed(2)}</td>
                <td>${formatDate(record.date)}</td>
                <td>${record.category || 'Other'}</td>
            </tr>
        `);
    });
    
    printWindow.document.write('</tbody></table>');
    
    // Print summary
    const total = recordsToPrint.reduce((sum, record) => sum + parseFloat(record.amount), 0);
    printWindow.document.write(`
        <div class="mt-4 p-3 bg-light rounded">
            <h5>Summary</h5>
            <p><strong>Total Records:</strong> ${recordsToPrint.length}</p>
            <p><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
            <p class="text-muted">Printed on ${new Date().toLocaleString()}</p>
        </div>
    `);
    
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Show alert message
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) existingAlert.remove();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '1100';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Check password for admin access
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (passwordInput === ADMIN_PASSWORD) {
        passwordModal.hide();
        document.getElementById('adminContent').style.display = 'block';
        localStorage.setItem('adminAuthenticated', 'true');
    } else {
        errorMessage.style.display = 'block';
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminAuthenticated');
    window.location.href = "index.html";
}

// Check if admin is authenticated on page load
if (window.location.pathname.includes('admin.html')) {
    if (localStorage.getItem('adminAuthenticated') === 'true') {
        passwordModal.hide();
        document.getElementById('adminContent').style.display = 'block';
    }
}