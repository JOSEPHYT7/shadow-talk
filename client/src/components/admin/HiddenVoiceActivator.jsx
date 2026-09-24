import React, { useEffect, useRef, useState } from 'react';

/**
 * Normalize speech transcript for client-side comparison
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

    // Cleanup resources
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

    // Start speech recognition session
    async function startVoicePipeline() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // Global safety timeout: 45 seconds total for voice verification
      timeoutTimerRef.current = setTimeout(() => {
        cleanup();
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
      }, 45000);

      // Request microphone permission only now
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (micErr) {
        // Silently terminate on mic denial
        cleanup();
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
        return;
      }

      if (!SpeechRecognition) {
        // Speech recognition API not supported in this specific browser
        cleanup();
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
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

        recognition.onresult = async (event) => {
          if (isTerminated || candidatePhraseSent) return;

          let fullTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }

          const normalized = normalizeTranscript(fullTranscript);

          // Phase 1: Listen internally for activation phrase "hey creator"
          if (!hasDetectedActivation) {
            if (normalized.includes('hey creator')) {
              hasDetectedActivation = true;
              setActivationHeard(true);
            }
            return;
          }

          // Phase 2: Activation detected! Extract spoken speech following "hey creator"
          if (hasDetectedActivation && !candidatePhraseSent) {
            let candidateText = normalized;
            const triggerIdx = normalized.indexOf('hey creator');
            if (triggerIdx >= 0) {
              candidateText = normalized.slice(triggerIdx + 'hey creator'.length).trim();
            }

            if (candidateText.length >= 3) {
              // Clear previous debounce timer
              if (candidateDebounceRef.current) {
                clearTimeout(candidateDebounceRef.current);
              }

              // Check if any result is marked final
              let isAnyFinal = false;
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) isAnyFinal = true;
              }

              const dispatchToBackend = async (textToSend) => {
                if (candidatePhraseSent || isTerminated) return;
                candidatePhraseSent = true;
                cleanup();

                try {
                  const res = await fetch(`${serverUrl}/api/admin/auth/voice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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

              // If marked final or after natural pause (1400ms debounce), dispatch candidate
              if (isAnyFinal && candidateText.length >= 8) {
                dispatchToBackend(candidateText);
              } else {
                candidateDebounceRef.current = setTimeout(() => {
                  dispatchToBackend(candidateText);
                }, 1400);
              }
            }
          }
        };

        recognition.onerror = () => {
          if (!hasDetectedActivation) {
            cleanup();
            if (typeof onVoiceFailure === 'function') onVoiceFailure();
          }
        };

        recognition.onend = () => {
          if (!isTerminated && activeRef.current && !candidatePhraseSent) {
            // Restart if ended before candidate was captured
            try {
              recognition.start();
            } catch {
              cleanup();
              if (typeof onVoiceFailure === 'function') onVoiceFailure();
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

  // Render absolutely nothing to the visible DOM (completely hidden)
  return null;
}
