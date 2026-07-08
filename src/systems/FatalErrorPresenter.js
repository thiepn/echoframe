import { SAVE_KEYS } from '../data/constants.js';

let presented = false;

function safeRemoveLocalData() {
  try {
    globalThis.localStorage?.removeItem(SAVE_KEYS.primary);
    globalThis.localStorage?.removeItem(SAVE_KEYS.backup);
    return true;
  } catch {
    return false;
  }
}

export function showFatalError({
  code = 'EF-UNEXPECTED',
  message = 'ECHOFRAME could not continue safely.',
  allowClearData = true,
} = {}) {
  if (presented || typeof document === 'undefined') return false;
  presented = true;

  const root = document.querySelector('#game-shell') ?? document.body;
  root.replaceChildren();

  const screen = document.createElement('section');
  screen.id = 'fatal-error-screen';
  screen.setAttribute('role', 'alert');
  screen.setAttribute('aria-labelledby', 'fatal-error-title');

  const title = document.createElement('h1');
  title.id = 'fatal-error-title';
  title.textContent = 'Signal interrupted';

  const explanation = document.createElement('p');
  explanation.textContent = message;

  const errorCode = document.createElement('p');
  errorCode.className = 'fatal-error-code';
  errorCode.textContent = `Error code: ${String(code).slice(0, 48)}`;

  const actions = document.createElement('div');
  actions.className = 'fatal-error-actions';

  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => globalThis.location?.reload());
  actions.append(reload);

  if (allowClearData) {
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Clear Local Data';
    clear.addEventListener('click', () => {
      const confirmed = globalThis.confirm?.(
        'Clear ECHOFRAME local save data? This removes settings, progression, statistics, history, controls, and tutorial completion.',
      );
      if (!confirmed) return;
      safeRemoveLocalData();
      globalThis.location?.reload();
    });
    actions.append(clear);
  }

  const note = document.createElement('p');
  note.className = 'fatal-error-note';
  note.textContent = 'No diagnostic stack trace is shown. Reload first; clear local data only if the problem persists.';

  screen.append(title, explanation, errorCode, actions, note);
  root.append(screen);
  reload.focus();
  return true;
}

export function resetFatalErrorForTests() {
  presented = false;
}
