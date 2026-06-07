import { useRef, useState, type FormEvent } from "react";
import {
  Compass,
  Flame,
  Waves,
  Zap,
  BookOpen,
  ChevronRight,
  Share2,
  Send,
  Sparkles,
  Bot,
  Play,
  Moon,
  Sun,
  User,
  Activity,
  Award,
  Book,
  PenTool,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  Mic,
  MicOff,
  Palette,
  Settings2,
  FileAudio,
  Check
} from "lucide-react";
import { Character, Message, ScrollChapter, MissionState, ArcSettings } from "./types";
import { DEFAULT_CHARACTER, BREATHING_STYLES, SCROLL_PRESETS, TRENDING_TECHNIQUES, ARCS, IMAGES } from "./data";

type AuthMode = "login" | "signup";
type AppTab = "remixTheme" | "remixSettings" | "remixVoice" | "discovery" | "training" | "library" | "intel";
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

const AUTH_STORAGE_KEY = "nichirin.currentUser";

const COMIC_THEMES = [
  {
    id: "demon-slayer",
    title: "鬼灭之刃",
    subtitle: "呼吸法、鬼杀队、血鬼术与柱训练",
    imageUrl: IMAGES.heroFlame,
    accent: "from-[#bd1020] to-[#ffb957]",
    settings: ["呼吸法", "日轮刀颜色", "鬼杀队阶级", "血鬼术对手", "任务地点"]
  },
  {
    id: "one-piece",
    title: "航海王",
    subtitle: "恶魔果实、霸气、海贼团与伟大航路",
    imageUrl: IMAGES.mangaTorii,
    accent: "from-[#1c7ced] to-[#ffb957]",
    settings: ["恶魔果实", "霸气类型", "船员定位", "岛屿生态", "悬赏身份"]
  },
  {
    id: "jujutsu",
    title: "咒术回战",
    subtitle: "术式、领域展开、咒具与高专任务",
    imageUrl: IMAGES.mangaEye,
    accent: "from-[#4f46e5] to-[#bd1020]",
    settings: ["天生术式", "领域展开", "咒具", "束缚条件", "任务等级"]
  }
];

const CORE_SETTING_OPTIONS: Record<string, string[]> = {
  "呼吸法": ["水之呼吸", "炎之呼吸", "雷之呼吸", "花之呼吸", "自创呼吸法"],
  "日轮刀颜色": ["漆黑", "赤红", "深蓝", "金黄", "渐变双色"],
  "鬼杀队阶级": ["癸", "庚", "甲", "继子", "柱候补"],
  "血鬼术对手": ["梦境操控", "蛛丝傀儡", "冰莲分身", "影子沼泽", "声音幻觉"],
  "任务地点": ["那田蜘蛛山", "无限列车", "蝶屋庭院", "浅草夜街", "雪山神社"],
  "恶魔果实": ["自然系", "超人系", "动物系", "幻兽种", "无果实剑士"],
  "霸气类型": ["见闻色", "武装色", "霸王色", "双霸气", "觉醒训练中"],
  "船员定位": ["航海士", "剑士", "狙击手", "船医", "考古学者"],
  "岛屿生态": ["空岛", "冬岛", "机械岛", "海底遗迹", "移动森林"],
  "悬赏身份": ["新人海贼", "革命军协力者", "海军卧底", "七武海候补", "失落王国后裔"],
  "天生术式": ["影法术", "咒言", "空间扭曲", "记忆燃烧", "自创术式"],
  "领域展开": ["静默剧场", "黑潮神社", "镜面牢笼", "星图病房", "未完成领域"],
  "咒具": ["短刀", "缠布长枪", "铃铛", "黑绳", "指环"],
  "束缚条件": ["夜晚增强", "不能说谎", "受伤后增幅", "保护他人时发动", "失去记忆换力量"],
  "任务等级": ["四级", "二级", "准一级", "一级", "特级调查"]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("remixTheme");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Remix flow state
  const [selectedThemeId, setSelectedThemeId] = useState(COMIC_THEMES[0].id);
  const [selectedCoreSetting, setSelectedCoreSetting] = useState(COMIC_THEMES[0].settings[0]);
  const [selectedCoreOption, setSelectedCoreOption] = useState(CORE_SETTING_OPTIONS[COMIC_THEMES[0].settings[0]][0]);
  const [voicePrompt, setVoicePrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Character state
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER);
  const [customTraitsInput, setCustomTraitsInput] = useState<string>(DEFAULT_CHARACTER.customTraits);
  const [charNameInput, setCharNameInput] = useState<string>(DEFAULT_CHARACTER.name);
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active Scroll states
  const [activeScroll, setActiveScroll] = useState<ScrollChapter>(SCROLL_PRESETS[0]);
  const [scrollPresets, setScrollPresets] = useState<ScrollChapter[]>(SCROLL_PRESETS);
  const [customScrollTitle, setCustomScrollTitle] = useState("");
  const [customScrollSummary, setCustomScrollSummary] = useState("");
  const [isGeneratingScroll, setIsGeneratingScroll] = useState(false);

  // Crow Messages Comment and Chat states
  const [comments, setComments] = useState([
    { username: "KINOE_USER", text: "この描写は本当に鳥肌が立つ。特に呼吸の表現が最高だ。", icon: "military_tech", color: "text-primary" },
    { username: "Mizunoto_44", text: "展開が早すぎて追いつけない！次が楽しみすぎる。", icon: "stars", color: "text-secondary" },
    { username: "Slayer_X", text: "最後のパネルの意味深な表情、伏線かな？", icon: "person", color: "text-outline" }
  ]);
  const [crowCommentInput, setCrowCommentInput] = useState("");
  
  // Bot panel state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "model",
      text: "CAW! CAW! GET READY, RECRUIT! I AM THE CORPS MESSENGER CROW! SHARE YOUR TRAINING SECRETS OR STATE YOUR EMERGENCY MISSION! CAW!",
      senderName: "鎹鴉 (Kasugai Crow)"
    }
  ]);
  const [isCrowLoading, setIsCrowLoading] = useState(false);

  // Intel Mission state
  const [selectedArc, setSelectedArc] = useState<"training" | "natagumo" | "mugen_train">("natagumo");
  const [atmosphere, setAtmosphere] = useState<"daylight" | "nocturnal">("nocturnal");
  const [breathingFocusLevel, setBreathingFocusLevel] = useState<number>(62);
  const [mission, setMission] = useState<MissionState>({
    isPlaying: false,
    arc: "natagumo",
    consequenceText: "",
    combatSceneText: "",
    statusUpdate: "",
    choices: [],
    isVictory: false,
    isDefeat: false,
    choiceHistory: [],
    isLoading: false
  });

  // Share Notification State
  const [sharedToast, setSharedToast] = useState(false);

  const selectedTheme = COMIC_THEMES.find((theme) => theme.id === selectedThemeId) || COMIC_THEMES[0];
  const selectedSettingOptions = CORE_SETTING_OPTIONS[selectedCoreSetting] || [];

  function selectRemixTheme(themeId: string) {
    const theme = COMIC_THEMES.find((item) => item.id === themeId) || COMIC_THEMES[0];
    const firstSetting = theme.settings[0];
    setSelectedThemeId(theme.id);
    setSelectedCoreSetting(firstSetting);
    setSelectedCoreOption(CORE_SETTING_OPTIONS[firstSetting]?.[0] || "");
  }

  function selectCoreSetting(setting: string) {
    setSelectedCoreSetting(setting);
    setSelectedCoreOption(CORE_SETTING_OPTIONS[setting]?.[0] || "");
  }

  function toggleVoiceInput() {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceError(null);

    if (!SpeechRecognitionCtor) {
      setVoiceError("当前浏览器不支持语音识别，可以先直接输入文字。");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join("");
      setVoicePrompt(transcript);
    };
    recognition.onerror = () => {
      setVoiceError("没有听清楚，请再试一次，或改用文字输入。");
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  }

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setCurrentUser(data.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      if (authMode === "signup") {
        setCharNameInput(data.user.name);
        setCharacter((prev) => ({ ...prev, name: data.user.name }));
      }
      setAuthName("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthMode("login");
    setAuthPassword("");
    setAuthError(null);
  }

  // Preset switchers
  const PRESETS_CHARACTER = [
    {
      name: "Tanjiro Kamado",
      japaneseTitle: "竈門 炭治郎",
      avatarUrl: IMAGES.profile1,
      breathingStyle: "Water Breathing",
      customTraits: "Kind-hearted, smelling faintly of coal, determined to protect his sister Nezuko.",
      vibe: "A serene, flowy water dragon aura overlaid with hints of sunlit warmth.",
      appearance: "Wearing a standard charcoal tactical uniform with a green and black checkered haori. Conspicuous forehead scar.",
      backstory: "Learning Urokodaki's techniques on Mt. Sagiri to slice demons.",
      totalConcentration: 85,
      stamina: 62,
      techniqueMastery: 40,
      techniques: DEFAULT_CHARACTER.techniques
    },
    {
      name: "Kyojuro Rengoku",
      japaneseTitle: "煉獄 杏寿郎",
      avatarUrl: IMAGES.profileSamuraiBeige,
      breathingStyle: "Flame Breathing",
      customTraits: "Extremely loud, passionate, honorable, with a massive hunger for sweet potatoes.",
      vibe: "A blinding, explosive crimson sunburst aura that heats up everything.",
      appearance: "Spiky yellow hair with red streaks, fire-patterned haori, red eyes, and a flame guard Nichirin.",
      backstory: "Rose to become the Flame Hashira through absolute rigorous focus. Fought to protect 200 passengers in Mugen Train.",
      totalConcentration: 100,
      stamina: 88,
      techniqueMastery: 95,
      techniques: [
        { name: "First Form: Unknowing Fire", kanji: "壱ノ型・不知火", description: "Charges forward at insane high speed, packing explosive flames around the unsheathed blade." },
        { name: "Second Form: Rising Scorching Sun", kanji: "弐ノ型・昇り炎天", description: "An upward circular slash that mimics the solar orbit arc, vaporizing oncoming threats." },
        { name: "Third Form: Blazing Universe", kanji: "参ノ型・気炎万象", description: "An explosive downward plunge of searing fiery focus." }
      ]
    },
    {
      name: "Zenitsu Agatsuma",
      japaneseTitle: "我妻 善逸",
      avatarUrl: IMAGES.profileSlayerRed,
      breathingStyle: "Thunder Breathing",
      customTraits: "Timid and paranoid when awake, but enters a lethal lightning-fast trance when unconscious.",
      vibe: "A crackling yellow thunderbolt flash of thunder.",
      appearance: "Yellow hair, yellow triangle-pattern haori, standard white belt. Lightning bolt decal on Nichirin blade.",
      backstory: "Trained under Jigoro Kuwajima. Only succeeded in mastering the First Form, but refined it to godspeed velocity.",
      totalConcentration: 85,
      stamina: 45,
      techniqueMastery: 30,
      techniques: [
        { name: "First Form: Thunderclap and Flash", kanji: "壱ノ型・霹靂一閃", description: "Dashes forward at lightning speed to draw and decapitate in a singular blind flash." },
        { name: "First Form: Godspeed", kanji: "壱ノ型・霹靂一閃・神速", description: "An advanced version allowing rapid consecutive dashes, although exhausting the feet." }
      ]
    }
  ];

  const handleApplyPreset = (index: number) => {
    const preset = PRESETS_CHARACTER[index];
    setCharacter(preset);
    setCharNameInput(preset.name);
    setCustomTraitsInput(preset.customTraits);
  };

  const updateStatsForBreathing = (styleId: string) => {
    let customStats = { totalConcentration: 85, stamina: 62, techniqueMastery: 40 };
    if (styleId === "Flame Breathing") {
      customStats = { totalConcentration: 90, stamina: 85, techniqueMastery: 75 };
    } else if (styleId === "Thunder Breathing") {
      customStats = { totalConcentration: 95, stamina: 50, techniqueMastery: 60 };
    } else if (styleId === "Beast Breathing") {
      customStats = { totalConcentration: 80, stamina: 80, techniqueMastery: 50 };
    }
    setCharacter(prev => ({
      ...prev,
      breathingStyle: styleId,
      ...customStats
    }));
  };

  // REST API: Trigger Gemini-powered Dynamic Character Creator
  async function generateCharacterAI() {
    setIsGeneratingChar(true);
    setApiError(null);
    try {
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: charNameInput,
          breathingStyle: character.breathingStyle,
          customTraits: customTraitsInput,
          totalConcentration: character.totalConcentration,
          stamina: character.stamina,
          techniqueMastery: character.techniqueMastery
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate character.");
      }

      const aiData = await response.json();
      
      setCharacter(prev => ({
        ...prev,
        name: charNameInput,
        japaneseTitle: aiData.japaneseTitle || "斬魔剣士",
        vibe: aiData.vibe || "A striking spiritual presence.",
        appearance: aiData.appearance || "Dressed in standard combat haori armor with custom styling.",
        backstory: aiData.backstory || "Learned techniques through intense training routines.",
        techniques: aiData.techniques || prev.techniques
      }));
    } catch (err: any) {
      console.warn("API Error, falling back to local simulation:", err);
      // Beautiful smart fallback character generation
      const mockForms = [
        { name: `First Form: ${character.breathingStyle.split(' ')[0]} Slash`, kanji: "壱ノ型・斬閃", description: `A high-pressure directional sweep imbued with raw ${character.breathingStyle} energy.` },
        { name: `Second Form: Heavenly ${character.breathingStyle.split(' ')[0]} Vortex`, kanji: "弐ノ型・渦巻", description: "Spins around to form an impenetrable barrier of beautiful sword strikes." },
        { name: `Third Form: Awoken Strike`, kanji: "参ノ型・覚醒", description: "Performs an dynamic leap to carry maximum leverage downward onto the opponent’s guard." }
      ];
      setCharacter(prev => ({
        ...prev,
        name: charNameInput,
        japaneseTitle: "豪傑の呼吸者",
        vibe: `A brilliant and sharp presence, evoking the pure spirit of ${character.breathingStyle}.`,
        backstory: `Formed by dangerous encounters in standard Taisho-era mountainsides, studying the ancestral foundations of ${character.breathingStyle}. This slayer developed an impeccable high-frequency swordsmanship and yearns to defeat Kibutsuji.`,
        techniques: mockForms
      }));
      setApiError("Using locally forged character details. Configure your GEMINI_API_KEY in secrets to activate real Gemini content creation!");
    } finally {
      setIsGeneratingChar(false);
    }
  }

  // REST API: Kasugai Crow Chat AI Integration
  async function sendCrowChat() {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: "user", text: chatInput, senderName: character.name };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsCrowLoading(true);

    try {
      const chatPayload = [...chatMessages, userMsg];
      const response = await fetch("/api/crow-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatPayload,
          characterStatus: {
            name: character.name,
            breathingStyle: character.breathingStyle,
            stamina: character.stamina,
            mastery: character.techniqueMastery,
            concentration: character.totalConcentration
          }
        })
      });

      if (!response.ok) throw new Error("Server communication broken.");
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "model", text: data.text, senderName: "鎹鴉 (Kasugai Crow)" }]);
    } catch (err: any) {
      // Elegant Crow fallback
      const randomScream = [
        `CAW! CAW! RECRUIT ${character.name.toUpperCase()}! THE BATTLE OF MOUNT NATAGUMO IS ESCALATING! RUN 100 LAPS IN YOUR ${character.breathingStyle.toUpperCase()} HAORI NOW! NO SLACKING! CAW!`,
        `MESSAGE! MESSAGE! CONCENTRATION LEVEL IS ONLY ${character.totalConcentration}%! COWARDLY DEMONS ARE SNEAKING IN THE NIGHT FORESTS! ROTATE THE BLADE! CAW!`,
        `CAW! IN THE TAISHO ERA, THOSE WHO DON'T TRAIN HARD GET CHIPPED BLADES! DRAW THE WATER AND SPIT FLAMES! BE GRATEFUL! CAW!`
      ];
      const selectedScream = randomScream[Math.floor(Math.random() * randomScream.length)];
      setChatMessages(prev => [...prev, { role: "model", text: selectedScream, senderName: "鎹鴉 (Kasugai Crow)" }]);
    } finally {
      setIsCrowLoading(false);
    }
  }

  // REST API: Custom lore Scroll Generator
  async function generateCustomScroll() {
    if (!customScrollTitle.trim()) return;
    setIsGeneratingScroll(true);
    try {
      const response = await fetch("/api/generate-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: customScrollTitle, summary: customScrollSummary })
      });

      if (!response.ok) throw new Error("Scroll generation failed.");
      const scrollData = await response.json();

      const newScroll: ScrollChapter = {
        id: "scroll_dynamic_" + Date.now(),
        chapterNumber: scrollData.chapterNumber || "特番第壱話",
        publishDate: scrollData.publishDate || "特別公開",
        title: customScrollTitle,
        japaneseTitle: "外伝記録",
        summary: customScrollSummary || "A customized tale generated dynamically.",
        japaneseStoryText: scrollData.japaneseStoryText || "その刻、剣士の刀身は熱を発し、激闘が幕を開けた。",
        englishSummary: scrollData.englishSummary || "An exclusive dynamic chapter tracing outstanding combat stories.",
        imageUrls: [IMAGES.mangaClash, IMAGES.mangaEye, IMAGES.mangaTorii]
      };

      setScrollPresets(prev => [newScroll, ...prev]);
      setActiveScroll(newScroll);
      setCustomScrollTitle("");
      setCustomScrollSummary("");
    } catch (err) {
      // Local fallback creation
      const fallbackLocal: ScrollChapter = {
        id: "scroll_dynamic_local_" + Date.now(),
        chapterNumber: "外伝特別巻",
        publishDate: "現地生成",
        title: customScrollTitle,
        japaneseTitle: "剣士外伝",
        summary: customScrollSummary || "An custom local scroll generated dynamically without secrets.",
        japaneseStoryText: `【外伝伝記】刀身に宿る ${character.breathingStyle}！

烈風が吹き荒れ、少年はただひたすらに刃を見つめし。呼吸は極限に達し、腕には漆黒の筋が浮き出す。

「一歩も引くまい！」激突の爆炎が生じる！`,
        englishSummary: `A marvelous tactical scroll dedicated to ${customScrollTitle}. Refined for swordsmanship practitioners.`,
        imageUrls: [IMAGES.mangaClash, IMAGES.mangaEye]
      };
      setScrollPresets(prev => [fallbackLocal, ...prev]);
      setActiveScroll(fallbackLocal);
      setCustomScrollTitle("");
      setCustomScrollSummary("");
    } finally {
      setIsGeneratingScroll(false);
    }
  }

  // Interactive Text-Adventure Mission Simulator Trigger
  async function startMissionGame(startingChoice?: string) {
    setMission(prev => ({ ...prev, isLoading: true, isPlaying: true }));
    try {
      const choicesSoFar = mission.choiceHistory;
      if (startingChoice) {
        choicesSoFar.push(startingChoice);
      }

      const response = await fetch("/api/run-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arc: selectedArc,
          character: {
            name: character.name,
            breathingStyle: character.breathingStyle,
            selectedTechnique: character.techniques[0]?.name || "First Form"
          },
          atmosphere,
          breathingFocus: breathingFocusLevel,
          choiceHistory: choicesSoFar
        })
      });

      if (!response.ok) throw new Error("Server simulated logic used.");
      const gameData = await response.json();

      setMission(prev => ({
        ...prev,
        consequenceText: gameData.consequenceText,
        combatSceneText: gameData.combatSceneText,
        statusUpdate: gameData.statusUpdate,
        choices: gameData.choices || [],
        isVictory: gameData.isVictory || false,
        isDefeat: gameData.isDefeat || false,
        choiceHistory: choicesSoFar,
        isLoading: false
      }));

    } catch (err) {
      // High stakes local text-adventure rules engine in case server isn't available
      const lastChoiceStr = startingChoice || "Initial arrival";
      let textState = "";
      let sceneState = "";
      let statusState = "Breathing status: Tense focused!";
      let victoryState = false;
      let defeatState = false;
      let optionsList = [
        { id: 1, text: `Unleash ${character.techniques[0]?.name || "First Form"} to strike with supreme elemental weight!` },
        { id: 2, text: "Observe the layout and step back into defensive guard stance." },
        { id: 3, text: "Grip the hilt and jump onto the tree branches to evade." }
      ];

      if (mission.choiceHistory.length === 0) {
        if (selectedArc === "natagumo") {
          textState = `You arrive at Mount Natagumo under the chilling ${atmosphere} gloom. Dense violet sticky spiderwebs hang over gnarled pine structures. You hear a chilling string melody echoing above.`;
          sceneState = `A puppeted demon slayer corpse, controlled by transparent string threads, suddenly lunges at you, swing a broken sword as spider mandibles click!`;
          statusState = "Total Concentration Level at 65%. Your sword flashes in response.";
        } else if (selectedArc === "mugen_train") {
          textState = "You board the whistling, nightmarish Mugen Train carriage. The engine room emits deep soot and the air smells intensely of sweet blood.";
          sceneState = "Enmu's giant biological tentacles start sprouting through the luggage racks, trying to strangle innocent sleeping civilians!";
          statusState = "Uncomfortable rattling vibes. Flame meter is rising!";
        } else {
          textState = "You stand inside the Butterfly Mansion bamboo courtyard. Shinobu Kocho monitors with a playful smile, asking you to crack a massive clay gourd.";
          sceneState = "A rigorous reflex challenge starts: water basins fly in rapid circles as Kanao Tsuyuri moves like a swift flash to pin you down!";
        }
      } else {
        const turnCount = mission.choiceHistory.length;
        if (turnCount >= 3) {
          // Final outcome
          if (Math.random() > 0.3) {
            victoryState = true;
            textState = `CRITICAL STRIKE DECISION! Backed by your amazing ${character.breathingStyle} mastery and concentration, your blade glows fully loaded and cleanly severs the demonic threat!`;
            sceneState = "With a massive explosion of element patterns, the demon dust evaporates cleanly as the sun's first dawn rays breach the forest canopy!";
            statusState = "VICTORY! The selection exam passes. The slayer corps congratulates your heroic feat!";
            optionsList = [];
          } else {
            defeatState = true;
            textState = "You ran out of blood oxygen focus, causing your sword strike to miss the central core!";
            sceneState = "The demon webs construct an absolute trap, bounding your blade and throwing you to the hard floor!";
            statusState = "DEFEAT! Re-train your Breathing stats and try again.";
            optionsList = [];
          }
        } else {
          textState = `You executed: "${lastChoiceStr}". It created massive kinetic friction, but the threat quickly adapts, taking a swift counter posture in the Taisho shadows!`;
          sceneState = "A secondary hazard emerges from the rear! A large spider-family shadow sweeps in carrying poison gas!";
          statusState = `Stamina state: ${character.stamina - (turnCount * 10)}%. Concentration calibrated.`;
        }
      }

      setMission(prev => ({
        ...prev,
        consequenceText: textState,
        combatSceneText: sceneState,
        statusUpdate: statusState,
        choices: optionsList,
        isVictory: victoryState,
        isDefeat: defeatState,
        choiceHistory: mission.choiceHistory,
        isLoading: false
      }));
    }
  }

  const resetMission = () => {
    setMission({
      isPlaying: false,
      arc: selectedArc,
      consequenceText: "",
      combatSceneText: "",
      statusUpdate: "",
      choices: [],
      isVictory: false,
      isDefeat: false,
      choiceHistory: [],
      isLoading: false
    });
  };

  const notifyShare = () => {
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2500);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#131313] text-[#e5e2e1] ichimatsu-bg selection:bg-[#ffb3ad] selection:text-[#68000a]">
        <main className="min-h-screen max-w-6xl mx-auto px-4 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <section className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-3 bg-[#201f1f] border border-[#5c403d] px-4 py-2">
              <ShieldCheck className="w-5 h-5 text-[#ffb3ad]" />
              <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase tracking-widest">Corps Access</span>
            </div>
            <div>
              <h1 className="font-headline-xl text-5xl md:text-7xl text-[#ffdad7] italic leading-none tracking-tight">
                NICHIRIN
              </h1>
              <p className="mt-4 max-w-xl text-[#e5bdba] text-sm md:text-base leading-relaxed">
                Sign in to keep your slayer profile, story scrolls, and mission progress under your own account.
              </p>
            </div>
            <div className="relative overflow-hidden border-2 border-[#5c403d] bg-black min-h-[320px] slash-corner-md">
              <img src={IMAGES.heroFlame} alt="Nichirin flame mission artwork" className="absolute inset-0 w-full h-full object-cover opacity-55" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#5c403d] bg-black/45">
                <p className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">Active Archive</p>
                <p className="text-white text-lg font-bold mt-1">Training, Library, Discovery, and Intel</p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6">
            <div className="bg-[#1c1b1b] border-2 border-[#5c403d] p-6 md:p-8 bevel-card">
              <div className="flex bg-black border border-[#5c403d] p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                  className={`flex-1 h-11 text-xs font-bold font-label-sm uppercase flex items-center justify-center gap-2 transition-all ${
                    authMode === "login" ? "bg-[#bd1020] text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                  }}
                  className={`flex-1 h-11 text-xs font-bold font-label-sm uppercase flex items-center justify-center gap-2 transition-all ${
                    authMode === "signup" ? "bg-[#bd1020] text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="font-label-sm text-[10px] text-gray-300 block mb-1 uppercase">Display Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-3 text-white focus:outline-none focus:border-[#ffb3ad] font-label-sm"
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="font-label-sm text-[10px] text-gray-300 block mb-1 uppercase">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-3 text-white focus:outline-none focus:border-[#ffb3ad] font-label-sm"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="font-label-sm text-[10px] text-gray-300 block mb-1 uppercase">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-3 text-white focus:outline-none focus:border-[#ffb3ad] font-label-sm"
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                    minLength={6}
                    required
                  />
                </div>

                {authError && (
                  <div className="bg-[#bd1020]/20 border border-[#bd1020] text-[#ffb3ad] px-3 py-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full h-14 bg-[#bd1020] hover:brightness-110 disabled:opacity-60 text-white font-headline-md text-xs tracking-widest font-black flex items-center justify-center gap-3 border-t-2 border-[#ffb3ad] active:scale-[0.99] transition-all"
                >
                  {isAuthLoading ? (
                    <>
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      PROCESSING
                    </>
                  ) : authMode === "signup" ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      CREATE ACCOUNT
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      ENTER APP
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div id="nichirin-app-root" className="min-h-screen bg-[#131313] text-[#e5e2e1] font-body-md overflow-x-hidden pb-24 md:pb-8 selection:bg-[#ffb3ad] selection:text-[#68000a]">
      
      {/* Dynamic API Call Warning alert, only pops if there's constructive info */}
      {apiError && (
        <div id="api-warning-banner" className="bg-[#bd1020] text-white py-3 px-6 text-sm flex justify-between items-center z-[100] gap-4">
          <div className="flex items-center gap-2 font-label-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
          <button className="text-white hover:opacity-80 font-bold px-2 py-1" onClick={() => setApiError(null)}>Dismiss</button>
        </div>
      )}

      {/* Share dialog prompt overlay */}
      {sharedToast && (
        <div id="share-toast-bubble" className="fixed bottom-24 right-6 md:bottom-12 md:right-12 bg-[#bd1020] text-white px-6 py-4 border-2 border-[#ffb3ad] shadow-2xl z-[90] font-label-sm flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>MESSAGE FORWARDED TO CROW TRANSMITTERS!</span>
        </div>
      )}

      {/* TopAppBar header */}
      <header id="app-top-bar" className="sticky top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-16 bg-[#131313] border-b-2 border-[#5c403d] shadow-md">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#ffb3ad] text-2xl hidden md:inline">swords</span>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-black text-[#ffb3ad] tracking-tighter italic select-none">
            NICHIRIN
          </h1>
        </div>
        
        {/* Preset profiles picker triggers inside header */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 border border-[#5c403d] bg-black/30 px-3 py-2">
            <User className="w-4 h-4 text-[#ffb3ad]" />
            <div className="leading-none">
              <span className="font-label-sm text-[9px] text-gray-400 uppercase block">Signed in</span>
              <span className="font-label-sm text-[11px] text-white max-w-32 truncate block">{currentUser.name}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center border border-[#5c403d] text-[#ffb3ad] hover:bg-[#bd1020] hover:text-white transition-all"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase opacity-70 hidden lg:inline">Quick presets:</span>
          <div className="flex gap-2">
            {PRESETS_CHARACTER.map((preset, idx) => (
              <button 
                key={preset.name}
                id={`preset-btn-${idx}`}
                className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all duration-300 ${character.name === preset.name ? "border-[#ffb3ad] scale-110" : "border-gray-600 hover:border-[#ffb3ad] opacity-65"}`}
                onClick={() => handleApplyPreset(idx)}
                title={`Switch to preset ${preset.name}`}
              >
                <img src={preset.avatarUrl} alt={preset.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="w-1 bg-[#5c403d] h-8 mx-2 hidden lg:block"></div>
          <span className="font-label-sm text-sm text-[#ffb3ad] hidden lg:inline">{character.japaneseTitle}</span>
        </div>
      </header>

      <main id="app-main-content" className="max-w-7xl mx-auto px-4 py-6 md:py-12 min-h-[calc(100vh-140px)]">
        {["remixTheme", "remixSettings", "remixVoice"].includes(activeTab) && (
          <div className="mb-8 border border-[#5c403d] bg-[#1c1b1b] p-3 md:p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "remixTheme", label: "选择主题", icon: Palette },
                { id: "remixSettings", label: "核心设定", icon: Settings2 },
                { id: "remixVoice", label: "语音二创", icon: FileAudio }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveTab(step.id as AppTab)}
                    className={`h-14 md:h-16 flex items-center justify-center gap-2 border text-xs md:text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#bd1020] border-[#ffb3ad] text-white"
                        : "bg-black/40 border-[#5c403d] text-[#e5bdba] hover:border-[#ffb3ad]"
                    }`}
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-black/30 text-[10px]">{index + 1}</span>
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* REMIX PAGE 1: choose comic theme */}
        {activeTab === "remixTheme" && (
          <div id="remix-theme-page" className="space-y-8 animate-fade-in">
            <section className="relative min-h-[300px] md:min-h-[380px] overflow-hidden border-2 border-[#5c403d] slash-corner-md flex items-end p-6 md:p-10">
              <img src={selectedTheme.imageUrl} alt={selectedTheme.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/70 to-transparent"></div>
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-2 bg-[#bd1020] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  <Sparkles className="w-3 h-3" />
                  二创向导
                </span>
                <h2 className="mt-4 font-headline-xl text-4xl md:text-6xl text-white tracking-tight">
                  选择你想二创的漫画主题
                </h2>
                <p className="mt-4 text-[#e5bdba] text-sm md:text-base leading-relaxed max-w-2xl">
                  先确定世界观方向，后面会根据主题给出对应的核心设定与语音创作入口。
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {COMIC_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectRemixTheme(theme.id)}
                  className={`group text-left border-2 bg-[#1c1b1b] overflow-hidden transition-all bevel-card ${
                    selectedThemeId === theme.id ? "border-[#bd1020]" : "border-[#5c403d] hover:border-[#ffb3ad]"
                  }`}
                >
                  <div className="relative h-48 bg-black overflow-hidden">
                    <img src={theme.imageUrl} alt={theme.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${theme.accent} opacity-60`}></div>
                    {selectedThemeId === theme.id && (
                      <span className="absolute top-3 right-3 w-8 h-8 bg-[#bd1020] border border-[#ffb3ad] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-white text-xl font-bold">{theme.title}</h3>
                    <p className="mt-2 text-xs text-[#e5bdba] leading-relaxed">{theme.subtitle}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {theme.settings.slice(0, 3).map((setting) => (
                        <span key={setting} className="px-2 py-1 bg-black border border-[#5c403d] text-[10px] text-gray-300">
                          {setting}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("remixSettings")}
                className="px-8 py-4 bg-[#bd1020] text-white font-bold text-sm flex items-center gap-3 border-t-2 border-[#ffb3ad] hover:brightness-110"
              >
                下一步：选择核心设定
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* REMIX PAGE 2: choose core setting */}
        {activeTab === "remixSettings" && (
          <div id="remix-settings-page" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <aside className="lg:col-span-4 bg-[#1c1b1b] border-2 border-[#5c403d] p-5 bevel-card">
              <div className="relative h-56 overflow-hidden border border-[#5c403d] bg-black">
                <img src={selectedTheme.imageUrl} alt={selectedTheme.title} className="w-full h-full object-cover opacity-65" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] text-[#ffb3ad] font-bold uppercase">当前主题</p>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedTheme.title}</h2>
                  <p className="text-xs text-[#e5bdba] mt-2">{selectedTheme.subtitle}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {selectedTheme.settings.map((setting) => (
                  <button
                    key={setting}
                    type="button"
                    onClick={() => selectCoreSetting(setting)}
                    className={`w-full px-4 py-3 border text-left text-sm font-bold transition-all flex items-center justify-between ${
                      selectedCoreSetting === setting
                        ? "bg-[#bd1020] border-[#ffb3ad] text-white"
                        : "bg-black/40 border-[#5c403d] text-[#e5bdba] hover:border-[#ffb3ad]"
                    }`}
                  >
                    <span>{setting}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </aside>

            <section className="lg:col-span-8 space-y-6">
              <div className="border-l-8 border-[#bd1020] pl-5">
                <p className="text-[10px] text-[#ffb3ad] font-bold uppercase">核心设定</p>
                <h2 className="mt-2 text-3xl md:text-5xl font-headline-xl text-white">
                  选择「{selectedCoreSetting}」的二创方向
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSettingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedCoreOption(option)}
                    className={`min-h-28 text-left p-5 border-2 transition-all bevel-card ${
                      selectedCoreOption === option
                        ? "border-[#bd1020] bg-[#bd1020]/15"
                        : "border-[#5c403d] bg-[#1c1b1b] hover:border-[#ffb3ad]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white text-lg font-bold">{option}</p>
                        <p className="mt-2 text-xs text-[#e5bdba] leading-relaxed">
                          将它作为故事的能力源、冲突规则或角色身份基础。
                        </p>
                      </div>
                      {selectedCoreOption === option && (
                        <span className="w-8 h-8 bg-[#bd1020] border border-[#ffb3ad] flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#201f1f] border border-[#5c403d] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-[#ffb3ad] font-bold uppercase">已选择</p>
                  <p className="mt-1 text-white text-sm">
                    {selectedTheme.title} / {selectedCoreSetting} / {selectedCoreOption}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("remixTheme")}
                    className="px-5 py-3 border border-[#5c403d] text-[#e5bdba] text-xs font-bold hover:border-[#ffb3ad]"
                  >
                    返回主题
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("remixVoice")}
                    className="px-6 py-3 bg-[#bd1020] text-white text-xs font-bold flex items-center gap-2 border-t-2 border-[#ffb3ad] hover:brightness-110"
                  >
                    下一步：语音二创
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* REMIX PAGE 3: voice personalization */}
        {activeTab === "remixVoice" && (
          <div id="remix-voice-page" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <section className="lg:col-span-7 bg-[#1c1b1b] border-2 border-[#5c403d] p-6 md:p-8 bevel-card">
              <div className="flex items-center justify-between gap-4 border-b border-[#5c403d] pb-5">
                <div>
                  <p className="text-[10px] text-[#ffb3ad] font-bold uppercase">个性化二创内容</p>
                  <h2 className="mt-2 text-3xl md:text-5xl font-headline-xl text-white">用语音说出你的脑洞</h2>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`w-16 h-16 flex items-center justify-center border-2 transition-all ${
                    isListening
                      ? "bg-[#bd1020] border-[#ffb3ad] text-white animate-pulse"
                      : "bg-black border-[#5c403d] text-[#ffb3ad] hover:border-[#ffb3ad]"
                  }`}
                  title={isListening ? "停止录音" : "开始录音"}
                >
                  {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <textarea
                  rows={9}
                  value={voicePrompt}
                  onChange={(e) => setVoicePrompt(e.target.value)}
                  placeholder="例如：主角是一个害怕战斗但能听见刀声的人，他想用炎之呼吸保护妹妹。故事要热血一点，结尾留下悬念。"
                  className="w-full bg-[#0e0e0e] border border-[#5c403d] px-4 py-4 text-white text-sm leading-relaxed focus:outline-none focus:border-[#ffb3ad]"
                />

                {voiceError && (
                  <div className="bg-[#bd1020]/20 border border-[#bd1020] text-[#ffb3ad] px-4 py-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["更热血", "更搞笑", "更虐心"].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setVoicePrompt((prev) => `${prev}${prev ? "\n" : ""}希望整体风格：${tone}。`)}
                      className="px-4 py-3 bg-black/50 border border-[#5c403d] text-xs text-[#e5bdba] font-bold hover:border-[#ffb3ad]"
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="lg:col-span-5 space-y-5">
              <div className="relative h-72 overflow-hidden border-2 border-[#5c403d] slash-corner-md bg-black">
                <img src={selectedTheme.imageUrl} alt={selectedTheme.title} className="w-full h-full object-cover opacity-55" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[10px] text-[#ffb3ad] font-bold uppercase">二创摘要</p>
                  <h3 className="mt-2 text-2xl text-white font-bold">{selectedTheme.title}</h3>
                  <p className="mt-2 text-sm text-[#e5bdba]">{selectedCoreSetting}：{selectedCoreOption}</p>
                </div>
              </div>

              <div className="bg-[#201f1f] border border-[#5c403d] p-5">
                <p className="text-[10px] text-[#ffb3ad] font-bold uppercase mb-3">生成提示词预览</p>
                <div className="bg-black/50 border border-[#5c403d] p-4 text-xs text-[#e5bdba] leading-relaxed whitespace-pre-line min-h-44">
                  漫画主题：{selectedTheme.title}
                  {"\n"}核心设定：{selectedCoreSetting} - {selectedCoreOption}
                  {"\n"}用户个性化内容：{voicePrompt || "等待语音或文字输入..."}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("remixSettings")}
                  className="flex-1 px-5 py-4 border border-[#5c403d] text-[#e5bdba] text-xs font-bold hover:border-[#ffb3ad]"
                >
                  返回设定
                </button>
                <button
                  type="button"
                  onClick={notifyShare}
                  className="flex-1 px-5 py-4 bg-[#bd1020] text-white text-xs font-bold border-t-2 border-[#ffb3ad] hover:brightness-110"
                >
                  保存二创草稿
                </button>
              </div>
            </aside>
          </div>
        )}
        
        {/* TAB 1: TRAINING - Character Creator */}
        {activeTab === "training" && (
          <div id="training-tab-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Side: Avatar & Stat Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative bg-[#201f1f] p-6 border-2 border-[#5c403d] bevel-card">
              <div className="absolute inset-0 ichimatsu-pattern opacity-15 pointer-events-none"></div>
              
              <div className="relative w-full max-w-sm aspect-[3/4] flex items-center justify-center overflow-hidden border border-[#5c403d] bg-black bg-opacity-40">
                
                {/* Visual Aura Frame based on breathing style */}
                <div className={`aura-glow w-full h-full flex items-center justify-center transition-all duration-500`}>
                  <img 
                    src={IMAGES.silhouette} 
                    alt="Character silhouette overlay" 
                    className={`max-h-full object-contain mix-blend-screen transition-all ${
                      character.breathingStyle === "Water Breathing" ? "hue-rotate-180 brightness-110" : 
                      character.breathingStyle === "Thunder Breathing" ? "hue-rotate-60" :
                      character.breathingStyle === "Beast Breathing" ? "contrast-125 saturate-50" : ""
                    }`} 
                  />
                </div>

                {/* Overlay details */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                  <span className="font-label-sm text-[10px] bg-[#ffb3ad] text-[#6aa010] border border-[#68000a] text-black px-2 py-0.5 font-bold">
                    {character.breathingStyle.toUpperCase()}
                  </span>
                  <span className="text-white text-md font-bold text-shadow">{character.name}</span>
                </div>

                {/* Japanese traditional label banner */}
                <div className="absolute bottom-6 left-0 bg-[#bd1020] px-6 py-2 transform -rotate-2 border-2 border-[#ffb3ad] shadow-xl z-20">
                  <span className="font-headline-md text-white text-lg tracking-widest">{character.japaneseTitle}</span>
                </div>
              </div>

              {/* Dynamic Lorentz Text info */}
              <div className="w-full mt-6 p-4 bg-[#131313] border border-[#5c403d] rounded-none">
                <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">Vibe Meter:</span>
                <p className="text-[#e5bdba] text-sm italic mt-1 leading-relaxed">"{character.vibe}"</p>
                
                <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase block mt-3">Visual description:</span>
                <p className="text-gray-300 text-xs mt-1 leading-relaxed">{character.appearance}</p>
              </div>

              {/* Sliders Section */}
              <div className="w-full mt-6 space-y-4 bg-[#201f1f] p-4 border border-[#5c403d] relative">
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="font-label-sm text-[10px] uppercase text-[#ffb3ad]">Total Concentration Level</label>
                    <span className="font-label-sm text-[10px] text-[#ffb3ad]">全集中・常中: {character.totalConcentration}%</span>
                  </div>
                  <div className="h-4 w-full bg-black border border-[#5c403d] relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#bd1020] to-[#ffb3ad]" style={{ width: `${character.totalConcentration}%` }}></div>
                    <div className="absolute top-0 left-0 h-full w-full breathing-bar-segment opacity-40"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="font-label-sm text-[10px] uppercase text-secondary">Stamina</label>
                    <span className="font-label-sm text-[10px] text-secondary">スタミナ: {character.stamina}%</span>
                  </div>
                  <div className="h-4 w-full bg-black border border-[#5c403d] relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#1c7ced]" style={{ width: `${character.stamina}%` }}></div>
                    <div className="absolute top-0 left-0 h-full w-full opacity-35" style={{ backgroundImage: "linear-gradient(90deg, black 70%, transparent 70%)", backgroundSize: "10px 100%" }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="font-label-sm text-[10px] uppercase text-[#ffb957]">Technique Mastery</label>
                    <span className="font-label-sm text-[10px] text-[#ffb957]">型習得度: {character.techniqueMastery}%</span>
                  </div>
                  <div className="h-4 w-full bg-black border border-[#5c403d] relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#ffb957]" style={{ width: `${character.techniqueMastery}%` }}></div>
                    <div className="absolute top-0 left-0 h-full w-full opacity-35" style={{ backgroundImage: "linear-gradient(90deg, black 70%, transparent 70%)", backgroundSize: "10px 100%" }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Style Selection and Details Custom Form */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Manual inputs cards */}
              <div className="bg-[#1c1b1b] border-2 border-[#5c403d] p-6 bevel-card">
                <h3 className="font-headline-md text-[#ffb3ad] text-xl border-l-4 border-[#bd1020] pl-3 mb-4 uppercase">
                  RE-FORGE CHARACTER BIOGRAPHY
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-label-sm text-[10px] text-gray-300 block mb-1">CHOOSE WARRIOR NAME</label>
                    <input 
                      type="text" 
                      value={charNameInput}
                      onChange={(e) => setCharNameInput(e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-2 text-white focus:outline-none focus:border-[#ffb3ad] font-label-sm"
                    />
                  </div>

                  <div>
                    <label className="font-label-sm text-[10px] text-gray-300 block mb-1">PERSONAL TRAITS (INFLUENCES IA STORY)</label>
                    <textarea 
                      rows={2}
                      value={customTraitsInput}
                      onChange={(e) => setCustomTraitsInput(e.target.value)}
                      placeholder="Insert personality notes, favorite meals or unique habits of your samurai slayer"
                      className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ffb3ad] leading-relaxed"
                    />
                  </div>

                  {/* Manual stat tweaking buttons to let user feel full ownership */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button 
                      onClick={() => setCharacter(p => ({ ...p, totalConcentration: Math.min(100, p.totalConcentration + 5) }))} 
                      className="px-2 py-2 bg-[#2a2a2a] hover:bg-[#353534] border border-[#5c403d] text-xs font-label-sm font-bold block"
                    >
                      + CONCENTRATION
                    </button>
                    <button 
                      onClick={() => setCharacter(p => ({ ...p, stamina: Math.min(100, p.stamina + 5) }))} 
                      className="px-2 py-2 bg-[#2a2a2a] hover:bg-[#353534] border border-[#5c403d] text-xs font-label-sm font-bold block"
                    >
                      + STAMINA
                    </button>
                    <button 
                      onClick={() => setCharacter(p => ({ ...p, techniqueMastery: Math.min(100, p.techniqueMastery + 5) }))} 
                      className="px-2 py-2 bg-[#2a2a2a] hover:bg-[#353534] border border-[#5c403d] text-xs font-label-sm font-bold block"
                    >
                      + MASTERY
                    </button>
                  </div>
                </div>
              </div>

              {/* Title Header */}
              <div>
                <h2 className="font-headline-xl text-3xl md:text-5xl text-[#ffdad7] tracking-tighter italic leading-none">
                  SELECT YOUR BREATHING STYLE
                </h2>
                <p className="font-headline-md text-md text-[#e5bdba] mt-2 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#bd1020]"></span>
                  全集中の呼吸を選択
                </p>
              </div>

              {/* Breathing Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BREATHING_STYLES.map((style) => (
                  <div 
                    key={style.id}
                    id={`style-card-${style.id}`}
                    onClick={() => updateStatsForBreathing(style.id)}
                    className={`group relative overflow-hidden border-2 bevel-card p-5 cursor-pointer transition-all duration-300 ${
                      character.breathingStyle === style.id ? "border-[#bd1020] bg-[#bd1020] bg-opacity-10 border-l-[10px]" : "border-[#5c403d] bg-[#2a2a2a] hover:border-white"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                      <div className={`w-full h-full ${style.wavesColor}`} style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`material-symbols-outlined text-3xl ${style.textColor}`}>
                          {style.icon}
                        </span>
                        {character.breathingStyle === style.id && (
                          <span className="bg-[#bd1020] text-white px-2 py-0.5 rounded-none text-[8px] font-bold tracking-widest leading-none">
                            ✓ ACTIVE
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`font-headline-md text-lg text-white`}>{style.id}</h3>
                      <p className={`font-label-sm text-[11px] text-[#e5bdba] mb-3`}>{style.japanese}</p>
                      
                      <div className="h-[1px] w-full bg-[#5c403d] mb-3 opacity-50"></div>
                      <p className="font-body-md text-xs text-gray-300 italic leading-relaxed">{style.tags}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic generated lore backstory blocks */}
              <div className="bg-[#201f1f] border border-[#5c403d] p-6 text-sm">
                <div className="flex items-center gap-2 border-b border-[#5c403d] pb-2 mb-3">
                  <BookOpen className="w-5 h-5 text-[#ffb3ad]" />
                  <span className="font-label-sm text-[10px] text-[#ffb3ad] font-bold block">CHARACTER CHRONICLES & LORE BOOK</span>
                </div>
                <p className="text-[#e5bdba] leading-relaxed text-xs text-justify italic mb-4">
                  {character.backstory}
                </p>

                <span className="font-label-sm text-[10px] text-[#ffb3ad] block mb-2">BREATHING TECHNIQUES MASTERED:</span>
                <div className="space-y-3">
                  {character.techniques.map((tech, idx) => (
                    <div key={idx} className="bg-[#131313] p-3 border-l-2 border-[#bd1020]">
                      <div className="flex justify-between">
                        <span className="font-bold text-xs text-white">{tech.name}</span>
                        <span className="font-label-sm text-[10px] text-[#ffb3ad]">{tech.kanji}</span>
                      </div>
                      <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">{tech.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AWAKEN ACTION BUTTON */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[#5c403d]">
                <p className="font-label-sm text-xs text-[#ffb3ad] opacity-80 animate-pulse">
                  PREPARE FOR THE SELECTION EXAM...
                </p>

                <button 
                  id="awaken-blade-trigger"
                  disabled={isGeneratingChar}
                  onClick={generateCharacterAI}
                  className="w-full md:w-auto px-10 py-5 bg-[#bd1020] hover:brightness-110 active:scale-95 transition-all outline-none font-bold relative group border-t-2 border-[#ffcd9a] select-none"
                >
                  <div className="flex items-center gap-3 justify-center text-white">
                    {isGeneratingChar ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        <span className="font-headline-md tracking-wider text-sm font-black">FORGING VIA GEMINI INTEL...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col text-right leading-none">
                          <span className="font-headline-md text-sm leading-none font-black block">AWAKEN YOUR BLADE</span>
                          <span className="font-headline-md text-[10px] italic opacity-80 block mt-1">刀を振るえ</span>
                        </div>
                        <span className="material-symbols-outlined text-2xl">swords</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: DISCOVERY - Chronicles & Archives */}
        {activeTab === "discovery" && (
          <div id="discovery-tab-view" className="space-y-8 animate-fade-in">
            {/* Hero Section: Featured Chapter Banner */}
            <section className="relative w-full min-h-[420px] bg-gradient-to-t from-black via-transparent to-transparent flex items-end overflow-hidden slash-corner-md border-2 border-[#5c403d] p-6 md:p-12 shadow-2xl">
              <div className="absolute inset-0 z-0 select-none">
                <img src={IMAGES.heroFlame} alt="Slayer Hashira of Flame art" className="w-full h-full object-cover opacity-50 scale-102 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/50 to-transparent"></div>
                <div className="absolute inset-0 asanoha-overlay opacity-25"></div>
              </div>

              <div className="relative z-10 max-w-2xl">
                <div className="inline-block px-3 py-1 bg-[#bd1020] text-white font-label-sm text-[10px] uppercase font-bold tracking-widest mb-3">
                  {activeScroll.japaneseTitle}
                </div>
                <h2 className="font-headline-xl text-3xl md:text-5xl text-white mb-3">
                  {activeScroll.title}
                </h2>
                <p className="font-body-lg text-sm md:text-md text-[#e5bdba] mb-6 leading-relaxed">
                  {activeScroll.summary}
                </p>

                <button 
                  onClick={() => {
                    setActiveTab("library");
                  }}
                  className="bg-[#bd1020] hover:bg-opacity-95 text-white shadow-xl px-6 py-4 font-headline-md text-xs flex items-center gap-3 active:scale-95 transition-all select-none border-t-2 border-white/20"
                >
                  <span>READ SCROLL CANVAS</span>
                  <span className="material-symbols-outlined text-sm">auto_stories</span>
                </button>
              </div>
            </section>

            {/* AI Custom Chapter Generator Block */}
            <div className="bg-[#1c1b1b] border-2 border-[#5c403d] p-6 bevel-card">
              <h3 className="font-headline-md text-[#ffb3ad] text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffb3ad] animate-pulse" />
                INVENT A NEW STORY SCROLL VIA GEMINI
              </h3>
              <p className="text-gray-400 text-xs mb-4">
                Input any custom theme or event (e.g., "Thunder meets Flame", "The Rain Demon’s Ambush") to compile a poetry scrolls.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text"
                  placeholder="Thematic scroll Title (e.g. 幻の第十二刀)"
                  value={customScrollTitle}
                  onChange={(e) => setCustomScrollTitle(e.target.value)}
                  className="flex-1 bg-[#0e0e0e] border border-[#5c403d] px-3 py-2 text-white text-xs font-label-sm focus:outline-none"
                />
                <input 
                  type="text"
                  placeholder="A short story summary..."
                  value={customScrollSummary}
                  onChange={(e) => setCustomScrollSummary(e.target.value)}
                  className="flex-[2] bg-[#0e0e0e] border border-[#5c403d] px-3 py-2 text-white text-xs font-label-sm focus:outline-none"
                />
                <button 
                  disabled={isGeneratingScroll || !customScrollTitle}
                  onClick={generateCustomScroll}
                  className="bg-[#bd1020] hover:brightness-110 px-6 py-2 text-xs font-bold text-white select-none whitespace-nowrap"
                >
                  {isGeneratingScroll ? "COMPILES..." : "WRITE SCROLL"}
                </button>
              </div>
            </div>

            {/* Categories Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scrollPresets.slice(0, 3).map((preset, index) => (
                <div 
                  key={preset.id}
                  onClick={() => setActiveScroll(preset)}
                  className={`border-2 p-6 transition-all duration-300 bevel-card cursor-pointer group ${
                    activeScroll.id === preset.id ? "border-[#bd1020] bg-[#bd1020] bg-opacity-5" : "border-[#5c403d] bg-[#1c1b1b] hover:border-[#ffb3ad]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-[#ffb3ad] text-3xl">
                      {index === 0 ? "fitness_center" : index === 1 ? "visibility" : "history_edu"}
                    </span>
                    <span className="font-label-sm text-xs opacity-50">0{index+1}</span>
                  </div>
                  <h3 className="font-headline-md text-lg text-white mb-2 group-hover:text-[#ffb3ad] transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                    {preset.summary}
                  </p>
                </div>
              ))}
            </div>

            {/* Trending Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-4 border-[#bd1020] pb-2">
                <h3 className="font-headline-md text-xl text-[#ffb3ad]">注目の技と物語</h3>
                <span className="font-label-sm text-[10px] text-[#e5bdba] opacity-70">TRENDING CHRONICLES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TRENDING_TECHNIQUES.map((tech, idx) => (
                  <div 
                    key={idx}
                    className="flex gap-4 p-4 bg-[#201f1f] border-l-4 border-[#bd1020] bevel-card group hover:border-[#ffb3ad] transition-all"
                  >
                    <div className="w-20 h-20 bg-black overflow-hidden flex-shrink-0 border border-gray-800">
                      <img src={tech.imageUrl} alt={tech.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-label-sm text-[10px] text-secondary mb-1">{tech.style}</span>
                      <h4 className="font-headline-md text-md text-white">{tech.title}</h4>
                      <p className="text-xs text-[#e5bdba] leading-relaxed mt-1 line-clamp-2">{tech.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meter */}
            <div className="p-6 bg-[#201f1f] border-2 border-[#5c403d] slash-corner-md">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h5 className="font-label-sm text-[10px] text-[#ffb3ad] mb-1">全集中・常中</h5>
                  <p className="font-headline-md text-md text-white">STAMINA / 集中力</p>
                </div>
                <span className="font-label-sm text-sm text-[#ffb3ad] font-bold">85%</span>
              </div>
              <div className="h-4 bg-[#131313] flex gap-1 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-full flex-1 bg-[#bd1020] animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
                ))}
                <div className="h-full flex-1 bg-[#bd1020] opacity-40"></div>
                <div className="h-full flex-1 bg-transparent"></div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LIBRARY - Scroll Reader & Crow Message Forum */}
        {activeTab === "library" && (
          <div id="library-tab-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left Column Settings (Hidden on Mobile) */}
            <aside className="hidden lg:block lg:col-span-2 space-y-6">
              <div className="p-4 border-l-4 border-[#bd1020] bg-[#201f1f]">
                <h3 className="font-label-sm text-[9px] text-[#ffb3ad] mb-4 uppercase">BREATHING METER</h3>
                <div className="h-56 w-full bg-black relative flex flex-col-reverse justify-start">
                  <div className="h-[40%] bg-[#bd1020] w-full animate-pulse"></div>
                  <div className="h-[25%] bg-[#bd1020] opacity-50 w-full"></div>
                  <div className="h-1 bg-[#5c403d] w-full"></div>
                </div>
                <p className="mt-4 font-label-sm text-[10px] text-[#e5bdba] text-center">全集中・常中</p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    const idx = scrollPresets.findIndex(s => s.id === activeScroll.id);
                    if (idx > 0) setActiveScroll(scrollPresets[idx - 1]);
                  }}
                  className="w-full py-3 bg-[#bd1020] text-white text-xs font-bold italic bevel-metallic uppercase flex items-center justify-center gap-2 hover:brightness-115 active:scale-98 transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  PREVIOUS
                </button>
                <button 
                  onClick={() => {
                    const idx = scrollPresets.findIndex(s => s.id === activeScroll.id);
                    if (idx < scrollPresets.length - 1) setActiveScroll(scrollPresets[idx + 1]);
                  }}
                  className="w-full py-3 bg-[#2a2a2a] text-white text-xs font-bold border border-[#5c403d] flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-98 transition-all"
                >
                  NEXT LORE
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </aside>

            {/* Center Reader Panel Column */}
            <section className="lg:col-span-7 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col gap-2 border-b-4 border-[#bd1020] pb-4">
                <div className="flex justify-between items-end">
                  <span className="font-label-sm text-xs text-secondary">{activeScroll.chapterNumber}</span>
                  <span className="font-label-sm text-xs text-gray-400">{activeScroll.publishDate}</span>
                </div>
                <h2 className="font-headline-lg text-2xl md:text-3xl text-white">{activeScroll.title}</h2>
              </div>

              {/* Reader canvas panel */}
              <div className="bg-black p-4 md:p-6 border border-gray-800 space-y-1">
                <div className="relative group overflow-hidden">
                  <img src={activeScroll.imageUrls[0]} alt="manga pane illustration 1" className="w-full grayscale hover:grayscale-0 transition-all duration-700 ease-in-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none"></div>
                </div>

                {/* Parchment traditional vertical scrolling section */}
                <div className="parchment-texture p-6 md:p-12 border-x-8 border-[#353534] relative">
                  <div className="text-black leading-relaxed text-justify h-[380px] md:h-[480px] mx-auto opacity-95 [writing-mode:vertical-rl] whitespace-pre-line font-japanese overflow-x-auto select-all scrollbar-thin">
                    {activeScroll.japaneseStoryText}
                  </div>
                  
                  {/* Decorative stamp overlay */}
                  <div className="absolute bottom-4 right-4 text-[#68000a] opacity-65 font-black text-2xl border-4 border-[#68000a] px-3 rotate-12">
                    鬼殺隊
                  </div>
                </div>

                <div className="relative overflow-hidden">
                  <img src={activeScroll.imageUrls[1] || IMAGES.mangaEye} alt="manga panel 2" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute bottom-4 left-4 bg-[#bd1020] text-white px-3 py-1 font-label-sm text-[10px] font-bold">
                    CRITICAL HIT
                  </div>
                </div>

                {/* Focus bar spacer */}
                <div className="bg-[#2a2a2a] p-6 flex flex-col items-center gap-4 border-y-2 border-[#bd1020]">
                  <span className="material-symbols-outlined text-[#bd1020] text-5xl">flare</span>
                  <p className="font-headline-md text-lg text-[#ffb3ad] italic">全集中。</p>
                  <div className="w-full h-1 bg-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-2/3 bg-[#bd1020] nichirin-glow"></div>
                  </div>
                </div>

                <div className="relative">
                  <img src={activeScroll.imageUrls[2] || IMAGES.mangaTorii} alt="manga panel 3" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>

              {/* Scroll translations detail */}
              <div className="bg-[#201f1f] border border-[#5c403d] p-4 text-xs">
                <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase block mb-1">Corps Translation Transcript:</span>
                <p className="text-[#e5bdba] leading-relaxed">{activeScroll.englishSummary}</p>
              </div>

              {/* Action items */}
              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    const idx = scrollPresets.findIndex(s => s.id === activeScroll.id);
                    if (idx < scrollPresets.length - 1) {
                      setActiveScroll(scrollPresets[idx + 1]);
                    } else {
                      setActiveScroll(scrollPresets[0]);
                    }
                  }}
                  className="flex-1 py-4 bg-[#bd1020] hover:brightness-110 text-white font-headline-md text-xs italic bevel-metallic slash-corner transition-all duration-200"
                >
                  READ NEXT SCROLL CHAPTER
                </button>
                
                <button 
                  onClick={notifyShare}
                  className="w-16 h-16 flex items-center justify-center border-2 border-[#bd1020] text-[#ffb3ad] hover:bg-[#bd1020] hover:bg-opacity-10 active:scale-95 transition-colors"
                  title="Share with fellow slayers"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Share copy board UI section */}
              <div className="bg-[#1c1b1b] p-6 border-t-4 border-secondary">
                <h4 className="font-label-sm text-[10px] text-secondary mb-3 flex items-center gap-2 uppercase">
                  <Activity className="w-4 h-4 text-secondary" />
                  SHARE WITH THE CORPS SLAYER TELEPATHY
                </h4>
                <div className="flex gap-4">
                  <div className="flex-1 h-12 bg-black border border-gray-800 flex items-center px-4 text-gray-300 font-label-sm text-xs select-all">
                    https://nichirin.app/archives/{activeScroll.id}
                  </div>
                  <button 
                    onClick={notifyShare}
                    className="bg-[#bd1020] text-white px-6 text-xs font-bold uppercase hover:bg-opacity-80 active:scale-95 transition-all outline-none"
                  >
                    COPY
                  </button>
                </div>
              </div>

            </section>

            {/* Right Column Custom Chat and Messages board */}
            <aside className="lg:col-span-3 space-y-6">

              {/* Crow Messages List forum */}
              <div className="p-6 border border-[#5c403d] bg-black bg-opacity-40 ichimatsu-pattern relative">
                <h3 className="font-headline-md text-sm text-[#ffb3ad] mb-6 italic tracking-widest uppercase">
                  CROW MESSAGES
                </h3>
                
                <div className="space-y-6">
                  {comments.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-xs ${msg.color}`}>
                          {msg.icon}
                        </span>
                        <span className="font-label-sm text-[10px] text-white font-bold">{msg.username}</span>
                      </div>
                      <div className="bg-[#1c1b1b] p-3 border-l-2 border-[#5c403d] rounded-none">
                        <p className="text-xs leading-relaxed text-[#e5bdba]">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add a comment box */}
                <div className="mt-6 pt-4 border-t border-[#5c403d]">
                  <textarea 
                    rows={2}
                    placeholder="Engrave standard scroll comment..."
                    value={crowCommentInput}
                    onChange={(e) => setCrowCommentInput(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-gray-800 text-xs px-3 py-2 text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (!crowCommentInput.trim()) return;
                      setComments(prev => [...prev, {
                        username: character.name.toUpperCase().replace(" ", "_"),
                        text: crowCommentInput,
                        icon: "swords",
                        color: "text-[#ffb3ad]"
                      }]);
                      setCrowCommentInput("");
                    }}
                    className="w-full mt-2 py-2 bg-[#bd1020] text-white text-xs font-bold font-label-sm"
                  >
                    SEND TRANSMISSION
                  </button>
                </div>

                {/* Launcher button to toggle Kasugai Crow talk Sheet */}
                <div className="mt-6">
                  <button 
                    onClick={() => setChatOpen(true)}
                    className="w-full py-3 bg-[#bd1020] bg-opacity-20 hover:bg-opacity-35 border border-dashed border-[#ffb3ad] text-white text-xs font-bold font-label-sm flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4 text-[#ffb3ad] animate-bounce" />
                    <span>鎹鴉に伝言を託す (CHAT WITH CROW)</span>
                  </button>
                </div>
              </div>

              {/* Mission stats intellect info */}
              <div className="bg-[#1c1b1b] p-6 space-y-4 border border-[#5c403d]">
                <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">MISSION INTEL DATA</h3>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-xs text-gray-400">Total Views</span>
                  <span className="font-label-sm text-xs text-white">1,240,892</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-xs text-gray-400">Flame Meter</span>
                  <span className="font-label-sm text-xs text-[#bd1020] font-bold">88% 🔥</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-400">Scroll Rank</span>
                  <span className="font-label-sm text-xs text-secondary font-bold">#3 TOP</span>
                </div>
              </div>

            </aside>
          </div>
        )}

        {/* TAB 4: INTEL - Mission Settings & Interactive Text Simulator */}
        {activeTab === "intel" && (
          <div id="intel-tab-view" className="space-y-8 animate-fade-in text-justify">
            
            {/* Mission Hero banner header */}
            <div className="mb-8 border-l-8 border-[#bd1020] pl-6 select-none">
              <h2 className="font-headline-xl text-4xl md:text-5xl text-white uppercase tracking-tighter">
                FORGE YOUR DESTINY
              </h2>
              <p className="font-headline-md text-[#e5bdba] text-lg italic mt-1">
                運命を切り拓け
              </p>
            </div>

            {/* Simulated interactive text Game Board frame */}
            {mission.isPlaying ? (
              <div id="active-mission-room" className="bg-[#201f1f] border-4 border-[#bd1020] p-6 md:p-12 bevel-card relative overflow-hidden animate-shake">
                <div className="absolute inset-0 ichimatsu-pattern opacity-10 pointer-events-none"></div>
                
                {/* Visual Header matching selected arc */}
                <div className="flex justify-between items-center border-b border-[#5c403d] pb-4 mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#bd1020] text-white text-[10px] px-3 py-1 font-label-sm uppercase font-bold tracking-widest leading-none">
                      {atmosphere.toUpperCase()} COMBAT
                    </span>
                    <h3 className="font-headline-md text-white text-lg md:text-xl">
                      {ARCS.find(a => a.id === mission.arc)?.title}
                    </h3>
                  </div>

                  <span className="font-label-sm text-xs text-[#ffb3ad]">
                    Choices turn count: {mission.choiceHistory.length}
                  </span>
                </div>

                {mission.isLoading ? (
                  <div className="h-48 flex flex-col items-center justify-center relative z-10">
                    <RotateCcw className="w-12 h-12 text-[#bd1020] animate-spin mb-4" />
                    <p className="font-label-sm text-xs text-gray-300">GEMINI NARRATING SCENARIOS...</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative z-10">
                    
                    {/* Story prompt block */}
                    <div className="space-y-4">
                      <p className="text-[#ffb3ad] font-label-sm text-xs leading-relaxed opacity-75 uppercase">
                        Consequence situation:
                      </p>
                      <p className="text-white text-md tracking-wide leading-relaxed pl-4 border-l-4 border-gray-600 bg-black bg-opacity-40 py-3 pr-2">
                        {mission.consequenceText}
                      </p>

                      <p className="text-secondary font-label-sm text-xs tracking-wide uppercase mt-6 opacity-75">
                        Combat Threat Detail:
                      </p>
                      <p className="text-gray-200 text-sm leading-relaxed italic pr-2 font-japanese font-medium">
                        {mission.combatSceneText}
                      </p>
                    </div>

                    {/* Threat / victory state message callout banner */}
                    <div className="bg-[#131313] p-4 flex items-center justify-between border-l-4 border-[#ffb3ad]">
                      <span className="font-label-sm text-xs text-[#ffb3ad] uppercase">Status Check:</span>
                      <span className="font-label-sm text-xs text-white uppercase font-bold tracking-wide">
                        {mission.statusUpdate}
                      </span>
                    </div>

                    {/* CHOICE SELECT OPERATIONS list */}
                    {!mission.isVictory && !mission.isDefeat && (
                      <div className="space-y-3 pt-4">
                        <span className="font-label-sm text-[10px] text-gray-300 block mb-2 uppercase">
                          DECIDE YOUR NEXT BLADE POSITION OPERATION:
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {mission.choices.map((choice) => (
                            <button 
                              key={choice.id}
                              onClick={() => startMissionGame(choice.text)}
                              className="bg-[#2a2a2a] hover:bg-[#bd1020] hover:bg-opacity-20 text-left border border-[#5c403d] hover:border-[#bd1020] p-4 text-xs tracking-wide transition-all outline-none rounded-none text-white leading-relaxed"
                            >
                              <div className="flex gap-3">
                                <ChevronRight className="w-4 h-4 text-[#ffb3ad] flex-shrink-0" />
                                <span>{choice.text}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Victory / defeat screens trigger and reset */}
                    {(mission.isVictory || mission.isDefeat) && (
                      <div className="text-center py-6 space-y-4 border-t border-[#5c403d] animate-fade-in">
                        <div className="flex justify-center">
                          {mission.isVictory ? (
                            <CheckCircle className="w-16 h-16 text-[#00e676] animate-bounce" />
                          ) : (
                            <AlertCircle className="w-16 h-16 text-[#bd1020] animate-bounce" />
                          )}
                        </div>
                        <h4 className="font-headline-xl text-3xl text-white uppercase font-black">
                          {mission.isVictory ? "MISSION COMPLETE ✓" : "BLADE BROKEN / DEFEAT"}
                        </h4>
                        <p className="text-sm text-[#e5bdba] max-w-md mx-auto">
                          {mission.isVictory ? `Sensational performance, Slayer ${character.name}! You successfully resolved the threat and defended the realm.` : "The supernatural darkness overwhelmed your stamina block. Recover and plan a sharper strike."}
                        </p>
                        
                        <button 
                          onClick={resetMission}
                          className="px-10 py-4 bg-[#bd1020] text-white font-bold text-xs uppercase hover:bg-opacity-90 outline-none transition-all duration-300"
                        >
                          RETURN TO SHADOW PLANNING
                        </button>
                      </div>
                    )}

                    {/* Quit/Abort operational line */}
                    {!mission.isVictory && !mission.isDefeat && (
                      <div className="pt-4 border-t border-[#5c403d] flex justify-end">
                        <button 
                          onClick={resetMission}
                          className="text-gray-400 hover:text-[#bd1020] font-label-sm text-[10px] uppercase transition-all"
                        >
                          [ ABORT MISSION ACTIONS ]
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ) : (
              <div id="mission-planning-board" className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Arc options columns */}
                <section className="md:col-span-8 flex flex-col gap-6">
                  <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">swords</span>
                    SELECT ARC / 篇の選択
                  </h3>

                  {ARCS.map((arc) => (
                    <div 
                      key={arc.id}
                      onClick={() => {
                        if (arc.id !== "mugen_train") {
                          setSelectedArc(arc.id);
                        }
                      }}
                      className={`group relative border-2 p-5 overflow-hidden transition-all duration-300 rounded-none bevel-card cursor-pointer ${
                        arc.id === "mugen_train" ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        selectedArc === arc.id && arc.id !== "mugen_train" ? "border-[#bd1020] bg-[#bd1020]/10 border-l-[12px]" : "border-[#5c403d] bg-[#1c1b1b] hover:border-[#ffb3ad]"
                      }`}
                    >
                      <div className="absolute inset-0 parchment-texture opacity-5 pointer-events-none"></div>
                      
                      <div className="flex flex-col md:flex-row gap-5 relative z-10">
                        <div className="w-full md:w-44 h-28 bg-[#000] overflow-hidden flex-shrink-0 border border-neutral-800">
                          <img 
                            src={arc.imageUrl} 
                            alt={arc.title} 
                            className={`w-full h-full object-cover transition-all duration-500 ${
                              selectedArc === arc.id ? "grayscale-0 scale-102" : "grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100"
                            }`} 
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className="font-headline-md text-lg text-white group-hover:text-[#ffb3ad] transition-all">
                                {arc.title}
                              </h4>
                              <p className="font-label-sm text-[10px] text-[#ffb3ad] mt-1 italic">{arc.japaneseTitle}</p>
                            </div>

                            <span className={`px-2.5 py-1 text-[9px] font-bold font-label-sm leading-none uppercase ${
                              arc.id === "mugen_train" ? "bg-amber-800/80 text-white" : "bg-[#2a2a2a] text-secondary"
                            }`}>
                              {arc.unlockedAt}
                            </span>
                          </div>

                          <p className="text-gray-300 text-xs mt-3 leading-relaxed">
                            {arc.description}
                          </p>

                          <div className="flex gap-2 mt-4">
                            <span className="px-2 py-0.5 bg-black border border-gray-800 text-gray-400 font-label-sm text-[8px]">
                              {arc.tag1}
                            </span>
                            <span className="px-2 py-0.5 bg-black border border-gray-800 text-gray-400 font-label-sm text-[8px]">
                              {arc.tag2}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Atmosphere side settings panel column */}
                <aside className="md:col-span-4 flex flex-col gap-6">
                  
                  {/* Atmospheric switches */}
                  <div className="bg-[#1c1b1b] border-2 border-[#5c403d] p-5 bevel-card shadow-xl">
                    <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase mb-4 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#ffb3ad]" />
                      ATMOSPHERE / 雰囲気
                    </h3>

                    <div className="flex flex-col gap-3">
                      {/* Daylight */}
                      <label className={`group flex items-center justify-between p-3 bg-black border cursor-pointer transition-all ${
                        atmosphere === "daylight" ? "border-amber-500 bg-amber-500/5" : "border-gray-800 hover:border-[#ffb3ad]"
                      }`}>
                        <div className="flex items-center gap-3">
                          <Sun className="w-5 h-5 text-amber-500" />
                          <div>
                            <span className="text-white text-xs font-bold font-label-sm block">Daylight (Training)</span>
                            <span className="text-[9px] text-gray-400 font-label-sm">昼間 (修行)</span>
                          </div>
                        </div>
                        <input 
                          type="radio" 
                          name="atmosphere_radio" 
                          checked={atmosphere === "daylight"}
                          onChange={() => setAtmosphere("daylight")}
                          className="w-4 h-4 text-[#bd1020] bg-transparent border-[#5c403d] focus:ring-0 cursor-pointer"
                        />
                      </label>

                      {/* Nocturnal */}
                      <label className={`group flex items-center justify-between p-3 bg-black border cursor-pointer transition-all ${
                        atmosphere === "nocturnal" ? "border-[#bd1020] bg-[#bd1020]/5" : "border-gray-800 hover:border-[#ffb3ad]"
                      }`}>
                        <div className="flex items-center gap-3">
                          <Moon className="w-5 h-5 text-indigo-400" />
                          <div>
                            <span className="text-white text-xs font-bold font-label-sm block">Nocturnal (Battle)</span>
                            <span className="text-[9px] text-gray-400 font-label-sm">夜間 (戦闘)</span>
                          </div>
                        </div>
                        <input 
                          type="radio" 
                          name="atmosphere_radio" 
                          checked={atmosphere === "nocturnal"}
                          onChange={() => setAtmosphere("nocturnal")}
                          className="w-4 h-4 text-[#bd1020] bg-transparent border-[#5c403d] focus:ring-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Breathing sliders tweak focus */}
                  <div className="bg-[#1c1b1b] border-2 border-[#5c403d] p-5 bevel-card shadow-xl">
                    <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#ffb3ad]" />
                      BREATHING FOCUS / 全集中
                    </h3>

                    <div className="space-y-3">
                      <div className="flex gap-1 h-8 bg-black border border-gray-800 p-0.5">
                        {[...Array(8)].map((_, idx) => {
                          const barLimit = (idx + 1) * 12.5;
                          const active = breathingFocusLevel >= barLimit;
                          return (
                            <div 
                              key={idx} 
                              className={`flex-1 transition-all ${
                                active ? "bg-[#bd1020] animate-pulse" : "bg-neutral-900 border border-neutral-800"
                              }`}
                            ></div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-[9px] text-gray-400 font-label-sm">
                        <span>CURRENT: {breathingFocusLevel}%</span>
                        <span>PEAK: 100%</span>
                      </div>

                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={breathingFocusLevel}
                        onChange={(e) => setBreathingFocusLevel(Number(e.target.value))}
                        className="w-full accent-[#bd1020]"
                      />
                    </div>
                  </div>

                  {/* START ACTION MODULE */}
                  <div className="mt-4 pt-4 border-t border-[#5c403d]">
                    <button 
                      onClick={() => startMissionGame()}
                      className="w-full h-16 bg-[#bd1020] hover:brightness-110 active:scale-95 transition-all text-white font-headline-md text-xs tracking-widest font-black flex items-center justify-center gap-3 border-t-2 border-[#ffb3ad] shadow-2xl"
                    >
                      <span>START RECRUIT MISSION</span>
                      <ChevronRight className="w-5 h-5 animate-ping" />
                    </button>
                    <p className="text-center text-xs text-gray-500 font-label-sm italic mt-3">
                      任務を開始せよ
                    </p>
                  </div>

                </aside>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Kasugai Crow Chat Sheet Drawers (Slide over modal overlay) */}
      {chatOpen && (
        <div id="crow-sheet-backcover" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-end transition-opacity duration-300">
          <div 
            id="crow-sheet" 
            className="w-full max-w-md h-full bg-[#1c1b1b] border-l-2 border-[#5c403d] p-6 flex flex-col justify-between shadow-2xl relative"
          >
            {/* Header */}
            <div>
              <div className="flex justify-between items-center border-b border-[#5c403d] pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#ffb3ad] animate-bounce" />
                  <span className="font-headline-md text-md text-white">鎹鴉 伝信板 (CROW MESSENGER)</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-gray-400 hover:text-[#bd1020] font-label-sm text-[10px] uppercase block"
                >
                  [ CLOSE ]
                </button>
              </div>

              {/* Bot Character Portrait */}
              <div className="p-4 bg-black/40 border-b border-[#5c403d] flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#ffb3ad] overflow-hidden flex-shrink-0">
                  <img src={IMAGES.kinoeRankAvatar} alt="Kasugai Crow Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-label-sm text-xs text-white uppercase font-bold">KASUGAI CROW MSG_TRANS</h4>
                  <p className="text-[10px] text-gray-400 italic">"Delivering messages at high-pitched frequencies..."</p>
                </div>
              </div>
            </div>

            {/* Chat Messages thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2 scrollbar-thin">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="font-label-sm text-[8px] text-[#ffb3ad] mb-1">
                    {msg.senderName.toUpperCase()}
                  </span>
                  <div 
                    className={`max-w-[85%] rounded-none p-3 text-xs leading-relaxed ${
                      msg.role === "user" ? "bg-[#2a2a2a] text-[#ffdad7] border border-[#5c403d]" : "bg-[#bd1020]/20 text-[#ffb3ad] border-l-4 border-[#bd1020]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCrowLoading && (
                <div className="flex justify-start">
                  <div className="bg-black text-[#ffb3ad] font-label-sm text-[9px] p-2 animate-pulse">
                    CROW CHATTER SCREAMING CAW...
                  </div>
                </div>
              )}
            </div>

            {/* Inbound messaging controls */}
            <div className="border-t border-[#5c403d] pt-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendCrowChat();
                }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Yell something to your Kasugai Crow..."
                  className="flex-1 bg-black border border-gray-800 text-xs px-3 py-2 text-white focus:outline-none focus:border-[#bd1020]"
                />
                <button 
                  type="submit"
                  className="bg-[#bd1020] text-white px-4 hover:brightness-110 transition-all duration-150"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[9px] text-gray-500 font-label-sm italic mt-2">
                Note: Messaging is calibrated for Demon Slayer corp operations.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action sword Button shown in screen captures */}
      <button 
        id="dock-floater-button"
        title="Quick action dashboard triggers"
        onClick={() => {
          if (activeTab === "intel") {
            setSelectedArc("natagumo");
            setAtmosphere("nocturnal");
            startMissionGame();
          } else {
            setChatOpen(true);
          }
        }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-16 h-16 rounded-none bg-gradient-to-br from-[#bd1020] to-[#131313] text-[#ffcd9a] shadow-2xl flex items-center justify-center border-2 border-[#ffb3ad] slash-corner active:scale-95 transition-transform z-40 select-none animate-pulse-slow"
      >
        <span className="material-symbols-outlined text-3xl font-bold">swords</span>
      </button>

      {/* Persistent Bottom Layout Navigation drawer */}
      <nav id="nichirin-bottom-tabs" className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-stretch h-20 bg-[#1c1b1b] border-t-4 border-[#bd1020] shadow-2xl select-none">
        <button 
          id="tab-btn-remix-theme"
          onClick={() => setActiveTab("remixTheme")}
          className={`flex-1 flex flex-col items-center justify-center p-2 transition-all outline-none ${
            activeTab === "remixTheme" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Palette className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">主题</span>
        </button>

        <button 
          id="tab-btn-remix-settings"
          onClick={() => setActiveTab("remixSettings")}
          className={`flex-1 flex flex-col items-center justify-center p-2 transition-all outline-none border-l border-[#5c403d] ${
            activeTab === "remixSettings" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Settings2 className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">设定</span>
        </button>

        <button 
          id="tab-btn-remix-voice"
          onClick={() => setActiveTab("remixVoice")}
          className={`flex-1 flex flex-col items-center justify-center p-2 transition-all outline-none border-l border-[#5c403d] ${
            activeTab === "remixVoice" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Mic className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">语音</span>
        </button>
        
        <button 
          id="tab-btn-discovery"
          onClick={() => setActiveTab("discovery")}
          className={`flex-1 flex-col items-center justify-center p-2 transition-all outline-none hidden md:flex border-l border-[#5c403d] ${
            activeTab === "discovery" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Compass className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">Discovery</span>
        </button>

        <button 
          id="tab-btn-training"
          onClick={() => setActiveTab("training")}
          className={`flex-1 flex-col items-center justify-center p-2 transition-all outline-none hidden md:flex ${
            activeTab === "training" ? "bg-[#bd1020] text-white font-bold border-x border-[#5c403d]" : "text-gray-400 hover:text-white border-x border-[#5c403d]"
          }`}
        >
          <Flame className="w-5 h-5 mb-1 text-[#ffff57] animate-pulse" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">Training</span>
        </button>

        <button 
          id="tab-btn-library"
          onClick={() => setActiveTab("library")}
          className={`flex-1 flex-col items-center justify-center p-2 transition-all outline-none hidden md:flex ${
            activeTab === "library" ? "bg-[#bd1020] text-white font-bold border-r border-[#5c403d]" : "text-gray-400 hover:text-white border-r border-[#5c403d]"
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">Library</span>
        </button>

        <button 
          id="tab-btn-intel"
          onClick={() => setActiveTab("intel")}
          className={`flex-1 flex-col items-center justify-center p-2 transition-all outline-none hidden md:flex ${
            activeTab === "intel" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">Intel</span>
        </button>

      </nav>

    </div>
  );
}
