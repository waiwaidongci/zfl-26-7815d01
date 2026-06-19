const { test, expect } = require('@playwright/test');

test.describe('夜间灯塔守望 - E2E 验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. 页面能加载 - Canvas 和主菜单关键元素存在', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('#startBtn')).toBeVisible();
    await expect(page.locator('#levelSelectBtn')).toBeVisible();
    await expect(page.locator('#editorBtn')).toBeVisible();
    await expect(page.locator('#settingsBtn')).toBeVisible();
    await expect(page.locator('#campaignBtn')).toBeVisible();
    await expect(page.locator('#dailyChallengeBtn')).toBeVisible();
    await expect(page.locator('#mainMenu h1')).toContainText('夜间灯塔守望');
  });

  test('2. 主菜单关键入口可点击', async ({ page }) => {
    await page.click('#levelSelectBtn');
    await expect(page.locator('#levelSelectPanel')).toBeVisible();
    await page.click('#backToMenuBtn');
    await expect(page.locator('#startBtn')).toBeVisible();

    await page.click('#campaignBtn');
    await expect(page.locator('#campaignSelectPanel')).toBeVisible();
    await page.click('#backFromCampaignBtn');
    await expect(page.locator('#startBtn')).toBeVisible();

    await page.click('#dailyChallengeBtn');
    await expect(page.locator('#dailyChallengePanel')).toBeVisible();
    await page.click('#backFromDailyBtn');
    await expect(page.locator('#startBtn')).toBeVisible();
  });

  test('3. 关卡编辑器能试玩', async ({ page }) => {
    await page.click('#editorBtn');
    await expect(page.locator('#editorPanel')).toBeVisible();
    await expect(page.locator('#playtestBtn')).toBeVisible();

    await page.click('#playtestBtn');
    await expect(page.locator('#backFromPlaytestBtn')).toBeVisible();
    await expect(page.locator('#backFromPlaytestBtn')).toBeEnabled();

    await page.waitForTimeout(500);
    const gameState = await page.evaluate(() => state);
    expect(gameState).toBe("playing");

    await page.click('#backFromPlaytestBtn');
    await expect(page.locator('#editorPanel')).toBeVisible();
    await expect(page.locator('#backFromPlaytestBtn')).toBeHidden();
  });

  test('4. 设置能写入 localStorage', async ({ page }) => {
    const initialValue = await page.evaluate(() => localStorage.getItem('zfl26Settings'));
    expect(initialValue).toBeNull();

    await page.click('#settingsBtn');
    await expect(page.locator('#settingsPanel')).toBeVisible();
    await expect(page.locator('#soundToggle')).toHaveClass(/on/);

    await page.click('#soundToggle');
    await expect(page.locator('#soundToggle')).not.toHaveClass(/on/);

    const settingsAfterToggle = await page.evaluate(() => {
      const raw = localStorage.getItem('zfl26Settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(settingsAfterToggle).not.toBeNull();
    expect(settingsAfterToggle.sound).toBe(false);

    await page.reload();
    await page.click('#settingsBtn');
    await expect(page.locator('#soundToggle')).not.toHaveClass(/on/);

    const settingsAfterReload = await page.evaluate(() => {
      const raw = localStorage.getItem('zfl26Settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(settingsAfterReload.sound).toBe(false);
  });

  test('5. 导入弹窗能解析错误 JSON 并显示错误', async ({ page }) => {
    await page.click('#levelSelectBtn');
    await expect(page.locator('#levelSelectPanel')).toBeVisible();

    await page.click('#importPackBtn');
    await expect(page.locator('#packImportOverlay')).toBeVisible();
    await expect(page.locator('#importPackError')).toBeHidden();

    await page.click('#importFromTextBtn');
    await expect(page.locator('#importTextSection')).toBeVisible();

    await page.fill('#importTextarea', '{invalid json }}}');
    await page.click('#parseImportTextBtn');

    await expect(page.locator('#importPackError')).toBeVisible();
    const errorText = await page.locator('#importPackError').textContent();
    expect(errorText).toBeTruthy();
    expect(errorText.length).toBeGreaterThan(0);
  });
});
