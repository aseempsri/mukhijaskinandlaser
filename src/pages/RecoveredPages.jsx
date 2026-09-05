import { useState } from "react";
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

export function BookAppointmentPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    concern: "General consultation",
    preferred: "12 PM – 03 PM",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [stepError, setStepError] = useState("");

  const update = (field) => (event) => {
    setStepError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const canLeaveStep1 = () => form.name.trim() !== "" && form.phone.trim() !== "";

  const goNext = (event) => {
    if (step === 1 && !canLeaveStep1()) {
      event.currentTarget.form?.reportValidity();
      setStepError("Please enter your full name and phone number to continue. Email is optional.");
      return;
    }
    setStepError("");
    setStep((current) => current + 1);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!canLeaveStep1()) {
      setStep(1);
      setStepError("Please enter your full name and phone number to continue. Email is optional.");
      return;
    }
    console.info("Appointment request (frontend only — wire to API/CRM before go-live):", form);
    setSubmitted(true);
  };

  return (
    <main id="main">
      <PageHero
        eyebrow="Online appointment request"
        title="Book an Appointment"
        lede="Consultation windows: Monday–Saturday, 12 PM–03 PM and 04 PM–06 PM. Submitting this form is a request only — our team confirms by phone or WhatsApp."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap wrap-narrow">
          {submitted ? (
            <div className="side-card">
              <h2>Request received</h2>
              <p>
                Thank you, {form.name || "patient"}. This prototype stores the request in the browser
                console only. Call or WhatsApp +91-9554220700 to confirm, or use the clinic’s online
                booking system.
              </p>
              <div className="hero-ctas">
                <a className="btn btn-primary" href="https://easy.doctly.in/" target="_blank" rel="noopener noreferrer">Open Doctly Booking</a>
                <a className="btn btn-ghost" href="tel:+919554220700">Call the Clinic</a>
              </div>
            </div>
          ) : (
            <form className="appointment-form" onSubmit={onSubmit}>
              <div className="stepper" aria-live="polite">Step {step} of 3</div>
              {step === 1 && (
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={update("name")}
                      aria-required="true"
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      required
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={update("phone")}
                      aria-required="true"
                    />
                  </label>
                  <label>
                    Email <span className="optional-hint">(optional)</span>
                    <input name="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className="form-grid">
                  <label>
                    Concern
                    <select value={form.concern} onChange={update("concern")}>
                      <option>General consultation</option>
                      <option>Acne / acne scars</option>
                      <option>Open pores</option>
                      <option>Hair fall / PRP</option>
                      <option>Laser / aesthetic</option>
                      <option>Medical dermatology</option>
                    </select>
                  </label>
                  <label>
                    Preferred window
                    <select value={form.preferred} onChange={update("preferred")}>
                      <option>12 PM – 03 PM</option>
                      <option>04 PM – 06 PM</option>
                    </select>
                  </label>
                  <label className="full">Notes<textarea rows={4} value={form.notes} onChange={update("notes")} /></label>
                </div>
              )}
              {step === 3 && (
                <div className="side-card" style={{ marginBottom: 18 }}>
                  <h3>Review your request</h3>
                  <p><strong>{form.name}</strong> · {form.phone}</p>
                  <p>{form.email || "No email provided"}</p>
                  <p>{form.concern} · {form.preferred}</p>
                  {form.notes ? <p>{form.notes}</p> : null}
                </div>
              )}
              {stepError ? <p className="form-error" role="alert">{stepError}</p> : null}
              <div className="hero-ctas">
                {step > 1 ? <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Back</button> : null}
                {step < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={goNext}>Continue</button>
                ) : (
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                )}
              </div>
            </form>
          )}
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
