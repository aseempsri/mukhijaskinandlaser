import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { assetUrl, withBase } from "../paths";
import { FACEBOOK_URL, INSTAGRAM_URL } from "../social";

const IMG = {
  clinic: assetUrl("images/clinic-interior.webp"),
  doctorSenior: assetUrl("images/doctor-rd-mukhija-2.webp"),
  doctorGaurav: assetUrl("images/doctor-gaurav-mukhija-2.webp"),
  acne: assetUrl("images/treatments/acne-acne-scars.webp"),
  pores: assetUrl("images/treatments/open-pores.webp"),
  vitiligo: assetUrl("images/treatments/vitiligo-care.webp"),
};

const resultAsset = (file) => assetUrl(`images/results/${file}`);

const acneCases = Array.from({ length: 4 }, (_, index) => ({
  before: `acne-${index + 1}-before.webp`,
  after: `acne-${index + 1}-after.webp`,
  label: `Acne treatment case ${index + 1}`,
}));

const moleCases = [
  {
    before: "mole-1-before.webp",
    after: "mole-1-after.webp",
    label: "Mole removal case 1",
  },
  {
    before: "mole-2-before.webp",
    after: "mole-2-after.webp",
    label: "Mole removal case 2",
  },
];

const vitiligoAreas = ["Face", "Face", "Foot", "Eyelid", "Trunk", "Palm", "Face"];
const vitiligoCases = vitiligoAreas.map((area, index) => ({
  before: `vitiligo-${index + 1}-before.webp`,
  after: `vitiligo-${index + 1}-after.webp`,
  label: `Vitiligo treatment — ${area.toLowerCase()} case`,
}));

function CaseGallery({ cases, title, intro }) {
  return (
    <section className="results-section">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Real clinic outcomes</div>
          <h2>{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        <div className="case-grid">
          {cases.map((item) => (
            <figure className="case-card" key={item.before}>
              <div className="case-pair">
                <div>
                  <img src={resultAsset(item.before)} alt={`${item.label} before treatment`} loading="lazy" />
                  <span>Before</span>
                </div>
                <div>
                  <img src={resultAsset(item.after)} alt={`${item.label} after treatment`} loading="lazy" />
                  <span>After</span>
                </div>
              </div>
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </div>
        <p className="disclaimer results-disclaimer">
          Images supplied by the clinic for this website. Individual results vary with diagnosis,
          treatment plan, adherence and patient factors. These photographs do not guarantee an
          identical outcome.
        </p>
      </div>
    </section>
  );
}

function PageHero({ eyebrow, title, creds, lede }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {creds?.length ? (
          <ul className="hero-creds">
            {creds.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        ) : null}
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
    </section>
  );
}

function CtaBand({ title, copy }) {
  return (
    <section style={{ background: "var(--ivory-deep)" }}>
      <div className="wrap">
        <div className="cta-band" style={{ background: "var(--forest)" }}>
          <h2>{title}</h2>
          <p>{copy}</p>
          <div className="cta-actions">
            <a href={withBase("book-appointment/")} className="btn btn-gold">Book Appointment</a>
            <a href="tel:+919554220700" className="btn btn-ghost on-dark">Call +91-9554220700</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutClinicPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Our clinic"
        title="A dermatology practice built across two generations"
        lede="Mukhija Skin & Laser Clinic is a recognised dermatology, cosmetic and laser centre on Betiahata Road, Gorakhpur — offering clinical dermatology, laser procedures and dermatosurgery under one roof."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <div className="split-media reveal">
            <img src={IMG.clinic} alt="Reception and waiting area at Mukhija Skin & Laser Clinic" />
          </div>
          <div>
            <div className="eyebrow">Where experience meets modern dermatology</div>
            <h2>Clinical care with in-house laser technology</h2>
            <p>
              The clinic provides dermatological services spanning acne scar care, pigmentation,
              laser hair reduction, tattoo removal, mole removal, hair fall treatment, venereal
              disease care and related skin conditions. Treatment plans are set by the consulting
              dermatologist after in-person evaluation.
            </p>
            <ul className="split-list">
              <li><span className="tick">✓</span>Clinical, cosmetic and laser dermatology in one practice</li>
              <li><span className="tick">✓</span>In-house systems including LightSheer Desire, MedLite C6 and AcuPulse CO2</li>
              <li><span className="tick">✓</span>Board-certified dermatologists with focused training in skin and laser care</li>
            </ul>
            <a href={withBase("treatments/")} className="btn btn-ghost">Browse Treatments</a>
          </div>
        </div>
      </section>
      <CtaBand title="Ready to visit the clinic?" copy="Book a consultation with our dermatology team in Gorakhpur." />
    </main>
  );
}

export function DoctorRdPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Founder · Senior Dermatologist"
        title="Dr. R. D. Mukhija"
        creds={[
          "MBBS (MAMC, New Delhi, 1968)",
          "MD (AIIMS, New Delhi, 1972)",
          "Former Professor & Head, Dept. of Skin, VD & Leprosy",
          "Former Principal, BRD Medical College, Gorakhpur",
        ]}
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap doctor-profile">
          <div className="doctor-photo reveal"><img src={IMG.doctorSenior} alt="Dr. R. D. Mukhija" /></div>
          <div className="doctor-profile-copy">
            <p>
              Dr. R. D. Mukhija completed his MD under the supervision of late Prof. K. S. Kandhari,
              late Prof. L. K. Bhutani and Dr. J. S. Pasricha. He joined as a lecturer in Jhansi in
              1973 and was among the early figures to establish dermatology services in Uttar Pradesh.
              From 1975 to 2008 he worked at Medical College Gorakhpur.
            </p>
            <p>
              He has around 35 years of undergraduate and postgraduate teaching experience and has
              trained more than 100 postgraduate MD and DVD students in Gorakhpur. His department
              maintained a busy outpatient service and an indoor unit of 50 beds with research
              facilities. He has published over 100 scientific papers in Indian and international
              journals, with particular interest in clinical dermatology and leprosy.
            </p>
            <div className="doctor-tags">
              <span className="tag">Teacher Par Excellence Award, Dermacon 2011</span>
              <span className="tag">Chairman, Scientific Committee Dermacon 2010</span>
              <span className="tag">President, IADVL (UP)</span>
              <span className="tag">Lifetime Achievement Award, UP-UK Cuticon 2016</span>
              <span className="tag">Lifetime Achievement Award, SAARC AAD 2018</span>
              <span className="tag">Inspiring Dermatologists of India, Economic Times 2019</span>
            </div>
            <p>
              After retirement he continues private practice with his son, Dr. Gaurav Mukhija, at
              Mukhija Skin &amp; Laser Clinic.
            </p>
            <a href={withBase("book-appointment/")} className="btn btn-primary">Book an Appointment</a>
          </div>
        </div>
      </section>
    </main>
  );
}

export function DoctorGauravPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Dermatologist · Cosmetic & Laser Specialist"
        title="Dr. Gaurav Mukhija"
        creds={[
          "MBBS (JN Medical College, AMU Aligarh, 1996–2001)",
          "MD Dermatology, Venereology & Leprosy (JJM Medical College, RGUHS, 2003–06)",
          "Former Assistant Professor, BRD Medical College",
        ]}
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap doctor-profile">
          <div className="doctor-photo reveal"><img src={IMG.doctorGaurav} alt="Dr. Gaurav Mukhija" /></div>
          <div className="doctor-profile-copy">
            <p>
              Dr. Gaurav Mukhija leads day-to-day clinical and cosmetic dermatology at the clinic.
              His work covers diagnosis and management of skin, hair and nail conditions, along with
              laser and aesthetic procedures offered at the centre.
            </p>
            <p>
              The clinic’s in-house systems include diode, Q-switched Nd:YAG, fractional CO2 /
              AcuPulse CO2 and Excimer 308 light platforms. Services include dermatosurgery and
              contemporary approaches for anti-ageing, facial rejuvenation, hair growth and vitiligo.
            </p>
            <ul className="split-list">
              <li><span className="tick">✓</span>Life member of IADVL, EADV, AIDS Society of India and CDSI</li>
              <li><span className="tick">✓</span>Special training in plastic surgery &amp; cosmetology — Victoria Hospital, Bangalore Medical College</li>
              <li><span className="tick">✓</span>HIV training under Dr. D. G. Saple at Grant Medical College &amp; JJ Group of Hospitals, Mumbai</li>
              <li><span className="tick">✓</span>Trained on Lumenis aesthetic platforms including LightSheer Desire, AcuPulse CO2, MedLite C6 and ResurFX</li>
            </ul>
            <a href={withBase("book-appointment/")} className="btn btn-primary">Book an Appointment</a>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AcneScarPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Skin · Laser"
        title="Acne Scar Treatment in Gorakhpur"
        lede="Chemical peels and laser approaches such as MedLite C6 and AcuPulse CO2, matched to your skin after clinical evaluation."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap content-grid">
          <div>
            <img className="content-hero-img" src={IMG.acne} alt="Acne scar treatment" />
            <h2>Understanding acne scarring</h2>
            <p>
              Acne and acne scarring can affect people across age groups. When topical creams alone
              are not enough, chemical peels and laser-based approaches may be considered as part of
              a dermatologist-guided plan.
            </p>
            <h3>Chemical peels</h3>
            <p>
              For acne papules and pustules, chemical peels can gently remove outer skin layers to
              support clearer-looking skin. A course of sessions may be recommended depending on your
              presentation and response.
            </p>
            <h3>Laser acne scar care</h3>
            <p>
              MedLite C6 is typically used for blemishes and pigmented marks. AcuPulse CO2 laser
              treatment uses controlled heat to address acne scarring. Suitability and the number of
              sessions are determined after in-person assessment.
            </p>
            <p className="disclaimer">
              Individual results vary. Treatment suitability and outcomes depend on patient factors
              and are determined by the consulting dermatologist.
            </p>
          </div>
          <aside className="side-card">
            <h3>At a glance</h3>
            <ul className="split-list">
              <li><span className="tick">✓</span>Chemical peels</li>
              <li><span className="tick">✓</span>MedLite C6 laser</li>
              <li><span className="tick">✓</span>AcuPulse CO2 laser</li>
            </ul>
            <a href={withBase("book-appointment/")} className="btn btn-primary btn-block">Book Consultation</a>
            <a href={withBase("treatments/")} className="btn btn-ghost btn-block">All Treatments</a>
          </aside>
        </div>
      </section>
      <CaseGallery
        cases={acneCases}
        title="Acne treatment results"
        intro="Four clinic cases showing changes following dermatologist-led acne and scar treatment."
      />
      <CtaBand title="Discuss acne scar care with our team" copy="Book a consultation to review options suited to your skin." />
    </main>
  );
}

export function OpenPoresPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Skin · Laser"
        title="Open Pores Treatment in Gorakhpur"
        lede="Combined AcuPulse CO2 and MedLite C6 laser therapy considered for enlarged pores after dermatologist evaluation."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap content-grid">
          <div>
            <img className="content-hero-img" src={IMG.pores} alt="Open pores treatment" />
            <h2>About enlarged pores</h2>
            <p>
              Enlarged pores around the nose, forehead and cheeks can be difficult to conceal and may
              become more noticeable with makeup. They can also be associated with blackheads and acne.
              Temporary drying approaches may reduce oiliness, but do not permanently change pore structure.
            </p>
            <h3>Laser open pores treatment</h3>
            <p>
              At Mukhija Skin &amp; Laser Clinic, combined laser therapy using AcuPulse CO2 and
              MedLite C6 may be used. The approach aims to support collagen around oil glands and
              help refine the appearance of enlarged pores. Your dermatologist will advise whether
              this is appropriate for your skin.
            </p>
            <p className="disclaimer">
              Individual results vary. Treatment suitability and outcomes depend on patient factors
              and are determined by the consulting dermatologist.
            </p>
          </div>
          <aside className="side-card">
            <h3>At a glance</h3>
            <ul className="split-list">
              <li><span className="tick">✓</span>AcuPulse CO2 laser</li>
              <li><span className="tick">✓</span>MedLite C6 laser</li>
              <li><span className="tick">✓</span>Combined laser therapy</li>
            </ul>
            <a href={withBase("book-appointment/")} className="btn btn-primary btn-block">Book Consultation</a>
            <a href={withBase("treatments/")} className="btn btn-ghost btn-block">All Treatments</a>
          </aside>
        </div>
      </section>
      <CtaBand title="Ask about open pore treatment options" copy="Speak with our dermatologists about a plan suited to your skin." />
    </main>
  );
}

export function MoleRemovalPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Dermatosurgery"
        title="Mole Removal in Gorakhpur"
        lede="Assessment and cosmetic surgical removal of suitable moles and skin lesions after an in-person dermatology consultation."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap content-grid">
          <div>
            <img className="content-hero-img" src={assetUrl("images/mole-removal.jpg")} alt="Dermatology assessment for mole removal" />
            <h2>Cosmetic mole removal</h2>
            <p>
              Moles vary in type, depth and location. The dermatologist first examines the lesion
              and determines whether cosmetic removal is appropriate or whether further assessment
              is needed. The procedure and aftercare plan are selected for the individual lesion.
            </p>
            <p className="disclaimer">
              Do not attempt to remove or treat a changing, bleeding or symptomatic mole at home.
              Seek an in-person medical assessment.
            </p>
          </div>
          <aside className="side-card">
            <h3>At a glance</h3>
            <ul className="split-list">
              <li><span className="tick">✓</span>Dermatologist assessment</li>
              <li><span className="tick">✓</span>Cosmetic surgical options</li>
              <li><span className="tick">✓</span>Procedure-specific aftercare</li>
            </ul>
            <a href={withBase("book-appointment/")} className="btn btn-primary btn-block">Book Consultation</a>
          </aside>
        </div>
      </section>
      <CaseGallery
        cases={moleCases}
        title="Mole removal results"
        intro="Two clinic cases photographed before and after cosmetic mole removal."
      />
      <CtaBand title="Have a mole you would like assessed?" copy="Book an in-person dermatology consultation." />
    </main>
  );
}

export function VitiligoPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Medical dermatology · Phototherapy · Surgery"
        title="Vitiligo Treatment in Gorakhpur"
        lede="Medical and procedural vitiligo care using options selected for the site, stability and extent of each patient’s condition."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap content-grid">
          <div>
            <img className="content-hero-img" src={IMG.vitiligo} alt="Vitiligo Care treatment" />
            <h2>Vitiligo care at the clinic</h2>
            <p>
              The clinic offers narrow-band UVB phototherapy, Excimer laser and vitiligo surgery
              for suitable patients. Surgical options can include punch grafting and ultrathin
              split-thickness skin grafting. The dermatologist determines suitability after
              assessing disease activity, location and previous treatment.
            </p>
            <p className="disclaimer">
              Vitiligo response differs by patient and body site. A consultation is required before
              any phototherapy, laser or surgical treatment is recommended.
            </p>
          </div>
          <aside className="side-card">
            <h3>Treatment facilities</h3>
            <ul className="split-list">
              <li><span className="tick">✓</span>Narrow-band UVB phototherapy</li>
              <li><span className="tick">✓</span>Excimer laser</li>
              <li><span className="tick">✓</span>Punch grafting</li>
              <li><span className="tick">✓</span>Ultrathin split-thickness grafting</li>
            </ul>
            <a href={withBase("book-appointment/")} className="btn btn-primary btn-block">Book Consultation</a>
          </aside>
        </div>
      </section>
      <CaseGallery
        cases={vitiligoCases}
        title="Vitiligo treatment results"
        intro="Clinic cases across facial, eyelid, hand, foot and trunk vitiligo."
      />
      <section className="procedure-section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Treatment process</div>
            <h2>Vitiligo surgery and progress</h2>
          </div>
          <div className="procedure-grid">
            <figure className="gallery-card">
              <img src={resultAsset("vitiligo-grafting-procedure.webp")} alt="Punch grafting procedure for palm vitiligo" loading="lazy" />
              <figcaption>Punch grafting procedure</figcaption>
            </figure>
            <figure className="gallery-card">
              <img src={resultAsset("vitiligo-treatment-progress.webp")} alt="Repigmentation progress following vitiligo treatment" loading="lazy" />
              <figcaption>Treatment progress</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <CtaBand title="Discuss vitiligo treatment options" copy="Book an assessment with our dermatology team." />
    </main>
  );
}

export function BeforeAfterPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Patient results"
        title="Before & After"
        lede="Real clinic cases across acne treatment, cosmetic mole removal and vitiligo care. Individual results vary and are not guaranteed."
      />
      <CaseGallery cases={acneCases} title="Acne treatment" />
      <CaseGallery cases={moleCases} title="Cosmetic mole removal" />
      <CaseGallery cases={vitiligoCases} title="Vitiligo treatment" />
      <CtaBand title="Want to discuss your concern?" copy="Book a consultation with our dermatology team." />
    </main>
  );
}

export function ContactPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Visit us" title="Contact & Directions" />
      <section style={{ paddingTop: 0 }} id="hours">
        <div className="wrap contact-grid">
          <div className="side-card">
            <h3>Clinic Address</h3>
            <p>Betiahata Road, Near Hanuman Temple,<br />Betiahata, Gorakhpur, Uttar Pradesh 273001</p>
            <h3>Opening Hours</h3>
            <p>Mon–Sat: 10:00 AM – 08:00 PM<br />Sunday: Closed</p>
            <h3>Call / Email</h3>
            <p>
              <a href="tel:05512347093">0551-2347093</a>
              {" · "}
              <a href="tel:+919554220700">+91-9554220700</a>
              <br />
              <a href="mailto:mukhijagaurav@yahoo.co.in">mukhijagaurav@yahoo.co.in</a>
            </p>
            <h3>Follow Us</h3>
            <p>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
              {" · "}
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Facebook</a>
            </p>
            <div className="hero-ctas">
              <a href={withBase("book-appointment/")} className="btn btn-primary">Book Appointment</a>
              <a href="https://wa.me/919554220700" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
          <div className="map-frame">
            <iframe
              title="Mukhija Skin & Laser Clinic location"
              src="https://www.google.com/maps?q=Mukhija+Skin+%26+Laser+Clinic+Gorakhpur&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function BookAppointmentPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [stepError, setStepError] = useState("");
  const [bootError, setBootError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    serviceId: "",
    doctorId: "",
    appointmentDate: todayIso(),
    startTime: "",
    endTime: "",
    fullName: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    primaryConcern: "",
    duration: "",
    previousTreatment: false,
    previousTreatmentDetails: "",
    additionalNotes: "",
    consent: false,
  });

  useEffect(() => {
    Promise.all([api.getServices(), api.getDoctors()])
      .then(([serviceData, doctorData]) => {
        setServices(serviceData.services || []);
        setDoctors(doctorData.doctors || []);
        setForm((current) => ({
          ...current,
          serviceId: current.serviceId || serviceData.services?.[0]?._id || "",
          doctorId: current.doctorId || doctorData.doctors?.[0]?._id || "",
        }));
      })
      .catch((error) => {
        setBootError(error.message || "Unable to load booking options. Is the API running?");
      });
  }, []);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate || !form.serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setStepError("");
    api
      .getAvailableSlots({
        doctorId: form.doctorId,
        date: form.appointmentDate,
        serviceId: form.serviceId,
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots || []);
        setForm((current) => {
          const stillValid = (data.slots || []).some((slot) => slot.startTime === current.startTime);
          if (stillValid) return current;
          return { ...current, startTime: "", endTime: "" };
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setSlots([]);
          setStepError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.doctorId, form.appointmentDate, form.serviceId]);

  const selectedService = useMemo(
    () => services.find((item) => item._id === form.serviceId),
    [services, form.serviceId],
  );
  const selectedDoctor = useMemo(
    () => doctors.find((item) => item._id === form.doctorId),
    [doctors, form.doctorId],
  );

  const update = (field) => (event) => {
    setStepError("");
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const chooseSlot = (slot) => {
    setStepError("");
    setForm((current) => ({
      ...current,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.serviceId || !form.doctorId) return "Please choose a service and doctor.";
    }
    if (currentStep === 2) {
      if (!form.appointmentDate || !form.startTime) return "Please select a date and an available time slot.";
    }
    if (currentStep === 3) {
      if (!form.fullName.trim() || !form.phone.trim()) return "Full name and phone are required.";
    }
    if (currentStep === 4) {
      if (!form.primaryConcern.trim()) return "Please describe your primary concern.";
      if (!form.consent) return "Consent is required to submit an appointment request.";
    }
    return "";
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    setStep((current) => Math.min(5, current + 1));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const message = validateStep(4) || validateStep(3) || validateStep(2) || validateStep(1);
    if (message) {
      setStepError(message);
      return;
    }
    setSubmitting(true);
    setStepError("");
    try {
      const payload = {
        serviceId: form.serviceId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        endTime: form.endTime,
        patient: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          whatsappOptIn: true,
          emailOptIn: Boolean(form.email.trim()),
        },
        questionnaire: {
          primaryConcern: form.primaryConcern.trim(),
          duration: form.duration,
          previousTreatment: form.previousTreatment,
          previousTreatmentDetails: form.previousTreatmentDetails,
          additionalNotes: form.additionalNotes,
          symptoms: [],
        },
        consent: { given: true, version: "2026-01" },
        patientNotes: form.additionalNotes || form.primaryConcern,
      };
      const result = await api.createAppointment(payload, photos);
      setSubmitted(result.appointment);
    } catch (error) {
      setStepError(error.message || "Unable to submit appointment request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main">
      <PageHero
        eyebrow="Online appointment request"
        title="Book an Appointment"
        lede="Consultation windows: Monday–Saturday, 12 PM–03 PM and 04 PM–06 PM. Submitting this form creates a request — your dermatologist confirms the appointment."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap wrap-narrow">
          {bootError ? (
            <div className="side-card">
              <h2>Booking temporarily unavailable</h2>
              <p className="form-error">{bootError}</p>
              <p>Start the API with <code>npm run server</code>, then refresh this page. You can also call +91-9554220700.</p>
            </div>
          ) : null}

          {!bootError && submitted ? (
            <div className="side-card">
              <h2>Request received</h2>
              <p>
                Thank you, {form.fullName}. Your request <strong>{submitted.appointmentNumber}</strong> is
                {" "}<strong>PENDING</strong> for {submitted.date} at {submitted.startTime}.
              </p>
              <p>You will receive confirmation once the doctor reviews it.</p>
              <div className="hero-ctas">
                <a className="btn btn-primary" href={withBase(submitted.statusUrl)}>Track status</a>
                <a className="btn btn-ghost" href="tel:+919554220700">Call the Clinic</a>
              </div>
            </div>
          ) : null}

          {!bootError && !submitted ? (
            <form className="appointment-form" onSubmit={onSubmit}>
              <div className="stepper" aria-live="polite">Step {step} of 5</div>

              {step === 1 && (
                <div className="form-grid">
                  <label className="full">
                    Service
                    <select required value={form.serviceId} onChange={update("serviceId")}>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>{service.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full">
                    Doctor
                    <select required value={form.doctorId} onChange={update("doctorId")}>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="form-grid">
                  <label className="full">
                    Preferred date
                    <input type="date" required min={todayIso()} value={form.appointmentDate} onChange={update("appointmentDate")} />
                  </label>
                  <div className="full">
                    <span className="slot-label">Available times</span>
                    {loadingSlots ? <p className="dash-muted">Loading slots…</p> : null}
                    {!loadingSlots && !slots.length ? <p className="form-error">No open slots on this date. Try another day.</p> : null}
                    <div className="slot-grid">
                      {slots.map((slot) => (
                        <button
                          key={`${slot.startTime}-${slot.endTime}`}
                          type="button"
                          className={`slot-chip ${form.startTime === slot.startTime ? "active" : ""}`}
                          onClick={() => chooseSlot(slot)}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="form-grid">
                  <label>
                    Full name
                    <input required name="name" autoComplete="name" value={form.fullName} onChange={update("fullName")} />
                  </label>
                  <label>
                    Phone
                    <input required name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} />
                  </label>
                  <label>
                    Email <span className="optional-hint">(optional)</span>
                    <input name="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} />
                  </label>
                  <label>
                    Age <span className="optional-hint">(optional)</span>
                    <input name="age" type="number" min="1" max="120" value={form.age} onChange={update("age")} />
                  </label>
                  <label>
                    Gender <span className="optional-hint">(optional)</span>
                    <select value={form.gender} onChange={update("gender")}>
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="form-grid">
                  <label className="full">
                    Primary concern
                    <textarea required rows={3} value={form.primaryConcern} onChange={update("primaryConcern")} />
                  </label>
                  <label>
                    How long has this been present?
                    <input value={form.duration} onChange={update("duration")} placeholder="e.g. 3 months" />
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.previousTreatment} onChange={update("previousTreatment")} />
                    I have tried treatment for this before
                  </label>
                  {form.previousTreatment ? (
                    <label className="full">
                      Previous treatment details
                      <textarea rows={2} value={form.previousTreatmentDetails} onChange={update("previousTreatmentDetails")} />
                    </label>
                  ) : null}
                  <label className="full">
                    Additional notes <span className="optional-hint">(optional)</span>
                    <textarea rows={3} value={form.additionalNotes} onChange={update("additionalNotes")} />
                  </label>
                  <label className="full">
                    Photos <span className="optional-hint">(optional, JPEG/PNG/WebP, max 5)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => setPhotos([...event.target.files].slice(0, 5))}
                    />
                  </label>
                  <label className="full checkbox-row">
                    <input type="checkbox" required checked={form.consent} onChange={update("consent")} />
                    I consent to Mukhija Skin &amp; Laser Clinic storing my details and optional photos to process this appointment request.
                  </label>
                </div>
              )}

              {step === 5 && (
                <div className="side-card" style={{ marginBottom: 18 }}>
                  <h3>Review your request</h3>
                  <p><strong>{form.fullName}</strong> · {form.phone}</p>
                  <p>{form.email || "No email provided"}</p>
                  <p>{selectedService?.name} with {selectedDoctor?.name}</p>
                  <p>{form.appointmentDate} · {form.startTime}–{form.endTime}</p>
                  <p>{form.primaryConcern}</p>
                  {photos.length ? <p>{photos.length} photo(s) attached</p> : null}
                </div>
              )}

              {stepError ? <p className="form-error" role="alert">{stepError}</p> : null}
              <div className="hero-ctas">
                {step > 1 ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setStep((current) => current - 1)}>Back</button>
                ) : null}
                {step < 5 ? (
                  <button type="button" className="btn btn-primary" onClick={goNext}>Continue</button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                )}
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="wrap wrap-narrow">
          <div className="eyebrow">404</div>
          <h1>Page not found</h1>
          <p className="lede">The page you requested is not available. Return home or browse treatments.</p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href={withBase("/")}>Go Home</a>
            <a className="btn btn-ghost" href={withBase("treatments/")}>View Treatments</a>
          </div>
        </div>
      </section>
    </main>
  );
}
