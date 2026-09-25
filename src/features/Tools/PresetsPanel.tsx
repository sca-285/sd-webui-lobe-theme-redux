import { ActionIcon } from '@lobehub/ui';
import { App, Button, Checkbox, Dropdown, Empty, Input, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { MoreHorizontal, Save } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { currentGenTab } from '@/scripts/webui';

import { bus } from './bus';
import {
  type Preset,
  applyPreset,
  createPreset,
  deletePreset,
  loadPresets,
  movePreset,
  presetSummary,
  readCurrentParameters,
  updatePreset,
} from './presets';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding: 10px 12px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    transition: border-color 150ms ${token.motionEaseOut};

    &:hover {
      border-color: ${token.colorPrimaryBorder};
    }
  `,
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
  name: css`
    overflow: hidden;
    flex: 1;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const PresetsPanel = memo(() => {
  const { t } = useTranslation();
  const { styles } = useStyles();
  const { message, modal } = App.useApp();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const [includeSeed, setIncludeSeed] = useState(false);
  const [includeBatch, setIncludeBatch] = useState(false);
  const [editing, setEditing] = useState<string>();

  useEffect(() => {
    loadPresets(true).then((list) => setPresets([...list]));
    return bus.on('presets:changed', () => loadPresets().then((list) => setPresets([...list])));
  }, []);

  const save = useCallback(async() => {
    const tab = currentGenTab();
    const current = readCurrentParameters(tab, { includeSeed });
    await createPreset({
      batchCount: includeBatch ? current.batchCount : undefined,
      batchSize: includeBatch ? current.batchSize : undefined,
      name: name.trim() || t('tools.presets.defaultName', { n: presets.length + 1 }),
      parameters: current.parameters,
      tab,
    });
    setName('');
    message.success(t('tools.presets.saved'));
  }, [name, includeSeed, includeBatch, presets.length]);

  const apply = useCallback(async(preset: Preset) => {
    await applyPreset(preset, currentGenTab());
    message.success(t('tools.presets.applied'));
  }, []);

  const overwrite = useCallback(async(preset: Preset) => {
    const tab = currentGenTab();
    const current = readCurrentParameters(tab, { includeSeed: /(^|,\s*)Seed:/.test(preset.parameters) });
    await updatePreset(preset.id, {
      batchCount: preset.batchCount === undefined ? undefined : current.batchCount,
      batchSize: preset.batchSize === undefined ? undefined : current.batchSize,
      parameters: current.parameters,
      tab,
    });
    message.success(t('tools.presets.saved'));
  }, []);

  return (
    <Flexbox gap={12}>
      <Flexbox gap={8}>
        <Flexbox gap={8}>
          <Input
            allowClear
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            onPressEnter={save}
            placeholder={t('tools.presets.name')}
            value={name}
          />
          <Button block icon={<Save size={14} />} onClick={save} type="primary">
            {t('tools.presets.save')}
          </Button>
        </Flexbox>
        <Flexbox gap={4} horizontal wrap={'wrap'}>
          <Checkbox checked={includeSeed} onChange={(event) => setIncludeSeed(event.target.checked)}>
            {t('tools.presets.includeSeed')}
          </Checkbox>
          <Checkbox checked={includeBatch} onChange={(event) => setIncludeBatch(event.target.checked)}>
            {t('tools.presets.includeBatch')}
          </Checkbox>
        </Flexbox>
      </Flexbox>
      {presets.length === 0 ? (
        <Empty description={t('tools.presets.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        presets.map((preset, index) => (
          <Flexbox className={styles.card} gap={8} key={preset.id}>
            <Flexbox align={'center'} gap={6} horizontal>
              {editing === preset.id ? (
                <Input
                  autoFocus
                  defaultValue={preset.name}
                  maxLength={60}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    setEditing(undefined);
                    if (value && value !== preset.name) updatePreset(preset.id, { name: value });
                  }}
                  onPressEnter={(event) => (event.target as HTMLInputElement).blur()}
                  size={'small'}
                />
              ) : (
                <span className={styles.name} title={preset.name}>
                  {preset.name}
                </span>
              )}
              <Tag bordered={false} style={{ margin: 0 }}>
                {preset.tab}
              </Tag>
              <Dropdown
                menu={{
                  items: [
                    { key: 'rename', label: t('tools.presets.rename') },
                    { key: 'overwrite', label: t('tools.presets.overwrite') },
                    { disabled: index === 0, key: 'up', label: t('tools.presets.moveUp') },
                    { disabled: index === presets.length - 1, key: 'down', label: t('tools.presets.moveDown') },
                    { danger: true, key: 'delete', label: t('tools.presets.delete') },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'rename') setEditing(preset.id);
                    if (key === 'overwrite') overwrite(preset);
                    if (key === 'up') movePreset(preset.id, -1);
                    if (key === 'down') movePreset(preset.id, 1);
                    if (key === 'delete') {
                      modal.confirm({
                        centered: true,
                        okButtonProps: { danger: true },
                        onOk: () => deletePreset(preset.id),
                        title: t('tools.presets.deleteConfirm'),
                      });
                    }
                  },
                }}
                trigger={['click']}
              >
                <ActionIcon icon={MoreHorizontal} size={'small'} />
              </Dropdown>
            </Flexbox>
            <div className={styles.chips}>
              {presetSummary(preset).map((chip) => (
                <Tag key={chip}>{chip}</Tag>
              ))}
            </div>
            <Button block onClick={() => apply(preset)} size={'small'}>
              {t('tools.presets.apply')}
            </Button>
          </Flexbox>
        ))
      )}
    </Flexbox>
  );
});

export default PresetsPanel;
