import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import {
  getCases, createCase, updateCaseStatus, deleteCase,
  getStatsSeverity, getStatsType, getStatsStatus, getStatsMonthly,
  getOfficers, createOfficer, deleteOfficer
} from "./api/cases";

const socket = io("http://localhost:5000");

/* ── STYLE MAPS ── */
const SEV = {
  high:   { text: "text-red-400",    bg: "bg-red-500",    softBg: "bg-red-500/10",    border: "border-red-500/30",    bar: "#ef4444" },
  medium: { text: "text-yellow-400", bg: "bg-yellow-400", softBg: "bg-yellow-500/10", border: "border-yellow-500/30", bar: "#eab308" },
  low:    { text: "text-green-400",  bg: "bg-green-500",  softBg: "bg-green-500/10",  border: "border-green-500/30",  bar: "#22c55e" }
};

const STATUS_STYLE = {
  "reported":            "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "under investigation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "resolved":            "bg-green-500/10 text-green-400 border-green-500/20"
};

const OFFICER_STATUS_STYLE = {
  "available": "bg-green-500/10 text-green-400 border-green-500/20",
  "busy":      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "off-duty":  "bg-gray-500/10 text-gray-400 border-gray-500/20"
};

const SPEC_STYLE = {
  "cybercrime":    "bg-pink-500/10 text-pink-400",
  "physical crime":"bg-blue-500/10 text-blue-400",
  "general":       "bg-purple-500/10 text-purple-400"
};

const TT = {
  backgroundColor: "#0d0d14",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#e5e7eb"
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  }) : "—";

/* ══════════════════════════════════════════
   APP
══════════════════════════════════════════ */
export default function App() {
  const [cases,      setCases]      = useState([]);
  const [officers,   setOfficers]   = useState([]);
  const [page,       setPage]       = useState("dashboard");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* officer modal */
  const [officerModalOpen,  setOfficerModalOpen]  = useState(false);
  const [officerSubmitting, setOfficerSubmitting] = useState(false);
  const EMPTY_OFFICER = { name: "", badgeNumber: "", specialization: "cybercrime", status: "available" };
  const [officerForm, setOfficerForm] = useState(EMPTY_OFFICER);
  const setOf = (k, v) => setOfficerForm(p => ({ ...p, [k]: v }));

  /* aggregation stats */
  const [sevStats,     setSevStats]     = useState({ low: 0, medium: 0, high: 0 });
  const [typeStats,    setTypeStats]    = useState({ cybercrime: 0, physicalCrime: 0 });
  const [statusStats,  setStatusStats]  = useState({ reported: 0, investigating: 0, resolved: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);

  /* filters */
  const [fType,     setFType]     = useState("all");
  const [fSeverity, setFSeverity] = useState("all");
  const [fStatus,   setFStatus]   = useState("all");

  /* case form */
  const EMPTY = { type: "cybercrime", subtype: "fraud", description: "", reporterName: "", digitalEvidence: "" };
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── fetch stats ── */
  const loadStats = async () => {
    try {
      const [sev, type, status, monthly] = await Promise.all([
        getStatsSeverity(),
        getStatsType(),
        getStatsStatus(),
        getStatsMonthly()
      ]);
      setSevStats(sev.data);
      setTypeStats(type.data);
      setStatusStats(status.data);
      setMonthlyStats(monthly.data);
    } catch (e) { console.error(e); }
  };

  /* ── fetch officers ── */
  const loadOfficers = async () => {
    try {
      const res = await getOfficers();
      setOfficers(res.data);
    } catch (e) { console.error(e); }
  };

  /* ── initial load ── */
  useEffect(() => {
    getCases().then(r => setCases(r.data)).catch(console.error);
    loadStats();
    loadOfficers();

    socket.on("new-case",     c  => { setCases(p => [c, ...p]); loadStats(); });
    socket.on("case-updated", c  => { setCases(p => p.map(x => x._id === c._id ? c : x)); loadStats(); });
    socket.on("case-deleted", id => { setCases(p => p.filter(x => x._id !== id)); loadStats(); });

    return () => {
      socket.off("new-case");
      socket.off("case-updated");
      socket.off("case-deleted");
    };
  }, []);

  /* ── submit case ── */
  const handleSubmit = async () => {
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      await createCase({
        ...form,
        digitalEvidence: form.digitalEvidence.split(",").map(s => s.trim()).filter(Boolean)
      });
      setModalOpen(false);
      setForm(EMPTY);
    } catch (e) { console.error(e); }
    finally    { setSubmitting(false); }
  };

  /* ── submit officer ── */
  const handleOfficerSubmit = async () => {
    if (!officerForm.name.trim() || !officerForm.badgeNumber.trim()) return;
    setOfficerSubmitting(true);
    try {
      await createOfficer(officerForm);
      setOfficerModalOpen(false);
      setOfficerForm(EMPTY_OFFICER);
      loadOfficers();
    } catch (e) { console.error(e); }
    finally    { setOfficerSubmitting(false); }
  };

  /* ── delete officer ── */
  const handleDeleteOfficer = async (id) => {
    try {
      await deleteOfficer(id);
      loadOfficers();
    } catch (e) { console.error(e); }
  };

  const handleStatus = async (id, status) => {
    try { await updateCaseStatus(id, status); } catch (e) { console.error(e); }
  };
  const handleDelete = async (id) => {
    try { await deleteCase(id); } catch (e) { console.error(e); }
  };

  /* ── chart data ── */
  const sevChartData  = [
    { name: "Low",    value: sevStats.low    },
    { name: "Medium", value: sevStats.medium },
    { name: "High",   value: sevStats.high   }
  ];
  const typeChartData = [
    { name: "Cyber",    value: typeStats.cybercrime    },
    { name: "Physical", value: typeStats.physicalCrime }
  ];

  const total    = cases.length;
  const filtered = cases.filter(c =>
    (fType     === "all" || c.type     === fType)     &&
    (fSeverity === "all" || c.severity === fSeverity) &&
    (fStatus   === "all" || c.status   === fStatus)
  );

  /* officer counts */
  const availableOfficers = officers.filter(o => o.status === "available").length;
  const busyOfficers      = officers.filter(o => o.status === "busy").length;
  const offDutyOfficers   = officers.filter(o => o.status === "off-duty").length;

  /* ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-white/10 px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-red-500 to-pink-600" />
          <span className="text-2xl font-black tracking-[0.25em]">CRIMEDESK</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:opacity-90 hover:scale-105 transition-all px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/30"
        >
          + Report Crime
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1">

        {/* ── SIDEBAR ── */}
        <aside className="w-56 shrink-0 bg-white/[0.03] border-r border-white/10 p-5 sticky top-[65px] h-[calc(100vh-65px)]">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-600 px-2 mb-4">System Menu</p>
          {[
            { id: "dashboard", label: "Dashboard"  },
            { id: "cases",     label: "Case Files" },
            { id: "officers",  label: "Officers"   }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1.5 font-semibold flex justify-between items-center transition-all ${
                page === item.id
                  ? "bg-gradient-to-r from-white/10 to-white/5 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {item.label}
              {page === item.id && <span className="w-2 h-2 rounded-full bg-white" />}
            </button>
          ))}
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 p-8 overflow-auto">

          {/* ════════════════
              DASHBOARD
          ════════════════ */}
          {page === "dashboard" && (
            <div className="space-y-6">

              {/* stat cards */}
              <div className="grid grid-cols-4 gap-5">
                {[
                  { label: "Total Cases",   val: total,                color: "text-white"     },
                  { label: "High Severity", val: sevStats.high,        color: "text-red-400"   },
                  { label: "Cybercrime",    val: typeStats.cybercrime, color: "text-pink-400"  },
                  { label: "Resolved",      val: statusStats.resolved, color: "text-green-400" }
                ].map(card => (
                  <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition">
                    <p className="text-sm font-semibold text-gray-500 mb-3">{card.label}</p>
                    <p className={`text-5xl font-black ${card.color}`}>{card.val}</p>
                  </div>
                ))}
              </div>

              {/* charts */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-5">Severity Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sevChartData} barCategoryGap="35%">
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={TT} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {sevChartData.map((_, i) => (
                          <Cell key={i} fill={["#22c55e", "#eab308", "#ef4444"][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-5">Crime Type Breakdown</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={typeChartData}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={TT} />
                      <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2.5} fill="url(#grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* monthly trend */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-5">Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyStats}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={13} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT} />
                    <Line
                      type="monotone" dataKey="total"
                      stroke="#818cf8" strokeWidth={2.5}
                      dot={{ fill: "#818cf8", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* status pipeline */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-5">Case Status Pipeline</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Reported",      val: statusStats.reported,      dot: "bg-gray-400",  text: "text-gray-300"  },
                    { label: "Investigating", val: statusStats.investigating, dot: "bg-blue-500",  text: "text-blue-400"  },
                    { label: "Resolved",      val: statusStats.resolved,      dot: "bg-green-500", text: "text-green-400" }
                  ].map(row => (
                    <div key={row.label} className="bg-white/5 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${row.dot}`} />
                        <span className="text-sm font-semibold text-gray-400">{row.label}</span>
                      </div>
                      <p className={`text-4xl font-black ${row.text}`}>{row.val}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {total ? Math.round((row.val / total) * 100) : 0}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ════════════════
              CASE FILES
          ════════════════ */}
          {page === "cases" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black mr-auto">
                  Case Files
                  <span className="ml-3 text-base font-normal text-gray-600">
                    {filtered.length} / {total}
                  </span>
                </h2>
                {[
                  { val: fType,     set: setFType,     opts: [["all","All Types"],["cybercrime","Cybercrime"],["physical crime","Physical"]] },
                  { val: fSeverity, set: setFSeverity, opts: [["all","All Severity"],["high","High"],["medium","Medium"],["low","Low"]] },
                  { val: fStatus,   set: setFStatus,   opts: [["all","All Status"],["reported","Reported"],["under investigation","Investigating"],["resolved","Resolved"]] }
                ].map((f, i) => (
                  <select
                    key={i}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-4 py-2 outline-none focus:border-white/20 transition cursor-pointer text-sm"
                  >
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-24 text-gray-700">
                  <p className="text-6xl mb-4">📂</p>
                  <p className="text-base">No cases match your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(c => {
                    const sty = SEV[c.severity] ?? SEV.low;
                    return (
                      <div
                        key={c._id}
                        className={`bg-white/5 border ${sty.border} rounded-2xl p-5 hover:bg-white/[0.07] transition group flex gap-4`}
                      >
                        <div className={`w-1 rounded-full shrink-0 ${sty.bg}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-base capitalize">{c.type}</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-400 capitalize">{c.subtype}</span>
                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${sty.softBg} ${sty.text}`}>
                              {c.severity}
                            </span>
                            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${STATUS_STYLE[c.status]}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed mb-3">{c.description}</p>
                          <div className="flex flex-wrap gap-5 text-xs text-gray-600 font-mono">
                            <span>CASE ID: {c._id.slice(-8).toUpperCase()}</span>
                            <span>REPORTER: {c.reporterName || "Anonymous"}</span>
                            <span>RISK: {c.riskScore}/10</span>
                            <span>REPORTED: {fmt(c.timestamps?.reported)}</span>
                            {c.timestamps?.resolved && (
                              <span>RESOLVED: {fmt(c.timestamps.resolved)}</span>
                            )}
                          </div>
                          {c.digitalEvidence?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {c.digitalEvidence.map((ev, i) => (
                                <span key={i} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-gray-500 truncate max-w-[220px]">
                                  {ev}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 justify-center">
                          {c.status === "reported" && (
                            <button
                              onClick={() => handleStatus(c._id, "under investigation")}
                              className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition whitespace-nowrap"
                            >
                              Investigate
                            </button>
                          )}
                          {c.status !== "resolved" && (
                            <button
                              onClick={() => handleStatus(c._id, "resolved")}
                              className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════
              OFFICERS
          ════════════════ */}
          {page === "officers" && (
            <div className="space-y-5">

              {/* header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">
                  Officers
                  <span className="ml-3 text-base font-normal text-gray-600">
                    {officers.length} total
                  </span>
                </h2>
                <button
                  onClick={() => setOfficerModalOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 hover:scale-105 transition-all px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg"
                >
                  + Add Officer
                </button>
              </div>

              {/* officer status summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Available", val: availableOfficers, dot: "bg-green-500",  text: "text-green-400"  },
                  { label: "On Case",   val: busyOfficers,      dot: "bg-yellow-400", text: "text-yellow-400" },
                  { label: "Off Duty",  val: offDutyOfficers,   dot: "bg-gray-500",   text: "text-gray-400"   }
                ].map(row => (
                  <div key={row.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${row.dot}`} />
                      <span className="text-sm font-semibold text-gray-400">{row.label}</span>
                    </div>
                    <p className={`text-4xl font-black ${row.text}`}>{row.val}</p>
                  </div>
                ))}
              </div>

              {/* officer list */}
              {officers.length === 0 ? (
                <div className="text-center py-24 text-gray-700">
                  <p className="text-6xl mb-4">👮</p>
                  <p className="text-base">No officers found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {officers.map(o => (
                    <div
                      key={o._id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition group flex items-center gap-4"
                    >
                      {/* avatar */}
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-black text-lg shrink-0">
                        {o.name.charAt(0)}
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-base">{o.name}</span>
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${OFFICER_STATUS_STYLE[o.status]}`}>
                            {o.status}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${SPEC_STYLE[o.specialization]}`}>
                            {o.specialization}
                          </span>
                        </div>
                        <div className="flex gap-5 text-xs text-gray-600 font-mono">
                          <span>BADGE: {o.badgeNumber}</span>
                          <span>ID: {o._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>

                      {/* delete */}
                      <button
                        onClick={() => handleDeleteOfficer(o._id)}
                        className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── REPORT MODAL ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-gray-950 border border-white/10 rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-7 py-6 border-b border-white/5">
              <h2 className="text-xl font-bold">Report Incident</h2>
            </div>
            <div className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Reporter Name</label>
                <input
                  value={form.reporterName}
                  onChange={e => set("reporterName", e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Crime Type</label>
                  <select
                    value={form.type}
                    onChange={e => set("type", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="cybercrime">Cybercrime</option>
                    <option value="physical crime">Physical Crime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Subtype</label>
                  <select
                    value={form.subtype}
                    onChange={e => set("subtype", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="fraud">Fraud</option>
                    <option value="theft">Theft</option>
                    <option value="intrusion">Intrusion</option>
                    <option value="vandalism">Vandalism</option>
                    <option value="harassment">Harassment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Describe the incident in detail..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder-gray-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                  Digital Evidence
                  <span className="ml-2 text-gray-600 font-normal text-xs">optional — comma separated</span>
                </label>
                <input
                  value={form.digitalEvidence}
                  onChange={e => set("digitalEvidence", e.target.value)}
                  placeholder="report.pdf, https://link.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                />
              </div>
              <p className="text-xs text-gray-600">
                Severity and risk score are auto-assigned by the system.
              </p>
            </div>
            <div className="px-7 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => { setModalOpen(false); setForm(EMPTY); }}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.description.trim()}
                className="px-7 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICER MODAL ── */}
      {officerModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOfficerModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-gray-950 border border-white/10 rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-7 py-6 border-b border-white/5">
              <h2 className="text-xl font-bold">Add Officer</h2>
            </div>
            <div className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Full Name</label>
                <input
                  value={officerForm.name}
                  onChange={e => setOf("name", e.target.value)}
                  placeholder="Inspector Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Badge Number</label>
                <input
                  value={officerForm.badgeNumber}
                  onChange={e => setOf("badgeNumber", e.target.value)}
                  placeholder="e.g. ISB-006"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Specialization</label>
                  <select
                    value={officerForm.specialization}
                    onChange={e => setOf("specialization", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="cybercrime">Cybercrime</option>
                    <option value="physical crime">Physical Crime</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5">Status</label>
                  <select
                    value={officerForm.status}
                    onChange={e => setOf("status", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="off-duty">Off Duty</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-7 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => { setOfficerModalOpen(false); setOfficerForm(EMPTY_OFFICER); }}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleOfficerSubmit}
                disabled={officerSubmitting || !officerForm.name.trim() || !officerForm.badgeNumber.trim()}
                className="px-7 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                {officerSubmitting ? "Adding…" : "Add Officer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}