import { useEffect, useState } from "react";
import { API_BASE } from "./api";

export default function Security() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Verify QR Token UI
  const [tokenInput, setTokenInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

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
      await loadActive();
    } catch (e) {
      alert(e.message);
    }
  }

  // ✅ FIXED: CSV download uses /export/csv (and backend also supports other aliases)
  async function downloadCSV() {
    try {
      const res = await fetch(`${API_BASE}/export/csv`);
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
      alert(e.message || "CSV export failed");
    }
  }

  async function verifyToken() {
    setVerifyError("");
    setVerifyResult(null);

    const t = tokenInput.trim();
    if (!t) {
      setVerifyError("Please paste a QR token first.");
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/visits/verify/${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verify failed");
      setVerifyResult(data);
    } catch (e) {
      setVerifyError(e.message);
    } finally {
      setVerifyLoading(false);
    }
  }

  function clearVerify() {
    setTokenInput("");
    setVerifyError("");
    setVerifyResult(null);
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Security Dashboard</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={loadActive}>Refresh</button>
        <button onClick={downloadCSV}>Download CSV</button>
      </div>

      {/* VERIFY SECTION */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Verify QR Token</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            style={{ flex: 1 }}
            placeholder="Paste QR token here..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button onClick={verifyToken} disabled={verifyLoading}>
            {verifyLoading ? "Verifying..." : "Verify"}
          </button>
          <button onClick={clearVerify}>Clear</button>
        </div>

        {verifyError && <p style={{ color: "red", marginTop: 10 }}>{verifyError}</p>}

        {verifyResult && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              border: "1px solid #444",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <strong>Result:</strong>
              <span style={{ padding: "4px 10px", border: "1px solid #666", borderRadius: 999 }}>
                Status: {verifyResult.status}
              </span>
              <span>Visit ID: {verifyResult.visit_id}</span>
            </div>

            <p style={{ marginTop: 10 }}>
              <strong>Visitor:</strong> {verifyResult.visitor_name} ({verifyResult.company || "-"})
            </p>
            <p>
              <strong>Phone:</strong> {verifyResult.phone || "-"}
            </p>
            <p>
              <strong>Host:</strong> {verifyResult.host_name} ({verifyResult.host_email})
            </p>
            <p>
              <strong>Purpose:</strong> {verifyResult.purpose}
            </p>
            <p>
              <strong>Check-in:</strong> {verifyResult.check_in_at}
            </p>
            <p>
              <strong>Check-out:</strong> {verifyResult.check_out_at || "-"}
            </p>

            <p>
              <strong>Token:</strong> {verifyResult.qr_token}
            </p>

            {!verifyResult.check_out_at ? (
              <button onClick={() => checkout(verifyResult.visit_id)} style={{ marginTop: 10 }}>
                Check Out This Visit
              </button>
            ) : (
              <p style={{ marginTop: 10, opacity: 0.8 }}>Already checked out ✅</p>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE VISITORS TABLE */}
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
