// Login amb Google i crides a l'Apps Script. Compartit per les tres pàgines.
//
// La sessió verificada es guarda al navegador: en canviar de pestanya no es
// torna a preguntar res a ningú i la pàgina es pinta a l'instant. Cada quart
// d'hora es revalida en segon pla, sense que l'usuari ho noti.

const CLAU_SESSIO = "ms_sessio";
const REVALIDA_CADA = 15 * 60 * 1000;
const PREFIX_CACHE = "ms_cache_";
const CADUCITAT_CACHE = 10 * 60 * 1000;

let SESSIO = null;

// ---------------------------------------------------------------------------
// Sessió
// ---------------------------------------------------------------------------

function inicialitzaLogin(onLogin) {
  const desada = sessioDesada();
  if (desada) {
    SESSIO = desada;
    obreContingut();
    onLogin(SESSIO);
    if (Date.now() - (desada.verificat || 0) > REVALIDA_CADA) revalida();
    return;
  }
  demanaLogin(onLogin);
}

function sessioDesada() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAU_SESSIO));
    if (!s || !s.token) return null;
    // Els tokens de Google duren aproximadament una hora.
    const caduca = caducitatToken(s.token);
    if (!caduca || caduca - 60 < Date.now() / 1000) return null;
    return s;
  } catch (e) {
    return null;
  }
}

function caducitatToken(token) {
  try {
    const cos = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(cos)).exp;
  } catch (e) {
    return null;
  }
}

// Comprova en segon pla que el compte segueixi donat d'alta. Si falla no
// s'interromp res: el servidor verifica igualment cada escriptura.
async function revalida() {
  try {
    const dades = await api("jo", { id_token: SESSIO.token });
    SESSIO = Object.assign({}, SESSIO, dades, { verificat: Date.now() });
    localStorage.setItem(CLAU_SESSIO, JSON.stringify(SESSIO));
    pintaWhoami();
  } catch (e) {
    localStorage.removeItem(CLAU_SESSIO);
  }
}

function demanaLogin(onLogin) {
  document.getElementById("gate").classList.remove("hidden");
  document.getElementById("contingut").classList.add("hidden");

  carregaGoogle()
    .then(() => {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        auto_select: true, // si ja ha entrat abans, no cal ni clicar
        callback: (resposta) => validaToken(resposta.credential, onLogin)
      });
      google.accounts.id.renderButton(document.getElementById("gbtn"), {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        locale: "ca"
      });
      google.accounts.id.prompt();
    })
    .catch((e) => {
      document.getElementById("gate-estat").textContent = e.message;
    });
}

// La llibreria de Google només es carrega quan cal iniciar sessió de debò.
function carregaGoogle() {
  if (window.google && window.google.accounts) return Promise.resolve();
  if (!window._promesaGoogle) {
    window._promesaGoogle = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = res;
      s.onerror = () => rej(new Error("No s'ha pogut carregar el login de Google."));
      document.head.appendChild(s);
    });
  }
  return window._promesaGoogle;
}

async function validaToken(token, onLogin) {
  const estat = document.getElementById("gate-estat");
  if (estat) estat.textContent = "Comprovant el compte…";
  try {
    const dades = await api("jo", { id_token: token });
    SESSIO = {
      token: token,
      email: dades.email,
      nom: dades.nom,
      rol: dades.rol,
      verificat: Date.now()
    };
    localStorage.setItem(CLAU_SESSIO, JSON.stringify(SESSIO));
    obreContingut();
    onLogin(SESSIO);
  } catch (e) {
    localStorage.removeItem(CLAU_SESSIO);
    if (estat) estat.textContent = e.message;
  }
}

function obreContingut() {
  document.getElementById("gate").classList.add("hidden");
  document.getElementById("contingut").classList.remove("hidden");
  pintaWhoami();
  if (SESSIO && SESSIO.rol === "responsable") {
    const nav = document.getElementById("nav-aprov");
    if (nav) nav.classList.remove("hidden");
  }
}

function pintaWhoami() {
  const el = document.getElementById("whoami");
  if (!el || !SESSIO) return;
  el.innerHTML =
    "Sessió iniciada com <strong>" + escapa(SESSIO.nom) + "</strong> · " +
    escapa(SESSIO.email) +
    ' <button class="ghost small" onclick="tancaSessio()">Tanca sessió</button>';
}

function tancaSessio() {
  localStorage.removeItem(CLAU_SESSIO);
  netejaCache();
  if (window.google && window.google.accounts) google.accounts.id.disableAutoSelect();
  location.reload();
}

// ---------------------------------------------------------------------------
// Crides a l'Apps Script
// ---------------------------------------------------------------------------

// L'Apps Script no respon a peticions amb preflight CORS: per això els GET van
// sense capçaleres i els POST s'envien com a text pla.
async function api(accio, params) {
  const url = SCRIPT_URL + "?" + new URLSearchParams(
    Object.assign({ action: accio }, params)
  );
  const r = await fetch(url, { method: "GET" });
  const dades = await r.json();
  if (!dades.ok) throw new Error(dades.error || "Error desconegut");
  return dades.data;
}

async function apiPost(accio, cos) {
  const r = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action: accio, id_token: SESSIO.token }, cos))
  });
  const dades = await r.json();
  if (!dades.ok) throw new Error(dades.error || "Error desconegut");
  return dades.data;
}

/**
 * Pinta primer l'últim resultat conegut i després el refresca.
 * `aplica(dades, esAntic)` es crida un cop o dos.
 */
async function apiCachejat(accio, params, aplica, clauExtra) {
  const clau = PREFIX_CACHE + accio + (clauExtra || "");
  const desat = llegeixCache(clau);
  if (desat) aplica(desat, true);

  try {
    const fresc = await api(accio, Object.assign({ id_token: SESSIO.token }, params));
    escriuCache(clau, fresc);
    aplica(fresc, false);
    return fresc;
  } catch (e) {
    if (desat) return desat; // el que hi havia serveix; no molestem l'usuari
    throw e;
  }
}

function llegeixCache(clau) {
  try {
    const c = JSON.parse(localStorage.getItem(clau));
    if (!c || Date.now() - c.ts > CADUCITAT_CACHE) return null;
    return c.dades;
  } catch (e) {
    return null;
  }
}

function escriuCache(clau, dades) {
  try {
    localStorage.setItem(clau, JSON.stringify({ ts: Date.now(), dades: dades }));
  } catch (e) {
    // Si no hi cap, tant se val: només és una optimització.
  }
}

function invalidaCache(accio) {
  Object.keys(localStorage)
    .filter((k) => k.indexOf(PREFIX_CACHE + accio) === 0)
    .forEach((k) => localStorage.removeItem(k));
}

function netejaCache() {
  Object.keys(localStorage)
    .filter((k) => k.indexOf(PREFIX_CACHE) === 0)
    .forEach((k) => localStorage.removeItem(k));
}

// ---------------------------------------------------------------------------
// Utilitats de formulari
// ---------------------------------------------------------------------------

function omplerDepartaments(selDep, selSub) {
  selDep.innerHTML = '<option value="">Tria un departament…</option>';
  Object.keys(DEPARTAMENTS).forEach((d) => {
    selDep.insertAdjacentHTML("beforeend", "<option>" + escapa(d) + "</option>");
  });
  selDep.addEventListener("change", () => {
    const subs = DEPARTAMENTS[selDep.value] || [];
    selSub.innerHTML = '<option value="">Tria un subdepartament…</option>';
    subs.forEach((s) => {
      selSub.insertAdjacentHTML("beforeend", "<option>" + escapa(s) + "</option>");
    });
    selSub.disabled = subs.length === 0;
  });
  selSub.disabled = true;
}

function omplerOpcions(sel, llista, buit) {
  sel.innerHTML = '<option value="">' + buit + "</option>";
  llista.forEach((v) => sel.insertAdjacentHTML("beforeend", "<option>" + escapa(v) + "</option>"));
}

function escapa(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function mostraError(idCamp, missatge) {
  const el = document.getElementById(idCamp);
  if (!el) return;
  el.textContent = missatge;
  el.classList.add("show");
}

function netejaErrors() {
  document.querySelectorAll(".err").forEach((e) => e.classList.remove("show"));
}

function banner(tipus, html) {
  const el = document.getElementById("banner");
  el.className = "banner " + tipus;
  el.innerHTML = html;
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function amagaBanner() {
  document.getElementById("banner").classList.add("hidden");
}

function fitxerABase64(fitxer) {
  return new Promise((res, rej) => {
    const lector = new FileReader();
    lector.onload = () => res(lector.result.split(",")[1]);
    lector.onerror = () => rej(new Error("No s'ha pogut llegir el fitxer"));
    lector.readAsDataURL(fitxer);
  });
}
