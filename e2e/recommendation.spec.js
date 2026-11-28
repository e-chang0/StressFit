import { expect, test } from '@playwright/test';

test('비 오는 날 실내 루틴을 추천하고 통증을 표시하면 휴식으로 바꾼다', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('스트레스 수준', { exact: false }).fill('5');
  await page.getByLabel('여유 시간').selectOption('30');
  await page.getByLabel('운동 장소').selectOption('outdoor');
  await page.getByRole('checkbox', { name: '밖에 비가 와요' }).check();
  await page.getByRole('checkbox', { name: '운동 밴드가 있어요' }).check();

  const recommend = page.getByRole('button', { name: /루틴 (확인하기|찾기)/ });
  await recommend.click();
  await expect(page.getByRole('heading', { name: '밴드 운동' })).toBeHidden();
  await expect(page.getByText('비가 와서 실내 루틴을 골랐어요.')).toBeVisible();
  const plan = page.getByText('준비 4분 · 본운동 12분 · 마무리 4분');
  await expect(plan).toBeVisible();

  await page.getByRole('checkbox', { name: /현재 통증이나 부상/ }).check();
  await recommend.click();
  await expect(page.getByRole('heading', { name: '오늘은 휴식을 선택해 주세요' })).toBeVisible();
  await expect(page.getByText('통증이 있으면 운동을 멈추고 전문가와 상담해 주세요.')).toBeVisible();
  await expect(page.locator('#routine-plan')).toBeHidden();
  await expect(page.getByRole('button', { name: '이 루틴을 완료했어요' })).toBeHidden();
});
