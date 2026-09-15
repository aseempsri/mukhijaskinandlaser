import { useEffect, useState } from "react";
import {
  api,
  fetchDoctorImageBlobUrl,
  getActiveDoctorId,
  getDoctorToken,
  setActiveDoctorId,
  setDoctorToken,
} from "../api";
import { withBase } from "../paths";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateLabel(isoDate) {
  if (!isoDate) return "—";
  const date = typeof isoDate === "string" && isoDate.includes("T")
    ? isoDate.slice(0, 10)
    : String(isoDate).slice(0, 10);
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").toLowerCase()}`}>{status}</span>;
}

function LoginPanel({ onSuccess }) {
  const [email, setEmail] = useState("doctor@mukhijaskinclinic.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email.trim(), password);
      setDoctorToken(data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="doctor-shell">
      <section className="page-hero">
        <div className="wrap wrap-narrow">
          <div className="eyebrow">Secure staff access</div>
          <h1>Doctor Dashboard</h1>
          <p className="lede">One clinic login for both doctors. After signing in, choose whose schedule to manage.</p>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap wrap-narrow">
          <form className="appointment-form" onSubmit={onSubmit}>
            <div className="stepper">Staff login</div>
            <div className="form-grid">
              <label className="full">
                Email
                <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="full">
                Password
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="hero-ctas">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <a className="btn btn-ghost" href={withBase("/")}>Back to site</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function AppointmentCard({ appointment, onSelect }) {
  const patient = appointment.patientId;
  const service = appointment.serviceId;
  return (
    <button type="button" className="dash-card" onClick={() => onSelect(appointment._id)}>
      <div className="dash-card-top">
        <strong>{patient?.fullName || "Patient"}</strong>
        <StatusPill status={appointment.status} />
      </div>
      <p>{service?.name || "Consultation"} · {formatDateLabel(appointment.appointmentDate)} · {appointment.startTime}</p>
      <p className="dash-muted">{patient?.phone} · {appointment.appointmentNumber}</p>
    </button>
  );
}

function DetailPanel({ appointmentId, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("12:00");
  const [imageUrls, setImageUrls] = useState([]);

  const load = async () => {
    setError("");
    try {
      const result = await api.doctorAppointment(appointmentId);
      setData(result);
      setNotes(result.appointment.doctorNotes || "");
      setRescheduleDate(String(result.appointment.appointmentDate).slice(0, 10));
      setRescheduleTime(result.appointment.startTime);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  useEffect(() => {
    let revoked = [];
    const run = async () => {
      if (!data?.images?.length) {
        setImageUrls([]);
        return;
      }
      try {
        const urls = await Promise.all(data.images.map((img) => fetchDoctorImageBlobUrl(img._id)));
        revoked = urls;
        setImageUrls(urls);
      } catch {
        setImageUrls([]);
      }
    };
    run();
    return () => {
      revoked.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data?.images]);

  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) {
    return <div className="side-card"><p>Loading appointment…</p></div>;
  }
  if (error && !data) {
    return (
      <div className="side-card">
        <p className="form-error">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
      </div>
    );
  }

  const { appointment, questionnaire, history, notifications } = data;
  const patient = appointment.patientId;
  const service = appointment.serviceId;
  const doctor = appointment.doctorId;

  return (
    <div className="dash-detail">
      <div className="dash-detail-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <StatusPill status={appointment.status} />
      </div>
      <div className="side-card">
        <h2>{patient.fullName}</h2>
        <p>{patient.phone}{patient.email ? ` · ${patient.email}` : ""}</p>
        <p><strong>{service?.name}</strong> with {doctor?.name}</p>
        <p>{formatDateLabel(appointment.appointmentDate)} · {appointment.startTime}–{appointment.endTime}</p>
        <p className="dash-muted">{appointment.appointmentNumber}</p>
        {appointment.patientNotes ? <p><em>Patient notes:</em> {appointment.patientNotes}</p> : null}
      </div>

      {questionnaire ? (
        <div className="side-card">
          <h3>Questionnaire</h3>
          <p><strong>Concern:</strong> {questionnaire.primaryConcern || "—"}</p>
          {questionnaire.duration ? <p><strong>Duration:</strong> {questionnaire.duration}</p> : null}
          {questionnaire.symptoms?.length ? <p><strong>Symptoms:</strong> {questionnaire.symptoms.join(", ")}</p> : null}
          {questionnaire.previousTreatment ? (
            <p><strong>Previous treatment:</strong> {questionnaire.previousTreatmentDetails || "Yes"}</p>
          ) : null}
          {questionnaire.additionalNotes ? <p>{questionnaire.additionalNotes}</p> : null}
        </div>
      ) : null}

      {imageUrls.length ? (
        <div className="side-card">
          <h3>Photos</h3>
          <div className="dash-photos">
            {imageUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="Patient upload" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="side-card">
        <h3>Doctor notes</h3>
        <label className="full-block">
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes" />
        </label>
        <div className="hero-ctas" style={{ marginTop: 14 }}>
          {(appointment.status === "PENDING" || appointment.status === "RESCHEDULE_REQUESTED") && (
            <>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act(() => api.approveAppointment(appointmentId, notes))}>
                Approve
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => act(() => api.rejectAppointment(appointmentId, rejectReason || "Unable to accommodate this request"))}
              >
                Reject
              </button>
            </>
          )}
          {appointment.status === "APPROVED" && (
            <>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act(() => api.completeAppointment(appointmentId, notes))}>
                Mark completed
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => act(() => api.noShowAppointment(appointmentId))}>
                No-show
              </button>
            </>
          )}
          {(appointment.status === "PENDING" || appointment.status === "APPROVED" || appointment.status === "RESCHEDULE_REQUESTED") && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                if (confirm("Cancel this appointment? The patient will be notified.")) {
                  act(() => api.cancelAppointment(appointmentId, rejectReason || "Cancelled by clinic"));
                }
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {(appointment.status === "PENDING" || appointment.status === "APPROVED" || appointment.status === "RESCHEDULE_REQUESTED") && (
          <div className="form-grid" style={{ marginTop: 18, marginBottom: 0 }}>
            <label className="full">
              Rejection reason (optional)
              <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </label>
            <label>
              Propose new date
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </label>
            <label>
              Propose new time
              <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
            </label>
            <div className="full">
              <button
                type="button"
                className="btn btn-gold"
                disabled={busy || !rescheduleDate || !rescheduleTime}
                onClick={() =>
                  act(() =>
                    api.rescheduleAppointment(appointmentId, {
                      proposedDate: rescheduleDate,
                      proposedStartTime: rescheduleTime,
                      reason: rejectReason || undefined,
                    })
                  )
                }
              >
                Request reschedule
              </button>
            </div>
          </div>
        )}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </div>

      <div className="side-card">
        <h3>Status history</h3>
        <ul className="dash-list">
          {(history || []).map((item) => (
            <li key={item._id}>
              <StatusPill status={item.toStatus} />{" "}
              <span className="dash-muted">{new Date(item.createdAt).toLocaleString("en-IN")}</span>
              {item.note ? ` — ${item.note}` : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="side-card">
        <h3>Notifications</h3>
        <ul className="dash-list">
          {(notifications || []).map((item) => (
            <li key={item._id}>
              <strong>{item.channel}</strong> · {item.eventType} · {item.status}
            </li>
          ))}
          {!notifications?.length ? <li className="dash-muted">No notifications recorded.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function AvailabilityPanel() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "12:00",
    endTime: "15:00",
    slotMinutes: 30,
  });

  const load = async () => {
    try {
      const data = await api.doctorAvailability();
      setRows(data.availability || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addWindow = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.createAvailability({
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
        slotMinutes: Number(form.slotMinutes),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (row) => {
    try {
      await api.patchAvailability(row._id, { isActive: !row.isActive });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dash-stack">
      <form className="appointment-form" onSubmit={addWindow}>
        <div className="stepper">Add weekly window</div>
        <div className="form-grid">
          <label>
            Day
            <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}>
              {DAY_NAMES.map((name, index) => (
                <option key={name} value={index}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Slot minutes
            <input type="number" min={10} max={120} value={form.slotMinutes} onChange={(e) => setForm((f) => ({ ...f, slotMinutes: e.target.value }))} />
          </label>
          <label>
            Start
            <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          </label>
          <label>
            End
            <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          </label>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary">Save window</button>
      </form>
      <div className="dash-list-panel">
        {rows.map((row) => (
          <div key={row._id} className="dash-row">
            <div>
              <strong>{DAY_NAMES[row.dayOfWeek]}</strong>
              <p className="dash-muted">{row.startTime}–{row.endTime} · {row.slotMinutes} min</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(row)}>
              {row.isActive ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
        {!rows.length ? <p className="dash-muted">No availability windows yet.</p> : null}
      </div>
    </div>
  );
}

function DoctorPicker({ doctors, onSelect }) {
  return (
    <main id="main" className="doctor-shell">
      <section className="page-hero">
        <div className="wrap wrap-narrow">
          <div className="eyebrow">Choose workspace</div>
          <h1>Which doctor&apos;s schedule?</h1>
          <p className="lede">One clinic login — pick a doctor to review their appointment requests and availability.</p>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap wrap-narrow">
          <div className="doctor-pick-grid">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                className="doctor-pick-card"
                onClick={() => onSelect(doctor)}
              >
                <span className="eyebrow">{doctor.title || "Dermatologist"}</span>
                <strong>{doctor.name}</strong>
                <span className="doctor-pick-cta">Open dashboard →</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function DoctorDashboardPage() {
  const [user, setUser] = useState(null);
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [list, setList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const applyDoctorSelection = (doctor) => {
    if (!doctor) {
      setActiveDoctorId(null);
      setActiveDoctor(null);
      return;
    }
    const id = String(doctor.id);
    setActiveDoctorId(id);
    setActiveDoctor({ id, name: doctor.name, title: doctor.title });
    setSelectedId(null);
    setTab("overview");
  };

  const resolveDoctorFromUser = (nextUser) => {
    const doctors = nextUser.doctors || [];
    const savedId = getActiveDoctorId();
    const locked = nextUser.doctorId ? doctors.find((d) => String(d.id) === String(nextUser.doctorId)) : null;
    if (locked) {
      applyDoctorSelection(locked);
      return;
    }
    if (!nextUser.canSwitchDoctors && doctors[0]) {
      applyDoctorSelection(doctors[0]);
      return;
    }
    const saved = doctors.find((d) => String(d.id) === String(savedId));
    if (saved) applyDoctorSelection(saved);
    else {
      setActiveDoctor(null);
    }
  };

  const refresh = async () => {
    setError("");
    try {
      if (tab === "overview") {
        setSummary(await api.doctorSummary());
      } else if (tab === "pending") {
        const data = await api.doctorPending();
        setList(data.appointments || []);
      } else if (tab === "today") {
        const data = await api.doctorToday();
        setList(data.appointments || []);
      } else if (tab === "all") {
        const data = await api.doctorAppointments();
        setList(data.appointments || []);
      } else if (tab === "notifications") {
        const data = await api.doctorNotifications();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      if (err.status === 401) {
        setDoctorToken(null);
        setActiveDoctorId(null);
        setUser(null);
        setActiveDoctor(null);
      }
      setError(err.message);
    }
  };

  useEffect(() => {
    const token = getDoctorToken();
    if (!token) {
      setBooting(false);
      return;
    }
    api.me()
      .then((data) => {
        setUser(data.user);
        resolveDoctorFromUser(data.user);
      })
      .catch(() => {
        setDoctorToken(null);
        setActiveDoctorId(null);
      })
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!user || !activeDoctor || selectedId) return;
    refresh();
  }, [user, activeDoctor, tab, selectedId]);

  if (booting) {
    return <main id="main"><section className="page-hero"><div className="wrap"><p>Loading dashboard…</p></div></section></main>;
  }

  if (!user) {
    return (
      <LoginPanel
        onSuccess={(nextUser) => {
          setUser(nextUser);
          resolveDoctorFromUser(nextUser);
        }}
      />
    );
  }

  if (!activeDoctor) {
    return (
      <DoctorPicker
        doctors={user.doctors || []}
        onSelect={applyDoctorSelection}
      />
    );
  }

  const logout = () => {
    setDoctorToken(null);
    setActiveDoctorId(null);
    setUser(null);
    setActiveDoctor(null);
  };

  const switchDoctor = (event) => {
    const next = (user.doctors || []).find((d) => String(d.id) === event.target.value);
    if (next) applyDoctorSelection(next);
  };

  return (
    <main id="main" className="doctor-shell">
      <section className="page-hero doctor-dash-hero">
        <div className="wrap">
          <div className="eyebrow">Doctor workspace</div>
          <h1>Appointment Dashboard</h1>
          <p className="lede">
            Viewing schedule for <strong>{activeDoctor.name}</strong>
            {activeDoctor.title ? ` · ${activeDoctor.title}` : ""}
          </p>
          <div className="dash-doctor-bar">
            {(user.doctors || []).length > 1 ? (
              <label className="doctor-switch">
                <span>Doctor</span>
                <select value={activeDoctor.id} onChange={switchDoctor}>
                  {(user.doctors || []).map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="hero-ctas">
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
              <a className="btn btn-ghost btn-sm" href={withBase("/")}>Clinic site</a>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="dash-tabs" role="tablist">
            {[
              ["overview", "Overview"],
              ["pending", "Pending"],
              ["today", "Today"],
              ["all", "All"],
              ["notifications", "Notifications"],
              ["availability", "Availability"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                className={`dash-tab ${tab === id && !selectedId ? "active" : ""}`}
                onClick={() => {
                  setSelectedId(null);
                  setTab(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          {selectedId ? (
            <DetailPanel
              appointmentId={selectedId}
              onBack={() => setSelectedId(null)}
              onChanged={refresh}
            />
          ) : null}

          {!selectedId && tab === "overview" && summary ? (
            <div className="dash-stack">
              <div className="dash-stats">
                <div className="dash-stat"><span>Pending</span><strong>{summary.summary.pending}</strong></div>
                <div className="dash-stat"><span>Upcoming approved</span><strong>{summary.summary.approvedUpcoming}</strong></div>
                <div className="dash-stat"><span>Today</span><strong>{summary.summary.todayCount}</strong></div>
              </div>
              <h2 className="dash-section-title">Recent pending requests</h2>
              <div className="dash-grid">
                {(summary.recentPending || []).map((item) => (
                  <AppointmentCard key={item._id} appointment={item} onSelect={setSelectedId} />
                ))}
                {!summary.recentPending?.length ? <p className="dash-muted">No pending requests.</p> : null}
              </div>
              <h2 className="dash-section-title">Today&apos;s schedule</h2>
              <div className="dash-grid">
                {(summary.today || []).map((item) => (
                  <AppointmentCard key={item._id} appointment={item} onSelect={setSelectedId} />
                ))}
                {!summary.today?.length ? <p className="dash-muted">No appointments today.</p> : null}
              </div>
            </div>
          ) : null}

          {!selectedId && (tab === "pending" || tab === "today" || tab === "all") ? (
            <div className="dash-grid">
              {list.map((item) => (
                <AppointmentCard key={item._id} appointment={item} onSelect={setSelectedId} />
              ))}
              {!list.length ? <p className="dash-muted">No appointments in this view.</p> : null}
            </div>
          ) : null}

          {!selectedId && tab === "availability" ? <AvailabilityPanel key={activeDoctor.id} /> : null}

          {!selectedId && tab === "notifications" ? (
            <div className="dash-stack">
              <h2 className="dash-section-title">Notification center</h2>
              <div className="dash-list-panel">
                {notifications.map((notif) => (
                  <div key={notif._id} className="dash-row">
                    <div>
                      <strong>{notif.eventType}</strong>
                      <p className="dash-muted">
                        {notif.channel} · {notif.status} · {new Date(notif.createdAt).toLocaleString("en-IN")}
                      </p>
                      {notif.subject ? <p>{notif.subject}</p> : null}
                    </div>
                  </div>
                ))}
                {!notifications.length ? <p className="dash-muted">No notifications yet.</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function AppointmentStatusPage({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing appointment token.");
      return;
    }
    api.getAppointmentStatus(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  const appointment = data?.appointment;

  return (
    <main id="main">
      <section className="page-hero">
        <div className="wrap wrap-narrow">
          <div className="eyebrow">Appointment status</div>
          <h1>Your request</h1>
          <p className="lede">Track whether your appointment request is pending, approved, or needs a new time.</p>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap wrap-narrow">
          {error ? <div className="side-card"><p className="form-error">{error}</p></div> : null}
          {!error && !appointment ? <div className="side-card"><p>Loading…</p></div> : null}
          {appointment ? (
            <div className="side-card">
              <div className="dash-card-top">
                <h2 style={{ margin: 0 }}>{appointment.appointmentNumber}</h2>
                <StatusPill status={appointment.status} />
              </div>
              <p><strong>{appointment.service?.name}</strong> with {appointment.doctor?.name}</p>
              <p>{formatDateLabel(appointment.date)} · {appointment.startTime}–{appointment.endTime}</p>
              <p>{appointment.patient?.fullName} · {appointment.patient?.phone}</p>
              {appointment.status === "PENDING" ? (
                <p>Your request is with the dermatologist. You will receive confirmation by phone, WhatsApp, or email.</p>
              ) : null}
              {appointment.status === "APPROVED" ? (
                <p>Your appointment is confirmed. Please arrive a few minutes early.</p>
              ) : null}
              {appointment.status === "REJECTED" ? (
                <p>This request could not be accommodated. Please call the clinic to book another slot.</p>
              ) : null}
              {appointment.status === "RESCHEDULE_REQUESTED" ? (
                <p>The clinic proposed a new time. Call or WhatsApp +91-9554220700 to confirm.</p>
              ) : null}
              <div className="hero-ctas" style={{ marginTop: 18 }}>
                <a className="btn btn-primary" href="tel:+919554220700">Call clinic</a>
                <a className="btn btn-ghost" href={withBase("/book-appointment/")}>Book again</a>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
