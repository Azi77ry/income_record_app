const API_URL = 'http://localhost:5000/api/records'; // Backend API URL

// Pagination Variables
let currentPage = 1;
const rowsPerPage = 9;

// Fetch records from the server and sort them by date
async function fetchRecords() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch records');
        }
        const records = await response.json();

        // Sort records by date in ascending order
        records.sort((a, b) => new Date(a.date) - new Date(b.date));

        return records;
    } catch (error) {
        console.error('Error fetching records:', error);
        return [];
    }
}

// Add a record to the server
async function addRecord(record) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
        });
        if (!response.ok) {
            throw new Error('Failed to add record');
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding record:', error);
    }
}

// Delete a record from the server
async function deleteRecord(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete record');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
    }
}

// Update the table with records from the server
async function updateTable() {
    const records = await fetchRecords();
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
                    <button class="btn btn-warning btn-sm" onclick="editRecord('${record._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecordAndUpdate('${record._id}')">Delete</button>
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

    // Update Total Amount
    updateTotalAmount(records);
}

// Calculate and update the total amount
function updateTotalAmount(records) {
    const totalAmountElementAdmin = document.getElementById('totalAmount');
    const totalAmountElementUser = document.getElementById('totalAmount');

    const total = records.reduce((sum, record) => sum + parseFloat(record.amount), 0);
    const totalAmount = total.toFixed(2);

    if (totalAmountElementAdmin) {
        totalAmountElementAdmin.textContent = totalAmount;
    }
    if (totalAmountElementUser) {
        totalAmountElementUser.textContent = totalAmount;
    }
}

// Go to the previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
}

// Go to the next page
function nextPage() {
    const totalPages = Math.ceil(records.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
    }
}

// Delete a record and update the table
async function deleteRecordAndUpdate(id) {
    await deleteRecord(id);
    await updateTable();
}

// Edit a record
async function editRecord(id) {
    const records = await fetchRecords();
    const record = records.find(record => record._id === id);

    if (record) {
        document.getElementById('description').value = record.description;
        document.getElementById('amount').value = record.amount;
        document.getElementById('date').value = record.date;

        // Delete the old record
        await deleteRecordAndUpdate(id);
    }
}

// Add record form submission
if (document.getElementById('incomeForm')) {
    document.getElementById('incomeForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        const record = { description, amount, date };
        await addRecord(record);
        await updateTable();
        document.getElementById('incomeForm').reset();
    });
}

// Print records
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
updateTable();