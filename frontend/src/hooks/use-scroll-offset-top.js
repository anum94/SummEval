import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useRef, useMemo, useState, useCallback } from 'react';

/*
 * 1: Applies to top <header/>
 * const { offsetTop } = useScrollOffSetTop(80);
 *
 * Or
 *
 * 2: Applies to element
 * const { offsetTop, elementRef } = useScrollOffSetTop(80);
 * <div ref={elementRef} />
 *
 */


// useScrollOffSetTop hook returns an object with the following properties: offsetTop, elementRef. Used to determine if the user has scrolled past a certain point on the page.
export function useScrollOffSetTop(top = 0) {
  const elementRef = useRef(null);

  const { scrollY } = useScroll();

  const [offsetTop, setOffsetTop] = useState(false);

  const handleScrollChange = useCallback(
    (val) => {
      const scrollHeight = Math.round(val);

      if (elementRef?.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const elementTop = Math.round(rect.top);

        setOffsetTop(elementTop < top);
      } else {
        setOffsetTop(scrollHeight > top);
      }
    },
    [elementRef, top]
  );

  useMotionValueEvent(
    scrollY,
    'change',
    useMemo(() => handleScrollChange, [handleScrollChange])
  );

  const memoizedValue = useMemo(() => ({ elementRef, offsetTop }), [offsetTop]);

  return memoizedValue;
}