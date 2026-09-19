const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "mukhija_doctor_token";
const ACTIVE_DOCTOR_KEY = "mukhija_active_doctor_id";

export function getDoctorToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setDoctorToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getActiveDoctorId() {
  try {
    return localStorage.getItem(ACTIVE_DOCTOR_KEY);
  } catch {
    return null;
  }
}

export function setActiveDoctorId(doctorId) {
  try {
    if (doctorId) localStorage.setItem(ACTIVE_DOCTOR_KEY, doctorId);
    else localStorage.removeItem(ACTIVE_DOCTOR_KEY);
  } catch {
    // ignore
  }
}

async function request(path, { method = "GET", body, token, formData, doctorId } = {}) {
  const headers = {};
  const auth = token ?? getDoctorToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const activeDoctorId = doctorId ?? getActiveDoctorId();
  if (activeDoctorId) headers["X-Doctor-Id"] = activeDoctorId;
  let payload = body;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  getServices: () => request("/services"),
  getDoctors: () => request("/doctors"),
  getAvailableSlots: ({ doctorId, date, serviceId }) => {
    const params = new URLSearchParams({ doctorId, date });
    if (serviceId) params.set("serviceId", serviceId);
    return request(`/appointments/available-slots?${params}`);
  },
  createAppointment: (payload, files = []) => {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    files.forEach((file) => formData.append("photos", file));
    return request("/appointments", { method: "POST", formData });
  },
  getAppointmentStatus: (token) => request(`/appointments/status/${token}`),
  cancelAppointmentByToken: (token, reason) =>
    request(`/appointments/cancel/${token}`, { method: "POST", body: { reason } }),
  acceptReschedule: (token) =>
    request(`/appointments/reschedule/${token}/accept`, { method: "POST", body: {} }),
  declineReschedule: (token, reason) =>
    request(`/appointments/reschedule/${token}/decline`, { method: "POST", body: { reason } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  doctorSummary: () => request("/doctor/dashboard/summary"),
  doctorAnalytics: (days = 30) => request(`/doctor/analytics?days=${days}`),
  doctorAppointments: (query = {}) => {
    const params = new URLSearchParams(query);
    const q = params.toString();
    return request(`/doctor/appointments${q ? `?${q}` : ""}`);
  },
  doctorPending: () => request("/doctor/appointments/pending"),
  doctorToday: () => request("/doctor/appointments/today"),
  doctorAppointment: (id) => request(`/doctor/appointments/${id}`),
  approveAppointment: (id, doctorNotes) =>
    request(`/doctor/appointments/${id}/approve`, { method: "POST", body: { doctorNotes } }),
  rejectAppointment: (id, reason) =>
    request(`/doctor/appointments/${id}/reject`, { method: "POST", body: { reason } }),
  rescheduleAppointment: (id, body) =>
    request(`/doctor/appointments/${id}/reschedule`, { method: "POST", body }),
  completeAppointment: (id, doctorNotes) =>
    request(`/doctor/appointments/${id}/complete`, { method: "POST", body: { doctorNotes } }),
  noShowAppointment: (id) => request(`/doctor/appointments/${id}/no-show`, { method: "POST", body: {} }),
  cancelAppointment: (id, reason) =>
    request(`/doctor/appointments/${id}/cancel`, { method: "POST", body: { reason } }),
  doctorAvailability: () => request("/doctor/availability"),
  createAvailability: (body) => request("/doctor/availability", { method: "POST", body }),
  patchAvailability: (id, body) => request(`/doctor/availability/${id}`, { method: "PATCH", body }),
  doctorNotifications: () => request("/doctor/notifications"),
  listStaff: () => request("/doctor/staff"),
  createStaff: (body) => request("/doctor/staff", { method: "POST", body }),
  patchStaff: (id, body) => request(`/doctor/staff/${id}`, { method: "PATCH", body }),
  deleteStaff: (id) => request(`/doctor/staff/${id}`, { method: "DELETE" }),
};

export async function fetchDoctorImageBlobUrl(imageId) {
  const token = getDoctorToken();
  const doctorId = getActiveDoctorId();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (doctorId) headers["X-Doctor-Id"] = doctorId;
  const response = await fetch(`${API_BASE}/doctor/images/${imageId}`, { headers });
  if (!response.ok) throw new Error("Unable to load image.");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
