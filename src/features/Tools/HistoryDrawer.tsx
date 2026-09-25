import { ActionIcon } from '@lobehub/ui';
import { App, Button, Checkbox, Drawer, Empty, Image, Input, Modal, Segmented, Spin, Tag, Tooltip } from 'antd';
import { createStyles, useResponsive } from 'antd-style';
import { BookmarkPlus, Copy, GitCompare, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import {
  type GenTab,
  copyText,
  parseInfotext,
  pasteParameters,
  selectTab,
  setPrompts,
  setSeed,
} from '@/scripts/webui';

import { type HistoryEntry, historyApi } from './api';
import { bus } from './bus';
import { createPreset, loadPresets, parametersFromInfotext } from './presets';

const PAGE = 40;

const useStyles = createStyles(({ css, token }) => ({
  chips: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .ant-tag {
      margin: 0;
      font-size: 11px;
      line-height: 18px;
    }
  `,
  day: css`
    position: sticky;
    z-index: 2;
    top: 0;

    padding: 6px 0;

    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;

    background: ${token.colorBgElevated};
  `,
  diffAdd: css`
    color: ${token.colorSuccessText};
    background: ${token.colorSuccessBg};
    border-radius: 3px;
  `,
  diffRemove: css`
    color: ${token.colorErrorText};
    text-decoration: line-through;
    background: ${token.colorErrorBg};
    border-radius: 3px;
  `,
  diffRow: css`
    background: ${token.colorWarningBg};
  `,
  entry: css`
    padding: 10px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
    }
  `,
  more: css`
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    font-weight: 600;
    color: #fff;

    background: rgb(0 0 0 / 50%);
    border-radius: ${token.borderRadius}px;
  `,
  prompt: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    font-size: 13px;
    line-height: 1.45;
    word-break: break-word;
  `,
  table: css`
    width: 100%;
    font-size: 12px;
    border-collapse: collapse;

    td,
    th {
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      word-break: break-word;
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }

    th {
      width: 22%;
      color: ${token.colorTextSecondary};
    }
  `,
  thumb: css`
    position: relative;
    overflow: hidden;
    flex: none;

    width: 72px;
    height: 72px;

    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadius}px;

    img {
      object-fit: cover;
      width: 72px !important;
      height: 72px !important;
    }
  `,
  time: css`
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
}));

const dayLabel = (time: number, t: (key: 'tools.history.today' | 'tools.history.yesterday') => string) => {
  const date = new Date(time);
  const today = new Date();
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (days === 0) return t('tools.history.today');
  if (days === 1) return t('tools.history.yesterday');
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', weekday: 'short', year: 'numeric' });
};

const thumbSource = (image: HistoryEntry['images'][number]) =>
  image.thumb ? historyApi.thumbUrl(image.thumb) : image.url;

const SUMMARY_KEYS: [string, string][] = [
  ['Sampler', ''],
  ['Schedule type', ''],
  ['Steps', 'Steps'],
  ['CFG scale', 'CFG'],
  ['Size', ''],
  ['Seed', 'Seed'],
];

const summary = (entry: HistoryEntry) => {
  const parameters = new Map(parseInfotext(entry.infotext).parameters);
  return SUMMARY_KEYS.flatMap(([key, label]) => {
    const value = parameters.get(key);
    return value ? [label ? `${label} ${value}` : value] : [];
  });
};

const entryTime = (entry: HistoryEntry) => new Date(entry.time).toLocaleString();

const splitTokens = (text: string) =>
  text
    .split(/[\n,]/)
    .map((token) => token.trim())
    .filter(Boolean);

interface DiffProps {
  a: string;
  b: string;
  classNames: { add: string; remove: string };
}
/** Prompt tokens of B, marking those not in A (and listing those only in A). */
const TokenDiff = memo<DiffProps>(({ a, b, classNames }) => {
  const tokensA = splitTokens(a);
  const tokensB = splitTokens(b);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  return (
    <span>
      {tokensB.map((token, index) => (
        <span key={`b${index}`}>
          {index > 0 && ', '}
          <span className={setA.has(token) ? undefined : classNames.add}>{token}</span>
        </span>
      ))}
      {tokensA
        .filter((token) => !setB.has(token))
        .map((token, index) => (
          <span key={`a${index}`}>
            {(tokensB.length > 0 || index > 0) && ', '}
            <span className={classNames.remove}>{token}</span>
          </span>
        ))}
    </span>
  );
});

const Compare = memo<{ entries: [HistoryEntry, HistoryEntry]; onClose: () => void }>(({ entries, onClose }) => {
  const { t } = useTranslation();
  const { styles } = useStyles();
  // older first, so the diff reads as "what changed"
  const [a, b] = [...entries].sort((x, y) => x.time - y.time);
  const pa = parseInfotext(a.infotext);
  const pb = parseInfotext(b.infotext);
  const mapA = new Map(pa.parameters);
  const mapB = new Map(pb.parameters);
  const keys = [...new Set([...mapA.keys(), ...mapB.keys()])];
  return (
    <Modal centered footer={null} onCancel={onClose} open title={t('tools.history.compare')} width={860}>
      <Flexbox gap={12} horizontal style={{ marginBottom: 12 }}>
        {[a, b].map((entry, index) => (
          <Flexbox align={'center'} gap={8} horizontal key={entry.id} style={{ flex: 1 }}>
            {entry.images[0] && (
              <div className={styles.thumb}>
                <Image preview={{ src: entry.images[0].url }} src={thumbSource(entry.images[0])} />
              </div>
            )}
            <Flexbox gap={2}>
              <b>{index === 0 ? 'A' : 'B'}</b>
              <span className={styles.time}>{entryTime(entry)}</span>
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
      <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
        <table className={styles.table}>
          <tbody>
            <tr className={pa.prompt === pb.prompt ? undefined : styles.diffRow}>
              <th>{t('tools.history.prompt')}</th>
              <td colSpan={2}>
                <TokenDiff a={pa.prompt} b={pb.prompt} classNames={{ add: styles.diffAdd, remove: styles.diffRemove }} />
              </td>
            </tr>
            <tr className={pa.negative === pb.negative ? undefined : styles.diffRow}>
              <th>{t('tools.history.negative')}</th>
              <td colSpan={2}>
                <TokenDiff
                  a={pa.negative}
                  b={pb.negative}
                  classNames={{ add: styles.diffAdd, remove: styles.diffRemove }}
                />
              </td>
            </tr>
            <tr>
              <th>{t('tools.history.parameter')}</th>
              <th>A</th>
              <th>B</th>
            </tr>
            {keys.map((key) => (
              <tr className={mapA.get(key) === mapB.get(key) ? undefined : styles.diffRow} key={key}>
                <th>{key}</th>
                <td>{mapA.get(key) ?? '–'}</td>
                <td>{mapB.get(key) ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
});

interface EntryProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  selected: boolean;
  selectionFull: boolean;
}

const Entry = memo<EntryProps>(({ entry, selected, selectionFull, onSelect, onDelete }) => {
  const { t } = useTranslation();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const parsed = useMemo(() => parseInfotext(entry.infotext), [entry.infotext]);
  const chips = useMemo(() => summary(entry), [entry.infotext]);
  const tab = (entry.tab === 'img2img' ? 'img2img' : 'txt2img') as GenTab;
  const seed = useMemo(() => new Map(parsed.parameters).get('Seed'), [parsed]);
  const shown = entry.images.slice(0, 3);

  const reuseAll = async() => {
    selectTab(`tab_${tab}`);
    await pasteParameters(tab, entry.infotext);
    message.success(t('tools.history.applied'));
  };

  return (
    <Flexbox className={styles.entry} gap={8}>
      <Flexbox align={'center'} gap={8} horizontal>
        <Checkbox
          checked={selected}
          disabled={!selected && selectionFull}
          onChange={(event) => onSelect(entry.id, event.target.checked)}
        />
        <span className={styles.time}>
          {new Date(entry.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Tag bordered={false} style={{ margin: 0 }}>
          {entry.tab}
        </Tag>
        {entry.images.length > 1 && (
          <span className={styles.time}>{t('tools.history.images', { count: entry.images.length })}</span>
        )}
      </Flexbox>
      <Flexbox gap={10} horizontal>
        {shown.length > 0 && (
          <Image.PreviewGroup items={entry.images.map((image) => image.url)}>
            <Flexbox gap={6} horizontal style={{ flex: 'none' }}>
              {shown.map((image, index) => (
                <div className={styles.thumb} key={index}>
                  <Image fallback={thumbSource(image)} preview={{ src: image.url }} src={thumbSource(image)} />
                  {index === shown.length - 1 && entry.images.length > shown.length && (
                    <div className={styles.more} style={{ pointerEvents: 'none' }}>
                      +{entry.images.length - shown.length}
                    </div>
                  )}
                </div>
              ))}
            </Flexbox>
          </Image.PreviewGroup>
        )}
        <Flexbox gap={6} style={{ minWidth: 0 }}>
          <div className={styles.prompt} title={parsed.prompt}>
            {parsed.prompt || '—'}
          </div>
          <div className={styles.chips}>
            {chips.map((chip) => (
              <Tag key={chip}>{chip}</Tag>
            ))}
          </div>
        </Flexbox>
      </Flexbox>
      <Flexbox align={'center'} gap={4} horizontal wrap={'wrap'}>
        <Button onClick={reuseAll} size={'small'} type={'primary'}>
          {t('tools.history.reuseAll')}
        </Button>
        <Button onClick={() => setPrompts(tab, parsed.prompt, parsed.negative)} size={'small'}>
          {t('tools.history.reusePrompt')}
        </Button>
        {seed && (
          <Button onClick={() => setSeed(tab, seed)} size={'small'}>
            {t('tools.history.reuseSeed')}
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <Tooltip title={t('tools.history.copy')}>
          <ActionIcon
            icon={Copy}
            onClick={async() => {
              await copyText(entry.infotext);
              message.success(t('tools.history.copied'));
            }}
            size={'small'}
          />
        </Tooltip>
        <Tooltip title={t('tools.history.savePreset')}>
          <ActionIcon
            icon={BookmarkPlus}
            onClick={async() => {
              const existing = await loadPresets();
              await createPreset({
                name: t('tools.presets.defaultName', { n: existing.length + 1 }),
                parameters: parametersFromInfotext(entry.infotext),
                tab,
              });
              message.success(t('tools.presets.saved'));
            }}
            size={'small'}
          />
        </Tooltip>
        <Tooltip title={t('tools.history.delete')}>
          <ActionIcon icon={Trash2} onClick={() => onDelete(entry.id)} size={'small'} />
        </Tooltip>
      </Flexbox>
    </Flexbox>
  );
});

const HistoryDrawer = memo<{ onClose: () => void; open: boolean }>(({ open, onClose }) => {
  const { t } = useTranslation();
  const { styles } = useStyles();
  const { modal } = App.useApp();
  const { mobile } = useResponsive();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const request = useRef(0);

  const load = useCallback(async(offset: number) => {
    const id = ++request.current;
    setLoading(true);
    try {
      const page = await historyApi.list({ limit: PAGE, offset, q: query, tab });
      if (id !== request.current) return;
      setTotal(page.total);
      setItems((previous) => (offset === 0 ? page.items : [...previous, ...page.items]));
    } catch {
      if (id === request.current && offset === 0) setItems([]);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [query, tab]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => load(0), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [open, query, tab]);

  useEffect(
    () =>
      bus.on('history:added', (entry) => {
        if (tab && entry.tab !== tab) return;
        if (query) return;
        setItems((previous) => [entry, ...previous]);
        setTotal((value) => value + 1);
      }),
    [tab, query],
  );

  const remove = useCallback(async(id: string) => {
    await historyApi.remove(id);
    setItems((previous) => previous.filter((item) => item.id !== id));
    setSelected((previous) => previous.filter((item) => item !== id));
    setTotal((value) => Math.max(0, value - 1));
  }, []);

  const select = useCallback((id: string, value: boolean) => {
    setSelected((previous) => (value ? [...previous, id].slice(-2) : previous.filter((item) => item !== id)));
  }, []);

  const groups = useMemo(() => {
    const result: { entries: HistoryEntry[]; label: string }[] = [];
    for (const entry of items) {
      const label = dayLabel(entry.time, t);
      const last = result.at(-1);
      if (last && last.label === label) last.entries.push(entry);
      else result.push({ entries: [entry], label });
    }
    return result;
  }, [items]);

  const compareEntries = selected
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as HistoryEntry[];

  return (
    <Drawer
      extra={
        <Flexbox gap={4} horizontal>
          <Tooltip title={selected.length === 2 ? t('tools.history.compare') : t('tools.history.compareHint')}>
            <ActionIcon
              disable={compareEntries.length !== 2}
              icon={GitCompare}
              onClick={() => setComparing(true)}
            />
          </Tooltip>
          <Tooltip title={t('tools.history.clear')}>
            <ActionIcon
              icon={Trash2}
              onClick={() =>
                modal.confirm({
                  centered: true,
                  okButtonProps: { danger: true },
                  onOk: async() => {
                    await historyApi.clear();
                    setItems([]);
                    setTotal(0);
                    setSelected([]);
                  },
                  title: t('tools.history.clearConfirm'),
                })
              }
            />
          </Tooltip>
        </Flexbox>
      }
      onClose={onClose}
      open={open}
      placement={'right'}
      styles={{ body: { paddingBlock: 0 } }}
      title={t('tools.history.title')}
      width={mobile ? '100%' : 560}
    >
      <Flexbox gap={10} style={{ paddingBlock: 12 }}>
        <Input.Search
          allowClear
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('tools.history.search')}
          value={query}
        />
        <Segmented
          block
          onChange={(value) => setTab(String(value))}
          options={[
            { label: t('tools.history.all'), value: '' },
            { label: 'txt2img', value: 'txt2img' },
            { label: 'img2img', value: 'img2img' },
          ]}
          value={tab}
        />
        {items.length === 0 && !loading && (
          <Empty description={t('tools.history.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {groups.map((group) => (
          <Flexbox gap={8} key={group.label}>
            <div className={styles.day}>{group.label}</div>
            {group.entries.map((entry) => (
              <Entry
                entry={entry}
                key={entry.id}
                onDelete={remove}
                onSelect={select}
                selected={selected.includes(entry.id)}
                selectionFull={selected.length >= 2}
              />
            ))}
          </Flexbox>
        ))}
        {loading && <Spin style={{ margin: 16 }} />}
        {!loading && items.length < total && (
          <Button block onClick={() => load(items.length)}>
            {t('tools.history.loadMore')} ({items.length} / {total})
          </Button>
        )}
      </Flexbox>
      {comparing && compareEntries.length === 2 && (
        <Compare entries={compareEntries as [HistoryEntry, HistoryEntry]} onClose={() => setComparing(false)} />
      )}
    </Drawer>
  );
});

export default HistoryDrawer;
