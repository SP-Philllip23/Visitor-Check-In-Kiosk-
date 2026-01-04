Visitor Check-In Kiosk System

A full-stack Visitor Check-In Kiosk System designed for offices, universities, and organizations to manage visitor registration, security verification, and host administration in a simple and secure way.

This project demonstrates frontend–backend integration, QR code–based verification, and real-world business features such as CSV export and role-based dashboards.

📌 Project Objectives

Allow visitors to check in easily using a kiosk interface

Improve security by verifying visitors with QR codes

Enable administrators to manage hosts without deleting records

Provide security staff with real-time visitor monitoring and reports

🚀 Features
🖥️ Kiosk (Visitor)

Visitor check-in form:

Full name

Company

Phone number

Host

Purpose of visit

Automatically generates a QR Code after check-in

QR token can be copied for later verification

Disabled hosts do NOT appear in the kiosk dropdown

🛡️ Security Dashboard

View all active visitors

Verify visits using QR token

Paste QR token

Upload QR image (PNG/JPG screenshot – no camera needed)

View detailed visit information:

Visitor name & company

Host name & email

Purpose

Check-in time

Check-out time

Visit status (ACTIVE / CHECKED_OUT)

Check out visitors

Export visit logs to CSV

Opens correctly in Microsoft Excel / Google Sheets

👨‍💼 Admin – Host Management

Add new hosts

Enable / Disable hosts

Disabled hosts:

Remain visible in Admin dashboard

Are hidden from the Kiosk

Prevents data loss and keeps visit history intact

🧱 Technology Stack
Frontend

React (Vite)

JavaScript (ES6)

HTML / CSS

Backend

Node.js

Express.js

SQLite (better-sqlite3)

Additional Tools

QR Code generation

QR Code verification (image upload)

RESTful API

CSV export

📂 Project Structure
Visitor-Check-In-Kiosk/
│
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Security.jsx
│   │   ├── Admin.jsx
│   │   └── api.js
│   └── package.json
│
├── server/                 # Backend (Express)
│   ├── db/
│   │   └── visitor_kiosk.db
│   ├── index.js
│   └── package.json
│
└── README.md               # Project documentation

▶️ How to Run the Project
1️⃣ Start Backend Server

Open terminal:

cd server
npm install
node index.js


Backend runs on:

http://localhost:3001

2️⃣ Start Frontend Client

Open a new terminal:

cd client
npm install
npm run dev


Frontend runs on:

http://localhost:5173

🔁 Demo Workflow (For Presentation)

Admin adds a host

Visitor checks in at the Kiosk

System generates a QR Code

Security verifies the visit using:

QR token OR

Uploaded QR image

Security checks out the visitor

Security exports visit data as CSV

📊 CSV Export Details

CSV file includes:

Visit ID

Visitor name

Company

Phone number

Host name & email

Purpose

Check-in time

Check-out time

QR token

Fully compatible with Excel and Google Sheets

Designed for reporting and audit purposes

✅ Key Highlights (For Grading)

Full CRUD functionality

Clean frontend–backend separation

Persistent data storage with SQLite

QR-based security verification

Business-ready reporting feature

Role-based dashboards (Kiosk / Security / Admin)

Real-world system design (no data deletion)

⚠️ Notes

QR scanning by camera may require HTTPS on some devices

QR image upload works without camera permission

Designed for educational and demonstration purposes

👤 Author

Sary Phillip
Senior Project
Asia-Pacific International University
Academic Year 2025–2026

📌 License

This project is for educational use only