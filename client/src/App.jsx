import { useEffect, useState } from "react";
import { API_BASE } from "./api";
import Security from "./Security";
import Admin from "./Admin";
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

      // Reset form after success
      setForm({
        full_name: "",
        company: "",
        phone: "",
        host_id: "",
        purpose: "",
      });

      // Reload hosts (in case admin disabled a host)
      setLoadingHosts(true);
      await loadHosts();
    } catch (e) {
      setError(e.message);
    }
  }

  function copyToken() {
    if (!result?.qr_token) return;
    navigator.clipboard.writeText(result.qr_token);
    alert("QR token copied!");
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setPage("kiosk")}>Kiosk</button>
        <button onClick={() => setPage("security")}>Security</button>
        <button onClick={() => setPage("admin")}>Admin</button>
      </div>

      {/* SECURITY PAGE */}
      {page === "security" && <Security />}

      {/* ADMIN PAGE */}
      {page === "admin" && <Admin />}

      {/* KIOSK PAGE */}
      {page === "kiosk" && (
        <>
          <h1>Visitor Check-In Kiosk</h1>

          {loadingHosts ? (
            <p>Loading hosts...</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
              <input
                placeholder="Full name *"
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
              />
              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />

              <select
                value={form.host_id}
                onChange={(e) => updateField("host_id", e.target.value)}
              >
                <option value="">Select host *</option>
                {hosts.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.full_name} ({h.email})
                  </option>
                ))}
              </select>

              <input
                placeholder="Purpose * (e.g., Meeting)"
                value={form.purpose}
                onChange={(e) => updateField("purpose", e.target.value)}
              />

              <button type="submit">Check In</button>
            </form>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* ✅ QR CODE RESULT */}
          {result?.qr_token && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                border: "1px solid #ccc",
                borderRadius: 10,
                display: "grid",
                gap: 12,
                alignItems: "center",
                maxWidth: 520,
              }}
            >
              <h3 style={{ margin: 0 }}>Check-in success ✅</h3>

              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{ background: "white", padding: 10, borderRadius: 8 }}>
                  <QRCodeCanvas value={result.qr_token} size={160} />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>QR Token</div>
                    <code style={{ wordBreak: "break-all" }}>{result.qr_token}</code>
                  </div>

                  <button type="button" onClick={copyToken}>
                    Copy Token
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                Security can scan/read this QR token later to verify the visit.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
