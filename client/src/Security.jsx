import { useEffect, useState } from "react";
import { API_BASE } from "./api";

export default function Security() {
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

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Security Dashboard</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={loadActive}>Refresh</button>
        <button
          onClick={() => window.open(`${API_BASE}/export/csv`, "_blank")}
        >
          Download CSV
        </button>
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
