import { useEffect, useState } from "react";
import { API_BASE } from "./api";
import Security from "./Security";

export default function App() {
  const [page, setPage] = useState("kiosk");

  // KIOSK hosts (active only)
  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);

  // ADMIN hosts (all)
  const [adminHosts, setAdminHosts] = useState([]);
  const [loadingAdminHosts, setLoadingAdminHosts] = useState(false);
  const [adminError, setAdminError] = useState("");

  // KIOSK form
  const [form, setForm] = useState({
    full_name: "",
    company: "",
    phone: "",
    host_id: "",
    purpose: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // ADMIN add host form
  const [newHost, setNewHost] = useState({ full_name: "", email: "" });
  const [adminMsg, setAdminMsg] = useState("");

  async function loadHosts() {
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

  async function loadAdminHosts() {
    setLoadingAdminHosts(true);
    setAdminError("");
    try {
      const res = await fetch(`${API_BASE}/hosts/all`);
      const data = await res.json();
      setAdminHosts(data);
    } catch {
      setAdminError("Failed to load hosts list.");
    } finally {
      setLoadingAdminHosts(false);
    }
  }

  // load kiosk hosts first time
  useEffect(() => {
    loadHosts();
  }, []);

  // when switching to Admin tab, load admin list
  useEffect(() => {
    if (page === "admin") loadAdminHosts();
  }, [page]);

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
    } catch (e) {
      setError(e.message);
    }
  }

  async function addHost(e) {
    e.preventDefault();
    setAdminError("");
    setAdminMsg("");

    if (!newHost.full_name || !newHost.email) {
      setAdminError("Please fill full_name and email");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/hosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHost),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add host failed");

      setAdminMsg(`Host created ✅ (id: ${data.id})`);
      setNewHost({ full_name: "", email: "" });

      // refresh both admin list + kiosk dropdown
      await loadAdminHosts();
      await loadHosts();
    } catch (e) {
      setAdminError(e.message);
    }
  }

  async function disableHost(id) {
    if (!confirm("Disable this host? (They will disappear from kiosk list)")) return;

    setAdminError("");
    setAdminMsg("");

    try {
      const res = await fetch(`${API_BASE}/hosts/${id}/disable`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Disable failed");

      setAdminMsg("Host disabled ✅");
      await loadAdminHosts();
      await loadHosts();
    } catch (e) {
      setAdminError(e.message);
    }
  }

  async function enableHost(id) {
    if (!confirm("Enable this host?")) return;

    setAdminError("");
    setAdminMsg("");

    try {
      const res = await fetch(`${API_BASE}/hosts/${id}/enable`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enable failed");

      setAdminMsg("Host enabled ✅");
      await loadAdminHosts();
      await loadHosts();
    } catch (e) {
      setAdminError(e.message);
    }
  }

  const tabBtnStyle = (active) => ({
    padding: "10px 16px",
    borderRadius: 10,
    border: active ? "2px solid #fff" : "1px solid #555",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  });

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button style={tabBtnStyle(page === "kiosk")} onClick={() => setPage("kiosk")}>
          Kiosk
        </button>
        <button
          style={tabBtnStyle(page === "security")}
          onClick={() => setPage("security")}
        >
          Security
        </button>
        <button style={tabBtnStyle(page === "admin")} onClick={() => setPage("admin")}>
          Admin
        </button>
      </div>

      {/* SECURITY PAGE */}
      {page === "security" && <Security />}

      {/* ADMIN PAGE */}
      {page === "admin" && (
        <div style={{ maxWidth: 900 }}>
          <h1>Admin - Host Management</h1>

          <h3>Add Host</h3>
          <form onSubmit={addHost} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <input
              placeholder="Full name *"
              value={newHost.full_name}
              onChange={(e) => setNewHost((p) => ({ ...p, full_name: e.target.value }))}
            />
            <input
              placeholder="Email *"
              value={newHost.email}
              onChange={(e) => setNewHost((p) => ({ ...p, email: e.target.value }))}
            />
            <button type="submit">Add Host</button>
          </form>

          {adminError && <p style={{ color: "red" }}>{adminError}</p>}
          {adminMsg && <p style={{ color: "lightgreen" }}>{adminMsg}</p>}

          <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>All Hosts</h3>
            <button onClick={loadAdminHosts}>Refresh</button>
          </div>

          {loadingAdminHosts && <p>Loading...</p>}

          {!loadingAdminHosts && adminHosts.length === 0 && <p>No hosts yet.</p>}

          {adminHosts.length > 0 && (
            <table border="1" cellPadding="8" style={{ width: "100%", marginTop: 10 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {adminHosts.map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.full_name}</td>
                    <td>{h.email}</td>
                    <td>{h.is_active === 1 ? "ACTIVE" : "DISABLED"}</td>
                    <td>
                      {h.is_active === 1 ? (
                        <button onClick={() => disableHost(h.id)}>Disable</button>
                      ) : (
                        <button onClick={() => enableHost(h.id)}>Enable</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p style={{ marginTop: 16, opacity: 0.8 }}>
            ✅ Disabled hosts will disappear from the Kiosk “Select host” dropdown.
          </p>
        </div>
      )}

      {/* KIOSK PAGE */}
      {page === "kiosk" && (
        <>
          <h1>Visitor Check-In Kiosk</h1>

          {loadingHosts ? (
            <p>Loading hosts...</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
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

          {result?.qr_token && (
            <div style={{ marginTop: 20, padding: 12, border: "1px solid #ccc" }}>
              <h3>Check-in success ✅</h3>
              <p>QR Token:</p>
              <code>{result.qr_token}</code>
            </div>
          )}
        </>
      )}
    </div>
  );
}
