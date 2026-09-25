import { Theme, css } from 'antd-style';

export default (token: Theme) => css`
  input[type='range'] {
    cursor: pointer;

    height: 3px;
    margin-top: 8px;

    appearance: none;
    background: ${token.colorTextQuaternary};
    border-radius: ${token.borderRadiusXS}px;
    outline: none;

    transition: var(--button-transition);

    &::-webkit-slider-thumb {
      width: 12px;
      height: 16px;

      appearance: none;
      background: ${token.colorPrimary};
      border: 1px solid ${token.colorPrimary};
      border-radius: ${token.borderRadiusSM}px;

      transition: var(--button-transition);

      &:hover,
      &:active {
        background: ${token.colorPrimaryHover};
        border-color: ${token.colorPrimaryHover};
      }
    }

    &:hover {
      background: ${token.colorPrimaryHover};
    }

    &:active {
      background: ${token.colorPrimaryHover};
    }
  }

  /* Gradio 4 styles its slider thumb with a scoped class, which outranks the
     rule above: the thumbs came out as plain white discs, nearly invisible
     on the light theme. gradio-app raises the specificity just enough.
     Gradio 4's filled track (the part left of the thumb) is kept. */
  gradio-app .gradio-slider input[type='range'] {
    &::-webkit-slider-thumb {
      width: 12px;
      height: 16px;

      appearance: none;
      background: ${token.colorPrimary};
      border: 1px solid ${token.colorPrimary};
      border-radius: ${token.borderRadiusSM}px;
      box-shadow: none;
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 16px;

      background: ${token.colorPrimary};
      border: 1px solid ${token.colorPrimary};
      border-radius: ${token.borderRadiusSM}px;
      box-shadow: none;
    }

    &:hover::-webkit-slider-thumb,
    &:active::-webkit-slider-thumb {
      background: ${token.colorPrimaryHover};
      border-color: ${token.colorPrimaryHover};
    }
  }
`;
