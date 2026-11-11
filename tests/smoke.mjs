import { readFileSync } from 'node:fs';

// This is a test harness reading this repo's own plugin.js, not untrusted input.
const raw = readFileSync(new URL('../desktop/plugin.js', import.meta.url), 'utf8');
const src = raw
  .replace("import { host, useValue } from '@hermes/plugin-sdk';", '')
  .replace("import * as hermesSdk from '@hermes/plugin-sdk';", '')
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

// The real runtime is jsx(type, props, key): children belong in props.children, and a third
// argument is read as a key, not as a child. The double keeps that exact signature, otherwise a
// positional-child bug in the plugin stays invisible here.
function normalizeChildren(value) {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value.flat() : [value];
  return list.filter((kid) => kid !== null && kid !== undefined && kid !== false);
}

// onExtraArgument is called when a caller passes a third argument; the suite's own double ignores
// it, the strict one throws.
function createJsx(onExtraArgument) {
  return function jsx(type, props, ...extra) {
    if (extra.length > 0) onExtraArgument(extra);
    const given = props ?? {};
    const children = normalizeChildren(given.children);
    if (typeof type === 'function') return type({ ...given, children });
    return { type, props: given, children };
  };
}

const jsx = createJsx(() => {});

const storageMap = new Map();

// Mirrors apps/desktop/src/lib/profile-color.ts: (hash * 31 + charCode) >>> 0, then hsl(hue 68% 58%).
const sdkProfileColor = (name) => {
  if (typeof name !== 'string' || name.length === 0 || name === 'default') return null;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360} 68% 58%)`;
};

const hermesSdk = { profileColor: sdkProfileColor };

// Hermes Desktop stores hand-picked colours in localStorage; the plugin reads them through this.
const clientColorMap = new Map();
const localStorageDouble = {
  getItem(key) {
    return clientColorMap.has(key) ? clientColorMap.get(key) : null;
  },
  setItem(key, value) {
    clientColorMap.set(key, String(value));
  },
  removeItem(key) {
    clientColorMap.delete(key);
  },
};

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
  'hermesSdk',
  'localStorage',
  src + '\nreturn plugin;',
);
const plugin = build(host, useValue, useSyncExternalStore, jsx, hermesSdk, localStorageDouble);

// Evaluate a fresh copy of the module against its own doubles: no shared prefs cache.
// seededPrefs lets a check hand the module a `whoami.prefs` value the plugin did not normalise.
function loadContributions(sdk, clientStore, seededPrefs) {
  const loaded = [];
  const localCtx = {
    register(contribution) {
      loaded.push(contribution);
      return contribution;
    },
    registerMany(list) {
      for (const contribution of list) loaded.push(contribution);
    },
    storage: {
      get(key, fallback) {
        return seededPrefs === undefined ? fallback : seededPrefs;
      },
      set() {},
      remove() {},
    },
  };
  const factory = new Function(
    'host',
    'useValue',
    'useSyncExternalStore',
    'jsx',
    'hermesSdk',
    'localStorage',
    src + '\nreturn plugin;',
  );
  const loadedPlugin = factory(host, useValue, useSyncExternalStore, jsx, sdk, clientStore);
  loadedPlugin.register(localCtx);
  return (id) => loaded.find((c) => c.id === id).render();
}

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
check('registers three contributions', contributions.length === 3, String(contributions.length));

const areas = contributions.map((c) => c.area);
for (const area of ['composer.actions', 'palette', 'panes']) {
  check(`contribution area ${area}`, areas.includes(area), areas.join(', '));
}
check('no contribution targets the status bar', !areas.includes('statusBar.right'), areas.join(', '));

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

const pillChildren = Array.isArray(pill.children) ? pill.children : [];
const pillDot = pillChildren[0];
const pillLabel = pillChildren[1];
check(
  'pill renders a dot and a label',
  pillChildren.length === 2 &&
    pillDot &&
    pillDot.type === 'span' &&
    typeof pillDot.props.style.backgroundColor === 'string' &&
    pillLabel &&
    textOf(pillLabel).trim() === 'atlas',
  JSON.stringify(pillChildren.map((c) => (c && c.type) || String(c))),
);

// Same module, stricter runtime: any third argument to jsx is a bug, so this evaluation throws on
// one and asserts that rendering every contribution stays clean.
let strictJsxError = null;
try {
  const strictJsx = createJsx((extra) => {
    throw new Error(
      `jsx received ${extra.length + 2} arguments; children must be passed in props.children`,
    );
  });
  const strictFactory = new Function(
    'host',
    'useValue',
    'useSyncExternalStore',
    'jsx',
    'hermesSdk',
    'localStorage',
    src + '\nreturn plugin;',
  );
  const strictPlugin = strictFactory(
    host,
    useValue,
    useSyncExternalStore,
    strictJsx,
    hermesSdk,
    localStorageDouble,
  );
  const strictLoaded = [];
  strictPlugin.register({
    register(contribution) {
      strictLoaded.push(contribution);
      return contribution;
    },
    registerMany(list) {
      for (const contribution of list) strictLoaded.push(contribution);
    },
    storage: {
      get(key, fallback) {
        return fallback;
      },
      set() {},
      remove() {},
    },
  });
  for (const contribution of strictLoaded) {
    if (typeof contribution.render === 'function') contribution.render();
  }
} catch (error) {
  strictJsxError = error;
}
check(
  'jsx double rejects positional children',
  strictJsxError === null,
  strictJsxError && strictJsxError.message,
);

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
const presetHexes = ['#9CA3AF', '#3ECF8E', '#22D3EE', '#A78BFA', '#F472B6', '#EF4444', '#FB923C', '#6EA8FE'];
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

// --- client identity colour ---
// The accent check above left the pane in accent mode; go back to per-profile first.
const backToPerProfile = findButtons(render('settings-pane')).find((b) => textOf(b).trim() === 'accent');
backToPerProfile.props.onClick();

const clientExpected = sdkProfileColor('atlas');
const clientPillColour = colourOf(render('composer-pill'));
check(
  'client colour is used when no swatch is chosen',
  clientPillColour === clientExpected,
  `${clientPillColour} vs ${clientExpected}`,
);

clientColorMap.set('hermes.desktop.profileColors', JSON.stringify({ atlas: '#123456' }));
check(
  'client override wins over the derived hue',
  colourOf(render('composer-pill')) === '#123456',
  String(colourOf(render('composer-pill'))),
);

const greenClientSwatch = findButtons(render('settings-pane')).find((b) => b.props['aria-label'] === 'green');
greenClientSwatch.props.onClick();
check(
  'explicit swatch still beats the client colour',
  colourOf(render('composer-pill')) === '#3ECF8E',
  String(colourOf(render('composer-pill'))),
);

const resetClientSwatch = findButtons(render('settings-pane')).find((b) => textOf(b).trim() === 'reset');
resetClientSwatch.props.onClick();
clientColorMap.clear();

const fallbackPillColour = colourOf(loadContributions({}, localStorageDouble)('composer-pill'));
check(
  'missing profileColor falls back to the preset palette',
  presetHexes.includes(fallbackPillColour) && fallbackPillColour !== sdkProfileColor('atlas'),
  String(fallbackPillColour),
);

const firstLoadColour = colourOf(loadContributions(hermesSdk, localStorageDouble)('composer-pill'));
const secondLoadColour = colourOf(loadContributions(hermesSdk, localStorageDouble)('composer-pill'));
check(
  'client colour is stable across two module loads',
  typeof firstLoadColour === 'string' &&
    firstLoadColour.length > 0 &&
    firstLoadColour === secondLoadColour &&
    firstLoadColour === sdkProfileColor('atlas'),
  `${firstLoadColour} vs ${secondLoadColour} vs ${sdkProfileColor('atlas')}`,
);

let missingStorageColour = null;
let missingStorageThrew = false;
try {
  missingStorageColour = colourOf(loadContributions(hermesSdk, undefined)('composer-pill'));
} catch (error) {
  missingStorageThrew = true;
}
check(
  'colour resolution survives a missing localStorage',
  missingStorageThrew === false && missingStorageColour === sdkProfileColor('atlas'),
  String(missingStorageColour),
);

profile.set('default');
clientColorMap.set('hermes.desktop.profileColors', JSON.stringify({ default: '#123456' }));
const defaultPillColour = colourOf(render('composer-pill'));
check(
  'a profile named default stays neutral',
  defaultPillColour === '#9CA3AF',
  String(defaultPillColour),
);
profile.set('atlas');
clientColorMap.clear();

// The client trims the name before hashing and before the override lookup, so " atlas " must
// read as the atlas profile on both paths.
profile.set(' atlas ');
const spacedPillColour = colourOf(render('composer-pill'));
clientColorMap.set('hermes.desktop.profileColors', JSON.stringify({ atlas: '#123456' }));
const spacedOverrideColour = colourOf(render('composer-pill'));
clientColorMap.clear();
profile.set('atlas');

// The pill trims through normaliseProfile before it resolves a colour, so it cannot see this
// bug: the pane keys its rows by the stored profile name, and a legacy " atlas " key reaches the
// resolver untrimmed. That row is what the trim in clientColour actually protects.
const spacedPrefs = { mode: 'profile', colors: { ' atlas ': '' } };
const rowColour = (node) => {
  const row = collect(
    node,
    (n) => n.type === 'div' && (n.children || []).some((c) => c && c.type === 'span' && textOf(c) === ' atlas '),
  )[0];
  return row ? colourOf(row) : null;
};
const spacedHueRow = rowColour(loadContributions(hermesSdk, localStorageDouble, spacedPrefs)('settings-pane'));
clientColorMap.set('hermes.desktop.profileColors', JSON.stringify({ atlas: '#123456' }));
const spacedOverrideRow = rowColour(loadContributions(hermesSdk, localStorageDouble, spacedPrefs)('settings-pane'));
clientColorMap.clear();

check(
  'client colour trims the profile name',
  spacedPillColour === sdkProfileColor('atlas') &&
    spacedOverrideColour === '#123456' &&
    spacedHueRow === sdkProfileColor('atlas') &&
    spacedOverrideRow === '#123456',
  `pill ${spacedPillColour} vs ${sdkProfileColor('atlas')}, override ${spacedOverrideColour} vs #123456, row ${spacedHueRow} vs ${sdkProfileColor('atlas')}, row override ${spacedOverrideRow}`,
);
profile.set('atlas');
clientColorMap.clear();

console.log(`SMOKE: ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
