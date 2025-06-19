const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");

const API_URL = 'http://localhost:5000/api/transactions';

transactionFormEl.addEventListener("submit", addTransaction);

async function addTransaction(e) {
    e.preventDefault();

    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);

    if (!description || isNaN(amount)) {
        alert('Please enter a valid description and amount');
        return;
    }

    try {
        console.log('Sending POST:', { description, amount });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description, amount })
        });
        console.log('POST response status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add transaction');
        }
        transactionFormEl.reset();
        await fetchTransactions();
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction: ' + error.message);
    }
}

async function fetchTransactions() {
    try {
        console.log('Fetching transactions from:', API_URL);
        const response = await fetch(API_URL);
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch transactions');
        }
        const transactions = await response.json();
        console.log('Received transactions:', transactions);
        updateTransactionList(transactions);
        updateSummary(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        alert('Failed to fetch transactions: ' + error.message);
    }
}

function updateTransactionList(transactions) {
    transactionListEl.innerHTML = "";
    transactions.forEach((transaction) => {
        const transactionEl = createTransactionElement(transaction);
        transactionListEl.appendChild(transactionEl);
    });
}

function createTransactionElement(transaction) {
    const li = document.createElement("li");
    li.classList.add("transaction");
    li.classList.add(transaction.amount > 0 ? "income" : "expense");

    li.innerHTML = `
        <span>${transaction.description}</span>
        <span>
            ${formatCurrency(transaction.amount)}
            <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">Delete</button>
        </span>
    `;

    return li;
}

async function removeTransaction(id) {
    try {
        console.log('Deleting transaction:', id);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        console.log('DELETE response status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete transaction');
        }
        await fetchTransactions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction: ' + error.message);
    }
}

function updateSummary(transactions) {
    const balance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    const income = transactions
        .filter((transaction) => transaction.amount > 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);
    const expenses = transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);

    balanceEl.textContent = formatCurrency(balance);
    incomeAmountEl.textContent = formatCurrency(income);
    expenseAmountEl.textContent = formatCurrency(expenses);
}

function formatCurrency(number) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(number);
}

fetchTransactions();