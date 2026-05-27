const STORAGE_KEY = "blockedSites";

const form = document.getElementById("add-form");
const input = document.getElementById("site-input");
const list = document.getElementById("sites-list");
const count = document.getElementById("count");

function normalizeDomain(value) {
  let v = (value || "").trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/^https?:\/\//, "");
  v = v.split("/")[0];
  v = v.split("?")[0];
  v = v.replace(/^www\./, "");
  if (!v.includes(".") || v.length < 3) return null;
  if (!/^[a-z0-9.-]+$/.test(v)) return null;
  return v;
}

async function loadSites() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function saveSites(sites) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: sites });
}

function render(sites) {
  list.innerHTML = "";
  count.textContent = sites.length;

  if (sites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Sin sitios bloqueados todavía";
    list.appendChild(empty);
    return;
  }

  sites.forEach((site) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = site;

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.textContent = "×";
    btn.title = `Quitar ${site}`;
    btn.addEventListener("click", () => removeSite(site));

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function flashError() {
  input.classList.add("error");
  setTimeout(() => input.classList.remove("error"), 800);
}

async function addSite(raw) {
  const domain = normalizeDomain(raw);
  if (!domain) {
    flashError();
    return;
  }
  const sites = await loadSites();
  if (sites.includes(domain)) {
    flashError();
    return;
  }
  const next = [...sites, domain].sort();
  await saveSites(next);
  render(next);
  input.value = "";
  input.focus();
}

async function removeSite(domain) {
  const sites = await loadSites();
  const next = sites.filter((s) => s !== domain);
  await saveSites(next);
  render(next);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addSite(input.value);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue || []);
  }
});

(async () => {
  render(await loadSites());
  input.focus();
})();
