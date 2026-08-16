const rawBase = import.meta.env.BASE_URL || "/";
export const BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

/** App path from the browser location, with the Pages base stripped. */
export function appPathFromLocation(pathname = window.location.pathname) {
  if (!BASE) return pathname || "/";
  if (pathname === BASE || pathname === `${BASE}/`) return "/";
  if (pathname.startsWith(`${BASE}/`)) {
    const rest = pathname.slice(BASE.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

/** Prefix an in-app path with the Pages base (keeps hashes). */
export function withBase(path = "/") {
  if (path == null || path === "") return `${BASE}/` || "/";
  if (
    /^(https?:|tel:|mailto:|data:)/i.test(path)
    || path.startsWith("//")
  ) {
    return path;
  }
  if (path.startsWith("#")) return path;
  const [pathname, hash = ""] = path.split("#");
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefixed = `${BASE}${clean === "/" ? "/" : clean}`;
  return hash ? `${prefixed}#${hash}` : prefixed;
}

export function assetUrl(file) {
  const name = String(file).replace(/^\//, "");
  return `${BASE}/${name}`;
}

/** Fully-qualified asset URL, required by og:image and twitter:image. */
export function absoluteAssetUrl(file) {
  const path = assetUrl(file);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
