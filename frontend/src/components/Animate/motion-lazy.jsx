import { domMax, LazyMotion } from 'framer-motion';

// Motion Lazy to enable SSR: https://www.framer.com/motion/lazy-motion/
export function MotionLazy({ children }) {
  return (
    <LazyMotion strict features={domMax}>
      {children}
    </LazyMotion>
  );
}