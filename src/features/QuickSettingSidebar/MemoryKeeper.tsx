/**
 * Memory, under System in the Quick Setting sidebar (the sd-webui-memory-keeper
 * extension, built into the theme): what holds the VRAM and the RAM, split
 * into the WebUI, what it started (an LLM server...) and other programs; Free
 * VRAM and Free VRAM + RAM; and, under Details, every thing that holds memory
 * in its section, with 🔒 to keep it and buttons to move it to RAM or let it
 * go. The work is done by scripts/memory_keeper.py, at /lobe/memory.
 */
import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronDown, ChevronRight, Lock, LockOpen } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = '/lobe/memory';
const GB = 1024 ** 3;
const CLOSED_EVERY = 3000;
const OPEN_EVERY = 2000;

export interface Gauge {
  children?: number;
  free: number;
  name?: string;
  total: number;
  webui?: number;
}

export interface Usage {
  count?: number;
  error?: string;
  pid?: number;
  ram?: number | null;
  vram?: number | null;
  what?: string;
}

export interface Part {
  id: string;
  name: string;
  ram?: number;
  vram?: number;
}

export interface Holder {
  can_part_ram?: boolean;
  can_ram: boolean;
  can_unload: boolean;
  category: string;
  detail?: string;
  id: string;
  kind: string;
  name: string;
  parts?: Part[];
  pinned: boolean;
  source?: string;
  usage: Usage;
}

export interface Status {
  categories?: { icon: string; key: string; name: string }[];
  gauges: { gpu: Gauge | null; ram: Gauge | null };
  generating: boolean;
  holders?: Holder[];
  pinned?: string[];
}

interface Freed {
  ram?: number;
  seconds: number;
  skipped?: string[];
  vram?: number;
}

/** The WebUI, what it started, every other program: the used part of a gauge, in bytes. */
export const split = (g: Gauge): [number, number, number] => {
  const used = Math.max(0, g.total - g.free);
  const kids = Math.min(g.children || 0, used);
  const webui = Math.min(g.webui || 0, used - kids);
  return [webui, kids, Math.max(0, used - webui - kids)];
};

export const size = (n: number | null | undefined) =>
  n === null || n === undefined ? '' : n >= GB ? `${(n / GB).toFixed(1)} GB` : `${Math.round(n / 1024 ** 2)} MB`;

/** Holders by section, in the server's order; one of an unknown section goes to "other". */
export const group = (status: Status) => {
  const cats = status.categories || [];
  const known = new Set(cats.map((c) => c.key));
  const by: Record<string, Holder[]> = {};
  for (const h of status.holders || []) {
    const key = known.has(h.category) ? h.category : 'other';
    (by[key] = by[key] || []).push(h);
  }
  return cats.filter((c) => by[c.key]).map((c) => ({ ...c, rows: by[c.key] }));
};

const call = async<T, >(path: string, body?: unknown): Promise<T> => {
  const res = await fetch(
    API + path,
    body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
  );
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // not json
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
};

const useStyles = createStyles(({ css, token }) => ({
  bar: css`
    position: relative;

    overflow: hidden;
    display: flex;

    height: 18px;

    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadiusSM}px;
  `,
  buttons: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  `,
  card: css`
    display: flex;
    flex-direction: column;
    gap: 6px;

    padding: 10px 12px;

    font-size: 12px;
    font-variant-numeric: tabular-nums;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    .ant-btn {
      font-size: 12px;
    }
  `,
  dim: css`
    color: ${token.colorTextTertiary};
  `,
  group: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  groupHead: css`
    display: flex;
    gap: 6px;
    align-items: center;

    font-size: 11px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
  head: css`
    display: flex;
    gap: 8px;
    align-items: center;

    margin-block-end: 2px;
  `,
  label: css`
    width: 38px;
    color: ${token.colorTextSecondary};
  `,
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;

    font-size: 11px;
    color: ${token.colorTextTertiary};

    i {
      display: inline-block;

      width: 8px;
      height: 8px;
      margin-inline-end: 4px;

      vertical-align: -1px;

      border-radius: 2px;
    }
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-block-start: 4px;
  `,
  message: css`
    padding: 4px 6px;
    color: ${token.colorTextSecondary};
    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadiusSM}px;
  `,
  part: css`
    display: flex;
    gap: 6px;
    align-items: center;

    padding-inline-start: 26px;

    font-size: 11px;

    > span:nth-child(2) {
      white-space: nowrap;
    }
  `,
  pinned: css`
    border-color: ${token.colorPrimaryBorder} !important;
  `,
  row: css`
    display: flex;
    flex-direction: column;
    gap: 3px;

    padding: 5px 6px;

    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  rowHead: css`
    display: flex;
    gap: 4px;
    align-items: center;
  `,
  rowName: css`
    display: flex;
    flex: 1;
    flex-direction: column;

    min-width: 0;

    strong {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  rows: css`
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 8px;
    align-items: center;
  `,
  seg: css`
    height: 100%;
    opacity: 0.7;
    transition: width 600ms ${token.motionEaseOut};
  `,
  source: css`
    margin-inline-start: 4px;
    padding: 0 4px;

    font-size: 10px;
    font-weight: 500;
    color: ${token.purple};

    background: ${token.purple1};
    border-radius: 4px;
  `,
  tag: css`
    padding: 0 6px;
    font-size: 11px;
    color: ${token.colorWarning};
    background: ${token.colorWarningBg};
    border-radius: 4px;
  `,
  text: css`
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding-inline: 6px;

    color: ${token.colorText};
    text-shadow: 0 0 3px ${token.colorBgContainer};
  `,
  title: css`
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

const MemoryKeeper = memo(() => {
  const { cx, styles, theme } = useStyles();
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status | null>(null);
  const [full, setFull] = useState<Status | null>(null);
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const openRef = useRef(open);
  openRef.current = open;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  // the theme's colour, then one far from it (a purple primary is common), then grey
  const colors = [theme.colorPrimary, theme.cyan, theme.colorTextQuaternary];

  const refresh = useCallback(async(wantFull?: boolean) => {
    try {
      const data = await call<Status>(`/status${wantFull || openRef.current ? '?full=1' : ''}`);
      setStatus(data);
      if (data.holders) setFull(data);
      setMissing(false);
    } catch (error) {
      // 404: the WebUI has not loaded scripts/memory_keeper.py (restart it after an update)
      if (/HTTP 404/.test(String(error))) setMissing(true);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const tick = async() => {
      if (document.visibilityState === 'visible' && !busyRef.current) await refresh();
      if (!stopped) timer = window.setTimeout(tick, openRef.current ? OPEN_EVERY : CLOSED_EVERY);
    };
    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (open) refresh(true);
    else setMessage('');
  }, [open]);

  const report = (r: Freed, what: string) => {
    const amount = [r.vram === undefined ? '' : `${size(r.vram) || '0 MB'} VRAM`, r.ram === undefined ? '' : `${size(r.ram) || '0 MB'} RAM`]
      .filter(Boolean)
      .join(' · ');
    const left = r.skipped?.length ? ` · ${t('sidebar.memory.left', { list: r.skipped.join(', ') })}` : '';
    setMessage(`${t('sidebar.memory.freed', { amount: amount || '0 MB', seconds: r.seconds, what })}${left}`);
  };

  const doing = async(label: string, fn: () => Promise<void>) => {
    if (busyRef.current) return;
    setBusy(label);
    busyRef.current = label;
    setMessage('');
    try {
      await fn();
    } catch (error: any) {
      setMessage(error?.message || String(error));
    }
    setBusy('');
    busyRef.current = '';
    await refresh(true);
  };

  const act = (h: Holder, action: 'ram' | 'unload', part?: Part) =>
    doing(t(action === 'ram' ? 'sidebar.memory.busyMove' : 'sidebar.memory.busyUnload'), async() => {
      const r = await call<Freed>('/act', { action, id: h.id, part: part?.id });
      report(r, part ? `${h.name} / ${part.name}` : h.name);
    });

  const free = (level: 'vram' | 'all', category?: { key: string; name: string }) =>
    doing(t('sidebar.memory.busyFree'), async() => {
      const r = await call<Freed>('/free', { category: category?.key, level });
      report(r, category ? category.name : t(level === 'vram' ? 'sidebar.memory.freeVram' : 'sidebar.memory.freeAll'));
    });

  const pin = (h: Holder) =>
    doing(' ', async() => {
      await call('/pin', { id: h.id, keep: !h.pinned });
    });

  if (missing || !status) return null;

  const catName = (key: string, fallback: string) => t(`sidebar.memory.categories.${key}` as any, { defaultValue: fallback }) as string;

  const where = (u: Usage) => {
    if (u.error) return t('sidebar.memory.unknown');
    if (u.count) return t('sidebar.memory.inRam', { count: u.count });
    const bits = [u.vram ? `GPU ${size(u.vram)}` : '', u.ram ? `RAM ${size(u.ram)}` : ''].filter(Boolean);
    if (!bits.length && u.vram === null && u.ram === null) return t('sidebar.memory.loaded');
    return bits.join(' · ') || t('sidebar.memory.nothingHeld');
  };

  const gauge = (label: string, g: Gauge | null) => {
    if (!g) return null;
    const parts = split(g);
    return (
      <div className={styles.rows}>
        <span className={styles.label}>{label}</span>
        <div
          className={styles.bar}
          title={`${g.name ? `${g.name}\n` : ''}${t('sidebar.memory.webui')} ${size(parts[0])} · ${t('sidebar.memory.started')} ${size(parts[1])} · ${t('sidebar.memory.others')} ${size(parts[2])} · ${t('sidebar.memory.free')} ${size(g.free)}`}
        >
          {parts.map((n, i) => (
            <div className={styles.seg} key={i} style={{ background: colors[i], width: `${(100 * n) / g.total}%` }} />
          ))}
          <span className={styles.text}>{`${((g.total - g.free) / GB).toFixed(1)} / ${(g.total / GB).toFixed(1)} GB`}</span>
        </div>
      </div>
    );
  };

  const holderRow = (h: Holder) => {
    const u = h.usage || {};
    const parts = (h.parts || []).filter((p) => p.vram || p.ram);
    const process = h.id.startsWith('process:');
    return (
      <div className={cx(styles.row, h.pinned && styles.pinned)} key={h.id}>
        <div className={styles.rowHead}>
          {process ? (
            <span style={{ width: 22 }} />
          ) : (
            <Button
              disabled={Boolean(busy)}
              icon={h.pinned ? <Lock size={13} /> : <LockOpen size={13} />}
              onClick={() => pin(h)}
              size={'small'}
              style={h.pinned ? { color: theme.colorPrimary } : undefined}
              title={t(h.pinned ? 'sidebar.memory.unkeep' : 'sidebar.memory.keep')}
              type={'text'}
            />
          )}
          <div className={styles.rowName}>
            <strong title={h.name}>
              {h.name}
              {h.source && <span className={styles.source}>{h.source}</span>}
            </strong>
            <span className={styles.dim}>{where(u)}</span>
          </div>
        </div>
        {(h.detail || (h.can_ram && u.vram) || h.can_unload) && (
          <div className={styles.rowHead} style={{ paddingInlineStart: 26 }}>
            {h.detail && (
              <span className={styles.dim} style={{ flex: 1, fontSize: 11 }}>
                {h.detail}
              </span>
            )}
            {!h.detail && <span style={{ flex: 1 }} />}
            {h.can_ram && Boolean(u.vram) && (
              <Button disabled={Boolean(busy)} onClick={() => act(h, 'ram')} size={'small'} title={t('sidebar.memory.toRamTip')}>
                {t('sidebar.memory.toRam')}
              </Button>
            )}
            {h.can_unload && (
              <Button
                danger
                disabled={Boolean(busy)}
                onClick={() => act(h, 'unload')}
                size={'small'}
                title={t(h.kind === 'cache' ? 'sidebar.memory.clearTip' : 'sidebar.memory.unloadTip')}
              >
                {t(h.kind === 'cache' ? 'sidebar.memory.clear' : 'sidebar.memory.unload')}
              </Button>
            )}
          </div>
        )}
        {parts.length > 1 &&
          parts.map((p) => (
            <div className={styles.part} key={p.id}>
              <span style={{ flex: 1 }}>{p.name}</span>
              <span className={styles.dim}>{[p.vram ? `GPU ${size(p.vram)}` : '', p.ram ? `RAM ${size(p.ram)}` : ''].filter(Boolean).join(' · ')}</span>
              {h.can_part_ram && Boolean(p.vram) && (
                <Button disabled={Boolean(busy)} onClick={() => act(h, 'ram', p)} size={'small'} title={t('sidebar.memory.toRamTip')}>
                  {t('sidebar.memory.toRam')}
                </Button>
              )}
            </div>
          ))}
      </div>
    );
  };

  const sections = full ? group(full) : [];
  const keptCount = (full || status).pinned?.length || 0;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.title}>{t('sidebar.memory.title')}</span>
        {status.generating && <span className={styles.tag}>{t('sidebar.memory.generating')}</span>}
        <span style={{ flex: 1 }} />
        <Button
          icon={open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          iconPosition={'end'}
          onClick={() => setOpen(!open)}
          size={'small'}
          type={'text'}
        >
          {t('sidebar.memory.details')}
        </Button>
      </div>
      {gauge('VRAM', status.gauges.gpu)}
      {gauge('RAM', status.gauges.ram)}
      {(status.gauges.gpu || status.gauges.ram) && (
        <div className={styles.legend}>
          <span>
            <i style={{ background: colors[0] }} />
            {t('sidebar.memory.webui')}
          </span>
          <span>
            <i style={{ background: colors[1] }} />
            {t('sidebar.memory.started')}
          </span>
          <span>
            <i style={{ background: colors[2] }} />
            {t('sidebar.memory.others')}
          </span>
        </div>
      )}
      <div className={styles.buttons}>
        <Button
          disabled={Boolean(busy)}
          onClick={() => free('vram')}
          size={'small'}
          style={{ flex: 1 }}
          title={t('sidebar.memory.freeVramTip')}
        >
          {t('sidebar.memory.freeVram')}
        </Button>
        <Button
          danger
          disabled={Boolean(busy)}
          onClick={() => free('all')}
          size={'small'}
          style={{ flex: 1 }}
          title={t('sidebar.memory.freeAllTip')}
        >
          {t('sidebar.memory.freeAll')}
        </Button>
      </div>
      {open && (
        <div className={styles.list}>
          {!full && <span className={styles.dim}>{t('sidebar.memory.reading')}</span>}
          {full && !sections.length && <span className={styles.dim}>{t('sidebar.memory.nothing')}</span>}
          {sections.map((c) => {
            const vram = c.rows.reduce((a, h) => a + (h.usage?.vram || 0), 0);
            const ram = c.rows.reduce((a, h) => a + (h.usage?.ram || 0), 0);
            const freeable = c.key !== 'process' && c.rows.some((h) => !h.pinned && (h.can_unload || h.can_ram));
            const name = catName(c.key, c.name);
            return (
              <div className={styles.group} key={c.key}>
                <div className={styles.groupHead}>
                  <span>{`${c.icon} ${name}`}</span>
                  <span className={styles.dim} style={{ fontWeight: 400 }}>
                    {[vram ? `GPU ${size(vram)}` : '', ram ? `RAM ${size(ram)}` : ''].filter(Boolean).join(' · ')}
                  </span>
                  <span style={{ flex: 1 }} />
                  {freeable && (
                    <Button
                      disabled={Boolean(busy)}
                      onClick={() => free('all', { key: c.key, name })}
                      size={'small'}
                      title={t('sidebar.memory.sectionFreeTip')}
                      type={'link'}
                    >
                      {t('sidebar.memory.sectionFree')}
                    </Button>
                  )}
                </div>
                {c.rows.map(holderRow)}
              </div>
            );
          })}
          <span className={styles.dim}>{keptCount ? t('sidebar.memory.kept', { count: keptCount }) : t('sidebar.memory.keepHint')}</span>
        </div>
      )}
      {(busy.trim() || message) && <div className={styles.message}>{busy.trim() || message}</div>}
    </div>
  );
});

export default MemoryKeeper;
