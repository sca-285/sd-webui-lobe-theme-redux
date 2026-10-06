/**
 * Machine status under the quick settings, in the spirit of ComfyUI's
 * Crystools monitor: CPU, RAM, GPU load, VRAM, temperature and power, with
 * a short history line for the loads. Polls /lobe/system while the page is
 * visible; one reading is shared by every open tab (the server caches it).
 *
 * With the Memory Keeper on, the RAM and VRAM bars show who holds what (the
 * WebUI, what it started, other programs) and its buttons sit under them.
 */
import { createStyles } from 'antd-style';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Gauge, MemoryControls, size, split, useMemoryColors, useMemoryKeeper } from './MemoryKeeper';

interface Gpu {
  name: string;
  power: number | null;
  power_limit: number | null;
  temp: number | null;
  util: number | null;
  vram_total: number;
  vram_used: number;
}

interface Stats {
  cpu: number | null;
  disk: { total: number; used: number } | null;
  gpus: Gpu[];
  nvml: boolean;
  ram: { total: number; used: number } | null;
}

const INTERVAL = 1500;
const HISTORY = 48;

const useStyles = createStyles(({ css, token }) => ({
  bar: css`
    position: relative;

    overflow: hidden;

    height: 18px;

    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadiusSM}px;
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
  `,
  fill: css`
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    transition: width 600ms ${token.motionEaseOut}, background 600ms;
  `,
  head: css`
    display: flex;
    gap: 8px;
    align-items: baseline;
    justify-content: space-between;

    margin-block-end: 2px;

    color: ${token.colorTextSecondary};
  `,
  label: css`
    width: 38px;
    color: ${token.colorTextSecondary};
  `,
  name: css`
    overflow: hidden;
    color: ${token.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  row: css`
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 8px;
    align-items: center;
  `,
  spark: css`
    display: block;
    width: 100%;
    height: 34px;
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

const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(bytes >= 100 * 1024 ** 3 ? 0 : 1);

interface BarProps {
  label: string;
  /** who holds the used part, as bytes of `total`: the WebUI, what it started, other programs */
  parts?: { bytes: [number, number, number]; colors: string[]; title: string; total: number };
  percent: number | null;
  text: string;
}

const Bar = memo<BarProps>(({ label, parts, percent, text }) => {
  const { styles, theme } = useStyles();
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color = p >= 90 ? theme.colorError : p >= 70 ? theme.colorWarning : theme.colorPrimary;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.bar} title={parts ? `${label}: ${text}\n${parts.title}` : `${label}: ${text}`}>
        {parts ? (
          <div className={styles.fill} style={{ display: 'flex', width: `${p}%` }}>
            {parts.bytes.map((n, i) => (
              <div
                key={i}
                // the WebUI's part keeps the load colour of the bar
                style={{ background: i === 0 ? color : parts.colors[i], flex: `${n} 0 0`, opacity: 0.6 }}
              />
            ))}
          </div>
        ) : (
          <div className={styles.fill} style={{ background: color, opacity: 0.55, width: `${p}%` }} />
        )}
        <span className={styles.text}>{text}</span>
      </div>
    </div>
  );
});

const Spark = memo<{ series: { color: string; values: number[] }[] }>(({ series }) => {
  const { styles } = useStyles();
  const w = 100;
  const h = 30;
  return (
    <svg className={styles.spark} preserveAspectRatio="none" viewBox={`0 0 ${w} ${h}`}>
      {series.map(({ color, values }, i) => {
        if (values.length < 2) return null;
        const step = w / (HISTORY - 1);
        const offset = (HISTORY - values.length) * step;
        const points = values.map((v, j) => `${(offset + j * step).toFixed(2)},${(h - (v / 100) * (h - 2) - 1).toFixed(2)}`);
        return (
          <g key={i}>
            <polyline
              fill={color}
              fillOpacity={0.12}
              points={`${points[0].split(',')[0]},${h} ${points.join(' ')} ${w},${h}`}
              stroke="none"
            />
            <polyline fill="none" points={points.join(' ')} stroke={color} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
});

const SystemMonitor = memo<{ memory?: boolean }>(({ memory }) => {
  const { styles, theme } = useStyles();
  const { t } = useTranslation();
  const mk = useMemoryKeeper(Boolean(memory));
  const memoryColors = useMemoryColors();
  const mkOn = Boolean(memory) && !mk.missing && Boolean(mk.status);
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const history = useRef<{ cpu: number[]; gpu: number[]; ram: number[]; vram: number[] }>({
    cpu: [],
    gpu: [],
    ram: [],
    vram: [],
  });

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const push = (list: number[], value: number | null | undefined) => {
      if (value === null || value === undefined) return;
      list.push(value);
      if (list.length > HISTORY) list.shift();
    };
    const tick = async() => {
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch('/lobe/system');
          if (!res.ok) throw new Error(String(res.status));
          const data = (await res.json()) as Stats;
          if (stopped) return;
          const g = data.gpus[0];
          push(history.current.cpu, data.cpu);
          push(history.current.ram, data.ram ? (data.ram.used / data.ram.total) * 100 : null);
          push(history.current.gpu, g?.util);
          push(history.current.vram, g ? (g.vram_used / g.vram_total) * 100 : null);
          setStats(data);
          setFailed(false);
        } catch {
          if (!stopped) setFailed(true);
        }
      }
      if (!stopped) timer = window.setTimeout(tick, INTERVAL);
    };
    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (failed && !stats) return null;
  if (!stats) return null;

  const h = history.current;

  // who holds the memory this card counts as used (Memory Keeper's split, scaled to the card's own numbers)
  const partsOf = (used: number, total: number, g: Gauge | null | undefined): BarProps['parts'] => {
    if (!mkOn || !g) return undefined;
    const [webui, kids] = split({ ...g, free: Math.max(0, g.total - used), total: Math.max(g.total, used) });
    const bytes: [number, number, number] = [webui, kids, Math.max(0, used - webui - kids)];
    return {
      bytes,
      colors: memoryColors,
      title: `${t('sidebar.memory.webui')} ${size(bytes[0])} · ${t('sidebar.memory.started')} ${size(bytes[1])} · ${t('sidebar.memory.others')} ${size(bytes[2])}`,
      total,
    };
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.title}>{t('sidebar.system.title')}</span>
        {stats.gpus[0] && <span className={styles.name}>{stats.gpus[0].name.replace(/^nvidia\s+/i, '')}</span>}
      </div>
      <Spark
        series={
          stats.gpus.length > 0 ?
            [
              { color: theme.colorTextTertiary, values: h.cpu },
              { color: theme.colorSuccess, values: h.vram },
              { color: theme.colorPrimary, values: h.gpu },
            ] :
            [
              { color: theme.colorSuccess, values: h.ram },
              { color: theme.colorPrimary, values: h.cpu },
            ]
        }
      />
      {stats.cpu !== null && <Bar label="CPU" percent={stats.cpu} text={`${Math.round(stats.cpu)}%`} />}
      {stats.ram && (
        <Bar
          label="RAM"
          parts={partsOf(stats.ram.used, stats.ram.total, mk.status?.gauges.ram)}
          percent={(stats.ram.used / stats.ram.total) * 100}
          text={`${gb(stats.ram.used)} / ${gb(stats.ram.total)} GB`}
        />
      )}
      {stats.gpus.map((g, i) => (
        <div key={i} style={{ display: 'contents' }}>
          {g.util !== null && <Bar label={stats.gpus.length > 1 ? `GPU${i}` : 'GPU'} percent={g.util} text={`${g.util}%`} />}
          <Bar
            label="VRAM"
            parts={i === 0 ? partsOf(g.vram_used, g.vram_total, mk.status?.gauges.gpu) : undefined}
            percent={(g.vram_used / g.vram_total) * 100}
            text={`${gb(g.vram_used)} / ${gb(g.vram_total)} GB`}
          />
          {(g.temp !== null || g.power !== null) && (
            <Bar
              label={g.temp !== null ? t('sidebar.system.temp') : 'PWR'}
              percent={g.temp !== null ? g.temp : g.power_limit ? ((g.power || 0) / g.power_limit) * 100 : null}
              text={[g.temp !== null ? `${g.temp}°C` : '', g.power !== null ? `${Math.round(g.power)} W` : '']
                .filter(Boolean)
                .join(' · ')}
            />
          )}
        </div>
      ))}
      {stats.disk && (
        <Bar
          label={t('sidebar.system.disk')}
          percent={(stats.disk.used / stats.disk.total) * 100}
          text={`${gb(stats.disk.used)} / ${gb(stats.disk.total)} GB`}
        />
      )}
      {!stats.nvml && stats.gpus.length > 0 && (
        <span className={styles.name} title={t('sidebar.system.noNvmlHint')}>
          {t('sidebar.system.noNvml')}
        </span>
      )}
      {mkOn && <MemoryControls mk={mk} />}
    </div>
  );
});

export default SystemMonitor;
