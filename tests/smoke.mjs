import { readFileSync } from 'node:fs';

// This is a test harness reading this repo's own plugin.js, not untrusted input.
const raw = readFileSync(new URL('../plugin.js', import.meta.url), 'utf8');
const src = raw
  .replace("import { host, useValue } from '@hermes/plugin-sdk';", '')
  .replace("import { useSyncExternalStore } from 'react';", '')
  .replace("import { jsx } from 'react/jsx-runtime';", '')
  .replace('export default', 'const plugin =');

const notifications = [];

function atom(initial) {
  const box = { value: initial };
  return {
    get: () => box.value,
    set: (next) => {
      box.value = next;
    },
  };
}

const profile = atom('atlas');

const host = {
  state: { profile },
  notify: (payload) => {
    notifications.push(payload);
  },
};

const useValue = (a) => a.get();

const useSyncExternalStore = (sub, get) => get();

const jsx = (type, props, ...kids) => {
  const children = kids.flat().filter((k) => k !== null && k !== undefined && k !== false);
  if (typeof type === 'function') return type({ ...props, children });
  return { type, props: props ?? {}, children };
};

const storageMap = new Map();

const storage = {
  get(key, fallback) {
    return storageMap.has(key) ? storageMap.get(key) : fallback;
  },
  set(key, value) {
    storageMap.set(key, JSON.parse(JSON.stringify(value)));
  },
  remove(key) {
    storageMap.delete(key);
  },
};

const contributions = [];

const ctx = {
  register(contribution) {
    contributions.push(contribution);
    return contribution;
  },
  registerMany(list) {
    for (const contribution of list) contributions.push(contribution);
  },
  storage,
};

const build = new Function(
  'host',
  'useValue',
  'useSyncExternalStore',
  'jsx',
  src + '\nreturn plugin;',
);
const plugin = build(host, useValue, useSyncExternalStore, jsx);

function walk(node, fn) {
  if (node === null || node === undefined || typeof node !== 'object') return;
  fn(node);
  for (const child of node.children || []) walk(child, fn);
}

function collect(node, predicate) {
  const found = [];
  walk(node, (n) => {
    if (predicate(n)) found.push(n);
  });
  return found;
}

function findButtons(node) {
  return collect(node, (n) => n.type === 'button');
}

function textOf(node) {
  if (typeof node === 'string') return node;
  if (!node || !node.children) return '';
  return node.children.map(textOf).join(' ');
}

function colourOf(node) {
  const hits = collect(node, (n) => {
    const style = n.props && n.props.style;
    return style && typeof style.backgroundColor === 'string';
  });
  if (hits.length === 0) return null;
  return hits[0].props.style.backgroundColor;
}

const byArea = (area) => contributions.find((c) => c.area === area);
const render = (id) => {
  const contribution = contributions.find((c) => c.id === id);
  return contribution.render();
};

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail === undefined ? '' : ` -- ${detail}`}`);
  }
}

plugin.register(ctx);

check('plugin.id is whoami', plugin.id === 'whoami', String(plugin.id));
check('exactly 4 contributions', contributions.length === 4, String(contributions.length));

const areas = contributions.map((c) => c.area);
for (const area of ['composer.actions', 'statusBar.right', 'palette', 'panes']) {
  check(`contribution area ${area}`, areas.includes(area), areas.join(', '));
}

const pane = byArea('panes');
check('pane placement is right', pane && pane.data && pane.data.placement === 'right');

check(
  'every contribution has id and area',
  contributions.every(
    (c) => typeof c.id === 'string' && c.id.length > 0 && typeof c.area === 'string' && c.area.length > 0,
  ),
);
check(
  'every non-palette contribution has render()',
  contributions.filter((c) => c.area !== 'palette').every((c) => typeof c.render === 'function'),
);
check('palette has data.run()', typeof byArea('palette').data.run === 'function');
check(
  'no contribution uses a component key',
  contributions.every((c) => !Object.prototype.hasOwnProperty.call(c, 'component')),
);

const pill = render('composer-pill');
check('pill text contains atlas', textOf(pill).includes('atlas'), textOf(pill));
const pillColour = colourOf(pill);
check('pill carries a colour', typeof pillColour === 'string' && pillColour.length > 0, String(pillColour));

const sameAgain = colourOf(render('composer-pill'));
check('same profile yields the same colour twice', sameAgain === pillColour, `${pillColour} vs ${sameAgain}`);

let otherColour = null;
const probes = ['zen', 'work', 'personal', 'ops', 'nous', 'atlas-two'];
for (let i = 0; i < 32; i += 1) probes.push(`probe-${i}`);
for (const name of probes) {
  profile.set(name);
  const candidate = colourOf(render('composer-pill'));
  if (candidate !== pillColour) {
    otherColour = candidate;
    break;
  }
}
profile.set('atlas');
check(
  'two different profiles can map to different colours',
  otherColour !== null && otherColour !== pillColour,
  String(otherColour),
);

const presetLabels = ['mono', 'green', 'cyan', 'violet', 'pink', 'red', 'orange', 'nous'];
const paneNode = render('settings-pane');
const swatches = findButtons(paneNode).filter(
  (b) => b.props['aria-label'] !== undefined && presetLabels.includes(b.props['aria-label']),
);
check('settings pane renders 8 swatches with aria-label', swatches.length === 8, String(swatches.length));
check(
  'swatches cover every preset label',
  presetLabels.every((label) => swatches.some((b) => b.props['aria-label'] === label)),
);

const originalColour = pillColour;

const greenSwatch = findButtons(render('settings-pane')).find((b) => b.props['aria-label'] === 'green');
check('green swatch exists', Boolean(greenSwatch));
greenSwatch.props.onClick();
check('pill colour is green after swatch click', colourOf(render('composer-pill')) === '#3ECF8E', String(colourOf(render('composer-pill'))));
const storedAfterGreen = storage.get('whoami.prefs', null);
check(
  'storage records colors.atlas === green',
  Boolean(storedAfterGreen && storedAfterGreen.colors && storedAfterGreen.colors.atlas === 'green'),
  JSON.stringify(storedAfterGreen),
);

const resetButton = findButtons(render('settings-pane')).find((b) => textOf(b).trim() === 'reset');
check('reset button exists', Boolean(resetButton));
resetButton.props.onClick();
check(
  'reset restores the original colour',
  colourOf(render('composer-pill')) === originalColour,
  String(colourOf(render('composer-pill'))),
);
const storedAfterReset = storage.get('whoami.prefs', null);
check(
  'reset removes colors.atlas',
  Boolean(storedAfterReset && storedAfterReset.colors && !Object.prototype.hasOwnProperty.call(storedAfterReset.colors, 'atlas')),
  JSON.stringify(storedAfterReset),
);

const modeButton = findButtons(render('settings-pane')).find((b) => textOf(b).trim() === 'per-profile');
check('mode button shows per-profile', Boolean(modeButton));
modeButton.props.onClick();
check(
  'accent mode paints the pill with var(--ui-accent)',
  colourOf(render('composer-pill')) === 'var(--ui-accent)',
  String(colourOf(render('composer-pill'))),
);

profile.set(null);
const nullPill = render('composer-pill');
check('null profile shows no profile', textOf(nullPill).includes('no profile'), textOf(nullPill));
const beforeWarn = notifications.length;
nullPill.props.onClick();
const warn = notifications[notifications.length - 1];
check('null profile click emits a warning', notifications.length === beforeWarn + 1 && warn && warn.kind === 'warning', JSON.stringify(warn));

profile.set('atlas');
const beforePalette = notifications.length;
byArea('palette').data.run();
const paletteNotify = notifications[notifications.length - 1];
check(
  'palette run emits a notify mentioning atlas',
  notifications.length === beforePalette + 1 && paletteNotify && paletteNotify.message.includes('atlas'),
  JSON.stringify(paletteNotify),
);

check(
  'every notify has kind and never level',
  notifications.length > 0 &&
    notifications.every(
      (n) => typeof n.kind === 'string' && !Object.prototype.hasOwnProperty.call(n, 'level'),
    ),
  JSON.stringify(notifications),
);

console.log(`SMOKE: ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
