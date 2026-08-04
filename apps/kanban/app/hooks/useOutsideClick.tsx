import { useEffect, useRef } from 'react';

/**
 * Closes a menu/popover when the user clicks outside it or presses Escape.
 * The original component had three near-identical dropdown menus, none of
 * which closed on outside click — extracting this once means every menu
 * gets correct behavior for free, and fixing a bug here fixes it
 * everywhere (DRY).
 */
export function useOutsideClick<T extends HTMLElement>(
  onClose: () => void,
  isActive: boolean,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onClose]);

  return ref;
}
