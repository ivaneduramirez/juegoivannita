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
  await expect(page.locator('#gameCanvas')).toBeVisible();
});

test('acción principal: ataque reduce vida cuando están cerca', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PELEAR' }).click();
  await expect(page.locator('#startScreen')).toBeHidden();

  await page.evaluate(() => {
    const bar = document.querySelector('#player2Health') as HTMLElement | null;
    if (bar) bar.style.width = '100%';
    const game = (window as any).__game;
    game.player1.position.x = 400;
    game.player2.position.x = 520;
    game.player1.position.y = 30;
    game.player2.position.y = 30;
    game.player1.attack();
  });

  await expect.poll(async () => {
    return page.evaluate(() => document.querySelector('#player2Health')?.style.width || '');
  }).not.toBe('100%');
});

test('caso negativo: ataque no hace daño si están lejos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PELEAR' }).click();
  await expect(page.locator('#startScreen')).toBeHidden();

  await page.evaluate(() => {
    const bar = document.querySelector('#player2Health') as HTMLElement | null;
    if (bar) bar.style.width = '100%';
    const game = (window as any).__game;
    game.player1.position.x = 100;
    game.player2.position.x = 900;
    game.player1.position.y = 30;
    game.player2.position.y = 30;
    game.player1.attack();
  });

  await expect.poll(async () => {
    return page.evaluate(() => document.querySelector('#player2Health')?.style.width || '');
  }).toBe('100%');
});

test('flujo completo: un jugador gana por KO', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PELEAR' }).click();
  await expect(page.locator('#startScreen')).toBeHidden();

  await page.evaluate(() => {
    const game = (window as any).__game;
    game.player1.position.x = 400;
    game.player2.position.x = 520;
    game.player1.position.y = 30;
    game.player2.position.y = 30;
    game.player2.health = 10;
    game.player1.attack();
  });

  await expect(page.locator('#restartContainer')).toBeVisible();
  await expect(page.locator('#displayText')).not.toHaveText('');
});
