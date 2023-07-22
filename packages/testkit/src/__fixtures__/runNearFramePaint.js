/**
 * The whole this file should be shaken out because it uses DOM API
 */

let isHidden = document.visibilityState !== 'visible';

document.addEventListener('visibilitychange', () => {
  isHidden = document.visibilityState !== 'visible';
});

export function runNearFramePaint(callback) {
  if (isHidden) {
    return;
  } else {
    callback();
  }
}
