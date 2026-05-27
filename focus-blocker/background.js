const STORAGE_KEY = "blockedSites";
const RULE_ID_START = 1000;

function buildRule(id, domain) {
  const redirectUrl =
    chrome.runtime.getURL("blocked.html") +
    "?site=" + encodeURIComponent(domain);

  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: redirectUrl }
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ["main_frame"]
    }
  };
}

async function syncRules() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  const sites = data[STORAGE_KEY] || [];

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  const addRules = sites.map((site, idx) =>
    buildRule(RULE_ID_START + idx, site)
  );

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    syncRules();
  }
});

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
