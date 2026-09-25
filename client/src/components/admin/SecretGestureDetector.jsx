import { useRef } from 'react';

/**
 * Secret Gesture Detector
 * Monitors the terminal SVG icon for the exact sequence:
 *   2 clicks -> wait ~3s -> 1 click -> wait ~3s -> 3 clicks
 * 
 * Implemented using a resilient sliding-window timestamp buffer:
 * - Natural human tolerance:
 *     - Intra-burst double/triple clicks: <= 2000ms
 *     - Inter-phase wait (~3 seconds): 900ms to 8500ms
 * - Rolling window design: accidental clicks or hesitation do not break the sequence.
 * - Works reliably on desktop mouse, trackpad, pen, and mobile touch.
 */
export function useSecretGesture({ onGestureSuccess, onAdminReopen, hasAdminSession = false, disabled = false }) {
  const timestampsRef = useRef([]);

  const handleIconInteraction = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (disabled) return;

    const now = Date.now();

    // Append timestamp to rolling window buffer (keep up to last 12 interactions)
    timestampsRef.current.push(now);
    if (timestampsRef.current.length > 12) {
      timestampsRef.current.shift();
    }

    const count = timestampsRef.current.length;
    console.log(`[ShadowTalk Admin Gesture] Click registered (#${count}). Total in window: ${count}`);

    // Evaluate the last 6 timestamps
    if (timestampsRef.current.length >= 6) {
      const len = timestampsRef.current.length;
      const [c0, c1, c2, c3, c4, c5] = timestampsRef.current.slice(len - 6);

      const gap0 = c1 - c0;       // click 1 to 2 (burst of 2)
      const pause1 = c2 - c1;     // wait ~3s before single click
      const pause2 = c3 - c2;     // wait ~3s before final burst
      const gap1 = c4 - c3;       // click 1 to 2 (burst of 3)
      const gap2 = c5 - c4;       // click 2 to 3 (burst of 3)

      console.log(`[ShadowTalk Admin Gesture] Timing check:
  - Burst 1 gap (<=2000ms): ${gap0}ms
  - Pause 1 (900ms-8500ms): ${pause1}ms
  - Pause 2 (900ms-8500ms): ${pause2}ms
  - Burst 2 gap 1 (<=2000ms): ${gap1}ms
  - Burst 2 gap 2 (<=2000ms): ${gap2}ms`);

      // Validate sequence matching human cadence:
      // Burst clicks: quick taps up to 2000ms apart
      // Pauses: ~3 seconds (generous 900ms - 8500ms tolerance)
      const isMatch =
        gap0 <= 2000 &&
        pause1 >= 900 && pause1 <= 8500 &&
        pause2 >= 900 && pause2 <= 8500 &&
        gap1 <= 2000 &&
        gap2 <= 2000;

      if (isMatch) {
        console.log('[ShadowTalk Admin Gesture] MATCH SUCCESSFUL! Activating voice verification flow...');
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
