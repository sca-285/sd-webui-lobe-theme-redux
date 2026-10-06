import { describe, expect, it } from 'vitest';

import { type Status, group, size, split } from './MemoryKeeper';

const GB = 1024 ** 3;

const holder = (id: string, category: string) =>
  ({ can_ram: false, can_unload: true, category, id, kind: 'model', name: id, pinned: false, usage: {} });

describe('memory keeper', () => {
  it('splits the used memory into the WebUI, what it started and the rest', () => {
    expect(split({ children: 2 * GB, free: 4 * GB, total: 12 * GB, webui: 5 * GB })).toEqual([5 * GB, 2 * GB, GB]);
    // numbers that do not add up never go past what is used
    expect(split({ children: 20 * GB, free: 10 * GB, total: 12 * GB, webui: 5 * GB })).toEqual([0, 2 * GB, 0]);
  });

  it('writes sizes in GB or MB', () => {
    expect(size(1.5 * GB)).toBe('1.5 GB');
    expect(size(300 * 1024 ** 2)).toBe('300 MB');
    expect(size(null)).toBe('');
  });

  it('groups holders by section in the server order, unknown ones under other', () => {
    const status: Status = {
      categories: [
        { icon: '🧩', key: 'checkpoint', name: 'Checkpoint' },
        { icon: '🎨', key: 'lora', name: 'LoRA' },
        { icon: '📦', key: 'other', name: 'Other models' },
      ],
      gauges: { gpu: null, ram: null },
      generating: false,
      holders: [holder('x', 'weird'), holder('ckpt', 'checkpoint')],
    };
    expect(group(status).map((g) => [g.key, g.rows.map((r) => r.id)])).toEqual([
      ['checkpoint', ['ckpt']],
      ['other', ['x']],
    ]);
  });
});
