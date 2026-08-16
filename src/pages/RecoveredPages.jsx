import { useState } from "react";
import { assetUrl, withBase } from "../paths";

const IMG = {
  clinic: assetUrl("images/clinic-interior.jpg"),
  doctorSenior: assetUrl("images/doctor-rd-mukhija.jpg"),
  doctorGaurav: assetUrl("images/doctor-gaurav-mukhija.jpg"),
  acne: assetUrl("images/acne-scars.jpg"),
  pores: assetUrl("images/open-pores.jpg"),
};

const gallery = [
  { file: "acne-scars.jpg", label: "Acne scar treatment" },
  { file: "open-pores.jpg", label: "Open pores treatment" },
  { file: "laser-hair-removal.jpg", label: "Laser hair reduction" },
  { file: "hair-fall-prp.jpg", label: "PRP therapy for hair" },
  { file: "pigmentation.jpg", label: "Pigmentation & melasma" },
  { file: "skin-rejuvenation.jpg", label: "Skin rejuvenation" },
  { file: "mole-removal.jpg", label: "Mole & skin lesion removal" },
  { file: "tattoo-removal.jpg", label: "Tattoo removal" },
];

function PageHero({ crumbs, eyebrow, title, lede }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href={withBase("/")}>Home</a>
          {crumbs.map((crumb) => (
            <span key={crumb}>
              <span>/</span>
              {crumb}
            </span>
          ))}
        </nav>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
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
        crumbs={["About Clinic"]}
        eyebrow="Our clinic"
        title="A dermatology practice built across two generations"
        lede="Mukhija Skin & Laser Clinic is a recognised dermatology, cosmetic and laser centre on Betiahata Road, Gorakhpur — offering clinical dermatology, laser procedures and dermatosurgery under one roof."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <div className="split-media reveal">
            <img src={IMG.clinic} alt="Inside Mukhija Skin & Laser Clinic" />
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
      <PageHero crumbs={["Dr. R. D. Mukhija"]} eyebrow="Founder · Senior Dermatologist" title="Dr. R. D. Mukhija" />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap doctor-profile">
          <div className="doctor-photo reveal"><img src={IMG.doctorSenior} alt="Dr. R. D. Mukhija" /></div>
          <div>
            <div className="creds">
              MBBS (MAMC, New Delhi, 1968) · MD (AIIMS, New Delhi, 1972) · Former Professor &amp; Head,
              Dept. of Skin, VD &amp; Leprosy · Former Principal, BRD Medical College, Gorakhpur
            </div>
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
      <PageHero crumbs={["Dr. Gaurav Mukhija"]} eyebrow="Dermatologist · Cosmetic & Laser Specialist" title="Dr. Gaurav Mukhija" />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap doctor-profile">
          <div className="doctor-photo reveal"><img src={IMG.doctorGaurav} alt="Dr. Gaurav Mukhija" /></div>
          <div>
            <div className="creds">
              MBBS (JN Medical College, AMU Aligarh, 1996–2001) · MD Skin, VD &amp; Leprosy
              (JJM Medical College, RGUHS, 2003–06) · Former Assistant Professor, BRD Medical College
            </div>
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
        crumbs={["Treatments", "Acne Scar Treatment"]}
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
      <CtaBand title="Discuss acne scar care with our team" copy="Book a consultation to review options suited to your skin." />
    </main>
  );
}

export function OpenPoresPage() {
  return (
    <main id="main">
      <PageHero
        crumbs={["Treatments", "Open Pores Treatment"]}
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

export function BeforeAfterPage() {
  return (
    <main id="main">
      <PageHero
        crumbs={["Before & After"]}
        eyebrow="Treatment gallery"
        title="Before & After"
        lede="An overview of the treatment areas we see most often at Mukhija Skin & Laser Clinic. Individual results vary and are not guaranteed."
      />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="gallery-grid">
            {gallery.map((item) => (
              <figure className="gallery-card" key={item.file}>
                <img src={assetUrl(`images/${item.file}`)} alt={item.label} loading="lazy" />
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
          <p className="disclaimer" style={{ marginTop: 28 }}>
            The images above are illustrative placeholders, not patient photographs. Clinic-approved
            before &amp; after photography will replace them. Treatment outcomes depend on individual
            patient factors and are determined by the consulting dermatologist.
          </p>
        </div>
      </section>
      <CtaBand title="Want to discuss your concern?" copy="Book a consultation with our dermatology team." />
    </main>
  );
}

export function ContactPage() {
  return (
    <main id="main">
      <PageHero crumbs={["Contact"]} eyebrow="Visit us" title="Contact & Directions" />
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

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = (event) => {
    event.preventDefault();
    console.info("Appointment request (frontend only — wire to API/CRM before go-live):", form);
    setSubmitted(true);
  };

  return (
    <main id="main">
      <PageHero
        crumbs={["Book Appointment"]}
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
                  <label>Full name<input required value={form.name} onChange={update("name")} /></label>
                  <label>Phone<input required type="tel" value={form.phone} onChange={update("phone")} /></label>
                  <label>Email<input type="email" value={form.email} onChange={update("email")} /></label>
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
              <div className="hero-ctas">
                {step > 1 ? <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Back</button> : null}
                {step < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
                ) : (
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                )}
                <a className="btn btn-ghost" href="https://easy.doctly.in/" target="_blank" rel="noopener noreferrer">Or book on Doctly</a>
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
