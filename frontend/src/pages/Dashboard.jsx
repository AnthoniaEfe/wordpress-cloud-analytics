import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    api("/sites")
      .then(({ sites: s }) => {
        setSites(s || []);
        if (s?.length && !selectedSiteId) setSelectedSiteId(s[0]._id);
      })
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSiteId) {
      setEngagement(null);
      setPerformance(null);
      setSeo(null);
      return;
    }
    setMetricsLoading(true);
    Promise.all([
      api(`/analytics/engagement/${selectedSiteId}`).then((r) => r.data).catch(() => null),
      api(`/analytics/performance/${selectedSiteId}`).then((r) => r.data).catch(() => null),
      api(`/analytics/seo/${selectedSiteId}`).then((r) => r.data).catch(() => null),
    ])
      .then(([eng, perf, s]) => {
        setEngagement(eng);
        setPerformance(perf);
        setSeo(s);
      })
      .finally(() => setMetricsLoading(false));
  }, [selectedSiteId]);

  const selectedSite = sites.find((s) => s._id === selectedSiteId);
  const commentChartData = engagement?.mostCommentedPosts?.slice(0, 8).map((p, i) => ({
    name: `Post ${p.id}`,
    comments: p.comment_count,
    fill: COLORS[i % COLORS.length],
  })) || [];
  const seoPieData = seo
    ? [
        { name: "OK", value: Math.max(0, (seo.seoScore || 0)), color: "#22c55e" },
        { name: "Issues", value: 100 - (seo.seoScore || 0), color: "#ef4444" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>WordPress Cloud Analytics</h1>
          <p className="header-user">{user?.email}</p>
        </div>
        <div className="header-actions">
          <Link to="/sites/new" className="btn-primary">Add site</Link>
          <button type="button" className="btn-secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {loading ? (
        <p className="loading">Loading sites…</p>
      ) : sites.length === 0 ? (
        <div className="empty-state">
          <p>No WordPress sites connected.</p>
          <Link to="/sites/new" className="btn-primary">Add your first site</Link>
        </div>
      ) : (
        <>
          <div className="site-picker">
            <label>Site:</label>
            <select
              value={selectedSiteId || ""}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              {sites.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {metricsLoading ? (
            <p className="loading">Loading metrics…</p>
          ) : (
            <div className="dashboard-grid">
              {engagement && (
                <section className="card chart-card">
                  <h2>Engagement</h2>
                  <p className="metric-summary">
                    {engagement.totalPosts} posts · {engagement.totalComments} comments
                  </p>
                  {commentChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={commentChartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="comments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </section>
              )}

              {performance && (
                <section className="card chart-card">
                  <h2>Performance</h2>
                  <div className="gauge-wrap">
                    <div
                      className="gauge"
                      style={{
                        background: `conic-gradient(#22c55e 0% ${performance.performanceScore || 0}%, #e5e7eb ${performance.performanceScore || 0}% 100%)`,
                      }}
                    >
                      <span className="gauge-value">{performance.performanceScore ?? "—"}</span>
                    </div>
                    <p className="gauge-label">PageSpeed score</p>
                    {performance.loadTime != null && (
                      <p className="gauge-extra">FCP: {performance.loadTime}s</p>
                    )}
                  </div>
                </section>
              )}

              {seo && (
                <section className="card chart-card">
                  <h2>SEO health</h2>
                  <div className="seo-score">{seo.seoScore ?? "—"}</div>
                  <p className="seo-detail">
                    Missing meta: {seo.missingMetaDescriptions} · Long titles: {seo.longTitles} · Alt issues: {seo.imageAltIssues}
                  </p>
                  {seoPieData.length > 0 && (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={seoPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          label={({ name, value }) => `${name} ${value}`}
                        >
                          {seoPieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
