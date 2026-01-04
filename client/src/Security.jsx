import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./api";
import QrScanner from "qr-scanner";

// IMPORTANT for Vite: point to worker file
QrScanner.WORKER_PATH = new URL(
  "qr-scanner/qr-scanner-worker.min.js",
  import.meta.url
).toString();

export default function Security() {
  // ======================
  // ACTIVE VISITS TABLE
  // ======================
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (e) {
      alert(e.message);
    }
  }

  // ======================
  // CSV DOWNLOAD
  // ======================
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
      alert(e.message || "CSV export failed");
    }
  }

  // ======================
  // VERIFY TOKEN (API)
  // ======================
  const [tokenInput, setTokenInput] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function verifyToken(token) {
    const clean = (token || "").trim();
    if (!clean) {
      setVerifyError("Please paste a token first.");
      setVerifyResult(null);
      return;
    }

    setVerifying(true);
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
      setVerifying(false);
    }
  }

  function clearVerify() {
    setTokenInput("");
    setVerifyResult(null);
    setVerifyError("");
  }

  async function checkoutVerifiedVisit() {
    if (!verifyResult?.visit_id) return;
    if (verifyResult.status !== "ACTIVE") return;

    if (!confirm("Check out this visit?")) return;

    try {
      const res = await fetch(`${API_BASE}/visits/${verifyResult.visit_id}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      // refresh both areas
      await verifyToken(verifyResult.qr_token);
      loadActive();
    } catch (e) {
      alert(e.message);
    }
  }

  // ======================
  // UPLOAD QR IMAGE (NO CAMERA)
  // ======================
  const fileInputRef = useRef(null);

  async function handleUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifyError("");
    setVerifyResult(null);

    try {
      // scanImage can read File directly
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const scannedText = (result?.data || "").trim();

      if (!scannedText) throw new Error("QR not detected. Try a clearer image.");

      setTokenInput(scannedText);
      await verifyToken(scannedText);
    } catch (err) {
      setVerifyError(err?.message || "Failed to read QR from image.");
    } finally {
      // allow uploading the same file again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ======================
  // UI
  // ======================
  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Security Dashboard</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={loadActive}>Refresh</button>
        <button onClick={downloadCSV}>Download CSV</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* VERIFY QR TOKEN */}
      <div
        style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid #444",
          borderRadius: 10,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Verify QR Token</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            style={{ flex: "1 1 420px", minWidth: 280 }}
            placeholder="Paste QR token here..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />

          <button onClick={() => verifyToken(tokenInput)} disabled={verifying}>
            {verifying ? "Verifying..." : "Verify"}
          </button>

          <button onClick={clearVerify}>Clear</button>

          {/* UPLOAD IMAGE BUTTON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload a QR image (PNG/JPG) and auto-read it"
          >
            Upload QR Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            style={{ display: "none" }}
          />
        </div>

        {verifyError && <p style={{ color: "red", marginTop: 12 }}>{verifyError}</p>}

        {verifyResult && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              border: "1px solid #555",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <b>Result:</b>{" "}
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid #666",
                    marginLeft: 8,
                  }}
                >
                  Status: {verifyResult.status}
                </span>
                <span style={{ marginLeft: 16 }}>
                  <b>Visit ID:</b> {verifyResult.visit_id}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12, lineHeight: 1.8 }}>
              <div>
                <b>Visitor:</b> {verifyResult.visitor_name}
                {verifyResult.company ? ` (${verifyResult.company})` : ""}
              </div>
              <div>
                <b>Phone:</b> {verifyResult.phone || "-"}
              </div>
              <div>
                <b>Host:</b> {verifyResult.host_name} ({verifyResult.host_email})
              </div>
              <div>
                <b>Purpose:</b> {verifyResult.purpose}
              </div>
              <div>
                <b>Check-in:</b> {verifyResult.check_in_at}
              </div>
              <div>
                <b>Check-out:</b> {verifyResult.check_out_at || "-"}
              </div>
              <div>
                <b>Token:</b> <code>{verifyResult.qr_token}</code>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {verifyResult.status === "ACTIVE" ? (
                <button onClick={checkoutVerifiedVisit}>Check Out This Visit</button>
              ) : (
                <span style={{ opacity: 0.8 }}>Already checked out ✅</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE VISITS TABLE */}
      <div style={{ marginTop: 22 }}>
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
    </div>
  );
}
