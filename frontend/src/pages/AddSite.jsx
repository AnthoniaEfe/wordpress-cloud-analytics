import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function AddSite() {
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/sites", {
        method: "POST",
        body: JSON.stringify({ name, siteUrl, username, appPassword }),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to add site");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Add WordPress site</h1>
        <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </button>
      </header>
      <div className="card form-card">
        <p className="form-hint">
          Use your WordPress username and an Application Password (Users → Profile → Application Passwords).
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <label>
            Site name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Blog"
              required
            />
          </label>
          <label>
            Site URL
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </label>
          <label>
            WordPress username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Application password
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Connecting…" : "Add site"}
          </button>
        </form>
      </div>
    </div>
  );
}
