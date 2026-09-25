import { useRef } from 'react';

import { useInject } from '@/hooks/useInject';

import { adoptButtonClass } from '@/features/Share/createButton';

import { createButton } from './createButton';

export const useInjectPromptFormator = (type: 'txt' | 'img') => {
  const ref = useRef<any>(createButton(type));
  // Gradio 3 wraps the tool buttons in div.form, Gradio 4 does not
  useInject(ref, [`#${type}2img_tools > div.form`, `#${type}2img_tools`], {
    inverse: true,
    onStart: (row) => adoptButtonClass(ref.current, row),
  });
};
