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
      const res = await fetch(`${API_BASE}/hosts/${id}/disable`, { method: "POST" });
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
      const res = await fetch(`${API_BASE}/hosts/${id}/enable`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enable failed");
      loadHosts();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container" style={{ padding: 0 }}>
      <h1 className="pageTitle">Admin Dashboard</h1>
      <p className="pageDesc">
        Manage hosts (add, enable/disable). Disabled hosts remain in the system but will not appear in the Kiosk host dropdown.
      </p>

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Add Host</div>
          <div className="cardHint">
            Create a new host record (default: ACTIVE).
          </div>

          <form onSubmit={addHost} className="formGrid">
            <input
              className="input"
              placeholder="Full name *"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
            <input
              className="input"
              placeholder="Email *"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />

            <div className="actions" style={{ gridColumn: "1 / -1" }}>
              <button className="btn primary block" type="submit">
                Add Host
              </button>
            </div>
          </form>

          {error && <div className="noteError">{error}</div>}
        </div>

        <div className="card">
          <div className="cardTitle">Tip</div>
          <p className="cardHint">
            Keeping disabled hosts visible helps auditing and prevents data loss.
            Use Enable/Disable to control availability without deleting records.
          </p>
          <div className="small">
            Kiosk uses <code>GET /hosts</code> (active only). Admin uses <code>GET /hosts/all</code>.
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={loadHosts}>Refresh</button>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="splitRow">
          <div className="cardTitle" style={{ margin: 0 }}>All Hosts</div>
          <div className="cardHint" style={{ margin: 0 }}>
            {loading ? "Loading..." : `${hosts.length} total`}
          </div>
        </div>

        {!loading && hosts.length === 0 && <p className="cardHint">No hosts yet.</p>}

        {hosts.length > 0 && (
          <div className="tableWrap">
            <table>
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
                    <td>
                      {h.is_active ? (
                        <span className="badge good">ACTIVE</span>
                      ) : (
                        <span className="badge bad">DISABLED</span>
                      )}
                    </td>
                    <td>
                      {h.is_active ? (
                        <button className="btn bad" onClick={() => disableHost(h.id)}>
                          Disable
                        </button>
                      ) : (
                        <button className="btn good" onClick={() => enableHost(h.id)}>
                          Enable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
