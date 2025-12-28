declare module 'framer-motion/native' {
  import type { ComponentType } from 'react';

  type MotionComponent<T> = ComponentType<T & { layout?: boolean; transition?: any }>;

  export function motion<T>(Component: ComponentType<T>): MotionComponent<T>;

  export const AnimatePresence: ComponentType<{
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
  }>;
}

