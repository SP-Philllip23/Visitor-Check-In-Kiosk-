import { useEffect, useState } from "react";
import { API_BASE } from "./api";

export default function Admin() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
  });

  async function loadHosts() {
    setError("");
    setLoading(true);
    try {
      // IMPORTANT: Admin must load ALL hosts
      const res = await fetch(`${API_BASE}/hosts/all`);
      const data = await res.json();
      setHosts(data);
    } catch {
      setError("Failed to load hosts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHosts();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function addHost(e) {
    e.preventDefault();
    setError("");

    if (!form.full_name || !form.email) {
      setError("Please enter full name and email.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/hosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add host failed");

      setForm({ full_name: "", email: "" });
      loadHosts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function disableHost(id) {
    if (!confirm("Disable this host?")) return;

    try {
      const res = await fetch(`${API_BASE}/hosts/${id}/disable`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Disable failed");

      loadHosts();
    } catch (e) {
      alert(e.message);
    }
  }

  async function enableHost(id) {
    if (!confirm("Enable this host?")) return;

    try {
      const res = await fetch(`${API_BASE}/hosts/${id}/enable`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enable failed");

      loadHosts();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Admin - Host Management</h1>

      <form
        onSubmit={addHost}
        style={{ display: "grid", gap: 10, maxWidth: 420 }}
      >
        <input
          placeholder="Full name *"
          value={form.full_name}
          onChange={(e) => updateField("full_name", e.target.value)}
        />
        <input
          placeholder="Email *"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
        <button type="submit">Add Host</button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <hr style={{ margin: "24px 0" }} />

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>All Hosts</h2>
        <button onClick={loadHosts}>Refresh</button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && hosts.length === 0 && <p>No hosts yet.</p>}

      {hosts.length > 0 && (
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
            {hosts.map((h) => (
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

      <p style={{ marginTop: 12, opacity: 0.8 }}>
        ✅ Disabled hosts will disappear from the Kiosk “Select host” dropdown (because Kiosk uses
        <code> GET /hosts</code> = active only).
      </p>
    </div>
  );
}
