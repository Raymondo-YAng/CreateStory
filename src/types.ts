export interface Technique {
  name: string;
  kanji: string;
  description: string;
}

export interface Character {
  name: string;
  japaneseTitle: string;
  avatarUrl: string;
  breathingStyle: string;
  customTraits: string;
  vibe: string;
  appearance: string;
  backstory: string;
  totalConcentration: number;
  stamina: number;
  techniqueMastery: number;
  techniques: Technique[];
}

export interface ScrollChapter {
  id: string;
  chapterNumber: string;
  publishDate: string;
  title: string;
  japaneseTitle: string;
  summary: string;
  japaneseStoryText: string;
  englishSummary: string;
  imageUrls: string[];
}

export interface Message {
  role: "user" | "model";
  text: string;
  senderName: string;
  avatarRank?: string;
}

export interface ArcSettings {
  id: "training" | "natagumo" | "mugen_train";
  title: string;
  japaneseTitle: string;
  description: string;
  imageUrl: string;
  tag1: string;
  tag2: string;
  unlockedAt: string;
}

export interface MissionChoice {
  id: number;
  text: string;
}

export interface MissionState {
  isPlaying: boolean;
  arc: "training" | "natagumo" | "mugen_train";
  consequenceText: string;
  combatSceneText: string;
  statusUpdate: string;
  choices: MissionChoice[];
  isVictory: boolean;
  isDefeat: boolean;
  choiceHistory: string[];
  isLoading: boolean;
}
