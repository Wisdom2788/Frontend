const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");

let transactions = [];
const API_URL = 'http://localhost:3002';

document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
});

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("token")) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("register-section").style.display = "none";
        document.getElementById("app-section").style.display = "block";
        const fullName = localStorage.getItem("fullName");
        document.getElementById("welcome-message").textContent = `Welcome ${fullName}`;
        loadTransactions();
    } else {
        document.getElementById("login-section").style.display = "block";
        document.getElementById("register-section").style.display = "none";
        document.getElementById("app-section").style.display = "none";
    }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const fullName = document.getElementById("reg-fullName").value;
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName }),
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById("register-section").style.display = "none";
            document.getElementById("login-section").style.display = "block";
            document.getElementById("register-error").style.display = "none";
        } else {
            document.getElementById("register-error").textContent = data.message || "Registration failed";
            document.getElementById("register-error").style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('fullName', data.user.fullName);
            console.log('Login token stored:', data.token); // Debug log
            document.getElementById("login-section").style.display = "none";
            document.getElementById("app-section").style.display = "block";
            document.getElementById("welcome-message").textContent = `Welcome ${data.user.fullName}`;
            loadTransactions();
        } else {
            document.getElementById("login-error").style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Load transactions from backend
async function loadTransactions() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/api/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
            transactions = data;
            updateTransactionList();
            updateSummary();
        } else {
            console.error('Error loading transactions:', await response.json());
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Add transaction
transactionFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found, please log in again');
        return;
    }
    console.log('Adding transaction:', { description, amount, token });
    try {
        const response = await fetch(`${API_URL}/api/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ description, amount }),
        });
        const data = await response.json();
        console.log('Response:', { status: response.status, data });
        if (response.ok) {
            transactions.push(data);
            updateTransactionList();
            updateSummary();
            transactionFormEl.reset();
        } else {
            console.error('Error adding transaction:', data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function updateTransactionList() {
    transactionListEl.innerHTML = "";
    const sortedTransactions = [...transactions].reverse();
    sortedTransactions.forEach((transaction) => {
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
            <button class="delete-btn" onclick="removeTransaction('${transaction._id}')">x</button>
        </span>
    `;
    return li;
}

function updateSummary() {
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
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(number);
}

function removeTransaction(id) {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(response => {
        if (response.ok) {
            transactions = transactions.filter(t => t._id !== id);
            updateTransactionList();
            updateSummary();
        } else {
            console.error('Error deleting transaction:', response.status);
        }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    document.getElementById("login-section").style.display = "block";
    document.getElementById("register-section").style.display = "none";
    document.getElementById("app-section").style.display = "none";
});