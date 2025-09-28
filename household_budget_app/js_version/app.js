// データの保存と取得
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// DOM要素
const expenseForm = document.getElementById('expense-form');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const incomeElement = document.getElementById('income');
const expenseElement = document.getElementById('expense');
const balanceElement = document.getElementById('balance');
const historyBody = document.getElementById('history-body');

// 今日の日付をデフォルトに設定
dateInput.valueAsDate = new Date();

// フォーム送信時の処理
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 新しい取引データの作成
    const transaction = {
        id: generateID(),
        date: dateInput.value,
        category: categoryInput.value,
        amount: +amountInput.value,
        description: descriptionInput.value || '説明なし'
    };
    
    // データの保存
    transactions.push(transaction);
    saveTransactions();
    
    // フォームのリセット
    expenseForm.reset();
    dateInput.valueAsDate = new Date();
    
    // UI更新
    updateUI();
});

// ランダムIDの生成
function generateID() {
    return Math.floor(Math.random() * 1000000);
}

// トランザクションの保存
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// UI更新
function updateUI() {
    // 取引履歴の表示
    updateHistory();
    
    // 収支の計算と表示
    updateSummary();
}

// 取引履歴の更新
function updateHistory() {
    historyBody.innerHTML = '';
    
    // 日付の降順でソート
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // 金額の表示形式（収入は正、支出は負）
        const amount = transaction.category === '収入' 
            ? `+${transaction.amount.toLocaleString()}円` 
            : `-${transaction.amount.toLocaleString()}円`;
        
        // 金額の色
        const amountClass = transaction.category === '収入' ? 'income-amount' : 'expense-amount';
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description}</td>
            <td class="${amountClass}">${amount}</td>
            <td><button class="delete-btn" data-id="${transaction.id}">削除</button></td>
        `;
        
        historyBody.appendChild(row);
    });
    
    // 削除ボタンのイベント設定
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteTransaction);
    });
}

// 収支サマリーの更新
function updateSummary() {
    // 今月のデータのみをフィルタリング
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const thisMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === currentYear && 
               transactionDate.getMonth() === currentMonth;
    });
    
    // 収入計算
    const income = thisMonthTransactions
        .filter(transaction => transaction.category === '収入')
        .reduce((total, transaction) => total + transaction.amount, 0);
    
    // 支出計算
    const expense = thisMonthTransactions
        .filter(transaction => transaction.category !== '収入')
        .reduce((total, transaction) => total + transaction.amount, 0);
    
    // 残高計算
    const balance = income - expense;
    
    // 表示更新
    incomeElement.textContent = `${income.toLocaleString()}円`;
    expenseElement.textContent = `${expense.toLocaleString()}円`;
    balanceElement.textContent = `${balance.toLocaleString()}円`;
}

// トランザクション削除
function deleteTransaction(e) {
    const id = +e.target.getAttribute('data-id');
    
    // IDに一致する取引を除外
    transactions = transactions.filter(transaction => transaction.id !== id);
    
    // 保存と更新
    saveTransactions();
    updateUI();
}

// 日付フォーマット（YYYY-MM-DD を YYYY年MM月DD日 に変換）
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}年${month}月${day}日`;
}

// 初期表示
updateUI();