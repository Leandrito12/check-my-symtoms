/**
 * Fuente de verdad para tamaño de pantalla. Reactivo a resize en navegador (useWindowDimensions).
 * Plan: arquitectura universal responsive.
 */

import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const MOBILE_MAX = 767;
const TABLET_MAX = 1024;

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width <= MOBILE_MAX ? 'mobile' : width <= TABLET_MAX ? 'tablet' : 'desktop';

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
    height,
  };
}
