import { useCallback, useRef, useState } from 'react';

/**
 * Drag-down-to-dismiss for a bottom sheet.
 *
 * Pulling the grab area moves the sheet with the finger; past a third of its
 * height (or 90px, whichever is larger) it closes, otherwise it springs back.
 * Pointer events cover the mouse so the behaviour can be tested and used on a
 * desktop touchpad; touch events are handled separately because a pointer
 * event for touch would fire twice.
 */
export function useSheetDrag(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const start = useCallback((y: number) => {
    startY.current = y;
    setDragY(0);
  }, []);

  const move = useCallback((y: number) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, y - startY.current));
  }, []);

  const end = useCallback(() => {
    if (startY.current === null) return;
    const height = sheetRef.current?.clientHeight ?? 0;
    const shouldClose = dragY > Math.max(90, height * 0.3);
    startY.current = null;
    setDragY(0);
    if (shouldClose) onClose();
  }, [dragY, onClose]);

  /** Spread onto the grab area. */
  const handleProps = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': 'Close',
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    },
    onTouchStart: (e: React.TouchEvent) => start(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => move(e.touches[0].clientY),
    onTouchEnd: end,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      start(e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => e.pointerType !== 'touch' && move(e.clientY),
    onPointerUp: (e: React.PointerEvent) => e.pointerType !== 'touch' && end(),
  };

  /** Spread onto the sheet itself. */
  const sheetStyle: React.CSSProperties = dragY
    ? { transform: `translateY(${dragY}px)`, transition: 'none' }
    : { transition: 'transform 180ms ease-out' };

  return { sheetRef, sheetStyle, handleProps, dragY };
}
