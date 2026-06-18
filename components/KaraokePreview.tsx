
import React, { useState, useEffect, useRef } from 'react';
import { LyricSection } from '../types';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Music, 
  Flame, 
  Sparkles,
  Mic,
  MicOff,
  RefreshCw,
  Award,
  Info,
  Wind
} from 'lucide-react';

interface KaraokePreviewProps {
  title: string;
  hmongTitle: string;
  artist: string;
  lyrics: LyricSection[];
  mood: string; // sad, happy, romance, nostalgic
  tempo: 'slow' | 'medium' | 'fast';
}

const KaraokePreview: React.FC<KaraokePreviewProps> = ({
  title,
  hmongTitle,
  artist,
  lyrics,
  mood,
  tempo
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [tempoMultiplier, setTempoMultiplier] = useState(1);
  const [instrument, setInstrument] = useState<'flute' | 'synth' | 'chords'>('flute');
  
  // Auto-play feature state
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayDelay, setAutoPlayDelay] = useState(3000);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  
  // Vocal Practice Mode & Web Speech Audio Recording States
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [vocalScore, setVocalScore] = useState<number>(0);
  const [micStateError, setMicStateError] = useState<string | null>(null);

  // Practice and Web Speech API references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Keep ref up to date
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  // Timer state
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and manage ambient audio based on mood
  useEffect(() => {
    // Public CDN sounds for ambient background based on mood
    const ambientUrls = {
      sad: 'https://cdn.pixabay.com/audio/2021/08/04/audio_f6e9bcfe9c.mp3', // Rain Drops
      nostalgic: 'https://cdn.pixabay.com/audio/2022/08/31/audio_1e8a0026e6.mp3', // Wind in trees
      happy: 'https://cdn.pixabay.com/audio/2022/03/15/audio_b2879590ea.mp3', // Forest birds
      romantic: 'https://cdn.pixabay.com/audio/2021/08/09/audio_110a11add4.mp3' // Crickets night
    };
    
    const url = ambientUrls[mood as keyof typeof ambientUrls] || ambientUrls.romantic;

    if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio();
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = 0.25; // Subtle background volume
    }

    if (ambientAudioRef.current.src !== url) {
        const wasPlaying = !ambientAudioRef.current.paused;
        ambientAudioRef.current.src = url;
        if (wasPlaying && isPlaying && ambientEnabled && !isMuted) {
            ambientAudioRef.current.play().catch(e => console.warn('Ambient play failed:', e));
        }
    }

    return () => {
       if (ambientAudioRef.current) {
           ambientAudioRef.current.pause();
       }
    };
  }, [mood]);

  // Handle playing/pausing the ambient track when states change
  useEffect(() => {
    if (ambientAudioRef.current) {
        if (isPlaying && ambientEnabled && !isMuted && !isPracticeMode) {
            ambientAudioRef.current.play().catch(e => console.warn('Ambient play failed:', e));
        } else {
            ambientAudioRef.current.pause();
        }
    }
  }, [isPlaying, ambientEnabled, isMuted, isPracticeMode]);

  // Flatten lyrics for linear playback
  const flattenedLines = React.useMemo(() => {
    const list: { sectionLabel: string; text: string; translation: string; sectionIdx: number; lineIdx: number }[] = [];
    if (!lyrics || lyrics.length === 0) {
      // Default placeholder lines
      return [
        { sectionLabel: "Nqe 1 / Verse 1", text: "Kuv nco txais koj hauv nruab siab", translation: "I remember you deep inside my heart", sectionIdx: 0, lineIdx: 0 },
        { sectionLabel: "Nqe 1 / Verse 1", text: "Lub xub ntiag nyob rau lub roob ntsuab", translation: "Engulfed in the green mountain fog", sectionIdx: 0, lineIdx: 1 },
        { sectionLabel: "Nqe Tshooj / Chorus", text: "Txoj hmoo no tsis muaj caij ntsib", translation: "Our destiny has no time to meet again", sectionIdx: 1, lineIdx: 0 },
        { sectionLabel: "Nqe Tshooj / Chorus", text: "Sau cov kua muag cia rau nag hmo", translation: "Saving the tears for yesterday's regret", sectionIdx: 1, lineIdx: 1 }
      ];
    }
    
    lyrics.forEach((section, sIdx) => {
      section.lines.forEach((line, lIdx) => {
        list.push({
          sectionLabel: `${section.hmongSectionName} (${section.sectionName})`,
          text: line.text,
          translation: line.translation,
          sectionIdx: sIdx,
          lineIdx: lIdx
        });
      });
    });
    return list;
  }, [lyrics]);

  // Auto-play interval effect
  useEffect(() => {
    if (isAutoPlay) {
      if (isPlaying) setIsPlaying(false); // Halt audio if starting text auto-play
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentLineIndex(prev => {
          if (prev >= flattenedLines.length - 1) {
            setIsAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
        setCurrentWordIndex(-1);
      }, autoPlayDelay);
    } else {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    }
    return () => {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    };
  }, [isAutoPlay, autoPlayDelay, flattenedLines.length, isPlaying]);

  // Scroll active lyric into view in the list
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentLineIndex, isAutoPlay]);

  // Audio Synth Player using Web Audio API
  const playSyllableSound = (word: string) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Map Hmong tone markers or word length to Pentatonic notes (C4, D4, E4, G4, A4, C5)
      // Traditional Hmong minor pentatonic: C, D, Eb, G, Ab / C, Eb, F, G, Bb
      // RPA Tones: b, m, d, j, v, s, g, (blank)
      const lastChar = word.toLowerCase().slice(-1);
      let freq = 261.63; // C4 default

      if (mood === 'sad' || mood === 'nostalgic') {
        // Pentatonic minor sequence
        const minorNotes = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; // C4, Eb4, F4, G4, Bb4, C5
        const toneIndex = "bmdjvsg".indexOf(lastChar);
        freq = minorNotes[toneIndex !== -1 ? toneIndex : 2];
      } else {
        // Major Pentatonic for happy style
        const majorNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5
        const toneIndex = "bmdjvsg".indexOf(lastChar);
        freq = majorNotes[toneIndex !== -1 ? toneIndex : 1];
      }

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      if (instrument === 'flute') {
        // Soft breathy flute sound: Triangle wave + subtle lowpass or pitch vibrato
        osc.type = 'triangle';
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (instrument === 'synth') {
        // Cool sci-fi retro synth: Sine + fast gain attack
        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Bouncy pluck chords: Triangle with rapid decay
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Add a second harmonic oscillator to build a basic harmonic triad
        const oscPartners = [freq * 1.25, freq * 1.5]; // major/minor approximate intervals
        oscPartners.forEach(pFreq => {
          const oscP = ctx.createOscillator();
          const gainP = ctx.createGain();
          oscP.type = 'sine';
          oscP.frequency.setValueAtTime(pFreq, ctx.currentTime);
          oscP.connect(gainP);
          gainP.connect(ctx.destination);
          gainP.gain.setValueAtTime(0.01, ctx.currentTime);
          gainP.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.03);
          gainP.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          oscP.start(ctx.currentTime);
          oscP.stop(ctx.currentTime + 0.35);
        });

        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.32);
      }
    } catch (e) {
      console.warn("Audio Context init error:", e);
    }
  };

  // Base speed timing per line based on tempo setting
  const getLineDuration = () => {
    const base = tempo === 'slow' ? 6500 : tempo === 'fast' ? 4000 : 5000;
    return base / tempoMultiplier;
  };

  const handlePlayToggle = () => {
    // Resume audio context if created
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAutoPlay(false);
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsAutoPlay(false);
    setCurrentLineIndex(0);
    setCurrentWordIndex(-1);
    setCurrentSectionIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
  };

  // Main playback core loop
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
      return;
    }

    const startLinePlayback = () => {
      if (currentLineIndex >= flattenedLines.length) {
        // End of song loop or stop
        setIsPlaying(false);
        setCurrentLineIndex(0);
        setCurrentWordIndex(-1);
        return;
      }

      // Sync sections
      const activeLine = flattenedLines[currentLineIndex];
      setCurrentSectionIndex(activeLine.sectionIdx);

      // Breakdown words
      const words = activeLine.text.split(" ");
      let wordIdx = 0;
      setCurrentWordIndex(0);
      playSyllableSound(words[0]);

      // Speed of word highlights based on total line duration divided by total words
      const duration = getLineDuration();
      const wordGap = duration / (words.length + 1.5);

      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = setInterval(() => {
        wordIdx += 1;
        if (wordIdx < words.length) {
          setCurrentWordIndex(wordIdx);
          playSyllableSound(words[wordIdx]);
        } else {
          setCurrentWordIndex(-1);
          if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
        }
      }, wordGap);

      // Set timeout to advance to the next line
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, duration);
    };

    startLinePlayback();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    };
  }, [isPlaying, currentLineIndex, flattenedLines, tempo, tempoMultiplier]);

  // Vocal Practice Mode implementation
  const drawMicWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Use ref to check active recording
      if (!isRecordingRef.current || !canvasRef.current || !analyserRef.current) {
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Drawing empty flat indicator
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#020617'; // slate-950 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle gridlines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const yPos = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
        ctx.stroke();
      }

      ctx.lineWidth = 2.5;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#818cf8'); // indigo-400
      gradient.addColorStop(0.5, '#f472b6'); // pink-400
      gradient.addColorStop(1, '#67e8f9'); // cyan-300
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startPracticeRecording = async () => {
    setMicStateError(null);
    setTranscript('');
    setVocalScore(0);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      };

      // Set state to recording BEFORE starting audio frame rendering
      setIsRecording(true);
      isRecordingRef.current = true;
      mediaRecorder.start();

      // Setup Speech Recognition Web Speech API (if supported)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let currentText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);

          // Calculate pronunciation match or phrase similarities with active line
          if (activeLine && activeLine.text) {
            const cleanActive = activeLine.text.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/\s+/).filter(Boolean);
            const cleanSpoken = currentText.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/\s+/).filter(Boolean);
            
            let matches = 0;
            cleanActive.forEach((word) => {
              // Simple check if user spoken words matches phonetic sounds
              if (cleanSpoken.some((sw) => sw.includes(word) || word.includes(sw))) {
                matches++;
              }
            });
            const ratio = cleanActive.length > 0 ? (matches / cleanActive.length) : 0;
            const score = Math.min(100, Math.round(ratio * 100));
            setVocalScore(score);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition notice:", e);
        };

        recognitionRef.current = rec;
        rec.start();
      }

      // Draw the waveform animation
      setTimeout(() => {
        drawMicWaveform();
      }, 50);

      // Trigger standard playback accompaniment if not already playing!
      if (!isPlaying) {
        setIsPlaying(true);
      }

    } catch (err: any) {
      console.error("Mic access block:", err);
      setMicStateError("Cannot access your microphone. Please enable microphone permissions in your browser configuration.");
    }
  };

  const stopPracticeRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop background instrumental playback
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setCurrentWordIndex(-1);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
  };

  const playRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    if (isPlayingRecording) {
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
      }
      setIsPlayingRecording(false);
    } else {
      const audio = new Audio(recordedAudioUrl);
      recordedAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingRecording(false);
      };
      setIsPlayingRecording(true);
      audio.play();
    }
  };

  // Clean up all streams and animation frames on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const activeLine = flattenedLines[currentLineIndex] || { text: "", translation: "", sectionLabel: "" };
  const words = activeLine.text.split(" ");

  return (
    <div id="karaoke-visualizer" className="relative h-full overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-6 md:p-8 min-h-[460px]">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated fluid aurora background */}
        <div className={`absolute -inset-[10px] opacity-30 blur-3xl transition-all duration-1000 ${
          mood === 'sad' ? 'bg-gradient-to-tr from-sky-900 via-blue-950 to-indigo-900 animate-pulse' :
          mood === 'happy' ? 'bg-gradient-to-tr from-amber-600/30 via-indigo-950 to-emerald-900/30' :
          mood === 'romantic' ? 'bg-gradient-to-tr from-rose-900/30 via-slate-950 to-purple-900/30' :
          'bg-gradient-to-tr from-emerald-900/20 via-slate-950 to-teal-900/30'
        }`} />
        
        {/* Traditional Hmong mountains graphic overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-15 pointer-events-none mix-blend-screen bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-500/30 via-slate-950 to-transparent" />
        
        {/* Music beat indicators - glowing circles bouncing */}
        {isPlaying && (
          <div className="absolute top-12 right-12 flex gap-1 items-end h-8">
            <span className="w-1 bg-yellow-400 animate-[bounce_0.6s_infinite_alternate] h-4" />
            <span className="w-1 bg-indigo-400 animate-[bounce_0.8s_infinite_alternate] h-6 delay-75" />
            <span className="w-1 bg-cyan-400 animate-[bounce_0.5s_infinite_alternate] h-8 delay-150" />
            <span className="w-1 bg-yellow-400 animate-[bounce_0.7s_infinite_alternate] h-3 delay-200" />
          </div>
        )}
      </div>

      {/* Top Header Controls / Options */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <Music className="w-5 h-5 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">Kev Mloog Nkauj / Player</span>
            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[160px] md:max-w-xs">{title || "Song Preview"}</h3>
          </div>
        </div>

        {/* Synthesizer Instrument & Vocal Practice Options */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setInstrument('flute')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${instrument === 'flute' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Faj (Raj Flute)
            </button>
            <button
              onClick={() => setInstrument('synth')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${instrument === 'synth' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Pop Beep
            </button>
            <button
              onClick={() => setInstrument('chords')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${instrument === 'chords' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Chord Pluck
            </button>
          </div>

          {/* Vocal Practice Mode Toggle */}
          <button
            onClick={() => {
              if (isRecording) {
                stopPracticeRecording();
              }
              setIsPracticeMode(!isPracticeMode);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
              isPracticeMode
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/15'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-pulse text-white' : 'text-rose-400'}`} />
            <span>{isPracticeMode ? 'Close Practice' : '🎤 Vocal Practice'}</span>
          </button>
        </div>
      </div>

      {/* Main Karaoke Screens Stage */}
      <div className="relative z-10 flex-grow flex flex-col justify-center py-6 text-center">
        
        {/* Section Tag Indicator */}
        <div className="mb-6">
          <span className="px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 animate-pulse">
            {isPlaying ? activeLine.sectionLabel : "Song Standby"}
          </span>
        </div>

        {/* Dynamic Highlight Lyric Line */}
        <div className="space-y-4 max-w-2xl mx-auto px-4">
          <div className="min-h-[80px] flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-2xl md:text-4xl font-extrabold tracking-tight leading-normal">
            {words.map((word, wordIdx) => {
              const isWordActive = currentWordIndex === wordIdx;
              const isWordPassed = currentWordIndex > wordIdx;
              
              return (
                <span
                  key={wordIdx}
                  className={`transition-all duration-150 inline-block drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transform ${
                    isWordActive 
                      ? 'text-yellow-300 scale-110 drop-shadow-[0_0_12px_rgba(253,224,71,0.6)] font-black' 
                      : isWordPassed 
                        ? 'text-indigo-300/80' 
                        : 'text-slate-400'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* Line English Translation */}
          <p className="text-base md:text-lg text-slate-400 font-medium italic select-none min-h-[28px] opacity-90 leading-relaxed max-w-xl mx-auto transition-all duration-300">
            {activeLine.translation ? `"${activeLine.translation}"` : "Press Play / Nias tso nkauj to start singing along!"}
          </p>
        </div>

        {/* Vocal practice mode HUD console panel */}
        {isPracticeMode && (
          <div className="mt-6 p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 max-w-xl mx-auto backdrop-blur-md relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top row elements */}
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-750'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 text-left">
                  {isRecording ? 'Teb Chaws Kaw Suab / Recording' : '🎤 Practice Console'}
                </span>
              </div>

              {/* Match accuracy rating score */}
              {vocalScore > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[10px]">
                  <Award className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                  <span>Match Score: <strong className="text-white text-xs">{vocalScore}%</strong></span>
                </div>
              )}
            </div>

            {/* Waveform Visualizer Canvas container */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-16 bg-slate-950 rounded-xl border border-slate-900 shadow-inner block"
                width={600}
                height={80}
              />
              {!isRecording && !recordedAudioUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] uppercase font-black tracking-wider select-none pointer-events-none">
                  ⚡ Waveform Stream Flatline - Press Record to Practice Singing ⚡
                </div>
              )}
            </div>

            {/* Error messaging state */}
            {micStateError && (
              <p className="text-rose-400 text-[11px] leading-normal font-semibold text-center bg-rose-950/20 py-1.5 px-3 rounded-lg border border-rose-900/30">
                ⚠️ {micStateError}
              </p>
            )}

            {/* Transcription Feed (Speech API) */}
            {transcript && (
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1 text-left">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block leading-none">Your Vocal Speech Feed:</span>
                <p className="text-xs font-bold text-indigo-300 italic">"{transcript}"</p>
              </div>
            )}

            {/* Bottom action bar inside the console */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
              
              {/* Record triggering switch */}
              <button
                onClick={isRecording ? stopPracticeRecording : startPracticeRecording}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Nres Kaw Suab / Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Pib Kaw Suab / Record Vocal</span>
                  </>
                )}
              </button>

              {/* Recorded playback clip, if loaded */}
              {recordedAudioUrl && (
                <button
                  onClick={playRecordedAudio}
                  className={`py-2 px-4 rounded-xl border text-xs font-black transition-all flex items-center gap-2 ${
                    isPlayingRecording
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-emerald-400 hover:text-emerald-350'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPlayingRecording ? 'animate-spin' : ''}`} />
                  <span>{isPlayingRecording ? 'Nres Mloog / Pause' : 'Mloog Koj Kaw / Playback'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Interactive Lyric Roller List */}
        {!isPlaying && !isPracticeMode && (
          <div className="mt-8 max-h-[140px] overflow-y-auto custom-scrollbar max-w-md mx-auto px-2 relative border border-slate-800/50 rounded-xl bg-slate-900/30">
            <div className="sticky top-0 bg-[#070b14] z-10 py-2 border-b border-white/5 flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Lyrics List</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" title="Auto-scroll delay in seconds">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Delay</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={autoPlayDelay / 1000}
                    onChange={(e) => setAutoPlayDelay(parseFloat(e.target.value) * 1000)}
                    disabled={isAutoPlay}
                    className="w-16 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[9px] font-mono text-slate-400 w-4">{autoPlayDelay / 1000}s</span>
                </div>
                <button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`text-[10px] px-2 py-1 rounded font-black tracking-wide transition-all active:scale-95 ${
                    isAutoPlay 
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  {isAutoPlay ? 'Stop Auto' : 'Auto-Play Text'}
                </button>
              </div>
            </div>
            
            <div className="space-y-1 pb-2">
              {flattenedLines.map((line, idx) => {
                const isActive = currentLineIndex === idx;
                return (
                  <div 
                    key={idx} 
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => {
                      setCurrentLineIndex(idx);
                      setCurrentWordIndex(-1);
                      if (isAutoPlay) setIsAutoPlay(false);
                    }}
                    className={`py-1.5 px-3 cursor-pointer hover:bg-slate-800/50 rounded-lg transition-colors truncate text-xs ${
                      isActive ? 'text-indigo-300 font-black bg-indigo-950/40 border border-indigo-500/20' : 'text-slate-500'
                    }`}
                  >
                    <span className="opacity-50 mr-2 font-mono text-[10px]">{idx + 1}.</span> 
                    {line.text} 
                    <span className="opacity-40 text-[10px] ml-2 block truncate">({line.sectionLabel})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom control bar dashboard */}
      <div className="relative z-10 pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayToggle}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isPlaying 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          
          <button
            onClick={handleStop}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all active:scale-95"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>

          <span className="text-xs font-bold text-slate-500 select-none hidden md:inline bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {currentLineIndex + 1} / {flattenedLines.length} Nqe
          </span>
        </div>

        {/* Sound Volume & Speed adjustment */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Audio on/off */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all font-bold"
            title={isMuted ? 'Unmute Synth' : 'Mute Synth'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Ambient Sound Toggle */}
          <button
            onClick={() => setAmbientEnabled(!ambientEnabled)}
            className={`p-3 rounded-xl border transition-all ${ambientEnabled ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            title={ambientEnabled ? 'Disable Ambient Sounds' : 'Enable Ambient Sounds'}
          >
            <Wind className="w-4 h-4" />
          </button>

          {/* Tempo speed multiplier slider */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center text-xs gap-3">
            <span className="font-bold text-[10px] uppercase text-slate-500 select-none">Speed</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={tempoMultiplier}
              onChange={(e) => setTempoMultiplier(parseFloat(e.target.value))}
              className="w-24 md:w-32 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <span className="font-mono text-[10px] text-slate-400 w-8 text-right select-none">{tempoMultiplier.toFixed(2)}x</span>
          </div>
        </div>

        {/* Singer Credential banner */}
        <div className="text-right hidden lg:block">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Hu los ntawm / Artist</p>
          <p className="text-sm font-bold text-slate-300 italic leading-snug">{artist || "Sua Vaj"}</p>
        </div>
      </div>
    </div>
  );
};

export default KaraokePreview;

