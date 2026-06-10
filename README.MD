# 💰 FinTrack - Personal Finance Management Platform

FinTrack is a full-stack personal finance management application that helps users track expenses, manage accounts, analyze spending habits, and gain financial insights through interactive dashboards and visualizations.

## 🚀 Features

### Authentication & Security

* User Registration and Login
* JWT-based Authentication
* Protected Routes
* Secure Password Hashing

### Dashboard Analytics

* Financial Overview
* Income vs Expense Analysis
* Category-wise Spending Breakdown
* Monthly Spending Trends
* Running Balance Tracking
* Interactive Charts & Visualizations

### Transaction Management

* View All Transactions
* Add Manual Transactions
* Delete Transactions
* Filter by:

  * Account
  * Transaction Type
  * Month
  * Year
* Pagination Support

### Account Management

* Create Multiple Accounts
* Savings Accounts
* Current Accounts
* Credit Accounts
* Digital Wallets
* Account Balance Tracking

### Smart Categorization

* Food & Dining
* Shopping
* Travel
* Transport
* Entertainment
* Education
* Health
* Bills & Utilities
* Other Categories

### File Upload & Processing

* Bank Statement Upload
* Transaction Parsing
* Automatic Categorization
* Financial Data Processing

### Responsive Design

* Mobile Friendly
* Tablet Friendly
* Desktop Optimized
* Modern UI/UX

---

## 🛠️ Tech Stack

### Frontend

* React.js
* React Router
* Axios
* Recharts
* React Hot Toast
* Lucide Icons
* Vite

### Backend

* Node.js
* Express.js
* JWT Authentication
* Multer
* Sequelize ORM

### Database

* MySQL

---

## 📊 Screenshots

### Dashboard

<img width="100%" src="./screenshots/dashboard.png" />

### Transactions

<img width="100%" src="./screenshots/transactions.png" />

### Accounts

<img width="100%" src="./screenshots/accounts.png" />

### Upload Statement

<img width="100%" src="./screenshots/upload.png" />

---

## 📂 Project Structure

```bash
FinTrack
│
├── frontend
│   ├── src
│   ├── pages
│   ├── components
│   ├── services
│   ├── context
│   └── utils
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── models
│   ├── services
│   └── uploads
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/fintrack.git
```

### Backend Setup

```bash
cd backend

npm install
```

Create `.env`

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fintrack

JWT_SECRET=your_secret_key
```

Run Backend

```bash
npm start
```

---

### Frontend Setup

```bash
cd frontend

npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Run Frontend

```bash
npm run dev
```

---

## 📈 Future Enhancements

* AI Financial Insights
* Budget Recommendations
* Expense Forecasting
* Email Reports
* Goal Tracking
* Investment Dashboard
* Recurring Transaction Detection
* OCR-Based Receipt Scanner

---

## 🎯 Learning Outcomes

Through this project I gained hands-on experience in:

* Full Stack Development
* REST API Design
* Authentication & Authorization
* Database Design
* Data Visualization
* Responsive UI Design
* State Management
* Financial Data Processing
* Error Handling
* Production-Level Project Structure

---

## 👨‍💻 Author

Prabhankar Tiwari

LinkedIn: https://linkedin.com/in/your-linkedin

GitHub: https://github.com/your-github

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.
