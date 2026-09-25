import { Suspense, lazy, memo, useRef, useState } from 'react';

import { useInject } from '@/hooks/useInject';

import { adoptButtonClass, createButton } from './createButton';

// The share modal pulls in modern-screenshot; fetch it on the first click.
const ShareModal = lazy(() => import('./ShareModal'));

const Share = memo<{ type: 'txt' | 'img' }>(({ type }) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const buttonReference = useRef<any>(
    createButton(type, (value: boolean) => {
      if (value) setLoaded(true);
      setOpen(value);
    }),
  );

  useInject(
    buttonReference,
    // Gradio 3 wraps the buttons in a .form; in Gradio 4 they sit in the row itself
    [`#image_buttons_${type}2img > .form`, `#image_buttons_${type}2img`],
    {
      debug: `[layout] inject - Share ${type}`,
      inverse: true,
      onStart: (row) => adoptButtonClass(buttonReference.current, row),
    },
  );

  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <ShareModal onCancel={() => setOpen(false)} open={open} type={type} />
    </Suspense>
  );
});

export default memo(() => {
  return (
    <>
      <Share type={'txt'} />
      <Share type={'img'} />
    </>
  );
});
