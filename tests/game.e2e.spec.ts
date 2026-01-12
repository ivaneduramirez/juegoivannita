import { test, expect } from '@playwright/test';

test('carga la home y muestra UI principal', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UFC FIGHT NIGHT/i);
  await expect(page.locator('#gameCanvas')).toBeVisible();
  await expect(page.locator('#startScreen')).toBeVisible();
});

test('flujo principal: iniciar pelea oculta el start screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PELEAR' }).click();
  await expect(page.locator('#startScreen')).toBeHidden();
  await expect(page.locator('#debugLog')).toHaveText(/Pelea Iniciada|P1:/);
});

test('caso negativo: reinicio no visible antes del KO', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#restartContainer')).toBeHidden();
  await expect(page.locator('#displayText')).toHaveText('');
});
