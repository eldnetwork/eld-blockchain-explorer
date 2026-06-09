import { extendTheme } from '@chakra-ui/react';

// eld_swap
export const NAV_BAR_COLOR = '#E7B494';

export const BACKGROUND_COLOR = '#A5ACB4';

export const BOX_BG_COLOR = 'white';

export const DARK_BOX_BG_COLOR = '#505C66';

export const LIGHT_TEXT_COLOR = 'white';

export const DARK_TEXT_COLOR = 'black';

export const BORDER_COLOR = 'gray.800';

const BORDER_RADIUS = '6px';

const theme = extendTheme({
  fonts: {
    body: "'IoskeleyMono', monospace",
    heading: "'IoskeleyMono', monospace",
    mono: "'IoskeleyMono', monospace",
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: BORDER_RADIUS,
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    Box: {
      baseStyle: {
        borderRadius: BORDER_RADIUS,
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: BORDER_RADIUS,
      },
    },
    ListItem: {
      baseStyle: {
        borderRadius: BORDER_RADIUS,
      },
    },
    Skeleton: {
      defaultProps: {
        startColor: 'var(--lh-ghost-primary, #1f242b)',
        endColor: 'var(--lh-ghost-secondary, #13171c)',
      },
    },
  },
  styles: {
    global: {
      '*': {
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'IoskeleyMono', monospace",
        borderRadius: `${BORDER_RADIUS} !important`,
      },
      body: {
        fontFamily: "'IoskeleyMono', monospace",
        bg: '#070707',
        color: '#f3f3f0',
      },
      'html, #root': {
        background: '#070707',
        color: '#f3f3f0',
        minHeight: '100%',
      },
      '.chakra-modal__content, .chakra-popover__content, .chakra-menu__menu-list, .chakra-menu__menuitem, .chakra-tooltip': {
        background: '#111111 !important',
        color: '#f3f3f0 !important',
        borderColor: 'rgba(255, 255, 255, 0.12) !important',
      },
      '.chakra-modal__overlay': {
        background: 'rgba(0, 0, 0, 0.72) !important',
      },
    },
  },
});

export default theme;

