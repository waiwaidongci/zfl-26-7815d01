const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame, clearLocalStorage } = require("./setup.js");

let game;

function setup() {
  clearLocalStorage(game.window);
}

test.before(() => {
  game = loadGame();
});

test.beforeEach(() => {
  setup();
});

// ============================================================
// 最佳分取高值 测试
// ============================================================

test.describe("最佳分取高值", () => {
  test("levelBests - 导入更高分数应覆盖现有分数", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({
      builtin_0: 1000,
      builtin_1: 2000,
    }));

    const profile = {
      formatVersion: 1,
      gameVersion: "1.0.0",
      type: "player_profile",
      exportedAt: Date.now(),
      playerName: "test",
      categories: ["levelBests"],
      data: {
        levelBests: {
          builtin_0: 1500,
          builtin_2: 3000,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1500);
    assert.equal(bests.builtin_1, 2000);
    assert.equal(bests.builtin_2, 3000);
  });

  test("levelBests - 导入更低分数应保留现有分数", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({
      builtin_0: 1000,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        levelBests: {
          builtin_0: 500,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1000);
  });

  test("levelBests - 导入相同分数不改变状态", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({
      builtin_0: 1000,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        levelBests: {
          builtin_0: 1000,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1000);
  });

  test("globalBest - 导入更高的全局最佳分应覆盖", () => {
    game.LevelData.saveGlobalBest(5000);

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        globalBest: 8000,
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);
    assert.equal(game.LevelData.loadGlobalBest(), 8000);
  });

  test("globalBest - 导入更低的全局最佳分应保留原值", () => {
    game.LevelData.saveGlobalBest(5000);

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        globalBest: 3000,
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);
    assert.equal(game.LevelData.loadGlobalBest(), 5000);
  });

  test("builtinUnlocked - 导入更大的解锁数量应覆盖", () => {
    game.LevelData.saveBuiltinUnlocked(3);

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        builtinUnlocked: 5,
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);
    assert.equal(game.LevelData.loadBuiltinUnlocked(), 5);
  });

  test("builtinUnlocked - 导入更小的解锁数量应保留原值", () => {
    game.LevelData.saveBuiltinUnlocked(5);

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        builtinUnlocked: 2,
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests"]);
    assert.equal(result.success, true);
    assert.equal(game.LevelData.loadBuiltinUnlocked(), 5);
  });

  test("campaignProgress - 章节最佳分取较高值", () => {
    game.localStorage.setItem("zfl26CampaignProgress", JSON.stringify({
      chapterProgress: {
        chapter_1: { bestScore: 1000, completed: true },
        chapter_2: { bestScore: 2000, completed: false },
      },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        campaignProgress: {
          chapterProgress: {
            chapter_1: { bestScore: 1500, completed: false },
            chapter_3: { bestScore: 3000, completed: true },
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["campaignProgress"]);
    assert.equal(result.success, true);

    const progress = JSON.parse(game.localStorage.getItem("zfl26CampaignProgress") || "{}");
    assert.equal(progress.chapterProgress.chapter_1.bestScore, 1500);
    assert.equal(progress.chapterProgress.chapter_2.bestScore, 2000);
    assert.equal(progress.chapterProgress.chapter_3.bestScore, 3000);
  });

  test("campaignProgress - 章节完成状态取或（只要有一个完成则完成）", () => {
    game.localStorage.setItem("zfl26CampaignProgress", JSON.stringify({
      chapterProgress: {
        chapter_1: { bestScore: 1000, completed: true, completedAt: 1000 },
      },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        campaignProgress: {
          chapterProgress: {
            chapter_1: { bestScore: 500, completed: false },
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["campaignProgress"]);
    assert.equal(result.success, true);

    const progress = JSON.parse(game.localStorage.getItem("zfl26CampaignProgress") || "{}");
    assert.equal(progress.chapterProgress.chapter_1.completed, true);
    assert.equal(progress.chapterProgress.chapter_1.bestScore, 1000);
  });

  test("dailyChallenge - 每日最佳分取较高值", () => {
    game.localStorage.setItem("zfl26DailyChallengeHistory", JSON.stringify({
      "2024-01-01": { bestScore: 1000 },
      "2024-01-02": { bestScore: 2000 },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        dailyChallenge: {
          history: {
            "2024-01-01": { bestScore: 1500 },
            "2024-01-03": { bestScore: 3000 },
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["dailyChallenge"]);
    assert.equal(result.success, true);

    const history = JSON.parse(game.localStorage.getItem("zfl26DailyChallengeHistory") || "{}");
    assert.equal(history["2024-01-01"].bestScore, 1500);
    assert.equal(history["2024-01-02"].bestScore, 2000);
    assert.equal(history["2024-01-03"].bestScore, 3000);
  });
});

// ============================================================
// 统计字段累加或取最优值 测试
// ============================================================

test.describe("统计字段累加或取最优值", () => {
  test("累加型统计 - totalEscorted 应累加", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      totalEscorted: 100,
      perfectWins: 10,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          totalEscorted: 50,
          perfectWins: 5,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.totalEscorted, 150);
    assert.equal(stats.perfectWins, 15);
  });

  test("累加型统计 - narrowBeamWins, campaignCompletions 等应累加", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      narrowBeamWins: 5,
      campaignCompletions: 2,
      campaignNoDamageCompletions: 1,
      customRouteCompletions: 3,
      fogWins: 8,
      flashEscortSuccess: 4,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          narrowBeamWins: 3,
          campaignCompletions: 1,
          campaignNoDamageCompletions: 2,
          customRouteCompletions: 2,
          fogWins: 4,
          flashEscortSuccess: 1,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.narrowBeamWins, 8);
    assert.equal(stats.campaignCompletions, 3);
    assert.equal(stats.campaignNoDamageCompletions, 3);
    assert.equal(stats.customRouteCompletions, 5);
    assert.equal(stats.fogWins, 12);
    assert.equal(stats.flashEscortSuccess, 5);
  });

  test("最大值型统计 - maxLossStreak 取较大值", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      maxLossStreak: 5,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          maxLossStreak: 8,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);
    assert.equal(game.StatsStore.getAll().maxLossStreak, 8);
  });

  test("最大值型统计 - 导入更小的 maxLossStreak 保留原值", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      maxLossStreak: 10,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          maxLossStreak: 5,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);
    assert.equal(game.StatsStore.getAll().maxLossStreak, 10);
  });

  test("最优值型统计 - fastestClearTime 取较小值（越快越好）", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      fastestClearTime: 120,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          fastestClearTime: 90,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);
    assert.equal(game.StatsStore.getAll().fastestClearTime, 90);
  });

  test("最优值型统计 - 导入更慢的 fastestClearTime 保留原值", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      fastestClearTime: 60,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          fastestClearTime: 90,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);
    assert.equal(game.StatsStore.getAll().fastestClearTime, 60);
  });

  test("weatherWins 子对象应累加", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      weatherWins: {
        seaBreeze: 10,
        denseFog: 5,
        lighthouseFlash: 3,
      },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          weatherWins: {
            seaBreeze: 5,
            denseFog: 2,
            lighthouseFlash: 4,
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.weatherWins.seaBreeze, 15);
    assert.equal(stats.weatherWins.denseFog, 7);
    assert.equal(stats.weatherWins.lighthouseFlash, 7);
  });

  test("failReasons 子对象应累加", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      failReasons: {
        top: 10,
        bottom: 5,
        unlit: 3,
        rock: 2,
      },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          failReasons: {
            top: 4,
            bottom: 6,
            unlit: 1,
            rock: 3,
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.failReasons.top, 14);
    assert.equal(stats.failReasons.bottom, 11);
    assert.equal(stats.failReasons.unlit, 4);
    assert.equal(stats.failReasons.rock, 5);
  });

  test("统计 - 现有缺失字段时导入应正确设置", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      totalEscorted: 100,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          maxLossStreak: 5,
          fastestClearTime: 100,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.totalEscorted, 100);
    assert.equal(stats.maxLossStreak, 5);
    assert.equal(stats.fastestClearTime, 100);
  });

  test("统计 - 导入缺失字段时保留原值", () => {
    game.localStorage.setItem("zfl26Stats", JSON.stringify({
      totalEscorted: 100,
      maxLossStreak: 5,
      fastestClearTime: 60,
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        stats: {
          totalEscorted: 50,
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["stats"]);
    assert.equal(result.success, true);

    const stats = game.StatsStore.getAll();
    assert.equal(stats.totalEscorted, 150);
    assert.equal(stats.maxLossStreak, 5);
    assert.equal(stats.fastestClearTime, 60);
  });
});

// ============================================================
// 航海日志按ID去重 测试
// ============================================================

test.describe("航海日志按ID去重", () => {
  test("导入相同ID的航海日志应被去重", () => {
    const existingLogs = [
      { id: "log_1", levelId: "builtin_0", score: 1000, result: "win" },
      { id: "log_2", levelId: "builtin_1", score: 2000, result: "win" },
    ];
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify(existingLogs));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        voyageLogs: [
          { id: "log_1", levelId: "builtin_0", score: 1500, result: "win" },
          { id: "log_3", levelId: "builtin_2", score: 3000, result: "lose" },
        ],
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["voyageLogs"]);
    assert.equal(result.success, true);
    assert.equal(result.results.voyageLogs.added, 1);

    const logs = game.VoyageLogStore.loadAll();
    assert.equal(logs.length, 3);

    const ids = logs.map(l => l.id);
    assert.ok(ids.indexOf("log_1") >= 0);
    assert.ok(ids.indexOf("log_2") >= 0);
    assert.ok(ids.indexOf("log_3") >= 0);
  });

  test("导入无ID的航海日志应全部添加", () => {
    const existingLogs = [
      { id: "log_1", levelId: "builtin_0", score: 1000, result: "win" },
    ];
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify(existingLogs));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        voyageLogs: [
          { levelId: "builtin_1", score: 2000, result: "win" },
          { levelId: "builtin_2", score: 3000, result: "lose" },
        ],
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["voyageLogs"]);
    assert.equal(result.success, true);
    assert.equal(result.results.voyageLogs.added, 2);

    const logs = game.VoyageLogStore.loadAll();
    assert.equal(logs.length, 3);
  });

  test("导入完全不重复的航海日志应全部添加", () => {
    const existingLogs = [
      { id: "log_1", levelId: "builtin_0", score: 1000, result: "win" },
    ];
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify(existingLogs));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        voyageLogs: [
          { id: "log_2", levelId: "builtin_1", score: 2000, result: "win" },
          { id: "log_3", levelId: "builtin_2", score: 3000, result: "lose" },
        ],
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["voyageLogs"]);
    assert.equal(result.success, true);
    assert.equal(result.results.voyageLogs.added, 2);

    const logs = game.VoyageLogStore.loadAll();
    assert.equal(logs.length, 3);
  });

  test("导入完全重复的航海日志应全部跳过", () => {
    const existingLogs = [
      { id: "log_1", levelId: "builtin_0", score: 1000, result: "win" },
      { id: "log_2", levelId: "builtin_1", score: 2000, result: "win" },
    ];
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify(existingLogs));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        voyageLogs: [
          { id: "log_1", levelId: "builtin_0", score: 9999, result: "win" },
          { id: "log_2", levelId: "builtin_1", score: 9999, result: "win" },
        ],
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["voyageLogs"]);
    assert.equal(result.success, true);
    assert.equal(result.results.voyageLogs.added, 0);

    const logs = game.VoyageLogStore.loadAll();
    assert.equal(logs.length, 2);
    assert.equal(logs.find(l => l.id === "log_1").score, 1000);
  });

  test("新导入的日志应在列表前面", () => {
    const existingLogs = [
      { id: "log_old", levelId: "builtin_0", score: 1000, result: "win" },
    ];
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify(existingLogs));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        voyageLogs: [
          { id: "log_new", levelId: "builtin_1", score: 2000, result: "win" },
        ],
      },
    };

    game.ProfileStore.importProfile(profile, ["voyageLogs"]);
    const logs = game.VoyageLogStore.loadAll();
    assert.equal(logs[0].id, "log_new");
  });
});

// ============================================================
// 回放按ID去重 测试
// ============================================================

test.describe("回放按ID去重", () => {
  test("导入相同ID的回放应被去重", () => {
    game.localStorage.setItem("zfl26Replay_replay_1", JSON.stringify({
      meta: { levelId: "builtin_0", finalScore: 1000, outcome: "win" },
      frames: [],
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        replays: {
          replay_1: {
            meta: { levelId: "builtin_0", finalScore: 9999, outcome: "win" },
            frames: ["imported_data"],
          },
          replay_2: {
            meta: { levelId: "builtin_1", finalScore: 2000, outcome: "lose" },
            frames: ["new_data"],
          },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["replays"]);
    assert.equal(result.success, true);
    assert.equal(result.results.replays.added, 1);

    const replay1 = JSON.parse(game.localStorage.getItem("zfl26Replay_replay_1") || "{}");
    assert.equal(replay1.meta.finalScore, 1000);

    const replay2 = JSON.parse(game.localStorage.getItem("zfl26Replay_replay_2") || "null");
    assert.ok(replay2 !== null);
    assert.equal(replay2.meta.finalScore, 2000);
  });

  test("导入不重复的回放应全部添加", () => {
    game.localStorage.setItem("zfl26Replay_existing", JSON.stringify({
      meta: { levelId: "builtin_0", finalScore: 1000 },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        replays: {
          replay_a: { meta: { finalScore: 2000 }, frames: [] },
          replay_b: { meta: { finalScore: 3000 }, frames: [] },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["replays"]);
    assert.equal(result.success, true);
    assert.equal(result.results.replays.added, 2);

    assert.ok(game.localStorage.getItem("zfl26Replay_replay_a") !== null);
    assert.ok(game.localStorage.getItem("zfl26Replay_replay_b") !== null);
  });

  test("导入完全重复的回放应全部跳过", () => {
    game.localStorage.setItem("zfl26Replay_r1", JSON.stringify({
      meta: { finalScore: 1000 },
    }));
    game.localStorage.setItem("zfl26Replay_r2", JSON.stringify({
      meta: { finalScore: 2000 },
    }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        replays: {
          r1: { meta: { finalScore: 9999 }, frames: ["overwrite_try"] },
          r2: { meta: { finalScore: 9999 }, frames: ["overwrite_try"] },
        },
      },
    };

    const result = game.ProfileStore.importProfile(profile, ["replays"]);
    assert.equal(result.success, true);
    assert.equal(result.results.replays.added, 0);

    const r1 = JSON.parse(game.localStorage.getItem("zfl26Replay_r1") || "{}");
    const r2 = JSON.parse(game.localStorage.getItem("zfl26Replay_r2") || "{}");
    assert.equal(r1.meta.finalScore, 1000);
    assert.equal(r2.meta.finalScore, 2000);
  });
});

// ============================================================
// localStorage 回滚 测试
// ============================================================

test.describe("导入失败时 localStorage 回滚", () => {
  test("导入无效档案应返回错误且不修改 localStorage", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 1000 }));
    game.localStorage.setItem("zfl26Stats", JSON.stringify({ totalEscorted: 50 }));

    const invalidProfile = { type: "wrong_type", data: {} };
    const result = game.ProfileStore.importProfile(invalidProfile, ["levelBests", "stats"]);

    assert.equal(result.success, false);
    assert.ok(result.errors.length > 0);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1000);
  });

  test("snapshotAllData 应捕获所有相关 localStorage 键", () => {
    game.localStorage.setItem("zfl26CustomLevels", JSON.stringify([{ id: "test_lvl" }]));
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 1000 }));
    game.localStorage.setItem("zfl26Best", "5000");
    game.localStorage.setItem("zfl26Stats", JSON.stringify({ totalEscorted: 10 }));
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify([{ id: "log_1" }]));
    game.localStorage.setItem("zfl26Replay_test1", JSON.stringify({ meta: {} }));
    game.localStorage.setItem("zfl26Replay_test2", JSON.stringify({ meta: {} }));

    const snapshot = game.ProfileStore.snapshotAllData();

    assert.ok(snapshot["zfl26CustomLevels"] !== undefined);
    assert.ok(snapshot["zfl26LevelBests"] !== undefined);
    assert.ok(snapshot["zfl26Best"] !== undefined);
    assert.ok(snapshot["zfl26Stats"] !== undefined);
    assert.ok(snapshot["zfl26VoyageLogs"] !== undefined);
    assert.equal(snapshot._replayKeys.length, 2);
    assert.ok(snapshot._replayKeys.indexOf("zfl26Replay_test1") >= 0);
    assert.ok(snapshot._replayKeys.indexOf("zfl26Replay_test2") >= 0);
  });

  test("restoreSnapshot 应完整恢复 localStorage 状态", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 1000 }));
    game.localStorage.setItem("zfl26Stats", JSON.stringify({ totalEscorted: 50 }));
    game.localStorage.setItem("zfl26Replay_r1", JSON.stringify({ meta: { score: 100 } }));
    game.localStorage.setItem("zfl26Replay_r2", JSON.stringify({ meta: { score: 200 } }));

    const snapshot = game.ProfileStore.snapshotAllData();

    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 9999 }));
    game.localStorage.setItem("zfl26Stats", JSON.stringify({ totalEscorted: 9999 }));
    game.localStorage.setItem("zfl26Replay_r1", JSON.stringify({ meta: { score: 9999 } }));
    game.localStorage.removeItem("zfl26Replay_r2");
    game.localStorage.setItem("zfl26Replay_r3", JSON.stringify({ meta: { score: 300 } }));
    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify([{ id: "new_log" }]));

    const restored = game.ProfileStore.restoreSnapshot(snapshot);
    assert.equal(restored, true);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1000);

    const stats = JSON.parse(game.localStorage.getItem("zfl26Stats") || "{}");
    assert.equal(stats.totalEscorted, 50);

    const r1 = JSON.parse(game.localStorage.getItem("zfl26Replay_r1") || "{}");
    assert.equal(r1.meta.score, 100);

    const r2 = game.localStorage.getItem("zfl26Replay_r2");
    assert.ok(r2 !== null);

    const r3 = game.localStorage.getItem("zfl26Replay_r3");
    assert.equal(r3, null);

    const logs = game.localStorage.getItem("zfl26VoyageLogs");
    assert.equal(logs, null);
  });

  test("部分导入成功后失败应回滚所有更改", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 1000 }));
    game.localStorage.setItem("zfl26Stats", JSON.stringify({ totalEscorted: 50 }));

    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: {
        levelBests: { builtin_0: 2000 },
        stats: { totalEscorted: 25 },
        achievements: { ach_test: 1 },
      },
    };

    const StorageProto = Object.getPrototypeOf(game.localStorage);
    const origSetItem = StorageProto.setItem;
    let hasThrown = false;
    StorageProto.setItem = function(key, value) {
      if (key === "zfl26Stats" && !hasThrown) {
        hasThrown = true;
        throw new Error("Simulated storage error");
      }
      return origSetItem.call(this, key, value);
    };

    const result = game.ProfileStore.importProfile(profile, ["levelBests", "stats", "achievements"]);

    StorageProto.setItem = origSetItem;

    assert.equal(result.success, false);
    assert.ok(result.errors[0].indexOf("回滚") >= 0);

    const bests = JSON.parse(game.localStorage.getItem("zfl26LevelBests") || "{}");
    assert.equal(bests.builtin_0, 1000);

    const stats = JSON.parse(game.localStorage.getItem("zfl26Stats") || "{}");
    assert.equal(stats.totalEscorted, 50);

    const achievements = JSON.parse(game.localStorage.getItem("zfl26Achievements") || "{}");
    assert.equal(Object.keys(achievements).length, 0);
  });

  test("回滚后快照前不存在的键应被删除", () => {
    game.localStorage.setItem("zfl26LevelBests", JSON.stringify({ builtin_0: 1000 }));

    const snapshot = game.ProfileStore.snapshotAllData();

    game.localStorage.setItem("zfl26VoyageLogs", JSON.stringify([{ id: "new_log" }]));
    game.localStorage.setItem("zfl26Replay_new_replay", JSON.stringify({ meta: {} }));

    game.ProfileStore.restoreSnapshot(snapshot);

    assert.equal(game.localStorage.getItem("zfl26VoyageLogs"), null);
    assert.equal(game.localStorage.getItem("zfl26Replay_new_replay"), null);
    assert.ok(game.localStorage.getItem("zfl26LevelBests") !== null);
  });
});

// ============================================================
// 档案验证 测试
// ============================================================

test.describe("档案验证", () => {
  test("有效档案应验证通过", () => {
    const profile = {
      formatVersion: 1,
      gameVersion: "1.0.0",
      type: "player_profile",
      exportedAt: Date.now(),
      playerName: "test",
      data: { levelBests: {} },
    };

    const validation = game.ProfileStore.validateProfile(profile);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  test("无效 type 的档案应验证失败", () => {
    const profile = {
      formatVersion: 1,
      type: "wrong_type",
      data: {},
    };

    const validation = game.ProfileStore.validateProfile(profile);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some(e => e.indexOf("文件类型") >= 0));
  });

  test("缺少 formatVersion 应验证失败", () => {
    const profile = {
      type: "player_profile",
      data: {},
    };

    const validation = game.ProfileStore.validateProfile(profile);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some(e => e.indexOf("formatVersion") >= 0));
  });

  test("formatVersion 过大应验证失败", () => {
    const profile = {
      formatVersion: 999,
      type: "player_profile",
      data: {},
    };

    const validation = game.ProfileStore.validateProfile(profile);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some(e => e.indexOf("版本过新") >= 0));
  });

  test("缺少 data 字段应验证失败", () => {
    const profile = {
      formatVersion: 1,
      type: "player_profile",
    };

    const validation = game.ProfileStore.validateProfile(profile);
    assert.equal(validation.valid, false);
  });

  test("parseProfileFromText 应正确解析有效 JSON", () => {
    const profile = {
      formatVersion: 1,
      type: "player_profile",
      data: { levelBests: { builtin_0: 1000 } },
    };
    const text = JSON.stringify(profile);

    const result = game.ProfileStore.parseProfileFromText(text);
    assert.equal(result.success, true);
    assert.equal(result.profile.type, "player_profile");
    assert.equal(result.profile.data.levelBests.builtin_0, 1000);
  });

  test("parseProfileFromText 应对无效 JSON 返回错误", () => {
    const result = game.ProfileStore.parseProfileFromText("not valid json {{{");
    assert.equal(result.success, false);
    assert.ok(result.errors.length > 0);
  });
});
