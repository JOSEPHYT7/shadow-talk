import React, { useEffect, useRef, useState } from 'react';
import { Mic, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import './VoiceVerification.css';

/**
 * Normalize speech transcript
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
 * Minimal Voice Verification Component
 * Speaks "Hey Creator" on open, displays glowing mic visualizer and sound waves,
 * and shows strictly "Listening..." -> "Passed ✓" or "Failed".
 */
export function HiddenVoiceActivator({
  active,
  sessionId,
  sessionToken,
  serverUrl,
  onVoiceSuccess,
  onVoiceFailure
}) {
  const [status, setStatus] = useState('listening'); // 'listening' | 'verifying' | 'passed' | 'failed'
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const isTerminatedRef = useRef(false);
  const candidateSentRef = useRef(false);

  // Synthesize and speak "Hey Creator"
  const speakSystemPrompt = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Hey Creator');
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // Dispatch candidate transcript to backend
  const verifyPhraseWithBackend = async (textToSend) => {
    if (candidateSentRef.current || isTerminatedRef.current) return;

    setStatus('verifying');

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
        candidateSentRef.current = true;
        setStatus('passed');

        setTimeout(() => {
          if (!isTerminatedRef.current && typeof onVoiceSuccess === 'function') {
            onVoiceSuccess(data.sessionToken);
          }
        }, 850);
      } else {
        // Keep listening without failing permanently
        setStatus('listening');
      }
    } catch {
      setStatus('listening');
    }
  };

  useEffect(() => {
    if (!active || !sessionId || !sessionToken) return;

    isTerminatedRef.current = false;
    candidateSentRef.current = false;
    setStatus('listening');

    // 1. Speak system prompt audio
    speakSystemPrompt();

    // 2. Start speech recognition pipeline
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    async function initSpeech() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch {}

      if (!SpeechRecognition) {
        // Fallback for browsers without Web Speech API
        verifyPhraseWithBackend('voice_skip_fallback');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          if (isTerminatedRef.current || candidateSentRef.current) return;

          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }

          const normalized = normalizeTranscript(fullTranscript);

          // As soon as the secret phrase or "back buddy" is detected
          if (
            normalized.includes('back buddy') ||
            normalized.includes('back money') ||
            normalized.includes('im back buddy')
          ) {
            verifyPhraseWithBackend(normalized);
          }
        };

        recognition.onerror = (err) => {
          // Ignore non-fatal pause errors like 'no-speech'
          if (err && (err.error === 'no-speech' || err.error === 'audio-capture')) {
            return;
          }
          if (err && (err.error === 'not-allowed' || err.error === 'service-not-allowed')) {
            // If mic is blocked, gracefully fall back
            verifyPhraseWithBackend('voice_skip_fallback');
          }
        };

        recognition.onend = () => {
          if (!isTerminatedRef.current && !candidateSentRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        verifyPhraseWithBackend('voice_skip_fallback');
      }
    }

    initSpeech();

    // Escape key listener to cancel
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isTerminatedRef.current = true;
      window.removeEventListener('keydown', handleKeyDown);

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
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [active, sessionId, sessionToken, serverUrl]);

  return (
    <div className="voice-verify-overlay" onClick={onVoiceFailure}>
      <div className="voice-minimal-card" onClick={(e) => e.stopPropagation()}>
        {/* Central Pulsing Microphone */}
        <div className="voice-visualizer-center">
          <div className="pulse-ring-outer" />
          <div className="pulse-ring-inner" />
          <div
            className={`mic-circle-core ${status}`}
            onClick={speakSystemPrompt}
            title="Click to replay 'Hey Creator'"
          >
            <Mic size={34} />
          </div>
        </div>

        {/* Sound Equalizer Waves */}
        <div className="sound-bars-row">
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
        </div>

        {/* Status Pill: passed or not */}
        <div className={`voice-minimal-status ${status}`}>
          {status === 'verifying' && <Loader2 size={13} className="spin-loader" />}
          {status === 'passed' && <CheckCircle size={14} />}
          {status === 'failed' && <XCircle size={14} />}

          <span>
            {status === 'passed'
              ? 'Passed ✓'
              : status === 'verifying'
              ? 'Verifying...'
              : status === 'failed'
              ? 'Failed ✗'
              : 'Listening...'}
          </span>
        </div>
      </div>
    </div>
  );
}
