import { useEffect, useRef, useState } from 'react';
import { Mic, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import './VoiceVerification.css';

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
 * Minimal Voice Verification Modal
 * Speaks "Hey Creator", stays open on screen, listens for "I'm back buddy",
 * and displays strictly "Listening..." -> "Passed ✓" or "Failed ✗".
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
  const mountTimeRef = useRef(Date.now());

  // Synthesize and speak "Hey Creator" clearly
  const speakSystemPrompt = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utterance = new SpeechSynthesisUtterance('Hey Creator');
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const enVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Google') || v.name.includes('Natural') || v.default)
          );
          if (enVoice) {
            utterance.voice = enVoice;
          }
        }

        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // Dispatch candidate transcript to backend
  const verifyPhraseWithBackend = async (textToSend) => {
    if (candidateSentRef.current || isTerminatedRef.current || !textToSend) return;

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
        }, 1100);
      } else {
        // If not matched, resume listening
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
    mountTimeRef.current = Date.now();
    setStatus('listening');

    // 1. Speak system prompt audio with short delay to ensure browser audio pipeline is ready
    const speechTimer = setTimeout(() => {
      speakSystemPrompt();
    }, 180);

    // Also retry speech when voices are loaded if empty initially
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        if (!candidateSentRef.current && !isTerminatedRef.current) {
          speakSystemPrompt();
        }
      };
    }

    // 2. Start speech recognition pipeline
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    async function initSpeech() {
      // Request mic permission
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch {}

      if (!SpeechRecognition) return;

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

          // As soon as the user speaks "I'm back buddy" or "back buddy"
          if (
            normalized.includes('back buddy') ||
            normalized.includes('back money') ||
            normalized.includes('im back buddy') ||
            normalized.includes('back body')
          ) {
            verifyPhraseWithBackend(normalized);
          }
        };

        recognition.onerror = () => {
          // Stay in listening state on non-fatal errors
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
      } catch {}
    }

    initSpeech();

    // Escape key listener to close/cancel
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onVoiceFailure === 'function') onVoiceFailure();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isTerminatedRef.current = true;
      clearTimeout(speechTimer);
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
    };
  }, [active, sessionId, sessionToken, serverUrl]);

  // Click on mic to replay system voice prompt
  const handleMicClick = (e) => {
    e.stopPropagation();
    speakSystemPrompt();
  };

  // Clicking the status pill allows manual trigger of verification if user spoke already
  const handleStatusClick = (e) => {
    e.stopPropagation();
    verifyPhraseWithBackend("I'm back buddy");
  };

  // Safe backdrop click handler: prevents accidental dismiss during initial 1.5 seconds
  const handleOverlayClick = (e) => {
    if (Date.now() - mountTimeRef.current < 1500) {
      return;
    }
    if (e.target === e.currentTarget && typeof onVoiceFailure === 'function') {
      onVoiceFailure();
    }
  };

  return (
    <div className="voice-verify-overlay" onClick={handleOverlayClick}>
      <div className="voice-minimal-card" onClick={(e) => e.stopPropagation()}>
        {/* Central Pulsing Glowing Microphone */}
        <div className="voice-visualizer-center">
          <div className="pulse-ring-outer" />
          <div className="pulse-ring-inner" />
          <div
            className={`mic-circle-core ${status}`}
            onClick={handleMicClick}
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

        {/* Minimal Status: Passed or Not */}
        <div
          className={`voice-minimal-status ${status}`}
          onClick={handleStatusClick}
          title={status === 'listening' ? "Speak 'I'm back buddy' (or tap to pass)" : ''}
          style={{ cursor: status === 'listening' ? 'pointer' : 'default' }}
        >
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
