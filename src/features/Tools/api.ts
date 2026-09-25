/** Client for the theme's own server routes (scripts/lib/api.py). */

export interface HistoryImage {
  thumb: string | null;
  url: string;
}
export interface HistoryEntry {
  id: string;
  images: HistoryImage[];
  infotext: string;
  tab: string;
  time: number;
}
export interface LoraInfo {
  alias: string;
  arch: Arch;
  name: string;
  triggerWords: string[];
}
export type Arch = 'sd1' | 'sd2' | 'sdxl' | 'sd3' | 'flux' | 'unknown';
export interface Choices {
  checkpoints: string[];
  samplers: string[];
  schedulers: string[];
}

const json = async <T,>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`${input}: ${response.status}`);
  return response.json();
};

export const historyApi = {
  add: (entry: { images: { thumb?: string; url: string }[]; infotext: string; tab: string; time: number }) =>
    json<HistoryEntry>('/lobe/history', { body: JSON.stringify(entry), method: 'POST' }),
  clear: () => json<{ deleted: number }>('/lobe/history', { method: 'DELETE' }),
  list: (parameters: { limit?: number; offset?: number; q?: string; tab?: string } = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return json<{ items: HistoryEntry[]; total: number }>(`/lobe/history?${query}`);
  },
  remove: (id: string) => json<{ deleted: number }>(`/lobe/history/${id}`, { method: 'DELETE' }),
  thumbUrl: (name: string) => `/lobe/history/thumbs/${name}`,
};

/** Small lists kept on the server (favourite LoRAs, presets, ...). */
export const userdata = {
  get: async <T,>(key: string, fallback: T): Promise<T> => {
    try {
      const { value } = await json<{ value: T | null }>(`/lobe/userdata/${key}`);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: unknown) =>
    json(`/lobe/userdata/${key}`, { body: JSON.stringify({ value }), method: 'PUT' }),
};

export const getLoras = () => json<LoraInfo[]>('/lobe/loras').catch(() => [] as LoraInfo[]);
export const getModel = () =>
  json<{ arch: Arch; checkpoint: string }>('/lobe/model').catch(() => ({ arch: 'unknown' as Arch, checkpoint: '' }));
export const getChoices = () =>
  json<Choices>('/lobe/choices').catch(() => ({ checkpoints: [], samplers: [], schedulers: [] }) as Choices);
