import { host, useValue } from '@hermes/plugin-sdk';
import { useSyncExternalStore } from 'react';
import { jsx } from 'react/jsx-runtime';

const PRESETS = [
  { id: 'mono', label: 'mono', hex: '#9CA3AF' },
  { id: 'green', label: 'green', hex: '#3ECF8E' },
  { id: 'cyan', label: 'cyan', hex: '#22D3EE' },
  { id: 'violet', label: 'violet', hex: '#A78BFA' },
  { id: 'pink', label: 'pink', hex: '#F472B6' },
  { id: 'red', label: 'red', hex: '#EF4444' },
  { id: 'orange', label: 'orange', hex: '#FB923C' },
  { id: 'nous', label: 'nous', hex: '#6EA8FE' },
];

const PREFS_KEY = 'whoami.prefs';
const DEFAULT_MODE = 'profile';
const ACCENT = 'var(--ui-accent)';

const TEXT_SECONDARY = 'var(--ui-text-secondary)';
const TEXT_TERTIARY = 'var(--ui-text-tertiary)';
const STROKE_SECONDARY = 'var(--ui-stroke-secondary)';

let REGISTER_CTX = null;
let prefsCache = null;
const listeners = new Set();

function normaliseProfile(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value && typeof value === 'object') {
    const candidates = [value.name, value.id, value.label, value.profile, value.slug];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return null;
  }
  return null;
}

function hashProfile(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function presetForProfile(name) {
  if (!name) return PRESETS[0];
  return PRESETS[hashProfile(name) % PRESETS.length];
}

function presetById(id) {
  return PRESETS.find((preset) => preset.id === id) || null;
}

function normalisePrefs(raw) {
  const prefs = raw && typeof raw === 'object' ? raw : {};
  const mode = prefs.mode === 'accent' ? 'accent' : DEFAULT_MODE;
  const colors = prefs.colors && typeof prefs.colors === 'object' ? { ...prefs.colors } : {};
  return { mode, colors };
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getPrefs() {
  if (prefsCache === null) {
    let raw = null;
    if (REGISTER_CTX) {
      try {
        raw = REGISTER_CTX.storage.get(PREFS_KEY, null);
      } catch (error) {
        raw = null;
      }
    }
    prefsCache = normalisePrefs(raw);
  }
  return prefsCache;
}

function setPrefs(next) {
  const value = normalisePrefs(next);
  if (REGISTER_CTX) {
    REGISTER_CTX.storage.set(PREFS_KEY, value);
  }
  prefsCache = value;
  emit();
}

function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs, getPrefs);
}

function colourFor(prefs, name) {
  if (!name) return { hex: PRESETS[0].hex, label: PRESETS[0].label };
  if (prefs.mode === 'accent') return { hex: ACCENT, label: 'accent' };
  const stored = prefs.colors[name];
  if (typeof stored === 'string' && stored.length > 0) {
    if (stored.startsWith('#')) return { hex: stored, label: stored };
    const preset = presetById(stored);
    if (preset) return { hex: preset.hex, label: preset.label };
  }
  const fallback = presetForProfile(name);
  return { hex: fallback.hex, label: fallback.label };
}

function profileNames(prefs, active) {
  const names = [];
  for (const key of Object.keys(prefs.colors)) {
    if (typeof key === 'string' && key.length > 0 && !names.includes(key)) names.push(key);
  }
  if (active && !names.includes(active)) names.push(active);
  names.sort((a, b) => a.localeCompare(b));
  return names;
}

function activeProfileName() {
  try {
    return normaliseProfile(host.state.profile.get());
  } catch (error) {
    return null;
  }
}

function dot(colour, size) {
  return jsx('span', {
    'aria-hidden': 'true',
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: colour.hex,
      flex: '0 0 auto',
    },
  });
}

function ComposerPill() {
  const profile = normaliseProfile(useValue(host.state.profile));
  const prefs = usePrefs();
  const colour = colourFor(prefs, profile);
  const label = profile || 'no profile';

  return jsx(
    'button',
    {
      type: 'button',
      title:
        profile === null
          ? 'No profile selected: a new session needs an explicit profile'
          : `New sessions will use the "${profile}" profile`,
      onClick: () => {
        const current = activeProfileName();
        if (current === null) {
          host.notify({
            kind: 'warning',
            message: 'Whoami: no active profile. A new session needs an explicit profile.',
          });
          return;
        }
        const currentColour = colourFor(getPrefs(), current);
        host.notify({
          kind: 'info',
          message: `Whoami: active profile "${current}" (colour ${currentColour.label}).`,
        });
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '999px',
        border: `1px solid ${STROKE_SECONDARY}`,
        background: 'transparent',
        color: profile === null ? TEXT_TERTIARY : TEXT_SECONDARY,
        font: 'inherit',
        fontSize: '11px',
        lineHeight: '18px',
        cursor: 'pointer',
      },
    },
    dot(colour, '8px'),
    jsx('span', { style: { fontWeight: 500 } }, label),
  );
}

function StatusDot() {
  const profile = normaliseProfile(useValue(host.state.profile));
  const prefs = usePrefs();
  const colour = colourFor(prefs, profile);
  return jsx(
    'button',
    {
      type: 'button',
      title: profile === null ? 'Whoami: no profile' : `Whoami: ${profile}`,
      'aria-label': profile === null ? 'Whoami: no profile' : `Whoami: ${profile}`,
      onClick: () => {
        host.notify({
          kind: profile === null ? 'warning' : 'info',
          message:
            profile === null
              ? 'Whoami: no active profile. A new session needs an explicit profile.'
              : `Whoami: active profile "${profile}".`,
        });
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        height: '18px',
        padding: '0',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      },
    },
    dot(colour, '8px'),
  );
}

function ModeRow(props) {
  const prefs = props.prefs;
  const nextMode = prefs.mode === 'accent' ? 'profile' : 'accent';
  return jsx(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 0',
        borderBottom: `1px solid ${STROKE_SECONDARY}`,
      },
    },
    jsx('span', { style: { color: TEXT_SECONDARY, fontSize: '11px' } }, 'Mode'),
    jsx(
      'button',
      {
        type: 'button',
        onClick: () => props.onChange(nextMode),
        style: {
          padding: '2px 8px',
          borderRadius: '999px',
          border: `1px solid ${STROKE_SECONDARY}`,
          background: 'transparent',
          color: TEXT_SECONDARY,
          font: 'inherit',
          fontSize: '11px',
          cursor: 'pointer',
        },
      },
      prefs.mode === 'accent' ? 'accent' : 'per-profile',
    ),
  );
}

function ProfileRow(props) {
  const prefs = props.prefs;
  const name = props.name;
  const current = colourFor(prefs, name);
  return jsx(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px 0',
        borderBottom: `1px solid ${STROKE_SECONDARY}`,
      },
    },
    jsx(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
      dot(current, '8px'),
      jsx(
        'span',
        {
          style: {
            color: TEXT_SECONDARY,
            fontSize: '11px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
          },
        },
        name,
      ),
    ),
    jsx(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' } },
      ...PRESETS.map((preset) =>
        jsx('button', {
          type: 'button',
          'aria-label': preset.label,
          title: preset.label,
          onClick: () => props.onPick(name, preset.id),
          style: {
            width: '14px',
            height: '14px',
            padding: '0',
            borderRadius: '50%',
            border:
              prefs.colors[name] === preset.id
                ? `2px solid ${TEXT_SECONDARY}`
                : `1px solid ${STROKE_SECONDARY}`,
            backgroundColor: preset.hex,
            cursor: 'pointer',
          },
        }),
      ),
      jsx(
        'button',
        {
          type: 'button',
          onClick: () => props.onReset(name),
          style: {
            marginLeft: '4px',
            padding: '0 4px',
            border: 'none',
            background: 'transparent',
            color: TEXT_TERTIARY,
            font: 'inherit',
            fontSize: '10px',
            cursor: 'pointer',
          },
        },
        'reset',
      ),
    ),
  );
}

function WhoamiPane() {
  const prefs = usePrefs();
  const profile = normaliseProfile(useValue(host.state.profile));
  const names = profileNames(prefs, profile);

  const pick = (name, presetId) => {
    const current = getPrefs();
    setPrefs({ mode: current.mode, colors: { ...current.colors, [name]: presetId } });
  };

  const reset = (name) => {
    const current = getPrefs();
    const colors = { ...current.colors };
    delete colors[name];
    setPrefs({ mode: current.mode, colors });
  };

  const setMode = (mode) => {
    setPrefs({ mode: mode === 'accent' ? 'accent' : DEFAULT_MODE, colors: getPrefs().colors });
  };

  return jsx(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px',
        color: TEXT_SECONDARY,
        fontSize: '11px',
        overflowY: 'auto',
      },
    },
    jsx(ModeRow, { prefs, onChange: setMode }),
    names.length === 0
      ? jsx('div', { style: { color: TEXT_TERTIARY, padding: '6px 0' } }, 'no profiles yet')
      : names.map((name) => jsx(ProfileRow, { key: name, name, prefs, onPick: pick, onReset: reset })),
  );
}

export default {
  id: 'whoami',
  name: 'Whoami',
  description: 'Shows which Hermes profile the composer will create a new session on.',
  register(ctx) {
    if (!host.state || !host.state.profile) {
      throw new Error(
        'Whoami needs Hermes Desktop 0.21.5 or newer (host.state.profile is missing).',
      );
    }

    REGISTER_CTX = ctx;
    prefsCache = null;

    ctx.register({
      id: 'composer-pill',
      area: 'composer.actions',
      order: 20,
      render: () => jsx(ComposerPill, {}),
    });

    ctx.register({
      id: 'status-chip',
      area: 'statusBar.right',
      order: 120,
      render: () => jsx(StatusDot, {}),
    });

    ctx.register({
      id: 'palette-show',
      area: 'palette',
      data: {
        id: 'whoami.show',
        action: 'whoami.show',
        label: 'Whoami: show active profile',
        keywords: ['profile', 'whoami', 'scope'],
        run() {
          const profile = activeProfileName();
          if (profile === null) {
            host.notify({
              kind: 'warning',
              message: 'Whoami: no active profile. A new session needs an explicit profile.',
            });
            return;
          }
          const colour = colourFor(getPrefs(), profile);
          host.notify({
            kind: 'info',
            message: `Whoami: active profile "${profile}" (colour ${colour.label}).`,
          });
        },
      },
    });

    ctx.register({
      id: 'settings-pane',
      area: 'panes',
      title: 'Whoami',
      data: { placement: 'right', width: '240px' },
      render: () => jsx(WhoamiPane, {}),
    });
  },
};
