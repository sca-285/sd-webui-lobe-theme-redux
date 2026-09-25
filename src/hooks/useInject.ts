import { consola } from 'consola';
import { RefObject, useEffect, useRef, useState } from 'react';

interface InjectOptions {
  debug?: string;
  id?: string;
  inverse?: boolean;
  onError?: (error: Error) => void;
  onStart?: (ele: HTMLDivElement) => void;
  onSuccess?: (ele: HTMLDivElement) => void;
  parent?: string;
}
export const useInject = (
  ref: RefObject<HTMLDivElement>,
  /** A selector, or several tried in order (e.g. one per Gradio version). */
  selectors: string | string[],
  { onSuccess, onError, debug, id, onStart, parent, inverse }: InjectOptions = {},
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [element, setElement] = useState<HTMLDivElement>();
  const isInject = useRef(false);
  useEffect(() => {
    if (isInject.current) return;

    try {
      const root = parent ? (gradioApp().querySelector(parent) as HTMLDivElement) : gradioApp();
      let ele: HTMLDivElement | null = null;
      for (const selector of [selectors].flat()) {
        ele = root?.querySelector(selector) as HTMLDivElement | null;
        if (ele) break;
      }
      if (ele) {
        if (id) ele.id = id;
        onStart?.(ele);
        if (inverse && ref.current) {
          ele.append(ref.current);
        } else {
          ref.current?.append(ele);
        }
        setElement(ele);
        onSuccess?.(ele);
        isInject.current = true;
        setIsLoading(false);
        if (debug) consola.success(`🤯 ${debug}`);
      } else {
        if (debug) consola.error(`🤯 ${debug}`, `Element not found for selector: ${selectors}`);
      }
    } catch (error: any) {
      console.error(error);
      onError?.(error);
      setIsLoading(false);
      if (debug) consola.error(`🤯 ${debug}`, error);
    }
  }, []);
  return {
    element,
    isLoaded: !isLoading,
    isLoading,
  };
};
