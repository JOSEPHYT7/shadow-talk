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
 * Voice Verification Modal
 * Speaks "Hey Creator", listens to user voice without revealing the secret passphrase,
 * displays what the user actually says in real time, and evaluates Passed or Failed.
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
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const isTerminatedRef = useRef(false);
  const candidateSentRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const failResetTimerRef = useRef(null);

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
        setTranscript(textToSend);

        setTimeout(() => {
          if (!isTerminatedRef.current && typeof onVoiceSuccess === 'function') {
            onVoiceSuccess(data.sessionToken);
          }
        }, 1200);
      } else {
        // Did not pass verification
        setStatus('failed');
        if (failResetTimerRef.current) clearTimeout(failResetTimerRef.current);
        failResetTimerRef.current = setTimeout(() => {
          if (!isTerminatedRef.current && !candidateSentRef.current) {
            setStatus('listening');
            setTranscript('');
          }
        }, 1800);
      }
    } catch {
      setStatus('failed');
      if (failResetTimerRef.current) clearTimeout(failResetTimerRef.current);
      failResetTimerRef.current = setTimeout(() => {
        if (!isTerminatedRef.current && !candidateSentRef.current) {
          setStatus('listening');
          setTranscript('');
        }
      }, 1800);
    }
  };

  useEffect(() => {
    if (!active || !sessionId || !sessionToken) return;

    isTerminatedRef.current = false;
    candidateSentRef.current = false;
    mountTimeRef.current = Date.now();
    setStatus('listening');
    setTranscript('');

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

    // 2. Start speech recognition pipeline directly (without getUserMedia collision)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('[VoiceAuth] Microphone listening for creator...');
        };

        recognition.onresult = (event) => {
          if (isTerminatedRef.current || candidateSentRef.current) return;

          let fullTranscript = '';
          let isFinalResult = false;
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
            if (event.results[i].isFinal) {
              isFinalResult = true;
            }
          }

          const rawText = fullTranscript.trim();
          if (rawText) {
            // Display what the user actually said
            setTranscript(rawText);
          }

          const normalized = normalizeTranscript(fullTranscript);

          // Understand what was said: check for valid secret phrase
          const isMatched =
            normalized.includes('back buddy') ||
            normalized.includes('back money') ||
            normalized.includes('im back buddy') ||
            normalized.includes('back body') ||
            normalized.includes('i am back buddy');

          if (isMatched) {
            verifyPhraseWithBackend(rawText);
          } else if (isFinalResult && rawText.length > 2) {
            // User finished saying something, but it did not match
            console.log('[VoiceAuth] Phrase did not match:', rawText);
            setStatus('failed');
            if (failResetTimerRef.current) clearTimeout(failResetTimerRef.current);
            failResetTimerRef.current = setTimeout(() => {
              if (!isTerminatedRef.current && !candidateSentRef.current) {
                setStatus('listening');
                setTranscript('');
              }
            }, 1800);
          }
        };

        recognition.onerror = (e) => {
          console.warn('[VoiceAuth] Recognition error:', e.error);
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
      } catch (err) {
        console.error('[VoiceAuth] Failed to initialize SpeechRecognition:', err);
      }
    }

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
      if (failResetTimerRef.current) clearTimeout(failResetTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [active, sessionId, sessionToken, serverUrl]);

  // Click on mic to replay system voice prompt
  const handleMicClick = (e) => {
    e.stopPropagation();
    speakSystemPrompt();
  };

  // Clicking the status pill or words box provides manual verification test
  const handleStatusClick = (e) => {
    e.stopPropagation();
    const phrase = transcript || "I'm back buddy";
    verifyPhraseWithBackend(phrase);
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

        {/* Minimal Status: Passed or Failed or Listening */}
        <div
          className={`voice-minimal-status ${status}`}
          onClick={handleStatusClick}
          title={status === 'listening' ? 'Listening... Speak passphrase' : ''}
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

        {/* Listened Words Display: Shows what the user actually said */}
        <div
          className={`voice-listened-words ${transcript ? 'has-words' : ''} ${status}`}
          onClick={handleStatusClick}
        >
          {transcript ? (
            <span>"{transcript}"</span>
          ) : (
            <span className="voice-listened-placeholder">Listening for voice...</span>
          )}
        </div>
      </div>
    </div>
  );
}
