import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./api";

export default function Security() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Verify box
  const [token, setToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const fileInputRef = useRef(null);

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
      loadActive();

      // If the verified visit is the same one, refresh verify result too
      if (verifyResult?.visit_id === id) {
        await verifyToken(token);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function downloadCSV() {
    try {
      // your server supports these paths; this one is fine:
      const res = await fetch(`${API_BASE}/visits/export.csv`);
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

  async function verifyToken(t) {
    const clean = String(t || "").trim();
    if (!clean) {
      setVerifyError("Please paste a token first.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");
    setVerifyResult(null);

    try {
      const res = await fetch(`${API_BASE}/visits/verify/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token not found");

      setVerifyResult(data);
    } catch (e) {
      setVerifyError(e.message);
    } finally {
      setVerifyLoading(false);
    }
  }

  function clearVerify() {
    setToken("");
    setVerifyError("");
    setVerifyResult(null);
  }

  async function readQrFromImageFile(file) {
    // Uses BarcodeDetector (Chrome supports QR). No external library needed.
    if (!file) return;

    try {
      if (!("BarcodeDetector" in window)) {
        alert("QR image scan needs Chrome (BarcodeDetector not supported in this browser).");
        return;
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      // createImageBitmap is supported in modern browsers
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);

      if (!codes || codes.length === 0) {
        alert("No QR code found in this image. Try a clearer screenshot.");
        return;
      }

      const value = codes[0]?.rawValue || "";
      if (!value) {
        alert("QR code detected but token is empty.");
        return;
      }

      setToken(value);
      await verifyToken(value);
    } catch (e) {
      alert("Failed to read QR from image. Try a clearer image.");
    }
  }

  return (
    <div className="container">
      <div className="pageTitleRow">
        <div>
          <h1 className="pageTitle">Security Dashboard</h1>
          <p className="muted">
            Monitor active visitors, verify QR tokens, check out visits, and export logs.
          </p>
        </div>

        <div className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
          <button className="btn" onClick={loadActive}>
            Refresh
          </button>
          <button className="btn" onClick={downloadCSV}>
            Download CSV
          </button>
        </div>
      </div>

      {/* VERIFY */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Verify QR Token</h2>

        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Paste QR token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ flex: 1 }}
          />

          <button className="btn" onClick={() => verifyToken(token)} disabled={verifyLoading}>
            {verifyLoading ? "Verifying..." : "Verify"}
          </button>

          <button className="btn btnGhost" onClick={clearVerify}>
            Clear
          </button>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => readQrFromImageFile(e.target.files?.[0])}
          />
          <button className="btn btnGhost" onClick={() => fileInputRef.current?.click()}>
            Upload QR Image
          </button>
          <span className="muted" style={{ marginLeft: 10 }}>
            Tip: upload a screenshot/photo of the QR from Kiosk.
          </span>
        </div>

        {verifyError && <p style={{ color: "#ff6b6b", marginTop: 10 }}>{verifyError}</p>}

        {verifyResult && (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <b>Result:</b>
                <span className="pill">
                  Status: {verifyResult.status}
                </span>
                <span className="muted">Visit ID: {verifyResult.visit_id}</span>
              </div>
            </div>

            <div style={{ marginTop: 12, lineHeight: 1.9 }}>
              <div><b>Visitor:</b> {verifyResult.visitor_name} {verifyResult.company ? `(${verifyResult.company})` : ""}</div>
              <div><b>Phone:</b> {verifyResult.phone || "-"}</div>
              <div><b>Host:</b> {verifyResult.host_name} ({verifyResult.host_email})</div>
              <div><b>Purpose:</b> {verifyResult.purpose}</div>
              <div><b>Check-in:</b> {verifyResult.check_in_at}</div>
              <div><b>Check-out:</b> {verifyResult.check_out_at || "-"}</div>
              <div className="muted"><b>Token:</b> {verifyResult.qr_token}</div>
            </div>

            {verifyResult.status === "ACTIVE" ? (
              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={() => checkout(verifyResult.visit_id)}
              >
                Check Out This Visit
              </button>
            ) : (
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <span className="muted">Already checked out</span>
                <span>✅</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE VISITS */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Active Visitors</h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

        {!loading && rows.length === 0 && <p className="muted">No active visitors.</p>}

        {rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitor</th>
                <th>Company</th>
                <th>Purpose</th>
                <th>Check-in</th>
                <th style={{ width: 130 }}>Action</th>
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
                    <button className="btn" onClick={() => checkout(r.id)}>
                      Check Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
