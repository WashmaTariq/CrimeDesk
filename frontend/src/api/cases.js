import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "x-api-key": "crimedesk-secret-key-2026"
  }
});

export const getCases          = ()           => API.get("/cases");
export const createCase        = (data)       => API.post("/cases", data);
export const updateCaseStatus  = (id, status) => API.put(`/cases/${id}/status`, { status });
export const deleteCase        = (id)         => API.delete(`/cases/${id}`);

/* ── Aggregation stat endpoints ── */
export const getStatsSeverity  = () => API.get("/cases/stats/severity");
export const getStatsType      = () => API.get("/cases/stats/type");
export const getStatsStatus    = () => API.get("/cases/stats/status");
export const getStatsMonthly   = () => API.get("/cases/stats/monthly");

/* ── Officers ── */
export const getOfficers       = ()     => API.get("/officers");
export const createOfficer     = (data) => API.post("/officers", data);
export const deleteOfficer     = (id)   => API.delete(`/officers/${id}`);