const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const INDEX_HTML_PATH = path.join(__dirname, "..", "index.html");

function loadGame() {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "http://localhost",
    storageQuota: 10000000,
  });

  const window = dom.window;
  const document = window.document;

  window.addEventListener("error", (e) => {
    e.preventDefault();
  });

  window.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
  });

  const exportScript = document.createElement("script");
  exportScript.textContent = `
    window.__testExports = {
      ProfileStore: ProfileStore,
      LevelData: LevelData,
      StatsStore: StatsStore,
      VoyageLogStore: VoyageLogStore,
      CampaignStore: CampaignStore,
      AchievementRules: AchievementRules,
      DailyChallengeStore: DailyChallengeStore,
      CampaignConfig: CampaignConfig,
    };
  `;
  document.body.appendChild(exportScript);

  const exports = window.__testExports || {};

  return {
    window,
    document,
    localStorage: window.localStorage,
    ProfileStore: exports.ProfileStore,
    LevelData: exports.LevelData,
    StatsStore: exports.StatsStore,
    VoyageLogStore: exports.VoyageLogStore,
    CampaignStore: exports.CampaignStore,
    AchievementRules: exports.AchievementRules,
    DailyChallengeStore: exports.DailyChallengeStore,
    CampaignConfig: exports.CampaignConfig,
  };
}

function clearLocalStorage(window) {
  window.localStorage.clear();
}

module.exports = {
  loadGame,
  clearLocalStorage,
};
