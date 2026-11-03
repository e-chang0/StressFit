import { recommendRoutine } from './recommendation.js';

const form = document.querySelector('#routine-form');
const result = document.querySelector('#result');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const routine = recommendRoutine({
      stress: Number(form.elements.stress.value),
      minutes: Number(form.elements.minutes.value),
      place: form.elements.place.value,
      hasPain: form.elements.hasPain.checked,
    });
    document.querySelector('#routine-title').textContent = routine.title;
    document.querySelector('#routine-detail').textContent =
      `${routine.duration}분 · 강도 ${routine.intensity}`;
    document.querySelector('#routine-reason').textContent = routine.reason;
    result.hidden = false;
    document.querySelector('#error').textContent = '';
  } catch (error) {
    result.hidden = true;
    document.querySelector('#error').textContent = error.message;
  }
});
