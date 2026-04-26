import { useEffect, useRef, useState } from 'react';

export type CountDirection = 'up' | 'down' | 'both';

/**
 * Animates a number from its previous value to `target` whenever `target`
 * changes
 * `direction` controls which transitions animate
 */
export function useCountUp(
  target: number,
  duration = 1000,
  direction: CountDirection = 'both',
): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    if (displayRef.current === target) return;

    const isIncrease = target > displayRef.current;
    const isDecrease = target < displayRef.current;
    const shouldAnimate =
      direction === 'both' ||
      (direction === 'up' && isIncrease) ||
      (direction === 'down' && isDecrease);

    if (!shouldAnimate) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const from = displayRef.current;
    const startedAt = Date.now();
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, direction]);

  return display;
}
