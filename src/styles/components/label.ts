import { css } from 'antd-style';

export default () => {
  return css`
    [id$='_settings'] {
      /* checkbox labels (Gradio 3: svelte-1ojmf70, Gradio 4: svelte-3pzdsv) */
      label:has(> input[type='checkbox']) {
        overflow: hidden;
        display: block !important;
      }
    }

    label {
      position: relative;
      min-width: 64px;
      text-overflow: ellipsis;
      white-space: nowrap;

      > span[data-testid='block-info'] {
        overflow: hidden;
        width: 100%;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  `;
};
