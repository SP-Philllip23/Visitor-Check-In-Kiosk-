const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// database connection
const path = require("path");
const db = new Database(path.join(__dirname, "db", "visitor_kiosk.db"));

// =====================
// HEALTH CHECK
// =====================
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Visitor Check-In API running" });
});

// =====================
// ADMIN: ADD HOST
// =====================
app.post("/hosts", (req, res) => {
  const { full_name, email } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: "full_name and email required" });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO hosts (full_name, email) VALUES (?, ?)"
    );
    const result = stmt.run(full_name, email);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// KIOSK: VISITOR CHECK-IN
// =====================
app.post("/checkin", (req, res) => {
  const { full_name, company, phone, host_id, purpose } = req.body;

  if (!full_name || !host_id || !purpose) {
    return res.status(400).json({ error: "missing required fields" });
  }

  try {
    const visitorStmt = db.prepare(
      "INSERT INTO visitors (full_name, company, phone) VALUES (?, ?, ?)"
    );
    const visitor = visitorStmt.run(full_name, company, phone);

    const qr_token = crypto.randomUUID();

    const visitStmt = db.prepare(
      `INSERT INTO visits (visitor_id, host_id, purpose, qr_token)
       VALUES (?, ?, ?, ?)`
    );
    visitStmt.run(visitor.lastInsertRowid, host_id, purpose, qr_token);

    res.json({ success: true, qr_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SECURITY: ACTIVE VISITORS
// =====================
app.get("/visits/active", (req, res) => {
  const rows = db.prepare(`
    SELECT visits.id, visitors.full_name, visitors.company, visits.purpose, visits.check_in_at
    FROM visits
    JOIN visitors ON visitors.id = visits.visitor_id
    WHERE visits.check_out_at IS NULL
  `).all();

  res.json(rows);
});

// =====================
// SECURITY: CHECK-OUT
// =====================
app.post("/visits/:id/checkout", (req, res) => {
  db.prepare(
    "UPDATE visits SET check_out_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(req.params.id);

  res.json({ success: true });
});

// =====================
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`API running at http://localhost:${PORT}`)
);
