import dingSound from './assets/audio/ding.mp3';
import duplicateSound from './assets/audio/duplicate.mp3';
import strikeSound from './assets/audio/strike.mp3';

export function playBellSound() {
  const audio = new Audio(dingSound);
  audio.play().catch(e => console.error('Error playing ding sound:', e));
}

export function playBuzzerSound() {
  const audio = new Audio(strikeSound);
  audio.play().catch(e => console.error('Error playing strike sound:', e));
}

export function playDuplicateSound() {
  const audio = new Audio(duplicateSound);
  audio.play().catch(e => console.error('Error playing duplicate sound:', e));
}
