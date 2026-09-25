import { Theme, css } from 'antd-style';

export default (token: Theme) => css`
  .gradio-dropdown {
    .wrap,
    input {
      cursor: pointer;
    }

    .container .wrap {
      .wrap-inner input {
        font-size: var(--text-sm);
        line-height: 0;
      }
    }
  }

  .dropdown-arrow {
    margin: 0 !important;
  }

  ul.options {
    display: block !important;

    margin: 0 !important;
    padding: 4px !important;

    background: ${token.colorBgElevated} !important;
    border: 1px solid ${token.colorBorder} !important;
    border-radius: ${token.borderRadius}px !important;
    box-shadow: ${token.boxShadow};

    li {
      overflow: hidden;
      display: block !important;

      padding: 4px 8px !important;

      line-height: 1 !important;
      text-overflow: ellipsis;
      white-space: nowrap;

      border-radius: ${token.borderRadiusSM}px !important;

      &.selected {
        color: ${token.colorText} !important;
        background: ${token.colorFill} !important;
      }

      &.active:not(.selected) {
        color: black !important;
        background: ${token.yellow} !important;
      }

      &:hover {
        color: ${token.colorText} !important;
        background: ${token.colorFillSecondary} !important;
      }
    }
  }

  /* The refresh button next to "VAE / Text Encoder" in newer Forge Classic
     builds: keep it one control tall. (This fix used to sit inside the
     ul.options li block, where it could never match.) */
  #vae_text_encoder_button {
    height: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
    margin: 4px 0 !important;
    padding: 0 8px !important;

    svg {
      width: 16px !important;
      height: 16px !important;
    }
  }
`;
