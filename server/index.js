const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// database connection
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
// ADMIN: LIST HOSTS
// =====================
app.get("/hosts", (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, full_name, email FROM hosts WHERE is_active = 1 ORDER BY id DESC"
    )
    .all();
  res.json(rows);
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
// ADMIN: VISIT HISTORY
// =====================
app.get("/visits/history", (req, res) => {
  const rows = db.prepare(`
    SELECT
      visits.id,
      visitors.full_name AS visitor_name,
      visitors.company,
      visitors.phone,
      hosts.full_name AS host_name,
      hosts.email AS host_email,
      visits.purpose,
      visits.check_in_at,
      visits.check_out_at,
      visits.qr_token
    FROM visits
    JOIN visitors ON visitors.id = visits.visitor_id
    JOIN hosts ON hosts.id = visits.host_id
    ORDER BY visits.id DESC
    LIMIT 200
  `).all();

  res.json(rows);
});

// =====================
// ADMIN: EXPORT CSV
// =====================
app.get("/export/csv", (req, res) => {
  const rows = db.prepare(`
    SELECT
      visits.id AS visit_id,
      visitors.full_name AS visitor_name,
      visitors.company,
      visitors.phone,
      hosts.full_name AS host_name,
      hosts.email AS host_email,
      visits.purpose,
      visits.check_in_at,
      visits.check_out_at,
      visits.qr_token
    FROM visits
    JOIN visitors ON visitors.id = visits.visitor_id
    JOIN hosts ON hosts.id = visits.host_id
    ORDER BY visits.id DESC
  `).all();

  const header = [
    "visit_id",
    "visitor_name",
    "company",
    "phone",
    "host_name",
    "host_email",
    "purpose",
    "check_in_at",
    "check_out_at",
    "qr_token",
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csv =
    header.join(",") +
    "\n" +
    rows.map(r => header.map(h => escape(r[h])).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="visitor_logs.csv"');
  res.send(csv);
});

// =====================
// ADMIN: BASIC STATS
// =====================
app.get("/stats", (req, res) => {
  const visitorsToday = db.prepare(`
    SELECT COUNT(*) AS count
    FROM visits
    WHERE date(check_in_at) = date('now')
  `).get().count;

  const avgDurationMinutes = db.prepare(`
    SELECT AVG((julianday(check_out_at) - julianday(check_in_at)) * 24 * 60) AS avg
    FROM visits
    WHERE check_out_at IS NOT NULL
  `).get().avg;

  res.json({
    visitorsToday,
    avgVisitDurationMinutes: avgDurationMinutes
      ? Number(avgDurationMinutes.toFixed(1))
      : 0
  });
});

// =====================
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`API running at http://localhost:${PORT}`)
);
