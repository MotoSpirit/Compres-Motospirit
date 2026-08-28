// Login amb Google i crides a l'Apps Script. Compartit per les tres pàgines.

let SESSIO = null; // { token, email, nom, rol }

function inicialitzaLogin(onLogin) {
  const guardat = sessionStorage.getItem("ms_token");
  if (guardat) {
    validaToken(guardat, onLogin);
    return;
  }
  mostraBotoGoogle(onLogin);
}

function mostraBotoGoogle(onLogin) {
  document.getElementById("gate").classList.remove("hidden");
  document.getElementById("contingut").classList.add("hidden");

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => validaToken(resposta.credential, onLogin)
  });
  google.accounts.id.renderButton(document.getElementById("gbtn"), {
    theme: "filled_black",
    size: "large",
    text: "signin_with",
    locale: "ca"
  });
}

async function validaToken(token, onLogin) {
  const estat = document.getElementById("gate-estat");
  if (estat) estat.textContent = "Comprovant el compte…";
  try {
    const dades = await api("jo", { id_token: token });
    SESSIO = { token, email: dades.email, nom: dades.nom, rol: dades.rol };
    sessionStorage.setItem("ms_token", token);
    document.getElementById("gate").classList.add("hidden");
    document.getElementById("contingut").classList.remove("hidden");
    pintaWhoami();
    onLogin(SESSIO);
  } catch (e) {
    sessionStorage.removeItem("ms_token");
    if (estat) estat.textContent = e.message;
    mostraBotoGoogle(onLogin);
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
  sessionStorage.removeItem("ms_token");
  location.reload();
}

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

// Departament -> subdepartament
function omplerDepartaments(selDep, selSub) {
  selDep.innerHTML = '<option value="">Tria un departament…</option>';
  Object.keys(DEPARTAMENTS).forEach((d) => {
    selDep.insertAdjacentHTML("beforeend", '<option>' + escapa(d) + "</option>");
  });
  selDep.addEventListener("change", () => {
    const subs = DEPARTAMENTS[selDep.value] || [];
    selSub.innerHTML = '<option value="">Tria un subdepartament…</option>';
    subs.forEach((s) => {
      selSub.insertAdjacentHTML("beforeend", '<option>' + escapa(s) + "</option>");
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
