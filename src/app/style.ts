import { createStyles } from 'antd-style';
import { adjustHue } from 'polished';

export const useStyles = createStyles(
  (
    { css, token, isDarkMode },
    { headerHeight, isPrimaryColor }: { headerHeight: number; isPrimaryColor: boolean },
  ) => ({
    // The glow behind the header. It used to be a 60vw band with an animated
    // gradient under filter: blur(100px): every animation frame, and every
    // repaint anywhere under it (each keystroke in the prompt), re-rasterised
    // a 100 px blur over ~1000x270 px. Measured in Chromium: the page
    // dropped to 18 fps while idle and typing took twice as long.
    //
    // Here the softness comes from radial gradients, which need no filter,
    // and the movement is a transform, which the compositor animates without
    // repainting. The container clips it: the band used to hang 20vw past
    // the right edge and gave every page a horizontal scrollbar.
    background: css`
      pointer-events: none;

      position: absolute !important;
      z-index: 0;
      inset-block-start: 0;
      inset-inline-end: 0;

      overflow: hidden;
      contain: strict;

      width: 100%;
      height: 640px;

      &::before {
        content: '';

        position: absolute;
        inset-block-start: -260px;
        inset-inline-end: -12vw;
        transform: rotate(4deg);

        width: 72vw;
        height: 620px;

        opacity: ${isDarkMode ? 0.22 : 0.14};
        background:
          radial-gradient(
            closest-side at 30% 50%,
            ${isPrimaryColor ? token.colorPrimary : token.gold},
            transparent
          ),
          radial-gradient(
            closest-side at 55% 45%,
            ${isPrimaryColor ? adjustHue(45, token.colorPrimary) : token.magenta},
            transparent
          ),
          radial-gradient(
            closest-side at 75% 55%,
            ${isPrimaryColor ? adjustHue(-45, token.colorPrimary) : token.geekblue},
            transparent
          ),
          radial-gradient(
            closest-side at 90% 40%,
            ${isPrimaryColor ? token.colorPrimary : token.cyan},
            transparent
          );

        will-change: transform;
        animation: lobe-glow-drift 10s ease-in-out infinite alternate;
      }

      @keyframes lobe-glow-drift {
        0% {
          transform: translate3d(0, 0, 0) rotate(4deg) scale(1);
        }

        50% {
          transform: translate3d(-6vw, 30px, 0) rotate(2deg) scale(1.08);
        }

        100% {
          transform: translate3d(-12vw, 0, 0) rotate(6deg) scale(1);
        }
      }

      @media (max-width: 768px) {
        &::before {
          inset-block-start: -240px;
          inset-inline-end: -40vw;
          width: 170vw;
          height: 440px;
          opacity: ${isDarkMode ? 0.14 : 0.08};
        }
      }

      @media (prefers-reduced-motion: reduce) {
        &::before {
          animation: none;
        }
      }
    `,
    backgroundLite: css`
      pointer-events: none;

      position: absolute !important;
      top: -400px;
      left: 0;

      overflow: hidden;

      width: 100%;
      height: 100%;

      opacity: ${isPrimaryColor ? (isDarkMode ? 0.2 : 0.05) : isDarkMode ? 0.15 : 0};
      background: radial-gradient(
        circle 600px at calc(100% - 300px) 300px,
        ${token.colorPrimary},
        transparent
      );
    `,
    panel: css`
      .draggable-panel {
        border-style: dashed;
      }
    `,
    quicksettings: css`
      #quicksettings {
        align-items: start;
        padding: 16px !important;
      }
    `,
    sidebar: css`
      height: calc(100vh - ${headerHeight}px);
    `,
  }),
);
