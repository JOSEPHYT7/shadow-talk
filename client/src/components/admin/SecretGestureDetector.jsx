import { useRef } from 'react';

/**
 * Secret Gesture Detector
 * Monitors the terminal SVG icon for the exact sequence:
 *   2 clicks -> wait ~3s -> 1 click -> wait ~3s -> 3 clicks
 * 
 * Implemented using a resilient sliding-window timestamp buffer:
 * - Natural human tolerance:
 *     - Intra-burst double/triple clicks: <= 1800ms
 *     - Inter-phase wait (~3 seconds): 1200ms to 7500ms
 * - Rolling window design: accidental clicks or hesitation do not permanently break the sequence.
 * - Deduplicates rapid synthetic events (< 60ms) across pointerdown and click.
 * - Works identically across desktop mouse, trackpad, pen, and mobile touch.
 */
export function useSecretGesture({ onGestureSuccess, onAdminReopen, hasAdminSession = false, disabled = false }) {
  const timestampsRef = useRef([]);
  const lastEventTimeRef = useRef(0);

  const handleIconInteraction = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (disabled) return;

    // If administrator is already authenticated, clicking immediately reopens the console
    if (hasAdminSession && typeof onAdminReopen === 'function') {
      onAdminReopen();
      return;
    }

    const now = Date.now();

    // 1. Deduplicate rapid synthetic events (e.g. pointerdown followed by click within 60ms)
    if (now - lastEventTimeRef.current < 60) {
      return;
    }
    lastEventTimeRef.current = now;

    // 2. Append timestamp to rolling window buffer (keep up to last 12 interactions)
    timestampsRef.current.push(now);
    if (timestampsRef.current.length > 12) {
      timestampsRef.current.shift();
    }

    // 3. Evaluate the last 6 timestamps
    if (timestampsRef.current.length >= 6) {
      const len = timestampsRef.current.length;
      const [c0, c1, c2, c3, c4, c5] = timestampsRef.current.slice(len - 6);

      const gap0 = c1 - c0;       // click 1 to 2 (burst of 2)
      const pause1 = c2 - c1;     // wait ~3s before single click
      const pause2 = c3 - c2;     // wait ~3s before final burst
      const gap1 = c4 - c3;       // click 1 to 2 (burst of 3)
      const gap2 = c5 - c4;       // click 2 to 3 (burst of 3)

      // Validate sequence matching human cadence:
      // Burst clicks: quick taps up to 1800ms apart
      // Pauses: ~3 seconds (generous 1200ms - 7500ms tolerance)
      const isMatch =
        gap0 <= 1800 &&
        pause1 >= 1200 && pause1 <= 7500 &&
        pause2 >= 1200 && pause2 <= 7500 &&
        gap1 <= 1800 &&
        gap2 <= 1800;

      if (isMatch) {
        timestampsRef.current = []; // Clear on success
        if (typeof onGestureSuccess === 'function') {
          onGestureSuccess();
        }
      }
    }
  };

  return {
    handleIconInteraction
  };
}
