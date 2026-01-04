import { useEffect, useState } from "react";
import { API_BASE } from "./api";
import Security from "./Security";
import Admin from "./Admin";

// If you use qrcode.react, use this import style:
// npm i qrcode.react
import { QRCodeCanvas } from "qrcode.react";

export default function App() {
  const [page, setPage] = useState("kiosk");

  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);

  const [form, setForm] = useState({
    full_name: "",
    company: "",
    phone: "",
    host_id: "",
    purpose: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function loadHosts() {
    setError("");
    setLoadingHosts(true);

    try {
      const res = await fetch(`${API_BASE}/hosts`);
      const data = await res.json();
      setHosts(data);
    } catch {
      setError("Failed to load hosts. Is the server running on port 3001?");
    } finally {
      setLoadingHosts(false);
    }
  }

  useEffect(() => {
    loadHosts();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!form.full_name || !form.host_id || !form.purpose) {
      setError("Please fill: Full name, Host, Purpose");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          host_id: Number(form.host_id),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-in failed");

      setResult(data);
      setForm({
        full_name: "",
        company: "",
        phone: "",
        host_id: "",
        purpose: "",
      });

      // reload hosts in case admin disabled/enabled someone
      loadHosts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copyToken() {
    if (!result?.qr_token) return;
    try {
      await navigator.clipboard.writeText(result.qr_token);
      alert("Token copied!");
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  return (
    <div className="appShell">
      <div className="topNav">
        <button className={`tab ${page === "kiosk" ? "active" : ""}`} onClick={() => setPage("kiosk")}>
          Kiosk
        </button>
        <button className={`tab ${page === "security" ? "active" : ""}`} onClick={() => setPage("security")}>
          Security
        </button>
        <button className={`tab ${page === "admin" ? "active" : ""}`} onClick={() => setPage("admin")}>
          Admin
        </button>
      </div>

      {page === "security" && <Security />}
      {page === "admin" && <Admin />}

      {page === "kiosk" && (
        <div className="container">
          <div className="pageTitleRow">
            <div>
              <h1 className="pageTitle">Visitor Check-In Kiosk</h1>
              <p className="muted">Check in visitors and generate a QR token for verification.</p>
            </div>

            <button className="btn btnGhost" onClick={loadHosts}>
              Reload Hosts
            </button>
          </div>

          <div className="card">
            {loadingHosts ? (
              <p>Loading hosts...</p>
            ) : (
              <form onSubmit={handleSubmit} className="formGrid">
                <div className="field">
                  <label>Full name *</label>
                  <input
                    className="input"
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    placeholder="e.g., Sary Phillip"
                  />
                </div>

                <div className="field">
                  <label>Company</label>
                  <input
                    className="input"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="e.g., APIU"
                  />
                </div>

                <div className="field">
                  <label>Phone</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="e.g., 012345678"
                  />
                </div>

                <div className="field">
                  <label>Host *</label>
                  <select
                    className="input"
                    value={form.host_id}
                    onChange={(e) => updateField("host_id", e.target.value)}
                  >
                    <option value="">Select host</option>
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.full_name} ({h.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Purpose *</label>
                  <input
                    className="input"
                    value={form.purpose}
                    onChange={(e) => updateField("purpose", e.target.value)}
                    placeholder="e.g., Meeting"
                  />
                </div>

                <button className="btn" type="submit" style={{ gridColumn: "1 / -1" }}>
                  Check In
                </button>
              </form>
            )}

            {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
          </div>

          {result?.qr_token && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>Check-in success ✅</h2>
                <span className="muted">Security can verify this token later.</span>
              </div>

              <div className="row" style={{ gap: 20, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ background: "#fff", padding: 10, borderRadius: 12 }}>
                  <QRCodeCanvas value={result.qr_token} size={180} />
                </div>

                <div style={{ minWidth: 280 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>QR Token</div>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {result.qr_token}
                  </div>

                  <button className="btn" style={{ marginTop: 12 }} onClick={copyToken}>
                    Copy Token
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
