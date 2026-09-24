import React, { useRef, useEffect } from 'react';

/**
 * Secret Gesture Detector
 * Monitors the terminal SVG icon for the exact sequence:
 *   2 clicks -> wait ~3s -> 1 click -> wait ~3s -> 3 clicks
 * 
 * Works seamlessly on desktop mouse clicks and mobile touch/tap events.
 * Violations or timeouts reset silently without any console or UI disclosure.
 */
export function useSecretGesture({ onGestureSuccess, disabled = false }) {
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
    if (disabled) return;

    // Prevent duplicate synthetic events on touch devices
    const now = Date.now();
    if (now - stateRef.current.lastClickTime < 60) {
      return;
    }

    const state = stateRef.current;
    const delta = now - state.lastClickTime;

    // Tolerance configuration:
    // Intra-burst clicks: <= 900ms
    // Inter-phase wait window: ~3s (2000ms - 4200ms)
    const MAX_BURST_INTERVAL = 900;
    const MIN_WAIT_INTERVAL = 2000;
    const MAX_WAIT_INTERVAL = 4200;

    switch (state.phase) {
      case 'IDLE': {
        // First click of Phase 1 (Burst of 2)
        state.phase = 'BURST_1';
        state.burst1Count = 1;
        state.lastClickTime = now;

        // Auto-reset if second click doesn't arrive in time
        if (state.waitTimer) clearTimeout(state.waitTimer);
        state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
        break;
      }

      case 'BURST_1': {
        // Must be within MAX_BURST_INTERVAL
        if (delta > MAX_BURST_INTERVAL) {
          // Took too long, treat this click as a new first click
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
          // Set maximum timeout for the wait window
          state.waitTimer = setTimeout(resetSilently, MAX_WAIT_INTERVAL);
        } else {
          // More than 2 clicks in burst 1 -> violation
          resetSilently();
        }
        break;
      }

      case 'WAIT_1': {
        // A single click is expected after waiting ~3s
        if (delta < MIN_WAIT_INTERVAL) {
          // Clicked too early (didn't wait ~3s) -> silent reset
          resetSilently();
          return;
        }

        if (delta > MAX_WAIT_INTERVAL) {
          // Clicked too late -> silent reset
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
          // Clicked too early -> silent reset
          resetSilently();
          return;
        }

        if (delta > MAX_WAIT_INTERVAL) {
          // Clicked too late -> silent reset
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
          // Too slow between final burst clicks
          resetSilently();
          return;
        }

        state.burst2Count += 1;
        state.lastClickTime = now;

        if (state.burst2Count === 2) {
          // Expect 3rd click within 900ms
          if (state.waitTimer) clearTimeout(state.waitTimer);
          state.waitTimer = setTimeout(resetSilently, MAX_BURST_INTERVAL);
        } else if (state.burst2Count === 3) {
          // ALL 3 CLICKS OF FINAL BURST COMPLETE! SEQUENCE SUCCESS!
          resetSilently();
          if (typeof onGestureSuccess === 'function') {
            onGestureSuccess();
          }
        } else {
          // Extra click beyond 3
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
