
import React, { useState, useEffect } from 'react';
import { AppStatus, StoryboardData, UserPreferences, LyricSection } from './types';
import { generateStoryboard } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';
import KaraokePreview from './components/KaraokePreview';
import MoodChart from './components/MoodChart';
import { 
  Music, 
  Sparkles, 
  Globe, 
  Layers, 
  Film, 
  Copy, 
  Download, 
  Trash2, 
  ChevronRight, 
  Radio, 
  Heart, 
  Compass, 
  Plus, 
  Check, 
  Info,
  Sliders,
  AlertCircle,
  Flame,
  Mic,
  MicOff,
  RefreshCw
} from 'lucide-react';

const UI_TEXT = {
  english: {
    title: "HMONG MV STUDIO",
    subtitle: "AI-POWERED SONGWRITING & STORYBOARDING",
    topic_label: "What is your song about?",
    topic_placeholder: "Describe a memory, story, or lyrics (e.g. A romantic ballad in the Laos mist, celebrating Hmong New Year, remembering ancestors...)",
    vibe: "Aesthetic Vibe",
    mood: "Emotional Mood",
    tempo: "Rhythm & Tempo",
    create_btn: "Tsim Txoj Nkauj • Create Song",
    generating: "Composing lyrics & cinematic storyboard...",
    error: "Could not create song. Please confirm your GEMINI_API_KEY is configured correctly in Settings > Secrets.",
    saved_tracks: "Your Hmong Song Library",
    empty_library: "No saved tracks. Enter a theme above to generate your first visual song!",
    tab_karaoke: "🎤 Sing Karaoke & Lyrics",
    tab_storyboard: "🎬 Video Storyboard Flow",
    production_title: "Production & Traditional Instrumental Vibe",
    export_lyrics: "Copy Hmong Lyrics",
    export_storyboard: "Download PDF Storyboard",
    lyrics_copied: "Lyrics copied to clipboard!",
    traditional_label: "Traditional Elements",
    overall_theme: "Overall Soundtrack Vibe",
    active_prompt: "Active Pitch Prompt:",
    reset_btn: "Reset App",
    quick_prompts: "Inspiration Prompt Ideas",
    dictation_start: "Voice Dictation",
    dictation_stop: "Stop Listening",
    dictation_error: "Speech error",
    dictation_support_err: "Speech Recognition is not supported list in this browser. Please try Google Chrome or Safari."
  },
  hmong: {
    title: "CHAW TSIM NKAUJ HMOOB",
    subtitle: "AI TSIM LUG NKAUJ & DAIM DUAB STYLES MV",
    topic_label: "Txoj nkauj no hais txog dab tsi?",
    topic_placeholder: "Sau lub ntsiab lus rau ntawm no (piv txwv: Tu siab nco qub tsev toj siab teb chaws nplog, nco niam txiv, zoo siab peb caug...)",
    vibe: "Xav tau hom Style",
    mood: "Lub Siab xav tau",
    tempo: "Kev Qeeb thiab Ceev",
    create_btn: "Tsim Txoj Nkauj Hmoob",
    generating: "Tab tom sau ntawv nkauj nrog thau duab tsab ntawv...",
    error: "Tsim tsis tau txoj nkauj. Thov xyuas seb koj puas tau ntxiv GEMINI_API_KEY hauv Settings > Secrets.",
    saved_tracks: "Koj Cov Txoj Nkauj Tseg Cia",
    empty_library: "Tsis muaj nkauj tseg li. Sau ib lub ntsiab lus saum toj no mus tsim!",
    tab_karaoke: "🎤 Karaoke & Hais Lug Nkauj",
    tab_storyboard: "🎬 Daim Duab Teeb Kev MV",
    production_title: "Cov Twj Paj Ntaus & Kev Tsim Nkauj",
    export_lyrics: "Luag Cov Lug Nkauj (Copy)",
    export_storyboard: "Download PDF MV Script",
    lyrics_copied: "Luag cov lug nkauj tiav log!",
    traditional_label: "Moj Kua Traditional",
    overall_theme: "Tag nrho cov duab & suab",
    active_prompt: "Ntsiab lus tsim:",
    reset_btn: "Pib Tshiab",
    quick_prompts: "Cov Ntsiab Lus Pom Zoo",
    dictation_start: "Hais Lus Sau",
    dictation_stop: "Nres Mloog",
    dictation_error: "Tsis hnov koj hais tsab lus",
    dictation_support_err: "Browser tsis txhawb Speech API. Thov siv Google Chrome lossis Safari."
  },
  lao: {
    title: "ສະຕູດີໂອ MV ມົ້ງ AI",
    subtitle: "AI ແຕ່ງເພງ ມົ້ງ ແລະ ຜັງສະຕໍຣີບອດ",
    topic_label: "ເພງຂອງທ່ານແມ່ນກ່ຽວກັບຫຍັງ?",
    topic_placeholder: "ຂຽນເລື່ອງລາວ ຫຼື ເນື້ອເພງຂອງທ່ານ (ຕົວຢ່າງ: ທະຫານປ້ອງກັນຊາຍແດນ ລາວ-ໄທ ຢູ່ເຂດຊຽງຮ່ອນ ໄລຍະປີ 1960-1975...)",
    vibe: "ປະເພດສະໄຕລ໌ (Style)",
    mood: "ເລືອກອາລົມເພງ",
    tempo: "ຄວາມໄວຂອງຈັງຫວະ",
    create_btn: "ສ້າງເພງໃຫມ່ • Tsim Txoj Nkauj",
    generating: "ລະບົບ AI ກຳລັງແຕ່ງເນື້ອເພງ ແລະ ອອກແບບສະຕໍຣີບອດ...",
    error: "ບໍ່ສາມາດສ້າງເພງໄດ້. ກະລຸນາກວດສອບ GEMINI_API_KEY ໃນ Settings > Secrets.",
    saved_tracks: "ຄັງວິວເພງຂອງທ່ານ",
    empty_library: "ບໍ່ມີເພງທີ່ບັນທຶກໄວ້. ຂຽນຫົວຂໍ້ຂ້າງເທິງເພື່ອສ້າງເພງທຳອິດຂອງທ່ານ!",
    tab_karaoke: "🎤 ຄາລາໂອເກະ & ເນື້ອເພງ",
    tab_storyboard: "🎬 ສະຕໍຣີບອດ ແລະ ພາບ MV",
    production_title: "ແນວທາງການຜະລິດສຽງດົນຕີ ແລະ ເຄື່ອງດົນຕີພື້ນເມືອງ",
    export_lyrics: "ຄັດລອກເນື້ອເພງ (Copy)",
    export_storyboard: "ດາວໂຫລດ PDF Storyboard",
    lyrics_copied: "ຄັດລອກເນື້ອເພງສຳເລັດແລ້ວ!",
    traditional_label: "ອົງປະກອບພື້ນເມືອງ",
    overall_theme: "ຈຸດປະສົງ ແລະ ຮູບແບບທົ່ວໄປ",
    active_prompt: "ຫົວຂໍ້ປະຈຸບັນ:",
    reset_btn: "ເລີ່ມໃຫມ່",
    quick_prompts: "ຕົວຢ່າງຫົວຂໍ້ແນວເພງ",
    dictation_start: "ພິມດ້ວຍສຽງ",
    dictation_stop: "ຢຸດການຮັບສຽງ",
    dictation_error: "ຂໍ້ຜິດພາດຮອງຮັບສຽງ",
    dictation_support_err: "ບຣາວເຊີນີ້ບໍ່ຮອງຮັບ Speech Recognition. ກະລຸນາໃຊ້ Google Chrome ຫຼື Safari."
  }
};

const SUGGESTED_PROMPTS = [
  {
    en: "A brave active-duty soldier protecting the Lao-Thai border in Xianghon district during 1960-1975.",
    hmo: "Ib tug tub rog daws teeb meem tiv thaiv ciam teb Nplog-Thaib hauv Xianghon xyoo 1960 mus rau 1975.",
    lao: "ໄລຍະປີ 1960 – 1975: ເປັນທະຫານປະຈຳການ ເຄື່ອນໄຫວເຮັດໜ້າທີ່ປ້ອງກັນຊາຍແດນ ລາວ-ໄທ ຢູ່ເຂດເມືອງຊຽງຮ່ອນ."
  },
  {
    en: "A sad separation song in the foggy peaks of Long Cheng mountains, Laos.",
    hmo: "Tu siab tshaj nco lub tsev thaum chaw qub toj siab roob Looj Chiab.",
    lao: "ເພງອາລົມເສຍໃຈ ຄິດຮອດບ້ານເກົ່າຍາມແຍກກັນຢູ່ເທິງຍອດພູເຂົາໝອກໜາ ລ້ອງແຈ້ງ ປະເທດລາວ."
  },
  {
    en: "A beautiful love song about a sweet, playful couple having fun and loving each other.",
    hmo: "Ib khub nkauj nraug sib hlub, sib fiab, luag ntxhi ua ke zoo li nkauj hnub nraug hli.",
    lao: "ເພງຮັກທີ່ສວຍງາມກ່ຽວກັບຄູ່ຮັກທີ່ໜ້າຮັກ, ມັກຫຼິ້ນມ່ວນຊື່ນ ແລະ ຮັກແພງກັນ."
  }
];

const INSPIRATION_IDEAS = [
  {
    en: "A vibrant pop song about throwing the ball (Pov Pob) and meeting a crush at the Hmong New Year festival.",
    hmo: "Ib txoj nkauj Ceev Pop xav txog kev ua si Pov Pob thiab ntsib tus hlub thaum mus noj peb caug.",
    lao: "ເພງປັອບທີ່ສົດໃສກ່ຽວກັບການໂຍນໝາກຄອນ (Pov Pob) ແລະ ພົບກັບຄົນທີ່ມັກໃນງານບຸນປີໃໝ່ຂອງຊາວມົ້ງ."
  },
  {
    en: "A nostalgic traditional ballad remembering the old harvest festival (Noj Tshiab) in the mountains.",
    hmo: "Txoj nkauj qub nco txog lub sijhawm noj tshiab, ua zoo siab txog cov qoob loo nyob pem roob.",
    lao: "ເພງພື້ນເມືອງກ່ຽວກັບການສະຫຼອງງານບຸນເກັບກ່ຽວ (Noj tshiab) ຢູ່ເທິງພູເຂົາ."
  },
  {
    en: "An upbeat modern Hmong hip-hop track about going to the night market to eat papaya salad and sticky rice.",
    hmo: "Ib txoj nkauj Hmoob HipHop hais txog mus yws khw hmo, noj ntaiv thiab mov nplaum.",
    lao: "ເພງມົ້ງຮິບຮັອບທັນສະໄຫມ ກ່ຽວກັບການໄປຕະຫຼາດກາງຄືນເພື່ອກິນຕຳໝາກຫຸ່ງ ແລະ ເຂົ້າໜຽວ."
  },
  {
    en: "A romantic cinematic song about long distance relationship between USA and Laos.",
    hmo: "Ib txoj nkauj hlub tu siab hais txog kev sib hlub nyob deb, Asmesliskas thiab Nplog teb.",
    lao: "ເພງຮັກກ່ຽວກັບຄວາມສຳພັນທາງໄລຍະທາງໄກ ລະຫວ່າງ ສະຫະລັດອາເມລິກາ ແລະ ປະເທດລາວ."
  },
  {
    en: "A motivational pop song about chasing dreams, finishing education, and making parents proud.",
    hmo: "Txoj nkauj txhawb zog txog kev ua siab ntev kawm ntawv kom tiav, ua rau niam txiv zoo siab.",
    lao: "ເພງສ້າງແຮງບັນດານໃຈກ່ຽວກັບການສຶກສາໃຫ້ຈົບ ແລະ ເຮັດໃຫ້ພໍ່ແມ່ພາກພູມໃຈ."
  },
  {
    en: "An epic movie soundtrack vibe about the historical journey crossing the Mekong river to seek freedom.",
    hmo: "Txoj nkauj ntshav hnyav tham txog keeb kwm tawm roob hla dej Naj Khoom nrhiav kev ywj pheej.",
    lao: "ເພງປະກອບຮູບເງົາ ກ່ຽວກັບການເດີນທາງຂ້າມແມ່ນ້ຳຂອງເພື່ອຊອກຫາອິດສະລະພາບ."
  }
];

const App: React.FC = () => {
  const [lang, setLang] = useState<'english' | 'hmong' | 'lao'>('hmong');
  const [prompt, setPrompt] = useState('Ib khub nkauj nraug luag ntxhi sib hlub heev');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // Custom adjustments for song characteristics
  const [prefMood, setPrefMood] = useState<'sad' | 'happy' | 'romantic' | 'nostalgic'>('romantic');
  const [prefTempo, setPrefTempo] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [prefVibe, setPrefVibe] = useState<'traditional' | 'pop' | 'modern'>('pop');
  
  const [data, setData] = useState<StoryboardData | null>(null);
  const [library, setLibrary] = useState<StoryboardData[]>([]);
  const [activeTab, setActiveTab] = useState<'karaoke' | 'storyboard'>('karaoke');
  const [showCopied, setShowCopied] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Voice Dictation browser SpeechRecognition hooks
  const [isDictating, setIsDictating] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const dictationRecognitionRef = React.useRef<any>(null);

  const startDictation = () => {
    setDictationError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationError(t.dictation_support_err);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      if (lang === 'lao') {
        recognition.lang = 'lo-LA';
      } else if (lang === 'hmong') {
        recognition.lang = 'hmn-Latn';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setPrompt(prev => {
            const separator = prev.trim() ? ' ' : '';
            return prev + separator + finalTranscript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Dictation error:", event);
        if (event.error !== 'no-speech') {
          setDictationError(`${t.dictation_error} (${event.error})`);
          stopDictation();
        }
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      dictationRecognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setDictationError(e.message || "Could not instantiate SpeechRecognition.");
    }
  };

  const stopDictation = () => {
    if (dictationRecognitionRef.current) {
      try {
        dictationRecognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
      dictationRecognitionRef.current = null;
    }
    setIsDictating(false);
  };

  // Clean up on unmount or language switch
  useEffect(() => {
    return () => {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
    };
  }, []);

  const t = UI_TEXT[lang];

  // Load Library from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hmong_mv_studio_library_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLibrary(parsed);
        if (parsed.length > 0) {
          setData(parsed[0]);
          setStatus(AppStatus.SUCCESS);
        }
      }
    } catch (e) {
      console.error("Failed to load local tracks", e);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus(AppStatus.GENERATING);
    try {
      const result = await generateStoryboard(prompt, prefMood, prefTempo, prefVibe);
      setData(result);
      
      // Save to LocalStorage Library
      const updatedLibrary = [result, ...library.filter(item => item.title !== result.title)].slice(0, 10);
      setLibrary(updatedLibrary);
      localStorage.setItem('hmong_mv_studio_library_v2', JSON.stringify(updatedLibrary));
      
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSelectTrack = (track: StoryboardData) => {
    setData(track);
    setActiveTab('karaoke');
    // Align preferences with track vibe if possible
    if (track.overallMood) {
      if (track.overallMood.toLowerCase().includes('sad') || track.overallMood.toLowerCase().includes('heartbroken')) {
        setPrefMood('sad');
      } else if (track.overallMood.toLowerCase().includes('happy') || track.overallMood.toLowerCase().includes('celebrate')) {
        setPrefMood('happy');
      } else if (track.overallMood.toLowerCase().includes('love') || track.overallMood.toLowerCase().includes('romanc')) {
        setPrefMood('romantic');
      } else {
        setPrefMood('nostalgic');
      }
    }
  };

  const handleDeleteTrack = (titleDeleting: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = library.filter(track => track.title !== titleDeleting);
    setLibrary(updated);
    localStorage.setItem('hmong_mv_studio_library_v2', JSON.stringify(updated));
    if (data?.title === titleDeleting) {
      setData(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleToggleFavorite = (titleToToggle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = library.map(track => {
      if (track.title === titleToToggle) {
        return { ...track, isFavorite: !track.isFavorite };
      }
      return track;
    });
    setLibrary(updated);
    localStorage.setItem('hmong_mv_studio_library_v2', JSON.stringify(updated));
    // If the active track is the one being toggled, update `data` too
    if (data?.title === titleToToggle) {
      setData({ ...data, isFavorite: !data.isFavorite });
    }
  };

  const handleCopyLyrics = () => {
    if (!data) return;
    const lyricsText = data.lyrics.map(sec => {
      const secHeader = `[${sec.hmongSectionName} / ${sec.sectionName}]\n`;
      const secLines = sec.lines.map(line => `${line.text}\n(${line.translation})`).join('\n');
      return `${secHeader}${secLines}\n`;
    }).join('\n');
    
    const formatted = `TITLE: ${data.hmongTitle} (${data.title})\nARTIST: ${data.artist}\nTHEME: ${data.theme}\n\n${lyricsText}`;
    navigator.clipboard.writeText(formatted);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadScript = async () => {
    if (!data || isDownloading) return;
    setIsDownloading(true);
    try {
      await generatePDF(data);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 border-slate-800 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top beautiful header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5 leading-none">
                <span className="text-white">{t.title}</span>
                <span className="text-indigo-400 text-xs font-bold py-0.5 px-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">PRO v2</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider font-extrabold uppercase mt-0.5 select-none">{t.subtitle}</p>
            </div>
          </div>

          {/* Bilingual Switcher and Actions */}
          <div className="flex items-center gap-2">
            
            {/* Language toggle flag button */}
            <button
              onClick={() => setLang(prev => prev === 'english' ? 'hmong' : prev === 'hmong' ? 'lao' : 'english')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all hover:border-slate-600 flex items-center gap-1.5 relative shadow-inner"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {lang === 'english' ? 'English / En' : lang === 'hmong' ? 'Hmoob / Hmong' : 'ພາສາລາວ / Lao'}
              </span>
            </button>

            {/* Reset button */}
            <button 
              onClick={() => {
                setPrompt('A beautiful traditional song about picking peach flowers during Hmong New year');
                setData(null);
                setStatus(AppStatus.IDLE);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-100 rounded-xl border border-slate-700 text-xs font-semibold max-sm:hidden transition-colors"
              title={t.reset_btn}
            >
              {t.reset_btn}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Creation Controls & Library (Span 5) */}
        <section className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Main Song Generator Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>{lang === 'english' ? "Create Custom Hmong Song" : "Tsim Txoj Nkauj Tshiab"}</span>
              </h2>
              <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Gemini 3.5
              </span>
            </div>

            {/* Topic text area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <label className="text-xs font-black tracking-wider text-slate-400 uppercase block">{t.topic_label}</label>
                
                <div className="flex items-center gap-2">
                  {/* AI Inspiration button */}
                  <button
                    onClick={() => {
                      const randomPrompt = INSPIRATION_IDEAS[Math.floor(Math.random() * INSPIRATION_IDEAS.length)];
                      setPrompt(lang === 'english' ? randomPrompt.en : lang === 'lao' ? randomPrompt.lao : randomPrompt.hmo);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all outline-none bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
                    title="Generate seasonal or trending Hmong song idea"
                  >
                    <Flame className="w-3 h-3 text-pink-400" />
                    <span>AI Inspiration</span>
                  </button>

                  {/* Voice dictation button */}
                  <button
                    onClick={isDictating ? stopDictation : startDictation}
                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all outline-none ${
                      isDictating
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-450 animate-pulse'
                        : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20'
                    }`}
                    title={isDictating ? t.dictation_stop : t.dictation_start}
                  >
                    {isDictating ? (
                      <MicOff className="w-3 h-3 text-rose-400 animate-pulse" />
                    ) : (
                      <Mic className="w-3 h-3 text-indigo-400" />
                    )}
                    <span>{isDictating ? t.dictation_stop : t.dictation_start}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.topic_placeholder}
                  className="w-full h-28 bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-inner"
                />
                {isDictating && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 bg-rose-500/20 border border-rose-500/30 rounded-lg text-[10px] text-rose-300 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>Listening...</span>
                  </div>
                )}
              </div>

              {dictationError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold leading-normal">
                  ⚠️ {dictationError}
                </div>
              )}
            </div>

            {/* Quick Inspiration Options */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">{t.quick_prompts}</span>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(lang === 'english' ? item.en : item.hmo)}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-xs text-slate-400 hover:text-slate-200 transition-all truncate block"
                  >
                    ✦ {lang === 'english' ? item.en : item.hmo}
                  </button>
                ))}
              </div>
            </div>

            {/* Music Preference Sliders / Dropdowns */}
            <div className="space-y-4 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase select-none">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'english' ? 'Adjust Music Dimensions' : 'Kho Cov Hom Nkauj'}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Mood Select */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.mood}</span>
                  <select
                    value={prefMood}
                    onChange={(e: any) => setPrefMood(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-350 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="sad">{lang === 'english' ? '😢 Sad / Tu Siab' : '😢 Tu Siab'}</option>
                    <option value="happy">{lang === 'english' ? '🥳 Upbeat / Zoo Siab' : '🥳 Zoo Siav'}</option>
                    <option value="romantic">{lang === 'english' ? '💖 Romance / Hlub' : '💖 Sib Hlub'}</option>
                    <option value="nostalgic">{lang === 'english' ? '🏔️ Nostalgic / Nco qub' : '🏔️ Nco Qub Chaw'}</option>
                  </select>
                </div>

                {/* Tempo Select */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.tempo}</span>
                  <select
                    value={prefTempo}
                    onChange={(e: any) => setPrefTempo(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-350 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="slow">{lang === 'english' ? 'Qeeb (Ballad)' : 'Qeeb (Ballad)'}</option>
                    <option value="medium">{lang === 'english' ? 'Nruab Nrab' : 'Nruab Nrab (Medium)'}</option>
                    <option value="fast">{lang === 'english' ? 'Ceev (Dance)' : 'Ceev (Pop)'}</option>
                  </select>
                </div>

                {/* Vibe Select */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.vibe}</span>
                  <select
                    value={prefVibe}
                    onChange={(e: any) => setPrefVibe(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-350 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="traditional">{lang === 'english' ? 'Raj / Classic' : 'Raj / Chaw Qub'}</option>
                    <option value="pop">{lang === 'english' ? 'Hmoob Pop' : 'Hmoob Pop'}</option>
                    <option value="modern">{lang === 'english' ? 'Hip-Hop R&B' : 'HipHop Hmoob'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleGenerate}
              disabled={status === AppStatus.GENERATING}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm transition-all focus:ring-2 focus:ring-indigo-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/10"
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-current animate-bounce" />
                  <span>{t.create_btn}</span>
                </>
              )}
            </button>

            {/* Error alerts */}
            {status === AppStatus.ERROR && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <p className="leading-relaxed">{t.error}</p>
              </div>
            )}
          </div>

          {/* User Song Library Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex-grow overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{t.saved_tracks} ({library.length})</span>
              </h3>
              
              {/* Favorites Filter Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showFavoritesOnly 
                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={showFavoritesOnly ? "Show All Tracks" : "Show Favorites Only"}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-rose-400' : ''}`} />
              </button>
            </div>

            {library.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl min-h-[140px]">
                <Music className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">{t.empty_library}</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[320px] custom-scrollbar flex-grow pr-1">
                {library
                  .filter(track => showFavoritesOnly ? track.isFavorite : true)
                  .map((track, idx) => {
                  const isActive = data?.title === track.title;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectTrack(track)}
                      className={`group p-3 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600/10 border-indigo-500/55 text-white' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'
                        }`}>
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black truncate">{track.hmongTitle || track.title}</p>
                          <p className="text-[10px] text-slate-500 truncate italic">{track.artist}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Favorite icon */}
                        <button
                          onClick={(e) => handleToggleFavorite(track.title, e)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            track.isFavorite
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 opacity-100'
                              : 'bg-slate-900/60 border-slate-800/40 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 hover:border-rose-500/20'
                          } active:scale-90`}
                          title="Toggle favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-400' : ''}`} />
                        </button>

                        {/* Delete icon */}
                        <button
                          onClick={(e) => handleDeleteTrack(track.title, e)}
                          className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/40 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 hover:border-rose-500/20 active:scale-90 transition-all"
                          title="Delete track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Active Workspace Player, Lyrics & Storyboard (Span 7) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Active Song Banner Header */}
          {data && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Vibe lighting block */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hmong-English Visual Song Ready</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {data.hmongTitle || data.title}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium select-none">
                    {lang === 'english' ? 'By Hmong Legend' : 'Hu los ntawm Hmoob Lo Lus'}: <span className="text-yellow-400 font-bold">{data.artist || 'Sua Vaj'}</span>
                  </p>
                </div>

                {/* Script Export & Lyrics Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLyrics}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-all relative flex items-center gap-1.5 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.export_lyrics}</span>
                    {showCopied && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-emerald-600 font-bold text-[10px] text-white rounded-md max-sm:w-28 text-center animate-bounce shadow-md">
                        {t.lyrics_copied}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadScript}
                    disabled={isDownloading}
                    className={`px-3.5 py-2 hover:bg-slate-755 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${isDownloading ? 'bg-slate-700 opacity-80 cursor-wait' : 'bg-slate-800'}`}
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-pink-400" />
                    )}
                    <span>{isDownloading ? (lang === 'hmong' ? 'Me ntsis...' : 'Generating PDF...') : t.export_storyboard}</span>
                  </button>
                </div>
              </div>

              {/* Story translation block */}
              <div className="mt-4 pt-4 border-t border-slate-800/60 leading-relaxed text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-extrabold text-slate-350">{lang === 'english' ? 'Song Meaning:' : 'Ntsiab Lus Nkauj:'}</span> "{data.theme}"
                </p>
              </div>
            </div>
          )}

          {/* Tab Selection Row */}
          {data && (
            <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-2xl flex text-sm">
              <button
                onClick={() => setActiveTab('karaoke')}
                className={`flex-1 py-3 rounded-xl font-black text-center flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'karaoke' 
                    ? 'bg-slate-800 text-white shadow-md border-b-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{t.tab_karaoke}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('storyboard')}
                className={`flex-1 py-3 rounded-xl font-black text-center flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'storyboard' 
                    ? 'bg-slate-800 text-white shadow-md border-b-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>{t.tab_storyboard}</span>
              </button>
            </div>
          )}

          {/* Workspaces Switch Screens */}
          {data ? (
            <div className="space-y-6">
              
              {/* Tab 1: Karaoke Singer Display */}
              {activeTab === 'karaoke' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <KaraokePreview
                    title={data.title}
                    hmongTitle={data.hmongTitle}
                    artist={data.artist}
                    lyrics={data.lyrics}
                    mood={prefMood}
                    tempo={prefTempo}
                  />

                  {/* Left-Right side view of full bilingual lyrics text sheet */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-800">
                      <Music className="w-4 h-4 text-indigo-400" />
                      <span>{lang === 'english' ? 'Lyrics Sheet (Hmong with English meaning)' : 'Daim Ntawv Qhia Lug Nkauj (Hmoob & En)'}</span>
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {data.lyrics?.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-3 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl hover:border-slate-800 transition-colors">
                          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/25 rounded-md text-indigo-400 text-slate-350">
                            {section.hmongSectionName} ({section.sectionName})
                          </span>
                          
                          <div className="space-y-2.5">
                            {section.lines.map((line, lIdx) => (
                              <div key={lIdx} className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-100">{line.text}</p>
                                <p className="text-[11px] text-slate-400 select-none italic">{line.translation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Storyboard Visualization & Emotional Chart */}
              {activeTab === 'storyboard' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  
                  {/* Recharts Mood intensity chart */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-1 shadow-xl">
                    <MoodChart scenes={data.scenes} />
                  </div>

                  {/* Scenes Grid Layout */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {data.scenes?.map((scene, idx) => (
                      <div key={idx} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/60 transition-all duration-300 shadow-lg hover:shadow-indigo-500/5">
                        
                        {/* Dynamic backdrop image */}
                        <div className="aspect-video relative overflow-hidden bg-slate-950">
                          <img 
                            src={scene.imageUrl} 
                            alt={scene.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none opacity-85"
                          />
                          
                          {/* Quick indicators */}
                          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white border border-white/10 shadow uppercase tracking-wider">
                            ⏱️ {scene.time}
                          </div>
                          <div className="absolute top-3 right-3 bg-pink-500/90 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow">
                            Mood: {scene.mood}%
                          </div>
                        </div>

                        {/* Scene Descriptions Card Content */}
                        <div className="p-5 space-y-3.5">
                          <div>
                            <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase block mb-1">
                              Scene {idx + 1} • Teeb Meem {idx + 1}
                            </span>
                            
                            {/* Poetic Hmong script description */}
                            <p className="text-white text-sm font-bold leading-normal italic">
                              "{scene.hmongDescription || 'Txuj duab sawv paj ntoos ntsuab'}"
                            </p>
                            
                            {/* Rich English storyboard text */}
                            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-medium">
                              {scene.description}
                            </p>
                          </div>

                          {/* Technical Camera Angle Visual Cue */}
                          <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2 text-slate-400">
                            <Compass className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] leading-normal font-semibold">
                              <span className="text-slate-300 font-extrabold">{lang === 'english' ? 'Camera Cue:' : 'Faj Thau Duab:'}</span> {scene.visualCue}
                            </p>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Production & Instrumental Insights details */}
                  {data.traditionalDetails && (
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950/30 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <Flame className="w-5 h-5 text-indigo-400 fill-current" />
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">{t.production_title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                        {data.traditionalDetails}
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            /* Standby State View */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center h-full min-h-[500px] flex flex-col justify-center items-center gap-4 animate-in fade-in duration-700">
              <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                <Music className="w-10 h-10 animate-bounce" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-xl font-bold text-white select-none">
                  {lang === 'english' ? 'Your Creative Studio Awaits' : 'Zoo siab txais tos koj tuaj tsim nkauj'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold select-none">
                  {lang === 'english' 
                    ? 'Enter a story description or select from our prompt ideas on the left. We will generate Hmong poetry lyrics with English translations, cultural production cues, and a complete cinematic storyboard film script.' 
                    : 'Sau koj cov ntsiab lus rau sab lauv tom qab ntawd nias "Tsim Txoj Nkauj". AI yuav pab koj teeb lug nkauj zoo nkauj thiab kos duab teeb rhuav tseg nrog suab karaoke mloog cuaj tias.'}
                </p>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Footer legalities */}
      <footer className="py-8 border-t border-slate-800/60 text-center text-slate-600 text-[11px] font-extrabold tracking-wide uppercase select-none mt-12 bg-slate-950/50">
        <p>© {new Date().getFullYear()} CHAW TSIM NKAUJ HMOOB (HMONG MV STUDIO) • ALL RIGHTS RESERVED • COV TXOJ LUG HMOOB POETRY</p>
      </footer>
    </div>
  );
};

export default App;
