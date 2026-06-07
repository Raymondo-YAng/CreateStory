import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "user.json");

type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: StoredUser[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function publicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

// Lazy initialize client to prevent startup failure if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. API calls will fail.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Route 0: Local account auth
app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(String(req.body.email || ""));
    const password = String(req.body.password || "");

    if (name.length < 2) {
      return res.status(400).json({ error: "Enter a display name with at least 2 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const users = await readUsers();
    if (users.some((user) => user.email === email)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ user: publicUser(newUser) });
  } catch (error: any) {
    console.error("Error signing up:", error);
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body.email || ""));
    const password = String(req.body.password || "");
    const users = await readUsers();
    const user = users.find((candidate) => candidate.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    res.json({ user: publicUser(user) });
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Could not log in." });
  }
});

// Ensure server handles API routes BEFORE mounting Vite middleware
// API Route 1: Generate Character
app.post("/api/generate-character", async (req, res) => {
  try {
    const { name, breathingStyle, customTraits, totalConcentration, stamina, techniqueMastery } = req.body;
    const ai = getAiClient();
    
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured. Please set it in Settings > Secrets." });
    }

    const prompt = `Generate a customized Demon Slayer (Samurai) warrior bio and dynamic techniques.
Character details:
- Name: ${name || "Unknown Warrior"}
- Selected Breathing Style: ${breathingStyle || "Flame Breathing"}
- Custom Personality/Traits: ${customTraits || "Determined and proud"}
- In-game stats: Total Concentration: ${totalConcentration || 50}%, Stamina: ${stamina || 50}%, Technique Mastery: ${techniqueMastery || 50}%

Please output a valid JSON response with the following schema:
{
  "japaneseTitle": "Character's thematic title in Japanese (e.g., 炎ノ剣士, 水平の守護者)",
  "vibe": "A 1-sentence poetic description of their aura (e.g., A blazing force of raw determination, smelling faintly of charcoal and ash)",
  "appearance": "A detailed 2-3 sentence description of their samurai visual features, hair, custom haori pattern, facial scar or markings, and the styling of their Nichirin blade.",
  "backstory": "A short, engaging 3-paragraph lore story about how they learned their breathing style, their family connection or tragedy, and their aspiration to become a Hashira.",
  "techniques": [
    {
      "name": "First Form: [Custom Japanese Kanji Style Name (e.g. Blazing Horizon)]",
      "kanji": "Japanese Kanji (e.g. 壱ノ型・灼熱水平)",
      "description": "How this technique is executed visually with swordsmanship and elemental effects."
    },
    {
      "name": "Second Form: [Form name]",
      "kanji": "Japanese Kanji (e.g. 弐ノ型・etc)",
      "description": "Visual details."
    },
    {
      "name": "Third Form: [Form name]",
      "kanji": "Japanese Kanji",
      "description": "Visual details."
    }
  ]
}
Make sure all techniques align specifically with their breathing style! For example, if it's Thunder Breathing, the techniques must contain speed, lightning crackles, and thunderous sound. If they chose a custom breathing style, invent highly creative, thematic techniques for it.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert anime lore creator, creative writer, and Demon Slayer scholar. You only outputs perfectly formatted JSON conforming strictly to the requested schema. No extra markdown tags outside JSON.",
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error generating character:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating character." });
  }
});

// API Route 2: Crow Chat (Kasugai Crow / 鎹鴉)
app.post("/api/crow-chat", async (req, res) => {
  try {
    const { messages, characterStatus } = req.body;
    const ai = getAiClient();
    
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const systemInstruction = `You are a Kasugai Crow (鎹鴉 - Kasugai Karasu), the majestic talking messenger crow from the Demon Slayer corps.
Your character traits:
- You shout almost everything! Use CAPITALIZATION frequently or exclamation points and urgent, dramatic words!
- You start some sentences with "CAW! CAW!" or "MESSAGE! MESSAGE!"
- You are passionate, slightly rude but deeply caring about the demon slayers.
- You speak of missions, demons, Hashira, food, and training.
- You emphasize Japanese terms, the Demon Slayer corps, and the Taisho era.
- Keep your replies relatively short (1-3 paragraphs Max), high-octane, and extremely urgent.
- Refer to the slayer as "SLAYER" or by their name if you know it (${characterStatus?.name || "RECRUIT"}).
- If they talk about their stats (Stamina: ${characterStatus?.stamina}%, Mastery: ${characterStatus?.mastery}%, Concentration: ${characterStatus?.concentration}%), yell at them to train harder or congratulate them on their raw power!`;

    // Map messages payload
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction,
        temperature: 0.9,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in crow chat:", error);
    res.status(500).json({ error: error.message || "An error occurred in crow communication." });
  }
});

// API Route 3: Mission Flow (Choices text-adventure)
app.post("/api/run-mission", async (req, res) => {
  try {
    const { arc, character, atmosphere, breathingFocus, choiceHistory } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const prompt = `Simulate a choice-based narrative of a Demon Slayer mission.
Context settings:
- Selected Arc/Location: ${arc || "natagumo (Mount Natagumo - Forest of Death)"}
- Atmosphere: ${atmosphere || "nocturnal (battle at night)"}
- Slayer Name: ${character?.name || "Young Slayer"}
- Slayer Breathing Style: ${character?.breathingStyle || "Flame Breathing"}
- Slayer Technique: ${character?.selectedTechnique || "First Form"}
- Breathing Focus Level: ${breathingFocus || 62}%
- Choice History so far: ${JSON.stringify(choiceHistory || [])}

If this is the beginning (choiceHistory is empty), generate the starting dramatic situation, describing the dark atmosphere, the rustling leaves, a sensing of demonic presence or encountering a threat appropriate to the Arc:
- Training Arc: Spider mansion exercises under Shinobu, running around bamboo forests, striking butterfly pillars or taking hard challenges.
- Mount Natagumo: Creepy, sticky violet spiderwebs, decapitated slayers floating in string puppets, encountering Rui's spider family.
- Mugen Train: Inside the rattling train, passenger tickets getting punched, passengers falling asleep, shadows of train tentacles, or fighting Enmu's train flesh at night!

If choiceHistory is NOT empty, narrate the consequence of the last choice, factor in their stats (Breathing Focus: ${breathingFocus}%) and breathing style, and describe the next tense phase of the encounter.

Output a valid JSON containing:
{
  "consequenceText": "A 2-3 sentence description of what happened as a result of their action or the initial set up.",
  "combatSceneText": "A 1-paragraph cinematic description of the monster threat or combat, styled in dramatic anime prose (e.g. 'A giant spider demon with multiple human arms drops from the canopy, mandibles clicking!')",
  "statusUpdate": "Poetic update regarding their battle state (e.g., 'Surrounded by poisonous vapor!', 'Focus slipping, blade glowing red!', 'Breathing at maximum output!')",
  "choices": [
    { "id": 1, "text": "Execute a specific breathing form matching their style to strike the threat directly." },
    { "id": 2, "text": "Take a defensive or defensive maneuver (tactical dodge, observing the movements, or sensory technique)." },
    { "id": 3, "text": "A tactical high-risk actions (e.g., jump off, save a civilian, or go for the main thread)." }
  ],
  "isVictory": false,
  "isDefeat": false
}
Make the prose incredibly intense, cinematic, and authentic! Give victory=true or defeat=true only after 3-4 cycles of choices.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a master anime game director. You generate high-stakes encounters and options. You output ONLY valid JSON matches.",
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error in mission execution:", error);
    res.status(500).json({ error: error.message || "An error occurred during the mission." });
  }
});

// API Route 4: Generate custom scrolling read scroll
app.post("/api/generate-scroll", async (req, res) => {
  try {
    const { title, summary } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const prompt = `Write a cinematic, traditional Japanese style scroll chapter from Demon Slayer based on the title: "${title || "煉獄の意志"}" and summary: "${summary || "炎柱・煉獄杏寿郎の最後の一戦。"}"
Formulate it into a highly poetic Japanese prose chapter, featuring sound effects (e.g., ドッ, ゴオオ, ズサァ) and intense vertical-scrolling appropriate storytelling.
If possible, also translate or include a beautiful English translation paragraph underneath.

Output a valid JSON matching this schema:
{
  "chapterNumber": "第 198 話",
  "publishDate": "2024.05.20 公開",
  "japaneseStoryText": "That poetic story line using writing mode writing-mode:vertical-rl. Keep it authentic and deep! It should be about 300 to 450 letters long. Use classic Taisho/Nichirin elements, swords clashing, fire spark, thunder roar.",
  "englishSummary": "Poetic English story summary."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a Japanese novelist and manga script editor. You output pure JSON matching the schema.",
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error generating scroll:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating scroll content." });
  }
});

// Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as middleware");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production state: serving static build from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nichirin App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
