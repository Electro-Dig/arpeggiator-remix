export const GUIDE_CARDS = Object.freeze([
  Object.freeze({
    id: 'stage',
    kicker: '01 / 站位',
    title: '进入镜头中央',
    body: '请站在屏幕正前方，让双手完整进入画面。现场观众请尽量不要在镜头内举手。',
    notations: ['CENTER / FRAME', 'ONE PLAYER / CAMERA'],
  }),
  Object.freeze({
    id: 'hands',
    kicker: '02 / 演奏',
    title: '左手旋律，右手节奏',
    body: '左手上下选择旋律、左右改变明暗、捏合控制音量；右手在平面中移动节奏，五根手指开合鼓声。',
    notations: ['L / MELODY', 'R / RHYTHM'],
  }),
  Object.freeze({
    id: 'recording',
    kicker: '03 / 录音',
    title: '用双手表达选择',
    body: '双手大拇指向上用于开始、停止或确认；双手大拇指向下用于取消或重录。界面按钮始终可用。',
    notations: ['↑↑ / CONFIRM', '↓↓ / CANCEL'],
  }),
]);

export const GUIDE_NEUTRAL_LOCK_MS = 1000;

export function advanceGuide(index, count = GUIDE_CARDS.length) {
  const last = Math.max(0, count - 1);
  return index >= last
    ? { index: last, complete: true }
    : { index: index + 1, complete: false };
}

export function retreatGuide(index) {
  return { index: Math.max(0, index - 1), complete: false };
}
