import { Icon } from '@lobehub/ui';
import { App, Input, type InputRef, Modal, Tag } from 'antd';
import { createStyles } from 'antd-style';
import {
  Bookmark,
  BookmarkPlus,
  Box,
  Clock,
  Cog,
  FastForward,
  History,
  Layers,
  LayoutPanelTop,
  type LucideIcon,
  Palette,
  Play,
  Settings2,
  Shuffle,
  Square,
  SunMoon,
  Waves,
} from 'lucide-react';
import qs from 'query-string';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { genNavList, getNavButtons } from '@/features/Header/genNavList';
import {
  $,
  appendToPrompt,
  clickGenerate,
  clickInterrupt,
  clickSkip,
  currentGenTab,
  parseInfotext,
  pasteParameters,
  selectTab,
  setDropdown,
  setInputValue,
} from '@/scripts/webui';
import { useAppStore } from '@/store';

import { getChoices, historyApi } from './api';
import { bus } from './bus';
import { ARCH_LABEL, formatWeight, loadLoraLists, loadLoras, pushRecent, weightOf } from './loraData';
import { applyPreset, createPreset, loadPresets, readCurrentParameters } from './presets';

type Group = 'action' | 'tab' | 'preset' | 'history' | 'sampler' | 'scheduler' | 'checkpoint' | 'lora' | 'setting';
const GROUP_ORDER: Group[] = ['action', 'tab', 'preset', 'history', 'lora', 'checkpoint', 'sampler', 'scheduler', 'setting'];
/** Shown before anything is typed; the rest appear when searching. */
const START_GROUPS = new Set<Group>(['action', 'tab', 'preset', 'history']);

interface Command {
  group: Group;
  icon: LucideIcon;
  id: string;
  keywords?: string;
  /** The thing itself (sampler name, LoRA name...), matched before the rest. */
  name?: string;
  run: () => unknown;
  subtitle?: string;
  title: string;
}

const useStyles = createStyles(({ css, token }) => ({
  active: css`
    background: ${token.colorFillSecondary};
  `,
  empty: css`
    padding: 24px;
    color: ${token.colorTextTertiary};
    text-align: center;
  `,
  footer: css`
    padding: 8px 14px;
    font-size: 12px;
    color: ${token.colorTextTertiary};
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  group: css`
    padding: 10px 14px 4px;
    font-size: 11px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,
  input: css`
    padding: 14px 16px;
    font-size: 16px;
    border-bottom: 1px solid ${token.colorBorderSecondary} !important;
    border-radius: 0;
  `,
  item: css`
    cursor: pointer;

    display: flex;
    gap: 10px;
    align-items: center;

    margin: 0 6px;
    padding: 8px 10px;

    border-radius: ${token.borderRadius}px;
  `,
  list: css`
    overflow-y: auto;
    max-height: min(60vh, 520px);
    padding-bottom: 6px;
  `,
  subtitle: css`
    overflow: hidden;
    font-size: 12px;
    color: ${token.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  title: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const BOUNDARY = /[\s(./:[_-]/;
/** Settings are many and wordy: rank them after the named things. */
const GROUP_WEIGHT: Partial<Record<Group, number>> = { history: 0.9, setting: 0.75 };

/** How well `query` matches `text` (0 = not at all): substring first, then in-order letters. */
const matchScore = (query: string, text: string) => {
  const t = text.toLowerCase();
  let total = 0;
  for (const word of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const index = t.indexOf(word);
    if (index >= 0) {
      total += 100 + (index === 0 || BOUNDARY.test(t[index - 1]) ? 60 : 0) - Math.min(index, 40) * 0.5;
      continue;
    }
    let from = 0;
    let previous = -2;
    let score = 0;
    for (const char of word) {
      const found = t.indexOf(char, from);
      if (found < 0) return 0;
      score += found === previous + 1 ? 4 : found === 0 || BOUNDARY.test(t[found - 1]) ? 3 : 1;
      previous = found;
      from = found + 1;
    }
    total += score;
  }
  return total - t.length * 0.01;
};

const rank = (query: string, command: Command) => {
  const q = query.toLowerCase();
  const name = (command.name || command.title).toLowerCase();
  let score = matchScore(query, name) * 1.3;
  if (score > 0) {
    if (name === q) score += 400;
    else if (name.startsWith(q)) score += 220;
    else if (name.includes(q)) score += 120;
  } else {
    score = matchScore(query, `${command.title} ${command.keywords || ''} ${command.subtitle || ''}`);
    if (score > 0 && command.title.toLowerCase().includes(q)) score += 80;
  }
  return score * (GROUP_WEIGHT[command.group] ?? 1);
};

/** WebUI settings on the Settings tab, with their labels. */
const scanSettings = (): { id: string; label: string; section: string }[] => {
  const result: { id: string; label: string; section: string }[] = [];
  const root = $('#tab_settings');
  if (!root) return result;
  for (const element of root.querySelectorAll<HTMLElement>('[id^="setting_"]')) {
    const label =
      element.querySelector('label > span, .label-wrap > span, [data-testid="block-info"], span[data-testid="block-label"]')
        ?.textContent || element.querySelector('label')?.textContent || '';
    const text = label.trim();
    if (!text || text.length > 160) continue;
    const section = element.closest('.tabitem, [id^="settings_"]')?.id?.replace(/^settings_/, '') || '';
    result.push({ id: element.id, label: text, section });
  }
  return result;
};

const openSetting = async(id: string, label: string) => {
  selectTab('tab_settings');
  const search = $<HTMLInputElement>('#settings_search input, #settings_search textarea');
  if (search) setInputValue(search, label);
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
  const element = $(`#${id}`);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.animate(
    [{ boxShadow: '0 0 0 2px var(--lobe-tools-primary, #1677ff)' }, { boxShadow: '0 0 0 0 transparent' }],
    { duration: 1600, easing: 'ease-out' },
  );
};

const CommandPalette = memo<{ onClose: () => void; open: boolean }>(({ open, onClose }) => {
  const { t } = useTranslation();
  const { styles, cx } = useStyles();
  const { message } = App.useApp();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [dynamic, setDynamic] = useState<Command[]>([]);
  const input = useRef<InputRef>(null);
  const list = useRef<HTMLDivElement>(null);
  const { themeMode, onSetThemeMode } = useAppStore((st) => ({
    onSetThemeMode: st.onSetThemeMode,
    themeMode: st.themeMode,
  }));

  const toggleTheme = useCallback(() => {
    const theme = themeMode === 'light' ? 'dark' : 'light';
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
    onSetThemeMode(theme);
    const url = qs.parseUrl(window.location.href);
    url.query.__theme = theme;
    window.history.replaceState(window.history.state, '', qs.stringifyUrl(url));
  }, [themeMode]);

  const staticCommands = useMemo<Command[]>(() => {
    const p = (key: string) => t(`tools.palette.${key}` as any) as string;
    const actions: Command[] = [
      { group: 'action', icon: Play, id: 'generate', keywords: 'run start', run: () => clickGenerate(), title: p('generate') },
      { group: 'action', icon: Square, id: 'interrupt', keywords: 'stop cancel', run: () => clickInterrupt(), title: p('interrupt') },
      { group: 'action', icon: FastForward, id: 'skip', keywords: 'next', run: () => clickSkip(), title: p('skip') },
      { group: 'action', icon: History, id: 'history', run: () => bus.emit('open:history'), title: p('openHistory') },
      { group: 'action', icon: Bookmark, id: 'presets', run: () => bus.emit('open:presets'), title: p('openPresets') },
      {
        group: 'action',
        icon: BookmarkPlus,
        id: 'save-preset',
        run: async() => {
          const tab = currentGenTab();
          const current = readCurrentParameters(tab);
          const existing = await loadPresets();
          await createPreset({
            name: t('tools.presets.defaultName', { n: existing.length + 1 }),
            parameters: current.parameters,
            tab,
          });
          message.success(t('tools.presets.saved'));
        },
        title: p('savePreset'),
      },
      { group: 'action', icon: SunMoon, id: 'theme', keywords: 'dark light mode', run: toggleTheme, title: p('toggleTheme') },
      { group: 'action', icon: Palette, id: 'theme-settings', keywords: 'lobe', run: () => bus.emit('open:settings'), title: p('themeSettings') },
    ];
    const tabs: Command[] = genNavList().map((item) => ({
      group: 'tab',
      icon: LayoutPanelTop,
      id: `tab:${item.id}`,
      keywords: item.id,
      run: () => getNavButtons()[item.index]?.click(),
      title: item.label,
    }));
    return [...actions, ...tabs];
  }, [toggleTheme]);

  // Lists that come from the server or the page, refreshed each time the palette opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const p = (key: string) => t(`tools.palette.${key}` as any) as string;
    const load = async() => {
      const [choices, loras, lists, presets, history] = await Promise.all([
        getChoices(),
        loadLoras(),
        loadLoraLists(),
        loadPresets(),
        historyApi.list({ limit: 30 }).catch(() => ({ items: [], total: 0 })),
      ]);
      if (cancelled) return;
      const favorites = new Set(lists.favorites);
      const commands: Command[] = [
        ...presets.map<Command>((preset) => ({
          group: 'preset',
          icon: Bookmark,
          id: `preset:${preset.id}`,
          name: preset.name,
          run: async() => {
            await applyPreset(preset, currentGenTab());
            message.success(t('tools.presets.applied'));
          },
          subtitle: preset.parameters,
          title: `${p('applyPreset')}: ${preset.name}`,
        })),
        ...history.items.map<Command>((entry) => {
          const parsed = parseInfotext(entry.infotext);
          return {
            group: 'history',
            icon: Clock,
            id: `history:${entry.id}`,
            keywords: entry.infotext,
            run: async() => {
              const target = entry.tab === 'img2img' ? 'img2img' : 'txt2img';
              selectTab(`tab_${target}`);
              await pasteParameters(target, entry.infotext);
              message.success(t('tools.history.applied'));
            },
            subtitle: `${new Date(entry.time).toLocaleString()} · ${parsed.parametersLine}`,
            title: parsed.prompt || entry.infotext.slice(0, 80),
          };
        }),
        ...[...loras.values()]
          .sort((a, b) => Number(favorites.has(b.name)) - Number(favorites.has(a.name)))
          .map<Command>((lora) => ({
            group: 'lora',
            icon: Layers,
            id: `lora:${lora.name}`,
            keywords: `${lora.alias} ${lora.triggerWords.join(' ')}`,
            name: lora.name,
            run: () => {
              appendToPrompt(currentGenTab(), `<lora:${lora.alias}:${formatWeight(weightOf(lora.name))}>`);
              pushRecent(lora.name);
            },
            subtitle: [favorites.has(lora.name) ? '★' : '', ARCH_LABEL[lora.arch], lora.triggerWords.join(', ')]
              .filter(Boolean)
              .join(' · '),
            title: `${p('addLora')}: ${lora.name}`,
          })),
        ...choices.checkpoints.map<Command>((name) => ({
          group: 'checkpoint',
          icon: Box,
          id: `ckpt:${name}`,
          name,
          run: () => setDropdown('setting_sd_model_checkpoint', name),
          title: `${p('loadCheckpoint')}: ${name}`,
        })),
        ...choices.samplers.map<Command>((name) => ({
          group: 'sampler',
          icon: Shuffle,
          id: `sampler:${name}`,
          name,
          run: () => setDropdown(`${currentGenTab()}_sampling`, name),
          title: `${p('setSampler')}: ${name}`,
        })),
        ...choices.schedulers.map<Command>((name) => ({
          group: 'scheduler',
          icon: Waves,
          id: `scheduler:${name}`,
          name,
          run: () => setDropdown(`${currentGenTab()}_scheduler`, name),
          title: `${p('setScheduler')}: ${name}`,
        })),
        ...scanSettings().map<Command>((setting) => ({
          group: 'setting',
          icon: setting.section ? Settings2 : Cog,
          id: `setting:${setting.id}`,
          keywords: setting.id.replace(/^setting_/, ''),
          run: () => openSetting(setting.id, setting.label),
          subtitle: setting.id.replace(/^setting_/, ''),
          title: setting.label,
        })),
      ];
      setDynamic(commands);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => input.current?.focus(), 50);
  }, [open]);

  const results = useMemo(() => {
    const all = [...staticCommands, ...dynamic];
    const trimmed = query.trim();
    if (!trimmed) {
      const start = all.filter((command) => START_GROUPS.has(command.group));
      const perGroup = new Map<Group, number>();
      return start.filter((command) => {
        const count = (perGroup.get(command.group) || 0) + 1;
        perGroup.set(command.group, count);
        return command.group !== 'history' || count <= 5;
      });
    }
    return all
      .map((command) => ({ command, score: rank(trimmed, command) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || GROUP_ORDER.indexOf(a.command.group) - GROUP_ORDER.indexOf(b.command.group))
      .slice(0, 60)
      .map((item) => item.command);
  }, [query, staticCommands, dynamic]);

  // grouped for display, in score order of each group's best match
  const grouped = useMemo(() => {
    const order: Group[] = [];
    const byGroup = new Map<Group, Command[]>();
    for (const command of results) {
      if (!byGroup.has(command.group)) {
        byGroup.set(command.group, []);
        order.push(command.group);
      }
      byGroup.get(command.group)!.push(command);
    }
    if (!query.trim()) order.sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
    return order.map((group) => ({ commands: byGroup.get(group)!, group }));
  }, [results]);
  const flat = useMemo(() => grouped.flatMap((group) => group.commands), [grouped]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = useCallback(
    (command?: Command) => {
      if (!command) return;
      onClose();
      // let the modal close first so focus returns to the page
      setTimeout(() => {
        Promise.resolve(command.run()).catch((error) => console.error('[lobe] command', error));
      }, 60);
    },
    [onClose],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      setActive((value) => Math.min(flat.length - 1, value + 1));
    
    break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      setActive((value) => Math.max(0, value - 1));
    
    break;
    }
    case 'Enter': {
      event.preventDefault();
      run(flat[active]);
    
    break;
    }
    // No default
    }
  };

  let index = -1;
  return (
    <Modal
      closable={false}
      destroyOnClose
      footer={null}
      onCancel={onClose}
      open={open}
      style={{ top: '12vh' }}
      styles={{ body: { padding: 0 }, content: { overflow: 'hidden', padding: 0 } }}
      width={640}
    >
      <div id="lobe-command-palette" onKeyDown={onKeyDown}>
        <Input
          className={styles.input}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('tools.palette.placeholder')}
          ref={input}
          value={query}
          variant={'borderless'}
        />
        <div className={styles.list} ref={list}>
          {flat.length === 0 && <div className={styles.empty}>{t('tools.palette.empty')}</div>}
          {grouped.map((group) => (
            <div key={group.group}>
              <div className={styles.group}>{t(`tools.palette.groups.${group.group}` as any) as string}</div>
              {group.commands.map((command) => {
                index++;
                const current = index;
                return (
                  <div
                    className={cx(styles.item, current === active && styles.active)}
                    data-index={current}
                    key={command.id}
                    onClick={() => run(command)}
                    onMouseMove={() => current !== active && setActive(current)}
                  >
                    <Icon icon={command.icon} size={{ fontSize: 16 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.title}>{command.title}</div>
                      {command.subtitle && <div className={styles.subtitle}>{command.subtitle}</div>}
                    </div>
                    {current === active && (
                      <Tag bordered={false} style={{ margin: 0 }}>
                        ↵
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className={styles.footer}>{t('tools.palette.hint')}</div>
      </div>
    </Modal>
  );
});

export default CommandPalette;
