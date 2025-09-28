// DOM Elements
const currentMonthElement = document.getElementById('current-month');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const totalIncomeElement = document.getElementById('total-income');
const totalExpenseElement = document.getElementById('total-expense');
const totalBalanceElement = document.getElementById('total-balance');
const transactionListElement = document.getElementById('transaction-list');
const addTransactionButton = document.getElementById('add-transaction');
const transactionModal = document.getElementById('transaction-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const closeModalButtons = document.querySelectorAll('.close-modal');
const transactionForm = document.getElementById('transaction-form');
const transactionDateInput = document.getElementById('transaction-date');
const transactionTypeInput = document.getElementById('transaction-type');
const transactionCategorySelect = document.getElementById('transaction-category');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionMemoInput = document.getElementById('transaction-memo');
const toggleButtons = document.querySelectorAll('.toggle-btn');

// Variables
let currentMonth = new Date();
let categories = [];
let expenseChart = null;

// Initialize the app
function init() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today;
    
    // Set current month display
    updateCurrentMonthDisplay();
    
    // Load categories
    loadCategories();
    
    // Load transactions for current month
    loadTransactions();
    
    // Load summary for current month
    loadSummary();
    
    // Event listeners
    setupEventListeners();
}

// Update the current month display
function updateCurrentMonthDisplay() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    currentMonthElement.textContent = `${year}年${month}月`;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}/${month}/${day}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(amount);
}

// Get current month in YYYY-MM format
function getCurrentMonthString() {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    
    return `${year}-${month}`;
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        
        updateCategorySelect('expense');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Update category select options based on transaction type
function updateCategorySelect(type) {
    // Clear existing options
    transactionCategorySelect.innerHTML = '';
    
    // Filter categories by type
    const filteredCategories = categories.filter(category => category.type === type);
    
    // Add options
    filteredCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        transactionCategorySelect.appendChild(option);
    });
}

// Load transactions for current month
async function loadTransactions() {
    try {
        const monthString = getCurrentMonthString();
        const response = await fetch(`/api/transactions?month=${monthString}`);
        const transactions = await response.json();
        
        renderTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Render transactions in the list
function renderTransactions(transactions) {
    // Clear existing transactions
    transactionListElement.innerHTML = '';
    
    if (transactions.length === 0) {
        // Show empty state
        transactionListElement.innerHTML = `
            <div class="empty-state">
                <i class="far fa-file-alt"></i>
                <p>まだ取引データがありません</p>
            </div>
        `;
        return;
    }
    
    // Add each transaction
    transactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.dataset.id = transaction.id;
        
        // Determine icon based on category
        let iconClass = 'fa-shopping-basket';
        if (transaction.category.includes('食')) iconClass = 'fa-utensils';
        else if (transaction.category.includes('交通')) iconClass = 'fa-car';
        else if (transaction.category.includes('住居')) iconClass = 'fa-home';
        else if (transaction.category.includes('光熱')) iconClass = 'fa-bolt';
        else if (transaction.category.includes('通信')) iconClass = 'fa-phone';
        else if (transaction.category.includes('趣味') || transaction.category.includes('娯楽')) iconClass = 'fa-gamepad';
        else if (transaction.category.includes('衣服') || transaction.category.includes('美容')) iconClass = 'fa-tshirt';
        else if (transaction.category.includes('医療') || transaction.category.includes('健康')) iconClass = 'fa-medkit';
        else if (transaction.category.includes('教育')) iconClass = 'fa-book';
        else if (transaction.category.includes('給料') || transaction.category.includes('収入')) iconClass = 'fa-money-bill-alt';
        
        // Determine background color based on type
        const bgColor = transaction.type === 'income' ? 'var(--secondary-color)' : 'var(--danger-color)';
        
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="category-icon" style="background-color: ${bgColor}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.category}</h4>
                    <p>${formatDate(transaction.date)}${transaction.memo ? ' · ' + transaction.memo : ''}</p>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon delete" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        transactionListElement.appendChild(transactionElement);
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.btn-icon.delete').forEach(button => {
        button.addEventListener('click', handleDeleteTransaction);
    });
}

// Load summary for current month
async function loadSummary() {
    try {
        const monthString = getCurrentMonthString();
        const response = await fetch(`/api/summary?month=${monthString}`);
        const summary = await response.json();
        
        // Update summary values
        totalIncomeElement.textContent = formatCurrency(summary.income);
        totalExpenseElement.textContent = formatCurrency(summary.expense);
        totalBalanceElement.textContent = formatCurrency(summary.balance);
        
        // Update chart
        updateExpenseChart(summary.categories);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Update expense chart
function updateExpenseChart(categories) {
    // Get chart canvas
    const chartCanvas = document.getElementById('expense-chart');
    
    // Destroy existing chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (categories.length === 0) {
        // No data to display
        return;
    }
    
    // Prepare chart data
    const labels = categories.map(item => item.category);
    const data = categories.map(item => item.amount);
    const backgroundColors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
        '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#27ae60',
        '#2980b9', '#8e44ad', '#c0392b', '#16a085'
    ];
    
    // Create chart
    expenseChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = transactionDateInput.value;
    const type = transactionTypeInput.value;
    const category = transactionCategorySelect.value;
    const amount = parseFloat(transactionAmountInput.value);
    const memo = transactionMemoInput.value;
    
    // Validate form
    if (!date || !category || isNaN(amount) || amount <= 0) {
        alert('全ての必須項目を入力してください');
        return;
    }
    
    // Create transaction data
    const transactionData = {
        date,
        type,
        category,
        amount,
        memo
    };
    
    try {
        // Send data to API
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Close modal
            closeModal();
            
            // Reset form
            transactionForm.reset();
            transactionDateInput.value = new Date().toISOString().split('T')[0];
            
            // Reload transactions and summary
            loadTransactions();
            loadSummary();
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('取引の追加に失敗しました。もう一度お試しください。');
    }
}

// Handle delete transaction
async function handleDeleteTransaction(e) {
    const transactionId = e.currentTarget.dataset.id;
    
    if (confirm('この取引を削除してもよろしいですか？')) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Reload transactions and summary
                loadTransactions();
                loadSummary();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('取引の削除に失敗しました。もう一度お試しください。');
        }
    }
}

// Show modal
function showModal() {
    transactionModal.style.display = 'block';
    modalOverlay.style.display = 'block';
}

// Close modal
function closeModal() {
    transactionModal.style.display = 'none';
    modalOverlay.style.display = 'none';
}

// Handle toggle buttons
function handleToggleButtonClick(e) {
    // Remove active class from all buttons
    toggleButtons.forEach(button => button.classList.remove('active'));
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Update hidden input value
    const value = e.target.dataset.value;
    transactionTypeInput.value = value;
    
    // Update category select
    updateCategorySelect(value);
}

// Handle previous month
function handlePrevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCurrentMonthDisplay();
    loadTransactions();
    loadSummary();
}

// Handle next month
function handleNextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCurrentMonthDisplay();
    loadTransactions();
    loadSummary();
}

// Setup event listeners
function setupEventListeners() {
    // Add transaction button
    addTransactionButton.addEventListener('click', showModal);
    
    // Close modal buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Modal overlay click
    modalOverlay.addEventListener('click', closeModal);
    
    // Form submission
    transactionForm.addEventListener('submit', handleFormSubmit);
    
    // Toggle buttons
    toggleButtons.forEach(button => {
        button.addEventListener('click', handleToggleButtonClick);
    });
    
    // Month navigation
    prevMonthButton.addEventListener('click', handlePrevMonth);
    nextMonthButton.addEventListener('click', handleNextMonth);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);