const params = new URLSearchParams(window.location.search);
const site = params.get("site");

if (site) {
  document.getElementById("domain").textContent = site;
} else {
  document.getElementById("domain").style.display = "none";
}

document.getElementById("back-btn").addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    window.close();
  }
});

document.getElementById("close-btn").addEventListener("click", () => {
  window.close();
});
