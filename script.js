document.addEventListener('DOMContentLoaded', function() {
    // Initialize the table with 5 rows
    initializeTable();
    
    // Add event listeners
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    
    // Initialize Jotform integration if in Jotform environment
    if (typeof JotForm !== 'undefined') {
        setupJotformIntegration();
    }
});

function initializeTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // Create 5 initial rows
    for (let i = 0; i < 5; i++) {
        addRow();
    }
    
    // Update total initially
    updateGrandTotal();
}

function addRow() {
    const tableBody = document.getElementById('tableBody');
    const rowId = Date.now() + Math.random();
    
    const row = document.createElement('tr');
    row.id = `row-${rowId}`;
    row.innerHTML = `
        <td>
            <input type="number" 
                   min="1" 
                   value="1" 
                   class="quantity-input"
                   data-row="${rowId}">
        </td>
        <td>
            <textarea class="description-input auto-resize" 
                      placeholder="Enter item description..." 
                      data-row="${rowId}"
                      oninput="autoResizeTextarea(this)"></textarea>
        </td>
        <td>
            <textarea class="reason-input auto-resize" 
                      placeholder="Enter reason for request..." 
                      data-row="${rowId}"
                      oninput="autoResizeTextarea(this)"></textarea>
        </td>
        <td>
            <input type="url" 
                   class="link-input" 
                   placeholder="https://example.com/product"
                   data-row="${rowId}">
        </td>
        <td>
            <select class="organization-select" data-row="${rowId}">
                <option value="">Select Organization</option>
                <option value="org1">Organization 1</option>
                <option value="org2">Organization 2</option>
                <option value="org3">Organization 3</option>
                <option value="other">Other</option>
            </select>
        </td>
        <td>
            <input type="number" 
                   step="0.01" 
                   min="0" 
                   value="0.00" 
                   class="cost-input"
                   data-row="${rowId}">
        </td>
        <td class="row-total" id="row-total-${rowId}">$0.00</td>
        <td>
            <button type="button" 
                    class="delete-btn" 
                    onclick="deleteRow('${rowId}')"
                    ${document.querySelectorAll('#tableBody tr').length <= 1 ? 'disabled' : ''}>
                Delete
            </button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Add event listeners to inputs
    const inputs = row.querySelectorAll('.quantity-input, .cost-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            updateRowTotal(rowId);
            updateGrandTotal();
        });
        input.addEventListener('change', function() {
            updateRowTotal(rowId);
            updateGrandTotal();
        });
    });
    
    // Trigger initial calculation
    updateRowTotal(rowId);
    updateGrandTotal();
    
    // Enable delete buttons on all rows if we have more than 1 row
    if (document.querySelectorAll('#tableBody tr').length > 1) {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.disabled = false;
        });
    }
}

function deleteRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    if (row && document.querySelectorAll('#tableBody tr').length > 1) {
        row.remove();
        updateGrandTotal();
        
        // Disable delete button if only one row remains
        if (document.querySelectorAll('#tableBody tr').length === 1) {
            document.querySelector('.delete-btn').disabled = true;
        }
    }
}

function updateRowTotal(rowId) {
    const quantityInput = document.querySelector(`.quantity-input[data-row="${rowId}"]`);
    const costInput = document.querySelector(`.cost-input[data-row="${rowId}"]`);
    const rowTotalElement = document.getElementById(`row-total-${rowId}`);
    
    if (!quantityInput || !costInput || !rowTotalElement) return;
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const costPerItem = parseFloat(costInput.value) || 0;
    const rowTotal = quantity * costPerItem;
    
    rowTotalElement.textContent = formatCurrency(rowTotal);
}

function updateGrandTotal() {
    const rowTotalElements = document.querySelectorAll('.row-total');
    let grandTotal = 0;
    
    rowTotalElements.forEach(element => {
        const text = element.textContent.replace(/[^0-9.-]+/g, "");
        const value = parseFloat(text) || 0;
        grandTotal += value;
    });
    
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
    
    // Update Jotform hidden field if integration is set up
    if (window.jotformDataField) {
        updateJotformData();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Jotform Integration
function setupJotformIntegration() {
    // Create hidden input to store all data
    window.jotformDataField = document.createElement('input');
    window.jotformDataField.type = 'hidden';
    window.jotformDataField.name = 'order_table_data';
    window.jotformDataField.id = 'order_table_data';
    document.querySelector('.widget-container').appendChild(window.jotformDataField);
    
    // Initialize with empty data
    updateJotformData();
    
    // Set up mutation observer to watch for changes
    const observer = new MutationObserver(function() {
        updateJotformData();
    });
    
    observer.observe(document.getElementById('tableBody'), {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Also watch for input events
    document.addEventListener('input', function(e) {
        if (e.target.closest('#tableBody')) {
            updateJotformData();
        }
    });
}

function updateJotformData() {
    const rows = [];
    const rowElements = document.querySelectorAll('#tableBody tr');
    
    rowElements.forEach(row => {
        const rowId = row.id.replace('row-', '');
        const rowData = {
            quantity: document.querySelector(`.quantity-input[data-row="${rowId}"]`)?.value || '',
            description: document.querySelector(`.description-input[data-row="${rowId}"]`)?.value || '',
            reason: document.querySelector(`.reason-input[data-row="${rowId}"]`)?.value || '',
            link: document.querySelector(`.link-input[data-row="${rowId}"]`)?.value || '',
            organization: document.querySelector(`.organization-select[data-row="${rowId}"]`)?.value || '',
            costPerItem: document.querySelector(`.cost-input[data-row="${rowId}"]`)?.value || '',
            rowTotal: document.getElementById(`row-total-${rowId}`)?.textContent || ''
        };
        rows.push(rowData);
    });
    
    const data = {
        rows: rows,
        grandTotal: document.getElementById('grandTotal').textContent,
        timestamp: new Date().toISOString()
    };
    
    if (window.jotformDataField) {
        window.jotformDataField.value = JSON.stringify(data);
        
        // Trigger Jotform to update the field
        if (typeof JotForm !== 'undefined') {
            JotForm.triggerOnChange(window.jotformDataField);
        }
    }
    
    return data;
}

// Export functions for Jotform
window.getTableData = updateJotformData;
window.addTableRow = addRow;
