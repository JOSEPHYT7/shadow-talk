import React, { useEffect, useRef, useState } from 'react';

/**
 * Standardize speech transcript for matching
 */
function normalizeTranscript(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[’`´']/g, '')
    .replace(/\bi am\b/g, 'im')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hidden Voice Activator & Speech Recognition Layer
 * Requests microphone ONLY after secret gesture initiation.
 * Listens internally for "Hey Creator", then captures speech for backend verification.
 * Contains ZERO secrets or target phrases in client source code.
 */
export function HiddenVoiceActivator({
  active,
  sessionId,
  sessionToken,
  serverUrl,
  onVoiceSuccess,
  onVoiceFailure
}) {
  const [activationHeard, setActivationHeard] = useState(false);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const candidateDebounceRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let isTerminated = false;

    // Cleanup resources safely
    function cleanup() {
      isTerminated = true;
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      if (candidateDebounceRef.current) {
        clearTimeout(candidateDebounceRef.current);
        candidateDebounceRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(t => t.stop());
        } catch {}
        streamRef.current = null;
      }
      setActivationHeard(false);
    }

    if (!active || !sessionId || !sessionToken) {
      cleanup();
      return;
    }

    async function startVoicePipeline() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // Global safety timeout: 60 seconds total for voice verification
      timeoutTimerRef.current = setTimeout(() => {
        cleanup();
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
      }, 60000);

      // If browser completely lacks SpeechRecognition API, notify backend with supported fallback
      if (!SpeechRecognition) {
        try {
          const res = await fetch(`${serverUrl}/api/admin/auth/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sessionId,
              sessionToken,
              phrase: 'voice_skip_fallback'
            })
          });
          const data = await res.json();
          cleanup();
          if (data && data.success && typeof onVoiceSuccess === 'function') {
            onVoiceSuccess(data.sessionToken);
          } else if (typeof onVoiceFailure === 'function') {
            onVoiceFailure();
          }
        } catch {
          cleanup();
          if (typeof onVoiceFailure === 'function') onVoiceFailure();
        }
        return;
      }

      // Request microphone permission only now
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (micErr) {
        // Microphone access denied or unavailable in this environment
        try {
          const res = await fetch(`${serverUrl}/api/admin/auth/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sessionId,
              sessionToken,
              phrase: 'voice_skip_fallback'
            })
          });
          const data = await res.json();
          cleanup();
          if (data && data.success && typeof onVoiceSuccess === 'function') {
            onVoiceSuccess(data.sessionToken);
          } else if (typeof onVoiceFailure === 'function') {
            onVoiceFailure();
          }
        } catch {
          cleanup();
          if (typeof onVoiceFailure === 'function') onVoiceFailure();
        }
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        let hasDetectedActivation = false;
        let candidatePhraseSent = false;

        const dispatchToBackend = async (textToSend) => {
          if (candidatePhraseSent || isTerminated) return;
          candidatePhraseSent = true;
          cleanup();

          try {
            const res = await fetch(`${serverUrl}/api/admin/auth/voice`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                sessionId,
                sessionToken,
                phrase: textToSend
              })
            });

            const data = await res.json();
            if (data && data.success) {
              if (typeof onVoiceSuccess === 'function') {
                onVoiceSuccess(data.sessionToken);
              }
            } else {
              if (typeof onVoiceFailure === 'function') {
                onVoiceFailure();
              }
            }
          } catch {
            if (typeof onVoiceFailure === 'function') {
              onVoiceFailure();
            }
          }
        };

        recognition.onresult = (event) => {
          if (isTerminated || candidatePhraseSent) return;

          // Build full transcript across all recognized results
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }

          const normalized = normalizeTranscript(fullTranscript);

          // Phase 1: Check for activation trigger "hey creator"
          if (!hasDetectedActivation) {
            if (normalized.includes('hey creator')) {
              hasDetectedActivation = true;
              setActivationHeard(true);
            }
          }

          // Phase 2: If activation is detected, inspect candidate text following "hey creator"
          if (hasDetectedActivation && !candidatePhraseSent) {
            let candidateText = normalized;
            const triggerIdx = normalized.indexOf('hey creator');
            if (triggerIdx >= 0) {
              candidateText = normalized.slice(triggerIdx + 'hey creator'.length).trim();
            }

            if (candidateText.length >= 3) {
              if (candidateDebounceRef.current) {
                clearTimeout(candidateDebounceRef.current);
              }

              // Check if any recent result is final
              let isAnyFinal = false;
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) isAnyFinal = true;
              }

              if (isAnyFinal && candidateText.length >= 6) {
                dispatchToBackend(candidateText);
              } else {
                candidateDebounceRef.current = setTimeout(() => {
                  dispatchToBackend(candidateText);
                }, 1300);
              }
            }
          }
        };

        recognition.onerror = (err) => {
          // Ignore non-fatal pause errors like no-speech
          if (err && (err.error === 'no-speech' || err.error === 'audio-capture')) {
            return;
          }
          if (err && (err.error === 'not-allowed' || err.error === 'service-not-allowed')) {
            cleanup();
            if (typeof onVoiceFailure === 'function') onVoiceFailure();
          }
        };

        recognition.onend = () => {
          if (!isTerminated && activeRef.current && !candidatePhraseSent) {
            try {
              recognition.start();
            } catch {
              // Ignore restart collision
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        cleanup();
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
      }
    }

    startVoicePipeline();

    return cleanup;
  }, [active, sessionId, sessionToken, serverUrl]);

  return null;
}
