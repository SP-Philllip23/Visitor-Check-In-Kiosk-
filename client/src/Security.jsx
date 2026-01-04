import { useEffect, useState } from "react";
import { API_BASE } from "./api";

export default function Security() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Verify token states
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verified, setVerified] = useState(null);

  async function loadActive() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/visits/active`);
      const data = await res.json();
      setRows(data);
    } catch {
      setError("Failed to load active visits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActive();
  }, []);

  async function checkout(id) {
    if (!confirm("Check out this visitor?")) return;

    try {
      const res = await fetch(`${API_BASE}/visits/${id}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      // refresh table
      loadActive();

      // if we verified this same visit, refresh the verified status too
      if (verified?.visit_id === id && verified?.qr_token) {
        await verifyToken(verified.qr_token, { silent: true });
      }
    } catch (e) {
      alert(e.message);
    }
  }

  // ✅ Download CSV (works with your backend route)
  async function downloadCSV() {
    try {
      const res = await fetch(`${API_BASE}/visits/export`);
      if (!res.ok) throw new Error("CSV export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "visitor_logs.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  }

  // ✅ Verify token function
  async function verifyToken(qrToken, opts = {}) {
    const silent = opts.silent || false;

    if (!qrToken.trim()) {
      if (!silent) setVerifyError("Please paste a QR token first.");
      return;
    }

    setVerifying(true);
    setVerifyError("");
    if (!silent) setVerified(null);

    try {
      const res = await fetch(`${API_BASE}/visits/verify/${encodeURIComponent(qrToken.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Token not found");

      setVerified(data);
    } catch (e) {
      setVerifyError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  function clearVerify() {
    setToken("");
    setVerifyError("");
    setVerified(null);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Security Dashboard</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={loadActive}>Refresh</button>
        <button onClick={downloadCSV}>Download CSV</button>
      </div>

      {/* ✅ VERIFY QR TOKEN BOX */}
      <div
        style={{
          border: "1px solid #444",
          borderRadius: 12,
          padding: 16,
          marginBottom: 18,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Verify QR Token</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste QR token here..."
            style={{ flex: "1 1 420px", padding: 10 }}
          />
          <button onClick={() => verifyToken(token)} disabled={verifying}>
            {verifying ? "Verifying..." : "Verify"}
          </button>
          <button onClick={clearVerify} disabled={verifying}>
            Clear
          </button>
        </div>

        {verifyError && <p style={{ color: "red", marginTop: 10 }}>{verifyError}</p>}

        {verified && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #555",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <strong>Result:</strong>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #666",
                }}
              >
                Status: {verified.status}
              </span>
              <span>Visit ID: {verified.visit_id}</span>
            </div>

            <div style={{ marginTop: 10, lineHeight: 1.7 }}>
              <div>
                <strong>Visitor:</strong> {verified.visitor_name}{" "}
                {verified.company ? `(${verified.company})` : ""}
              </div>
              <div>
                <strong>Phone:</strong> {verified.phone || "-"}
              </div>
              <div>
                <strong>Host:</strong> {verified.host_name} ({verified.host_email})
              </div>
              <div>
                <strong>Purpose:</strong> {verified.purpose}
              </div>
              <div>
                <strong>Check-in:</strong> {verified.check_in_at}
              </div>
              <div>
                <strong>Check-out:</strong> {verified.check_out_at || "-"}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Token:</strong>{" "}
                <code style={{ wordBreak: "break-all" }}>{verified.qr_token}</code>
              </div>
            </div>

            {/* ✅ quick action */}
            <div style={{ marginTop: 12 }}>
              {verified.status === "ACTIVE" ? (
                <button onClick={() => checkout(verified.visit_id)}>Check Out This Visit</button>
              ) : (
                <span style={{ opacity: 0.8 }}>Already checked out ✅</span>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && rows.length === 0 && <p>No active visitors.</p>}

      {rows.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Visitor</th>
              <th>Company</th>
              <th>Purpose</th>
              <th>Check-in</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.full_name}</td>
                <td>{r.company || "-"}</td>
                <td>{r.purpose}</td>
                <td>{r.check_in_at}</td>
                <td>
                  <button onClick={() => checkout(r.id)}>Check Out</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
