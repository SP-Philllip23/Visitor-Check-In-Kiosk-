// server/index.js

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// database connection (same DB used by init.js)
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
    // common error: UNIQUE constraint failed: hosts.email
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ADMIN: LIST ACTIVE HOSTS (for Kiosk dropdown)
// =====================
app.get("/hosts", (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, full_name, email FROM hosts WHERE is_active = 1 ORDER BY id DESC"
      )
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ADMIN: LIST ALL HOSTS (for Admin page)
// =====================
app.get("/hosts/all", (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, full_name, email, is_active, created_at FROM hosts ORDER BY id DESC"
      )
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ADMIN: DISABLE HOST
// =====================
app.post("/hosts/:id/disable", (req, res) => {
  try {
    const id = Number(req.params.id);
    const info = db
      .prepare("UPDATE hosts SET is_active = 0 WHERE id = ?")
      .run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Host not found" });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ADMIN: ENABLE HOST
// =====================
app.post("/hosts/:id/enable", (req, res) => {
  try {
    const id = Number(req.params.id);
    const info = db
      .prepare("UPDATE hosts SET is_active = 1 WHERE id = ?")
      .run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Host not found" });
    }

    res.json({ success: true, id });
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
    visitStmt.run(visitor.lastInsertRowid, Number(host_id), purpose, qr_token);

    res.json({ success: true, qr_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SECURITY: ACTIVE VISITORS
// =====================
app.get("/visits/active", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          visits.id,
          visitors.full_name,
          visitors.company,
          visits.purpose,
          visits.check_in_at,
          visits.qr_token
        FROM visits
        JOIN visitors ON visitors.id = visits.visitor_id
        WHERE visits.check_out_at IS NULL
        ORDER BY visits.id DESC
      `
      )
      .all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ✅ STEP A1: SECURITY: VERIFY QR TOKEN
// Goal: Security pastes/scans token -> get visit info + status
// =====================
app.get("/visits/verify/:token", (req, res) => {
  const token = req.params.token;

  if (!token) {
    return res.status(400).json({ error: "qr_token required" });
  }

  try {
    const row = db
      .prepare(
        `
        SELECT
          visits.id AS visit_id,
          visitors.full_name AS visitor_name,
          visitors.company AS company,
          visitors.phone AS phone,
          hosts.full_name AS host_name,
          hosts.email AS host_email,
          visits.purpose AS purpose,
          visits.check_in_at AS check_in_at,
          visits.check_out_at AS check_out_at,
          visits.qr_token AS qr_token,
          CASE
            WHEN visits.check_out_at IS NULL THEN 'ACTIVE'
            ELSE 'CHECKED_OUT'
          END AS status
        FROM visits
        JOIN visitors ON visitors.id = visits.visitor_id
        JOIN hosts ON hosts.id = visits.host_id
        WHERE visits.qr_token = ?
        ORDER BY visits.id DESC
        LIMIT 1
      `
      )
      .get(token);

    if (!row) {
      return res.status(404).json({ error: "Invalid token (visit not found)" });
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SECURITY: CHECK-OUT
// =====================
app.post("/visits/:id/checkout", (req, res) => {
  try {
    const id = Number(req.params.id);
    const info = db
      .prepare(
        "UPDATE visits SET check_out_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Visit not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// REPORTS: VISIT HISTORY
// =====================
app.get("/visits/history", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          visits.id AS id,
          visitors.full_name AS visitor_name,
          visitors.company AS company,
          visitors.phone AS phone,
          hosts.full_name AS host_name,
          hosts.email AS host_email,
          visits.purpose AS purpose,
          visits.check_in_at AS check_in_at,
          visits.check_out_at AS check_out_at,
          visits.qr_token AS qr_token
        FROM visits
        JOIN visitors ON visitors.id = visits.visitor_id
        JOIN hosts ON hosts.id = visits.host_id
        ORDER BY visits.id DESC
      `
      )
      .all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// DASHBOARD: STATS
// =====================
app.get("/stats", (req, res) => {
  try {
    const visitorsTodayRow = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM visits
        WHERE DATE(check_in_at) = DATE('now')
      `
      )
      .get();

    const avgRow = db
      .prepare(
        `
        SELECT AVG(
          (julianday(COALESCE(check_out_at, CURRENT_TIMESTAMP)) - julianday(check_in_at)) * 24 * 60
        ) AS avg_minutes
        FROM visits
        WHERE DATE(check_in_at) = DATE('now')
      `
      )
      .get();

    res.json({
      visitorsToday: visitorsTodayRow?.count || 0,
      avgVisitDurationMinutes: Number((avgRow?.avg_minutes || 0).toFixed(1)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// EXPORT: CSV
// =====================
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

app.get("/export/csv", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          visits.id AS visit_id,
          visitors.full_name AS visitor_name,
          visitors.company AS company,
          visitors.phone AS phone,
          hosts.full_name AS host_name,
          hosts.email AS host_email,
          visits.purpose AS purpose,
          visits.check_in_at AS check_in_at,
          visits.check_out_at AS check_out_at,
          visits.qr_token AS qr_token
        FROM visits
        JOIN visitors ON visitors.id = visits.visitor_id
        JOIN hosts ON hosts.id = visits.host_id
        ORDER BY visits.id DESC
      `
      )
      .all();

    const headers = [
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

    const lines = [];
    lines.push(headers.join(","));

    for (const r of rows) {
      lines.push(
        headers.map((h) => csvEscape(r[h])).join(",")
      );
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=visitor_logs.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
const PORT = 3001;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
