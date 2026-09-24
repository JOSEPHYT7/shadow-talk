import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Volume2,
  CheckCircle,
  AlertTriangle,
  X,
  Shield,
  Loader2,
  CornerDownLeft
} from 'lucide-react';
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
 * Voice Verification Interactive Enclave
 * Plays synthesized system audio ("Hey Creator"), displays interactive audio visualizer,
 * and captures spoken secret phrase ("I'm back buddy") for server-side verification.
 */
export function HiddenVoiceActivator({
  active,
  sessionId,
  sessionToken,
  serverUrl,
  onVoiceSuccess,
  onVoiceFailure
}) {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Listening for voice response...');
  const [isError, setIsError] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const candidateDebounceRef = useRef(null);
  const candidatePhraseSentRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Speak system voice prompt "Hey Creator"
  const speakSystemPhrase = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Hey Creator');
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        setIsSpeakingPrompt(true);
        utterance.onend = () => setIsSpeakingPrompt(false);
        utterance.onerror = () => setIsSpeakingPrompt(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeakingPrompt(false);
      }
    }
  };

  // Dispatch candidate text to server for backend verification
  const dispatchToBackend = async (textToSend) => {
    if (candidatePhraseSentRef.current || !textToSend) return;
    candidatePhraseSentRef.current = true;
    setVerifying(true);
    setStatusMessage('Verifying voice secret token...');
    setIsError(false);

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
        setStatusMessage('Voice verified! Securing session...');
        setIsError(false);
        setTimeout(() => {
          if (typeof onVoiceSuccess === 'function') {
            onVoiceSuccess(data.sessionToken);
          }
        }, 600);
      } else {
        candidatePhraseSentRef.current = false;
        setVerifying(false);
        setIsError(true);
        setStatusMessage('Phrase mismatch. Speak clearly or try again.');
      }
    } catch {
      candidatePhraseSentRef.current = false;
      setVerifying(false);
      setIsError(true);
      setStatusMessage('Verification request failed.');
    }
  };

  // Main speech recognition pipeline
  useEffect(() => {
    if (!active || !sessionId || !sessionToken) return;

    candidatePhraseSentRef.current = false;
    let isTerminated = false;

    // 1. Play audio prompt
    speakSystemPhrase();

    // 2. Start browser speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    async function startListening() {
      // Request mic permission
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (e) {
        setStatusMessage('Microphone access unavailable. You may type phrase below.');
        setShowManualInput(true);
      }

      if (!SpeechRecognition) {
        setStatusMessage('Speech recognition unsupported in this browser. Enter phrase manually.');
        setShowManualInput(true);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        recognition.onresult = (event) => {
          if (isTerminated || candidatePhraseSentRef.current) return;

          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }

          const rawTrimmed = fullTranscript.trim();
          setLiveTranscript(rawTrimmed);

          const normalized = normalizeTranscript(fullTranscript);

          // Extract candidate words (if "hey creator" is spoken first, inspect what follows)
          let candidate = normalized;
          const triggerIdx = normalized.indexOf('hey creator');
          if (triggerIdx >= 0) {
            candidate = normalized.slice(triggerIdx + 'hey creator'.length).trim();
          }

          // If sufficient candidate words detected, debounce and dispatch
          if (candidate.length >= 3) {
            if (candidateDebounceRef.current) {
              clearTimeout(candidateDebounceRef.current);
            }

            let isAnyFinal = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) isAnyFinal = true;
            }

            if (isAnyFinal && candidate.length >= 6) {
              dispatchToBackend(candidate);
            } else {
              candidateDebounceRef.current = setTimeout(() => {
                dispatchToBackend(candidate);
              }, 1200);
            }
          }
        };

        recognition.onerror = (err) => {
          if (err && (err.error === 'no-speech' || err.error === 'audio-capture')) {
            return;
          }
          if (err && (err.error === 'not-allowed' || err.error === 'service-not-allowed')) {
            setStatusMessage('Microphone permission blocked. Please use manual entry.');
            setShowManualInput(true);
          }
        };

        recognition.onend = () => {
          if (!isTerminated && activeRef.current && !candidatePhraseSentRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setShowManualInput(true);
      }
    }

    startListening();

    return () => {
      isTerminated = true;
      if (candidateDebounceRef.current) {
        clearTimeout(candidateDebounceRef.current);
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
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [active, sessionId, sessionToken, serverUrl]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    dispatchToBackend(manualText.trim());
  };

  return (
    <div className="voice-verify-overlay">
      <div className="voice-verify-card">
        {/* Header */}
        <div className="voice-verify-header">
          <div className="voice-header-badge">
            <Shield size={13} />
            <span>VOICE AUTHENTICATION // LAYER 02</span>
          </div>
          <button
            type="button"
            className="voice-close-btn"
            onClick={onVoiceFailure}
            title="Cancel authentication"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="voice-verify-body">
          {/* Animated Mic Visualizer */}
          <div className="voice-visualizer-center">
            <div className="pulse-ring-outer" />
            <div className="pulse-ring-inner" />
            <div
              className={`mic-circle-core ${verifying ? '' : 'listening'}`}
              onClick={speakSystemPhrase}
              title="Click to replay system voice"
            >
              <Mic size={34} />
            </div>
          </div>

          {/* Sound Bars Pulse Animation */}
          <div className="sound-bars-row">
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
          </div>

          {/* Dialogue Instructions */}
          <div className="voice-instructions-card">
            {/* System Audio Prompt Row */}
            <div className="voice-dialogue-row">
              <span className="voice-role-pill system">SYSTEM</span>
              <div className="voice-dialogue-content">
                <span className="voice-dialogue-text">"Hey Creator"</span>
                <button
                  type="button"
                  className="replay-audio-btn"
                  onClick={speakSystemPhrase}
                  title="Replay system audio prompt"
                >
                  <Volume2 size={12} />
                  <span>{isSpeakingPrompt ? 'Speaking...' : 'Play Audio'}</span>
                </button>
              </div>
            </div>

            {/* Expected User Response Row */}
            <div className="voice-dialogue-row">
              <span className="voice-role-pill user">YOU SPEAK</span>
              <div className="voice-dialogue-content">
                <span className="voice-dialogue-text">"I'm back buddy"</span>
              </div>
            </div>
          </div>

          {/* Live Transcript Display */}
          <div className={`voice-live-transcript ${liveTranscript ? 'heard' : ''}`}>
            {liveTranscript ? (
              <span>Heard: "{liveTranscript}"</span>
            ) : (
              <span>Speak into microphone clearly...</span>
            )}
          </div>

          {/* Real-time Status */}
          <div className={`voice-status-line ${isError ? 'error' : ''}`}>
            {verifying ? (
              <Loader2 size={13} className="spin-loader" />
            ) : isError ? (
              <AlertTriangle size={13} />
            ) : (
              <CheckCircle size={13} />
            )}
            <span>{statusMessage}</span>
          </div>

          {/* Manual Input Fallback */}
          <div className="voice-fallback-section">
            {!showManualInput ? (
              <button
                type="button"
                className="voice-fallback-toggle"
                onClick={() => setShowManualInput(true)}
              >
                Having microphone issues? Type voice phrase manually
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="voice-text-form">
                <input
                  type="text"
                  placeholder='Type "I&apos;m back buddy"'
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="voice-text-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="voice-text-btn"
                  disabled={verifying || !manualText.trim()}
                >
                  Verify
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
