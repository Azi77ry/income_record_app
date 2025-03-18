// Function to sort records by date in ascending order
function sortRecordsByDate() {
    records.sort((a, b) => {
        if (!isValidDate(a.date) || !isValidDate(b.date)) {
            console.error("Invalid date found in records:", a.date, b.date);
            return 0; // Skip sorting for invalid dates
        }
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}
// Check if records exist in localStorage, otherwise initialize an empty array
let records = JSON.parse(localStorage.getItem('records')) || [];

// Function to save records to localStorage
function saveRecords() {
    localStorage.setItem('records', JSON.stringify(records));
}

// Function to calculate the total amount
function calculateTotalAmount() {
    const total = records.reduce((sum, record) => sum + parseFloat(record.amount), 0);
    return total.toFixed(2); // Format to 2 decimal places
}

// Function to update the total amount display
function updateTotalAmount() {
    const totalAmountElementAdmin = document.getElementById('totalAmount');
    const totalAmountElementUser = document.getElementById('totalAmount');
    
    if (totalAmountElementAdmin) {
        totalAmountElementAdmin.textContent = calculateTotalAmount();
    }
    if (totalAmountElementUser) {
        totalAmountElementUser.textContent = calculateTotalAmount();
    }
}

// Pagination Variables
let currentPage = 1;
const rowsPerPage = 9;

// Function to update the table with pagination
function updateTable() {
    const tableBodyAdmin = document.getElementById('recordTable');
    const tableBodyUser = document.getElementById('userRecordTable');
    const pageInfo = document.getElementById('pageInfo');

    // Calculate the range of rows to display
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRecords = records.slice(startIndex, endIndex);

    // Update Admin Table
    if (tableBodyAdmin) {
        tableBodyAdmin.innerHTML = '';
        paginatedRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.description}</td>
                <td>${record.amount}</td>
                <td>${record.date}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editRecord(${record.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord(${record.id})">Delete</button>
                </td>
            `;
            tableBodyAdmin.appendChild(row);
        });
    }

    // Update User Table
    if (tableBodyUser) {
        tableBodyUser.innerHTML = '';
        paginatedRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.description}</td>
                <td>${record.amount}</td>
                <td>${record.date}</td>
            `;
            tableBodyUser.appendChild(row);
        });
    }

    // Update Page Info
    if (pageInfo) {
        const totalPages = Math.ceil(records.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

// Function to go to the previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
}

// Function to go to the next page
function nextPage() {
    const totalPages = Math.ceil(records.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
    }
}

// Admin Page: Add Record
if (document.getElementById('incomeForm')) {
    document.getElementById('incomeForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        const record = {
            id: Date.now(),
            description,
            amount,
            date
        };

        records.push(record);
        saveRecords();
        updateTable();
        updateTotalAmount();
        document.getElementById('incomeForm').reset();
    });
}

// Edit Record
function editRecord(id) {
    const record = records.find(record => record.id === id);
    if (record) {
        document.getElementById('description').value = record.description;
        document.getElementById('amount').value = record.amount;
        document.getElementById('date').value = record.date;

        records = records.filter(record => record.id !== id);
        saveRecords();
        updateTable();
        updateTotalAmount();
    }
}

// Delete Record
function deleteRecord(id) {
    records = records.filter(record => record.id !== id);
    saveRecords();
    updateTable();
    displayUserRecords(); // Update user page if open
    updateTotalAmount();
}

// Print Records
function printRecords() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Income Records</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Income Records</h1>');
    printWindow.document.write('<table class="table table-bordered">');
    printWindow.document.write('<thead><tr><th>Description</th><th>Amount</th><th>Date</th></tr></thead>');
    printWindow.document.write('<tbody>');
    
    records.forEach(record => {
        printWindow.document.write(`<tr><td>${record.description}</td><td>${record.amount}</td><td>${record.date}</td></tr>`);
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Initialize
updateTable(); // Display the first page of records
updateTotalAmount();