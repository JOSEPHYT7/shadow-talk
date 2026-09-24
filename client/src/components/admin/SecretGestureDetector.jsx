import React, { useRef, useEffect } from 'react';

/**
 * Secret Gesture Detector
 * Monitors the terminal SVG icon for the exact sequence:
 *   2 clicks -> wait ~3s -> 1 click -> wait ~3s -> 3 clicks
 * 
 * Works seamlessly on desktop mouse clicks, pen, and mobile touch/tap events.
 * Uses unified pointer events with robust debounce to prevent duplicate synthetic clicks.
 * Violations or timeouts reset silently without any console or UI disclosure.
 */
export function useSecretGesture({ onGestureSuccess, onAdminReopen, hasAdminSession = false, disabled = false }) {
  const stateRef = useRef({
    // State machine: 'IDLE' | 'BURST_1' | 'WAIT_1' | 'WAIT_2' | 'BURST_2'
    phase: 'IDLE',
    burst1Count: 0,
    burst2Count: 0,
    lastClickTime: 0,
    waitTimer: null
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (stateRef.current.waitTimer) {
        clearTimeout(stateRef.current.waitTimer);
      }
    };
  }, []);

  const resetSilently = () => {
    if (stateRef.current.waitTimer) {
      clearTimeout(stateRef.current.waitTimer);
    }
    stateRef.current = {
      phase: 'IDLE',
      burst1Count: 0,
      burst2Count: 0,
      lastClickTime: 0,
      waitTimer: null
    };
  };

  const handleIconInteraction = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (disabled) return;

    // If administrator is already authenticated, click immediately reopens the console
    if (hasAdminSession && typeof onAdminReopen === 'function') {
      onAdminReopen();
      return;
    }

    const now = Date.now();
    // Debounce duplicate events (e.g. touchstart followed by synthetic click) within 180ms
    if (now - stateRef.current.lastClickTime < 180) {
      return;
    }

    const state = stateRef.current;
    const delta = now - state.lastClickTime;

    // Generous, natural human tolerance windows:
    // Intra-burst clicks: <= 1400ms
    // Inter-phase wait window: ~3s (1200ms - 6500ms)
    const MAX_BURST_INTERVAL = 1400;
    const MIN_WAIT_INTERVAL = 1200;
    const MAX_WAIT_INTERVAL = 6500;

    switch (state.phase) {
      case 'IDLE': {
        // First click of Phase 1 (Burst of 2)
        state.phase = 'BURST_1';
        state.burst1Count = 1;
        state.lastClickTime = now;

        if (state.waitTimer) clearTimeout(state.waitTimer);
        state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
        break;
      }

      case 'BURST_1': {
        if (delta > MAX_BURST_INTERVAL) {
          // Took too long, treat as fresh first click
          state.burst1Count = 1;
          state.lastClickTime = now;
          if (state.waitTimer) clearTimeout(state.waitTimer);
          state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
          return;
        }

        state.burst1Count += 1;
        state.lastClickTime = now;

        if (state.burst1Count === 2) {
          // Phase 1 complete! Enter WAIT_1 (~3 seconds)
          state.phase = 'WAIT_1';
          if (state.waitTimer) clearTimeout(state.waitTimer);
          state.waitTimer = setTimeout(resetSilently, MAX_WAIT_INTERVAL);
        } else {
          resetSilently();
        }
        break;
      }

      case 'WAIT_1': {
        // Single click expected after waiting ~3s
        if (delta < MIN_WAIT_INTERVAL) {
          // Clicked too early (didn't wait ~3s)
          resetSilently();
          return;
        }

        if (delta > MAX_WAIT_INTERVAL) {
          // Clicked too late
          resetSilently();
          return;
        }

        // Single click accepted! Enter WAIT_2 (~3 seconds)
        state.phase = 'WAIT_2';
        state.lastClickTime = now;
        if (state.waitTimer) clearTimeout(state.waitTimer);
        state.waitTimer = setTimeout(resetSilently, MAX_WAIT_INTERVAL);
        break;
      }

      case 'WAIT_2': {
        // First click of final burst of 3 after waiting ~3s
        if (delta < MIN_WAIT_INTERVAL) {
          resetSilently();
          return;
        }

        if (delta > MAX_WAIT_INTERVAL) {
          resetSilently();
          return;
        }

        // First click of Burst 2 accepted!
        state.phase = 'BURST_2';
        state.burst2Count = 1;
        state.lastClickTime = now;
        if (state.waitTimer) clearTimeout(state.waitTimer);
        state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
        break;
      }

      case 'BURST_2': {
        if (delta > MAX_BURST_INTERVAL) {
          resetSilently();
          return;
        }

        state.burst2Count += 1;
        state.lastClickTime = now;

        if (state.burst2Count === 2) {
          // Expect 3rd click within interval
          if (state.waitTimer) clearTimeout(state.waitTimer);
          state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
        } else if (state.burst2Count === 3) {
          // ALL 3 CLICKS OF FINAL BURST COMPLETE! SEQUENCE SUCCESS!
          resetSilently();
          if (typeof onGestureSuccess === 'function') {
            onGestureSuccess();
          }
        } else {
          resetSilently();
        }
        break;
      }

      default:
        resetSilently();
        break;
    }
  };

  return {
    handleIconInteraction
  };
}
