import { createStyles } from 'antd-style';

export const useStyles = createStyles(
  ({ css }, { headerHeight = 64, width }: { headerHeight?: number; width: number }) => ({
    container: css`
      height: calc(100vh - ${headerHeight}px);

      ul.options {
        > li {
          max-width: ${width - 48}px;
        }
      }

      #quicksettings {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;

        width: 100%;

        > * {
          flex: 1;

          width: 100% !important;
          min-width: unset !important;
          max-width: unset !important;
          margin: 0;
          padding: 0;
        }

        .head > label {
          min-width: unset;
          max-width: 60%;
          margin-right: 12px;
        }

        input[type='color'] {
          width: 100%;
        }

        input[type='number'],
        textarea {
          resize: none;
          box-sizing: border-box;
          height: 28px !important;
          padding: 4px !important;
        }

        textarea {
          width: 100%;
        }

        /* Labels truncate. Not the dropdown's arrow holder: in Gradio 4 it is a
           span too (.icon-wrap), and at width: 100% its arrow grew to the full
           sidebar width (the giant triangle under "VAE / Text Encoder"). */
        span:not(.icon-wrap) {
          overflow: hidden;
          width: 100%;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .icon-wrap {
          flex: none;
          width: 20px;
          /* Forge's style.css paints it --background-fill-secondary with a
             negative margin, which shows as a dark box on this theme's inputs */
          margin-right: 0 !important;
          background: transparent !important;
        }

        .dropdown-arrow {
          width: 18px;
          min-width: 16px;
          height: 18px;
          min-height: 16px;
        }

        /* Gradio 4 multiselect (Forge / Classic "VAE / Text Encoder"): keep it
           one field tall, chips wrap inside it. */
        .gradio-dropdown.multiselect {
          .wrap-inner {
            box-sizing: border-box;
            flex-wrap: wrap;
            min-width: 0;
            max-width: 100%;
            min-height: 36px;
            height: auto !important;
            padding-block: 4px;
          }

          .token {
            overflow: hidden;
            max-width: 100%;

            > span {
              width: auto;
            }
          }

          .secondary-wrap {
            flex: 1 1 60px;
            min-width: 0;
          }
        }

        /* Forge's "UI" preset radio: wrap into a tidy grid */
        fieldset .wrap:has(> label > input[type='radio']) {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 6px;

          > label {
            justify-content: center;
            margin: 0;
          }
        }

        div.gradio-dropdown {
          min-width: unset !important;
        }
      }
    `,
  }),
);
