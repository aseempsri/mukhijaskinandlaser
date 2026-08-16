import { useEffect, useMemo, useRef, useState } from "react";
import homeHtml from "./content/home.html?raw";
import treatmentsHtml from "./content/treatments.html?raw";
import privacyHtml from "./content/privacy.html?raw";
import termsHtml from "./content/terms.html?raw";
import disclaimerHtml from "./content/medical-disclaimer.html?raw";
import {
  AboutClinicPage,
  AcneScarPage,
  BeforeAfterPage,
  BookAppointmentPage,
  ContactPage,
  DoctorGauravPage,
  DoctorRdPage,
  NotFoundPage,
  OpenPoresPage,
} from "./pages/RecoveredPages";
import { absoluteAssetUrl, appPathFromLocation, assetUrl, withBase } from "./paths";

const IMAGE = absoluteAssetUrl("images/hero-consultation.jpg");
const LOGO = assetUrl("logo.png");
const clinicSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: "Mukhija Skin & Laser Clinic",
  image: "https://www.mukhijaskinclinic.com/logo.png",
  telephone: ["+91-9554220700", "0551-2347093"],
  email: "mukhijagaurav@yahoo.co.in",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Betiahata Road, Near Hanuman Temple, Betiahata",
    addressLocality: "Gorakhpur",
    addressRegion: "Uttar Pradesh",
    postalCode: "273001",
    addressCountry: "IN",
  },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "10:00",
    closes: "20:00",
  }],
  medicalSpecialty: "Dermatology",
  url: "https://www.mukhijaskinclinic.com/",
};

function normalizeContentUrls(html) {
  return html.replace(/href="(?!https?:|tel:|mailto:|#)([^"]+?)\.html(#[^"]*)?"/g, (_, file, hash = "") => {
    if (file === "index") return `href="${withBase(`/${hash}`)}"`;
    return `href="${withBase(`/${file}/${hash}`)}"`;
  }).replace(/href="(?!https?:|tel:|mailto:|#|\/mukhijaskinandlaser)(\/[^"]*)"/g, (_, path) => `href="${withBase(path)}"`)
    .replace(/src="(\/[^"]*)"/g, (_, path) => `src="${assetUrl(path)}"`);
}

const pages = {
  home: {
    kind: "html",
    html: normalizeContentUrls(homeHtml),
    title: "Mukhija Skin & Laser Clinic | Dermatologist & Skin Specialist in Gorakhpur",
    description: "Expert dermatology, skin, hair and laser treatments at Mukhija Skin & Laser Clinic in Gorakhpur. Consult experienced dermatologists for personalised skin, hair and aesthetic care.",
    canonical: "/",
  },
  treatments: {
    kind: "html",
    html: normalizeContentUrls(treatmentsHtml),
    title: "Skin, Hair & Laser Treatments in Gorakhpur | Mukhija Skin & Laser Clinic",
    description: "Browse dermatology, laser and cosmetic treatments at Mukhija Skin & Laser Clinic, Gorakhpur — organised by Skin, Laser & Aesthetic, Hair and Medical Dermatology.",
    canonical: "/treatments/",
  },
  privacy: {
    kind: "html",
    html: normalizeContentUrls(privacyHtml),
    title: "Privacy Policy | Mukhija Skin & Laser Clinic",
    description: "Privacy Policy for Mukhija Skin & Laser Clinic, Gorakhpur.",
    canonical: "/privacy-policy/",
  },
  terms: {
    kind: "html",
    html: normalizeContentUrls(termsHtml),
    title: "Terms & Conditions | Mukhija Skin & Laser Clinic",
    description: "Terms and conditions for use of the Mukhija Skin & Laser Clinic website.",
    canonical: "/terms/",
  },
  disclaimer: {
    kind: "html",
    html: normalizeContentUrls(disclaimerHtml),
    title: "Medical Disclaimer | Mukhija Skin & Laser Clinic",
    description: "Medical disclaimer for Mukhija Skin & Laser Clinic, Gorakhpur.",
    canonical: "/medical-disclaimer/",
  },
  about: {
    kind: "component",
    Component: AboutClinicPage,
    title: "About Clinic | Mukhija Skin & Laser Clinic, Gorakhpur",
    description: "Learn about Mukhija Skin & Laser Clinic in Gorakhpur — a two-generation dermatology practice offering clinical, cosmetic and laser care.",
    canonical: "/about-clinic/",
  },
  doctorRd: {
    kind: "component",
    Component: DoctorRdPage,
    title: "Dr. R. D. Mukhija | Mukhija Skin & Laser Clinic, Gorakhpur",
    description: "Profile of Dr. R. D. Mukhija — former Professor & Head of Dermatology and former Principal, BRD Medical College, Gorakhpur.",
    canonical: "/dr-r-d-mukhija/",
  },
  doctorGaurav: {
    kind: "component",
    Component: DoctorGauravPage,
    title: "Dr. Gaurav Mukhija | Mukhija Skin & Laser Clinic, Gorakhpur",
    description: "Profile of Dr. Gaurav Mukhija — dermatologist specialising in clinical, cosmetic and laser dermatology in Gorakhpur.",
    canonical: "/dr-gaurav-mukhija-2/",
  },
  acneScar: {
    kind: "component",
    Component: AcneScarPage,
    title: "Acne Scar Treatment in Gorakhpur | Mukhija Skin & Laser Clinic",
    description: "Acne scar treatment in Gorakhpur using chemical peels and laser technologies such as MedLite C6 and AcuPulse CO2.",
    canonical: "/acne-scar-treatment-gorakhpur/",
  },
  openPores: {
    kind: "component",
    Component: OpenPoresPage,
    title: "Open Pores Treatment in Gorakhpur | Mukhija Skin & Laser Clinic",
    description: "Open pores treatment in Gorakhpur using combined AcuPulse CO2 and MedLite C6 laser therapy.",
    canonical: "/open-pores-treatment-gorakhpur/",
  },
  beforeAfter: {
    kind: "component",
    Component: BeforeAfterPage,
    title: "Before & After Gallery | Mukhija Skin & Laser Clinic",
    description: "Before and after gallery from Mukhija Skin & Laser Clinic, Gorakhpur. Individual results vary.",
    canonical: "/before-after/",
  },
  contact: {
    kind: "component",
    Component: ContactPage,
    title: "Contact Us | Mukhija Skin & Laser Clinic, Gorakhpur",
    description: "Contact Mukhija Skin & Laser Clinic on Betiahata Road, Gorakhpur — phone, email, hours and directions.",
    canonical: "/contact-us/",
  },
  book: {
    kind: "component",
    Component: BookAppointmentPage,
    title: "Book Appointment | Mukhija Skin & Laser Clinic, Gorakhpur",
    description: "Request an appointment at Mukhija Skin & Laser Clinic, Gorakhpur. Mon–Sat consultation windows 12–3 PM and 4–6 PM.",
    canonical: "/book-appointment/",
  },
  notFound: {
    kind: "component",
    Component: NotFoundPage,
    title: "Page Not Found | Mukhija Skin & Laser Clinic",
    description: "The requested page could not be found.",
    canonical: "/404/",
  },
};

const routeMap = {
  "/": "home",
  "/index.html": "home",
  "/treatments": "treatments",
  "/treatments/": "treatments",
  "/treatments.html": "treatments",
  "/privacy-policy": "privacy",
  "/privacy-policy/": "privacy",
  "/privacy-policy.html": "privacy",
  "/terms": "terms",
  "/terms/": "terms",
  "/terms.html": "terms",
  "/medical-disclaimer": "disclaimer",
  "/medical-disclaimer/": "disclaimer",
  "/medical-disclaimer.html": "disclaimer",
  "/about-clinic": "about",
  "/about-clinic/": "about",
  "/about-clinic.html": "about",
  "/dr-r-d-mukhija": "doctorRd",
  "/dr-r-d-mukhija/": "doctorRd",
  "/dr-r-d-mukhija.html": "doctorRd",
  "/dr-gaurav-mukhija-2": "doctorGaurav",
  "/dr-gaurav-mukhija-2/": "doctorGaurav",
  "/dr-gaurav-mukhija-2.html": "doctorGaurav",
  "/acne-scar-treatment-gorakhpur": "acneScar",
  "/acne-scar-treatment-gorakhpur/": "acneScar",
  "/acne-scar-treatment-gorakhpur.html": "acneScar",
  "/open-pores-treatment-gorakhpur": "openPores",
  "/open-pores-treatment-gorakhpur/": "openPores",
  "/open-pores-treatment-gorakhpur.html": "openPores",
  "/before-after": "beforeAfter",
  "/before-after/": "beforeAfter",
  "/before-after.html": "beforeAfter",
  "/contact-us": "contact",
  "/contact-us/": "contact",
  "/contact-us.html": "contact",
  "/book-appointment": "book",
  "/book-appointment/": "book",
  "/book-appointment.html": "book",
  "/404": "notFound",
  "/404.html": "notFound",
};

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement(selector.startsWith("link") ? "link" : "meta");
    document.head.appendChild(element);
  }
  if (selector.includes("property=")) {
    element.setAttribute("property", selector.match(/"(.+?)"/)[1]);
  } else if (selector.includes("name=")) {
    element.setAttribute("name", selector.match(/"(.+?)"/)[1]);
  } else {
    element.setAttribute("rel", "canonical");
  }
  element.setAttribute(attribute, value);
}

function useSeo(page) {
  useEffect(() => {
    document.title = page.title;
    const canonical = `https://www.mukhijaskinclinic.com${page.canonical}`;
    setMeta('meta[name="description"]', "content", page.description);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:title"]', "content", page.title);
    setMeta('meta[property="og:description"]', "content", page.description);
    setMeta('meta[property="og:image"]', "content", IMAGE);
    setMeta('meta[property="og:site_name"]', "content", "Mukhija Skin & Laser Clinic");
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:image"]', "content", IMAGE);
    setMeta('link[rel="canonical"]', "href", canonical);

    let schema = document.getElementById("clinic-schema");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "clinic-schema";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(clinicSchema);
  }, [page]);
}

function BrandMark() {
  return (
    <>
      <span className="brand-mark brand-mark-logo" aria-hidden="true">
        <img src={LOGO} alt="" />
      </span>
      <span className="brand-text"><strong>Mukhija Skin &amp; Laser</strong><span>Clinic · Gorakhpur</span></span>
    </>
  );
}

function IntroSplash({ onComplete }) {
  const splashRef = useRef(null);
  const backdropRef = useRef(null);
  const logoRef = useRef(null);
  const loaderRef = useRef(null);
  const progressFillRef = useRef(null);
  const progressValueRef = useRef(null);

  useEffect(() => {
    const splash = splashRef.current;
    const backdrop = backdropRef.current;
    const logo = logoRef.current;
    const loader = loaderRef.current;
    const progressFill = progressFillRef.current;
    const progressValue = progressValueRef.current;
    if (!splash || !backdrop || !logo || !loader || !progressFill || !progressValue) return;

    document.body.classList.add("intro-active");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startTime = performance.now();
    let frameId;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      progressFill.style.width = "100%";
      progressValue.textContent = "100%";
      loader.setAttribute("aria-valuenow", "100");

      const target = document.querySelector(".site-header .brand-mark-logo");
      const targetRect = target?.getBoundingClientRect();
      const startRect = logo.getBoundingClientRect();
      const duration = reduceMotion ? 250 : 1000;
      logo.style.transform = "none";
      logo.style.left = `${startRect.left}px`;
      logo.style.top = `${startRect.top}px`;
      logo.style.width = `${startRect.width}px`;
      logo.style.height = `${startRect.height}px`;

      loader.animate(
        [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(10px)" }],
        { duration: 260, fill: "forwards", easing: "ease-out" },
      );
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration,
        fill: "forwards",
        easing: "ease-in-out",
      });

      const logoAnimation = targetRect
        ? logo.animate(
          [
            {
              left: `${startRect.left}px`,
              top: `${startRect.top}px`,
              width: `${startRect.width}px`,
              height: `${startRect.height}px`,
              borderRadius: "0px",
            },
            {
              left: `${targetRect.left}px`,
              top: `${targetRect.top}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              borderRadius: "0px",
            },
          ],
          { duration, fill: "forwards", easing: "cubic-bezier(.76,0,.24,1)" },
        )
        : logo.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" });

      logoAnimation.finished.finally(() => {
        document.body.classList.remove("intro-active");
        onComplete();
      });
    };

    const updateProgress = (now) => {
      const progress = Math.max(0, Math.min(100, Math.round(((now - startTime) / 2000) * 100)));
      progressFill.style.width = `${progress}%`;
      progressValue.textContent = `${progress}%`;
      loader.setAttribute("aria-valuenow", String(progress));
      if (progress >= 100) {
        finish();
      } else {
        frameId = requestAnimationFrame(updateProgress);
      }
    };

    frameId = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(frameId);
      document.body.classList.remove("intro-active");
    };
  }, [onComplete]);

  return (
    <div className="intro-splash" ref={splashRef} aria-label="Loading Mukhija Skin & Laser Clinic">
      <div className="intro-backdrop" ref={backdropRef} />
      <div className="intro-logo" ref={logoRef}>
        <img src={LOGO} alt="Mukhija Skin & Laser Clinic" />
      </div>
      <div
        className="intro-loader"
        ref={loaderRef}
        role="progressbar"
        aria-label="Website loading progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
      >
        <div className="intro-progress-track">
          <span className="intro-progress-fill" ref={progressFillRef} />
        </div>
        <span className="intro-progress-value" ref={progressValueRef}>0%</span>
      </div>
    </div>
  );
}

function Header({ open, setOpen }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <div className="header-inner">
          <a href={withBase("/")} className="brand"><BrandMark /></a>
          <nav className="main-nav" aria-label="Primary">
            <a href={withBase("/")}>Home</a>
            <div className="has-drop">
              <a href={withBase("/about-clinic/")}>About <span aria-hidden="true">▾</span></a>
              <div className="dropdown">
                <a href={withBase("/about-clinic/")}>Our Clinic</a>
                <a href={withBase("/dr-r-d-mukhija/")}>Dr. R. D. Mukhija</a>
                <a href={withBase("/dr-gaurav-mukhija-2/")}>Dr. Gaurav Mukhija</a>
              </div>
            </div>
            <div className="has-drop">
              <a href={withBase("/treatments/")}>Treatments <span aria-hidden="true">▾</span></a>
              <div className="dropdown">
                <a href={withBase("/treatments/#skin")}>Skin</a>
                <a href={withBase("/treatments/#laser")}>Laser &amp; Aesthetic</a>
                <a href={withBase("/treatments/#hair")}>Hair</a>
                <a href={withBase("/treatments/#medical")}>Medical Dermatology</a>
              </div>
            </div>
            <a href={withBase("/before-after/")}>Before &amp; After</a>
            <a href={withBase("/contact-us/")}>Contact</a>
          </nav>
          <div className="header-actions">
            <a href="tel:+919554220700" className="icon-btn" aria-label="Call the clinic">☎</a>
            <a href={withBase("/book-appointment/")} className="btn btn-primary btn-sm">Book Appointment</a>
            <button className="icon-btn nav-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>☰</button>
          </div>
        </div>
      </header>
      <div className={`drawer-backdrop ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mobile-drawer-top">
          <span className="brand-text"><strong>Mukhija Skin &amp; Laser</strong></span>
          <button className="icon-btn drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav>
          <a href={withBase("/")}>Home</a>
          <a href={withBase("/about-clinic/")}>Our Clinic</a>
          <a href={withBase("/dr-r-d-mukhija/")}>Dr. R. D. Mukhija</a>
          <a href={withBase("/dr-gaurav-mukhija-2/")}>Dr. Gaurav Mukhija</a>
          <a href={withBase("/treatments/")}>All Treatments</a>
          <a href={withBase("/acne-scar-treatment-gorakhpur/")}>Acne Scar Treatment</a>
          <a href={withBase("/open-pores-treatment-gorakhpur/")}>Open Pores Treatment</a>
          <a href={withBase("/before-after/")}>Before &amp; After</a>
          <a href={withBase("/contact-us/")}>Contact</a>
        </nav>
        <div className="m-cta">
          <a href={withBase("/book-appointment/")} className="btn btn-primary btn-block">Book Appointment</a>
          <a href="tel:+919554220700" className="btn btn-ghost btn-block">Call +91-9554220700</a>
        </div>
      </aside>
    </>
  );
}

function Footer() {
  return (
    <>
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand"><BrandMark /></div>
              <p>A dermatologist-led skin, hair and laser clinic on Betiahata Road, Gorakhpur — built on more than three decades of clinical dermatology experience.</p>
            </div>
            <div className="foot-col"><h4>Clinic</h4><ul><li><a href={withBase("/about-clinic/")}>About Us</a></li><li><a href={withBase("/dr-r-d-mukhija/")}>Dr. R. D. Mukhija</a></li><li><a href={withBase("/dr-gaurav-mukhija-2/")}>Dr. Gaurav Mukhija</a></li><li><a href={withBase("/#technology")}>Technology</a></li></ul></div>
            <div className="foot-col"><h4>Treatments</h4><ul><li><a href={withBase("/acne-scar-treatment-gorakhpur/")}>Acne Scar Treatment</a></li><li><a href={withBase("/open-pores-treatment-gorakhpur/")}>Open Pores Treatment</a></li><li><a href={withBase("/treatments/#hair")}>Hair Fall &amp; PRP</a></li><li><a href={withBase("/treatments/")}>View All Treatments</a></li></ul></div>
            <div className="foot-col"><h4>Patient Info</h4><ul><li><a href={withBase("/book-appointment/")}>Book Appointment</a></li><li><a href={withBase("/before-after/")}>Before &amp; After</a></li><li><a href={withBase("/contact-us/")}>Contact &amp; Directions</a></li><li><a href={withBase("/contact-us/#hours")}>Clinic Hours</a></li></ul></div>
          </div>
          <div className="foot-bottom"><span>© 2026 Mukhija Skin &amp; Laser Clinic. All rights reserved.</span><div className="legal"><a href={withBase("/privacy-policy/")}>Privacy Policy</a><a href={withBase("/terms/")}>Terms</a><a href={withBase("/medical-disclaimer/")}>Medical Disclaimer</a></div></div>
        </div>
      </footer>
      <div className="desktop-float"><a href="https://wa.me/919554220700" className="wa" aria-label="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">✆</a><a href={withBase("/book-appointment/")} aria-label="Book an appointment">▣</a></div>
      <div className="mobile-action-bar"><a href="tel:+919554220700">☎ Call</a><a href="https://wa.me/919554220700" target="_blank" rel="noopener noreferrer">✆ WhatsApp</a><a href={withBase("/book-appointment/")} className="primary">▣ Book</a></div>
    </>
  );
}

function App() {
  const [path, setPath] = useState(() => appPathFromLocation());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem("mukhija-intro-seen") !== "true";
    } catch {
      return true;
    }
  });
  const pageKey = routeMap[path] ?? "notFound";
  const page = pages[pageKey];
  useSeo(page);

  const completeIntro = () => {
    try {
      localStorage.setItem("mukhija-intro-seen", "true");
    } catch {
      // The intro still completes when storage is unavailable.
    }
    setShowIntro(false);
  };

  useEffect(() => {
    const onPopState = () => setPath(appPathFromLocation());
    const onClick = (event) => {
      const anchor = event.target.closest("a");
      if (!anchor || anchor.target || anchor.protocol !== window.location.protocol || anchor.host !== window.location.host) return;
      const appPath = appPathFromLocation(anchor.pathname);
      if (!(appPath in routeMap) && appPath !== "/") return;
      event.preventDefault();
      window.history.pushState({}, "", `${withBase(appPath)}${anchor.hash}`);
      setPath(appPath);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (anchor.hash) requestAnimationFrame(() => document.querySelector(anchor.hash)?.scrollIntoView());
    };
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    const filterButtons = [...document.querySelectorAll(".cat-pill")];
    const onFilter = (event) => {
      const category = event.currentTarget.dataset.filter;
      filterButtons.forEach((button) => button.classList.toggle("active", button === event.currentTarget));
      document.querySelectorAll(".treat-card").forEach((card) => {
        card.hidden = category !== "all" && card.dataset.cat !== category;
      });
    };
    filterButtons.forEach((button) => button.addEventListener("click", onFilter));

    const cleanups = [];
    document.querySelectorAll(".ba-slider").forEach((slider) => {
      const update = (clientX) => {
        const rect = slider.getBoundingClientRect();
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        slider.style.setProperty("--split", `${percent}%`);
      };
      const move = (event) => update(event.touches?.[0]?.clientX ?? event.clientX);
      slider.addEventListener("mousemove", move);
      slider.addEventListener("touchmove", move, { passive: true });
      cleanups.push(() => {
        slider.removeEventListener("mousemove", move);
        slider.removeEventListener("touchmove", move);
      });
    });

    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("visible", entry.isIntersecting)), { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => {
      filterButtons.forEach((button) => button.removeEventListener("click", onFilter));
      cleanups.forEach((cleanup) => cleanup());
      observer.disconnect();
    };
  }, [path]);

  const content = useMemo(() => {
    if (page.kind === "html") {
      return <main id="main" dangerouslySetInnerHTML={{ __html: page.html }} />;
    }
    const Component = page.Component;
    return <Component />;
  }, [page]);

  return (
    <>
      <Header open={drawerOpen} setOpen={setDrawerOpen} />
      {content}
      <Footer />
      {showIntro ? <IntroSplash onComplete={completeIntro} /> : null}
    </>
  );
}

export default App;
