import React from 'react';
import { Box } from '@chakra-ui/react';
import { BACKGROUND_COLOR, BOX_BG_COLOR, BORDER_COLOR, BORDER_RADIUS } from '../constants';

function AsciiBox({ children, bg = BOX_BG_COLOR, cornerBg = BACKGROUND_COLOR, borderColor = BORDER_COLOR, borderRadius = BORDER_RADIUS, ...props }) {
  const useRounded = borderRadius != null && borderRadius !== 0 && borderRadius !== '0';
  return (
    <Box
      position="relative"
      bg={bg}
      fontFamily="mono"
      fontSize="sm"
      lineHeight="1.2"
      border={useRounded ? '1px dashed' : undefined}
      borderColor={useRounded ? borderColor : undefined}
      sx={useRounded ? { borderRadius: `${borderRadius} !important` } : undefined}
      {...props}
    >
      {!useRounded && (
        <>
          <Box position="absolute" top="0" left="2px" right="2px" h="1px" borderTop="1px dashed" borderColor={borderColor} pointerEvents="none" />
          <Box position="absolute" top="2px" right="0" bottom="2px" w="1px" borderRight="1px dashed" borderColor={borderColor} pointerEvents="none" />
          <Box position="absolute" bottom="0" left="2px" right="2px" h="1px" borderBottom="1px dashed" borderColor={borderColor} pointerEvents="none" />
          <Box position="absolute" top="2px" left="0" bottom="2px" w="1px" borderLeft="1px dashed" borderColor={borderColor} pointerEvents="none" />
        </>
      )}
      {children}
    </Box>
  );
}

export default AsciiBox;

