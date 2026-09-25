/**
 * Which tabs sit in the header bar. The rest are one click away in the
 * "All tabs" panel. Kept on the server (so every browser shows the same bar)
 * and in localStorage (so the bar is right before the server answers).
 */
import { useCallback, useEffect, useState } from 'react';

import { userdata } from '@/features/Tools/api';

const KEY = 'navPinned';
const LOCAL_KEY = 'SD-LOBE-NAV-PINNED';
export const DEFAULT_PINS = [
  'tab_txt2img',
  'tab_img2img',
  'tab_extras',
  'tab_pnginfo',
  'tab_settings',
  'tab_extensions',
];

const readLocal = (): string[] | undefined => {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    return Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const writeLocal = (pins: string[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pins));
  } catch {
    // private mode
  }
};

let shared: string[] = readLocal() || DEFAULT_PINS;
type Listener = (_pins: string[]) => void;
const listeners = new Set<Listener>();
let loaded = false;

const publish = (pins: string[]) => {
  shared = pins;
  writeLocal(pins);
  for (const listener of listeners) listener(pins);
};

export const useNavPins = () => {
  const [pins, setPins] = useState<string[]>(shared);

  useEffect(() => {
    listeners.add(setPins);
    if (!loaded) {
      loaded = true;
      userdata.get<string[] | null>(KEY, null).then((value) => {
        if (Array.isArray(value)) publish(value);
      });
    }
    return () => {
      listeners.delete(setPins);
    };
  }, []);

  const save = useCallback((next: string[]) => {
    publish(next);
    userdata.set(KEY, next).catch(() => undefined);
  }, []);

  const toggle = useCallback(
    (id: string) => save(shared.includes(id) ? shared.filter((item) => item !== id) : [...shared, id]),
    [save],
  );

  const reset = useCallback(() => save(DEFAULT_PINS), [save]);

  return { pins, reset, toggle };
};
