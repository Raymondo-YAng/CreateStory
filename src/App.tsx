import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  ChevronRight,
  Share2,
  Send,
  Sparkles,
  Bot,
  User,
  Activity,
  PenTool,
  PenLine,
  RotateCcw,
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
import { Character, Message, ScrollChapter } from "./types";
import { DEFAULT_CHARACTER, SCROLL_PRESETS, IMAGES } from "./data";

type AuthMode = "login" | "signup";
type AppTab = "create" | "library";
type CreateStep = "theme" | "settings" | "voice";
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

type StoredCreation = {
  id: string;
  userId: string;
  createdAt: string;
  settings: {
    themeId: string;
    themeTitle: string;
    themeSubtitle: string;
    coreSetting: string;
    coreOption: string;
    userPrompt: string;
    protagonistName: string;
  };
  story: {
    title: string;
    chapterNumber: string;
    publishDate: string;
    正文: string;
    简介: string;
  };
};

const AUTH_STORAGE_KEY = "veridia.currentUser";

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
    title: "海贼王",
    subtitle: "恶魔果实、霸气、海贼团与伟大航路",
    imageUrl: IMAGES.onePieceHero,
    accent: "from-[#1c7ced] to-[#ffb957]",
    settings: ["恶魔果实", "霸气类型", "船员定位", "岛屿生态", "悬赏身份"]
  },
  {
    id: "jujutsu",
    title: "咒术回战",
    subtitle: "术式、领域展开、咒具与高专任务",
    imageUrl: IMAGES.jujutsuHero,
    accent: "from-[#4f46e5] to-[#bd1020]",
    settings: ["天生术式", "领域展开", "咒具", "束缚条件", "任务等级"]
  },
  {
    id: "naruto",
    title: "火影忍者",
    subtitle: "查克拉、忍术、血继限界与忍者任务",
    imageUrl: IMAGES.narutoHero,
    accent: "from-[#f97316] to-[#1d4ed8]",
    settings: ["查克拉属性", "忍术类型", "忍者阶级", "血继限界", "任务地点"]
  },
  {
    id: "attack-on-titan",
    title: "进击的巨人",
    subtitle: "立体机动、巨人化、城墙与自由之翼",
    imageUrl: IMAGES.arcNatagumo,
    accent: "from-[#64748b] to-[#dc2626]",
    settings: ["巨人形态", "立体机动装置", "军团隶属", "战斗风格", "任务地点"]
  },
  {
    id: "my-hero",
    title: "我的英雄学院",
    subtitle: "个性、英雄学校、职业英雄与救援训练",
    imageUrl: IMAGES.myHeroHero,
    accent: "from-[#16a34a] to-[#ef4444]",
    settings: ["个性类型", "英雄学校", "职业目标", "战斗定位", "训练场景"]
  },
  {
    id: "bleach",
    title: "死神",
    subtitle: "斩魄刀、鬼道、虚化与尸魂界",
    imageUrl: IMAGES.bleachHero,
    accent: "from-[#0f172a] to-[#7c3aed]",
    settings: ["斩魄刀类型", "鬼道", "死神阶级", "虚化状态", "任务地点"]
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
  "任务等级": ["四级", "二级", "准一级", "一级", "特级调查"],
  "查克拉属性": ["火遁", "水遁", "雷遁", "风遁", "土遁"],
  "忍术类型": ["体术", "幻术", "封印术", "医疗忍术", "禁术"],
  "忍者阶级": ["下忍", "中忍", "上忍", "暗部", "影护卫"],
  "血继限界": ["写轮眼", "白眼", "木遁", "冰遁", "尘遁"],
  "巨人形态": ["进击的巨人", "铠之巨人", "女型巨人", "兽之巨人", "无垢巨人"],
  "立体机动装置": ["标准型", "雷枪装备", "狙击型", "改装型", "试验型"],
  "军团隶属": ["调查兵团", "宪兵团", "驻扎兵团", "训练兵团", "隐秘部队"],
  "战斗风格": ["斩击后颈", "团队协作", "单兵突袭", "防御掩护", "侦查诱敌"],
  "个性类型": ["强化型", "放出型", "变身型", "异型", "无个性"],
  "英雄学校": ["雄英高中", "士杰高中", "瓶胎高中", "私立中学", "候补培训"],
  "职业目标": ["职业英雄", "救援英雄", "幕后支援", "英雄事务所", "反英雄"],
  "训练场景": ["USJ", "体育场", "城市街区", "山林演习场", "灾害模拟区"],
  "斩魄刀类型": ["始解", "卍解", "鬼道系", "直接攻击型", "卍解未完成"],
  "鬼道": ["破道", "缚道", "回道", "禁咒", "自创鬼道"],
  "死神阶级": ["流魂街平民", "真央灵术院生", "席官", "副队长", "队长候补"],
  "虚化状态": ["未觉醒", "假面军势", "完全虚化", "控制虚化", "抗拒虚化"]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("create");
  const [createStep, setCreateStep] = useState<CreateStep>("theme");
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
  const [protagonistName, setProtagonistName] = useState(character.name);
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
  const [creations, setCreations] = useState<StoredCreation[]>([]);
  const [activeCreationId, setActiveCreationId] = useState<string | null>(null);
  const [isCreatingSpinoff, setIsCreatingSpinoff] = useState(false);
  const [showContinuationInput, setShowContinuationInput] = useState(false);
  const [continuationPrompt, setContinuationPrompt] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);

  // Crow Messages Comment and Chat states
  const [comments, setComments] = useState<{ username: string; text: string; icon: string; color: string }[]>([]);
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

  // Share Notification State
  const [sharedToast, setSharedToast] = useState(false);

  const selectedTheme = COMIC_THEMES.find((theme) => theme.id === selectedThemeId) || COMIC_THEMES[0];
  const selectedSettingOptions = CORE_SETTING_OPTIONS[selectedCoreSetting] || [];
  const activeCreation = creations.find((creation) => creation.id === activeCreationId) || null;
  const libraryScrolls = [...creations.map((creation) => creationToScroll(creation)), ...scrollPresets];

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;

    async function loadCreations() {
      try {
        const response = await fetch(`/api/creations?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Could not load creations.");
        const data = await response.json();
        setCreations(data.creations || []);
      } catch (err: any) {
        setApiError(err.message || "读取 Library 创作记录失败。");
      }
    }

    loadCreations();
  }, [currentUser]);

  useEffect(() => {
    if (creations.length === 0 || activeCreationId) return;
    const latestCreation = creations[0];
    setActiveCreationId(latestCreation.id);
    setActiveScroll(creationToScroll(latestCreation));
  }, [creations, activeCreationId]);

  function creationToScroll(creation: StoredCreation): ScrollChapter {
    const creationTheme = COMIC_THEMES.find((theme) => theme.id === creation.settings.themeId) || selectedTheme;

    const themeImageUrls =
      creationTheme.id === "demon-slayer"
        ? [IMAGES.heroFlame, IMAGES.mangaClash, IMAGES.arcNatagumo]
        : creationTheme.id === "jujutsu"
        ? [IMAGES.jujutsuHero, IMAGES.jujutsuGojo, IMAGES.jujutsuGroup]
        : creationTheme.id === "naruto"
        ? [IMAGES.narutoHero, IMAGES.narutoShippuden, IMAGES.narutoViz]
        : creationTheme.id === "one-piece"
        ? [IMAGES.onePieceHero, IMAGES.onePieceCrew, IMAGES.onePiecePoster]
        : creationTheme.id === "my-hero"
        ? [IMAGES.myHeroHero, IMAGES.myHeroClass, IMAGES.myHeroDeku]
        : creationTheme.id === "bleach"
        ? [IMAGES.bleachHero, IMAGES.bleachScene1, IMAGES.bleachScene2]
        : [creationTheme.imageUrl, IMAGES.mangaClash, IMAGES.mangaTorii];

    return {
      id: creation.id,
      chapterNumber: creation.story.chapterNumber,
      publishDate: creation.story.publishDate,
      title: creation.story.title,
      japaneseTitle: "用户番外",
      summary: `${creation.settings.themeTitle} / ${creation.settings.coreSetting} / ${creation.settings.coreOption}`,
      正文: creation.story.正文 || (creation.story as any).japaneseStoryText || "",
      简介: creation.story.简介 || (creation.story as any).englishSummary || "",
      imageUrls: themeImageUrls
    };
  }

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

  function selectLibraryScroll(scroll: ScrollChapter) {
    setActiveScroll(scroll);
    const creation = creations.find((item) => item.id === scroll.id);
    setActiveCreationId(creation?.id || null);
  }

  async function createSpinoffStory() {
    if (!currentUser || isCreatingSpinoff) return;

    const settings: StoredCreation["settings"] = {
      themeId: selectedTheme.id,
      themeTitle: selectedTheme.title,
      themeSubtitle: selectedTheme.subtitle,
      coreSetting: selectedCoreSetting,
      coreOption: selectedCoreOption,
      userPrompt: voicePrompt.trim(),
      protagonistName: protagonistName.trim() || character.name
    };

    setIsCreatingSpinoff(true);
    setApiError(null);

    try {
      const response = await fetch("/api/creations/spinoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          settings
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "番外故事生成失败。");
      }

      const creation: StoredCreation = data.creation;
      setCreations((prev) => [creation, ...prev]);
      setActiveCreationId(creation.id);
      setActiveScroll(creationToScroll(creation));
      setActiveTab("library");
      notifyShare();
    } catch (err: any) {
      setApiError(err.message || "番外故事生成失败。");
    } finally {
      setIsCreatingSpinoff(false);
    }
  }

  async function continueStory() {
    if (!currentUser || !activeCreation || isContinuing) return;

    const prompt = continuationPrompt.trim();
    if (!prompt) {
      setApiError("请输入后续主题内容。");
      return;
    }

    setIsContinuing(true);
    setApiError(null);

    try {
      const response = await fetch("/api/creations/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          creationId: activeCreation.id,
          continuationPrompt: prompt
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "续写失败。");
      }

      const updatedCreation: StoredCreation = data.creation;
      setCreations((prev) => prev.map((c) => (c.id === updatedCreation.id ? updatedCreation : c)));
      setActiveScroll(creationToScroll(updatedCreation));
      setContinuationPrompt("");
      setShowContinuationInput(false);
    } catch (err: any) {
      setApiError(err.message || "续写失败。");
    } finally {
      setIsContinuing(false);
    }
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

  // REST API: Trigger DeepSeek-powered dynamic character creator
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
      setApiError("Using locally forged character details. Configure DEEPSEEK_API_KEY to activate DeepSeek content creation.");
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
        正文: scrollData.正文 || "那一刻，剑士的刀身发热，激战拉开序幕。",
        简介: scrollData.简介 || "一段独家动态篇章，追溯精彩的战斗故事。",
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
        正文: `【外传传记】寄宿于刀身的 ${character.breathingStyle}！

狂风呼啸，少年只是一心凝视着刀刃。呼吸达至极限，手臂上浮现出漆黑的筋络。

「一步也不会退！」冲突的爆炎骤然升起！`,
        简介: `献给 ${customScrollTitle} 的精彩战术卷轴。为剑士精心撰写。`,
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
                VERIDIA
              </h1>
              <p className="mt-4 max-w-xl text-[#e5bdba] text-sm md:text-base leading-relaxed">
                Sign in to keep your creation drafts and story scroll library under your own account.
              </p>
            </div>
            <div className="relative overflow-hidden border-2 border-[#5c403d] bg-black min-h-[320px] slash-corner-md">
              <img src={IMAGES.heroFlame} alt="Veridia flame mission artwork" className="absolute inset-0 w-full h-full object-cover opacity-55" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#5c403d] bg-black/45">
                <p className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">Active Archive</p>
                <p className="text-white text-lg font-bold mt-1">创作步骤与 Library</p>
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
    <div id="veridia-app-root" className="min-h-screen bg-[#131313] text-[#e5e2e1] font-body-md overflow-x-hidden pb-24 md:pb-8 selection:bg-[#ffb3ad] selection:text-[#68000a]">
      
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
            VERIDIA
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
        {activeTab === "create" && (
          <div className="mb-8 border border-[#5c403d] bg-[#1c1b1b] p-3 md:p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "theme", label: "选择主题", icon: Palette },
                { id: "settings", label: "核心设定", icon: Settings2 },
                { id: "voice", label: "语音二创", icon: FileAudio }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = createStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCreateStep(step.id as CreateStep)}
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
        {activeTab === "create" && createStep === "theme" && (
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

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                onClick={() => setCreateStep("settings")}
                className="px-8 py-4 bg-[#bd1020] text-white font-bold text-sm flex items-center gap-3 border-t-2 border-[#ffb3ad] hover:brightness-110"
              >
                下一步：选择核心设定
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* REMIX PAGE 2: choose core setting */}
        {activeTab === "create" && createStep === "settings" && (
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
                    onClick={() => setCreateStep("theme")}
                    className="px-5 py-3 border border-[#5c403d] text-[#e5bdba] text-xs font-bold hover:border-[#ffb3ad]"
                  >
                    返回主题
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep("voice")}
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
        {activeTab === "create" && createStep === "voice" && (
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
                <div>
                  <label className="font-label-sm text-[10px] text-[#ffb3ad] uppercase block mb-2">主角名字</label>
                  <input
                    type="text"
                    value={protagonistName}
                    onChange={(e) => setProtagonistName(e.target.value)}
                    placeholder="例如：竈門炭治郎、或输入原创主角名"
                    className="w-full bg-[#0e0e0e] border border-[#5c403d] px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ffb3ad]"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">留空将使用当前角色：{character.name}</p>
                </div>

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
                  {"\n"}主角名字：{protagonistName.trim() || character.name}
                  {"\n"}用户个性化内容：{voicePrompt || "等待语音或文字输入..."}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateStep("settings")}
                  className="flex-1 px-5 py-4 border border-[#5c403d] text-[#e5bdba] text-xs font-bold hover:border-[#ffb3ad]"
                >
                  返回设定
                </button>
                <button
                  type="button"
                  onClick={createSpinoffStory}
                  disabled={isCreatingSpinoff}
                  className="flex-1 px-5 py-4 bg-[#bd1020] text-white text-xs font-bold border-t-2 border-[#ffb3ad] hover:brightness-110 disabled:opacity-60 disabled:cursor-wait"
                >
                  {isCreatingSpinoff ? "DeepSeek 创作中..." : "生成番外并保存"}
                </button>
              </div>
            </aside>
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
                    const idx = libraryScrolls.findIndex(s => s.id === activeScroll.id);
                    if (idx > 0) selectLibraryScroll(libraryScrolls[idx - 1]);
                  }}
                  className="w-full py-3 bg-[#bd1020] text-white text-xs font-bold italic bevel-metallic uppercase flex items-center justify-center gap-2 hover:brightness-115 active:scale-98 transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  PREVIOUS
                </button>
                <button 
                  onClick={() => {
                    const idx = libraryScrolls.findIndex(s => s.id === activeScroll.id);
                    if (idx < libraryScrolls.length - 1) selectLibraryScroll(libraryScrolls[idx + 1]);
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

                {/* Story display: dedicated light purple area for user-created stories, parchment for presets */}
                {activeCreation ? (
                  <div className="p-6 md:p-10 border-x-8 border-[#7c3aed] relative bg-[#f3e8ff]">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-[#7c3aed] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">用户创作故事</span>
                    </div>
                    <div className="relative text-[#1a120b] leading-loose text-justify text-base md:text-lg whitespace-pre-line font-japanese select-all pt-10 [text-shadow:0_1px_0_rgba(255,255,255,0.4)]">
                      {activeScroll.正文}
                    </div>
                    
                    {/* Decorative stamp overlay */}
                    <div className="absolute bottom-4 right-4 text-[#7c3aed] opacity-65 font-black text-2xl border-4 border-[#7c3aed] px-3 rotate-12 z-10">
                      用户番外
                    </div>
                  </div>
                ) : (
                  <div className="parchment-texture p-6 md:p-12 border-x-8 border-[#353534] relative">
                    <div className="absolute inset-0 bg-[#f4e4bc]/92"></div>
                    <div className="relative text-[#1a120b] leading-relaxed text-justify h-[380px] md:h-[480px] mx-auto opacity-95 [writing-mode:vertical-rl] whitespace-pre-line font-japanese overflow-x-auto select-all scrollbar-thin [text-shadow:0_1px_0_rgba(255,255,255,0.3)]">
                      {activeScroll.正文}
                    </div>
                    
                    {/* Decorative stamp overlay */}
                    <div className="absolute bottom-4 right-4 text-[#68000a] opacity-65 font-black text-2xl border-4 border-[#68000a] px-3 rotate-12 z-10">
                      鬼殺隊
                    </div>
                  </div>
                )}

                <div className="relative overflow-hidden">
                  <img src={activeScroll.imageUrls[1] || IMAGES.mangaEye} alt="manga panel 2" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute bottom-4 left-4 bg-[#bd1020] text-white px-3 py-1 font-label-sm text-[10px] font-bold">
                    CRITICAL HIT
                  </div>
                </div>

                <div className="relative">
                  <img src={activeScroll.imageUrls[2] || IMAGES.mangaTorii} alt="manga panel 3" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>

              {/* Scroll translations detail */}
              <div className="bg-[#201f1f] border border-[#5c403d] p-4 text-xs">
                <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase block mb-1">Corps Translation Transcript:</span>
                <p className="text-[#e5bdba] leading-relaxed">{activeScroll.简介}</p>
              </div>

              {/* Action items */}
              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    const idx = libraryScrolls.findIndex(s => s.id === activeScroll.id);
                    if (idx < libraryScrolls.length - 1) {
                      selectLibraryScroll(libraryScrolls[idx + 1]);
                    } else {
                      selectLibraryScroll(libraryScrolls[0]);
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
                    https://veridia.app/archives/{activeScroll.id}
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

              <div className="bg-[#1c1b1b] p-6 space-y-5 border border-[#5c403d]">
                <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">创作 JSON</h3>

                {activeCreation ? (
                  <div className="bg-[#0e0e0e] border border-[#5c403d] overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#5c403d] bg-black/40">
                      <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase tracking-wider">settings.json</span>
                      <span className="font-label-sm text-[9px] text-gray-500">{activeCreation.id.slice(0, 8)}</span>
                    </div>
                    <pre className="max-h-72 overflow-auto p-4 text-[11px] leading-relaxed text-[#e5bdba] whitespace-pre-wrap font-mono scrollbar-thin">
                      {JSON.stringify(activeCreation.settings, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-black/40 border border-dashed border-[#5c403d] p-4 text-xs text-gray-400 leading-relaxed">
                    选择一个用户生成番外后，这里会展示保存到 JSON 文件里的主题、设定和情节。
                  </div>
                )}

                <div className="border-t border-[#5c403d] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-sm text-[10px] text-[#ffb3ad] uppercase">已生成番外</span>
                    <span className="text-[10px] text-gray-500">{creations.length}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {creations.length === 0 ? (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        还没有番外。回到创作页完成三步后，点击“生成番外并保存”。
                      </p>
                    ) : (
                      creations.map((creation) => (
                        <button
                          key={creation.id}
                          type="button"
                          onClick={() => {
                            setActiveCreationId(creation.id);
                            setActiveScroll(creationToScroll(creation));
                          }}
                          className={`w-full text-left p-3 border transition-all ${
                            activeCreationId === creation.id
                              ? "bg-[#bd1020]/20 border-[#ffb3ad]"
                              : "bg-black/40 border-[#5c403d] hover:border-[#ffb3ad]"
                          }`}
                        >
                          <p className="text-xs font-bold text-white line-clamp-1">{creation.story.title}</p>
                          <p className="mt-1 text-[10px] text-[#e5bdba] line-clamp-1">
                            {creation.settings.themeTitle} / {creation.settings.coreOption}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Continue story section */}
                <div className="border-t border-[#5c403d] pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-label-sm text-[10px] text-[#ffb3ad] uppercase flex items-center gap-2">
                      <PenLine className="w-4 h-4" />
                      续写后续
                    </h3>
                    {activeCreation && (
                      <span className="text-[10px] text-gray-500">{activeCreation.story.title}</span>
                    )}
                  </div>

                  {!activeCreation ? (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      从上方列表选择一个用户生成番外后，可以在这里输入后续主题并续写故事。
                    </p>
                  ) : !showContinuationInput ? (
                    <button
                      type="button"
                      onClick={() => setShowContinuationInput(true)}
                      className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold flex items-center justify-center gap-2 border-t-2 border-[#c4b5fd] transition-all"
                    >
                      <PenLine className="w-4 h-4" />
                      为这个故事续写后续
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        rows={5}
                        value={continuationPrompt}
                        onChange={(e) => setContinuationPrompt(e.target.value)}
                        placeholder="例如：主角在战斗后遇到了失散多年的师妹，师妹却告诉他一个惊人的秘密……"
                        className="w-full bg-[#0e0e0e] border border-[#5c403d] px-3 py-3 text-white text-xs leading-relaxed focus:outline-none focus:border-[#7c3aed]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowContinuationInput(false);
                            setContinuationPrompt("");
                          }}
                          className="flex-1 py-3 border border-[#5c403d] text-[#e5bdba] text-xs font-bold hover:border-[#ffb3ad]"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={continueStory}
                          disabled={isContinuing}
                          className="flex-1 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white text-xs font-bold border-t-2 border-[#c4b5fd] flex items-center justify-center gap-2"
                        >
                          {isContinuing ? (
                            <>
                              <RotateCcw className="w-4 h-4 animate-spin" />
                              续写中…
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              生成后续
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </aside>
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
      {/* Persistent Bottom Layout Navigation drawer */}
      <nav id="veridia-bottom-tabs" className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-stretch h-20 bg-[#1c1b1b] border-t-4 border-[#bd1020] shadow-2xl select-none">
        <button 
          id="tab-btn-create"
          onClick={() => setActiveTab("create")}
          className={`flex-1 flex flex-col items-center justify-center p-2 transition-all outline-none ${
            activeTab === "create" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <PenTool className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">创作</span>
        </button>

        <button 
          id="tab-btn-library"
          onClick={() => setActiveTab("library")}
          className={`flex-1 flex flex-col items-center justify-center p-2 transition-all outline-none border-l border-[#5c403d] ${
            activeTab === "library" ? "bg-[#bd1020] text-white font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="font-label-sm text-[9px] uppercase tracking-wider">Library</span>
        </button>

      </nav>

    </div>
  );
}
