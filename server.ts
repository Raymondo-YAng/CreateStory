import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "user.json");
const CREATIONS_FILE = path.join(DATA_DIR, "creations.json");
const CREATION_EXPORTS_DIR = path.join(DATA_DIR, "creations");

type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

async function readCreations(): Promise<StoredCreation[]> {
  try {
    const raw = await fs.readFile(CREATIONS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeCreations(creations: StoredCreation[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CREATIONS_FILE, JSON.stringify(creations, null, 2), "utf8");
}

async function writeCreationSnapshot(creation: StoredCreation) {
  await fs.mkdir(CREATION_EXPORTS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CREATION_EXPORTS_DIR, `${creation.id}.json`),
    JSON.stringify(creation, null, 2),
    "utf8"
  );
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

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function parseJsonResponse(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function generateDeepSeekJson(prompt: string, systemInstruction: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: DEEPSEEK_API_KEY environment variable is not set. DeepSeek calls will use fallback content.");
    return null;
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "DeepSeek request failed.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return parseJsonResponse(content);
}

async function generateDeepSeekText(prompt: string, systemInstruction: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: DEEPSEEK_API_KEY environment variable is not set. DeepSeek calls will fail.");
    return null;
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.9
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "DeepSeek request failed.");
  }

  return payload?.choices?.[0]?.message?.content || "";
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

app.get("/api/creations", async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    const creations = await readCreations();
    res.json({
      creations: creations
        .filter((creation) => creation.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    });
  } catch (error: any) {
    console.error("Error reading creations:", error);
    res.status(500).json({ error: "Could not read creations." });
  }
});

app.post("/api/creations/spinoff", async (req, res) => {
  try {
    const userId = String(req.body.userId || "");
    const settings = req.body.settings || {};

    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    const normalizedSettings: StoredCreation["settings"] = {
      themeId: String(settings.themeId || ""),
      themeTitle: String(settings.themeTitle || "未命名主题"),
      themeSubtitle: String(settings.themeSubtitle || ""),
      coreSetting: String(settings.coreSetting || "核心设定"),
      coreOption: String(settings.coreOption || "未选择"),
      userPrompt: String(settings.userPrompt || ""),
      protagonistName: String(settings.protagonistName || "无名剑士")
    };

    let story: StoredCreation["story"];

    const deepSeekPrompt = `You will receive a user's complete fan-story creation settings as JSON.
Use every important setting and write an original spinoff side story.

User settings JSON:
${JSON.stringify(normalizedSettings, null, 2)}

Requirements:
- The story must be based on themeTitle, coreSetting, coreOption, and userPrompt.
- Write in Chinese, with a manga/anime side-story feeling.
- Keep it original and avoid copying any existing copyrighted scene.
- Include a dramatic title, a short chapter number, a publish date label, a vertical scroll story text field, and a concise summary.
- The story text should be Chinese prose with some Japanese manga sound effects if useful.
- The story MUST be significantly longer and richer: aim for 1200–1800 Chinese characters.
- Structure the narrative with all of the following elements:
  1. An atmospheric opening that establishes the location, time of day, weather, and mood.
  2. A brief introduction of the protagonist and their current emotional state.
  3. At least one paragraph of internal monologue showing the character's doubts, resolve, or memories.
  4. At least one section of spoken dialogue between characters (or a remembered voice).
  5. Two escalations of tension: a minor obstacle and then a major confrontation.
  6. A detailed climax scene with vivid action, sensory details, and Japanese manga sound effects.
  7. A short aftermath or lingering emotional beat at the end.
- Use vivid descriptions: show what the character sees, hears, smells, and feels physically.
- Keep the coreSetting and coreOption central to how the conflict is resolved.
- Use the protagonist's name "${normalizedSettings.protagonistName || "无名剑士"}" consistently throughout the story. Make them the clear point-of-view character.

Output valid JSON only:
{
  "title": "番外故事标题",
  "chapterNumber": "番外 第01话",
  "publishDate": "生成日期标签",
  "正文": "1200-1800字、细节丰富的番外故事正文",
  "简介": "一段简洁的故事简介，突出核心冲突与情感。"
}`;

    const generated = await generateDeepSeekJson(
      deepSeekPrompt,
      `You are DeepSeek ${DEEPSEEK_MODEL}, a careful fan-fiction editor. Transform user settings JSON into a fresh spinoff story. Output only valid JSON.`
    );

    if (generated) {
      story = {
        title: String(generated.title || `${normalizedSettings.themeTitle}番外`),
        chapterNumber: String(generated.chapterNumber || "番外 第01话"),
        publishDate: String(generated.publishDate || "DeepSeek 生成"),
        正文: String(generated.正文 || "故事生成完成，但正文为空。"),
        简介: String(generated.简介 || "根据用户设定生成的番外故事。")
      };
    } else {
      // Local fallback keeps the JSON persistence flow usable while the API key is missing.
      const fallbackOpening = `暮色像一层厚重的帷幕压在山道上，远处的乌鸦发出嘶哑的叫声，仿佛预示着什么。风卷起草叶，掠过少年紧绷的脸颊。他低头看着自己微微颤抖的掌心，那里还残留着白天训练时磨出的血痕。`;
      const heroName = normalizedSettings.protagonistName || "无名剑士";
      const fallbackMonologue = `「为什么偏偏是我？」${heroName}在心中反复追问。${normalizedSettings.coreSetting}「${normalizedSettings.coreOption}」的力量在他体内涌动，像一条尚未驯服的河流。他想起师父说过的话：真正的强大不是从不恐惧，而是即使恐惧也依然向前。`;
      const fallbackDialogue = `「你果然还是来了。」阴影中走出一个熟悉的身影，声音低沉而冰冷。\n\n${heroName}没有回答，只是缓缓拔出刀，刀身在月光下泛起微光。\n\n「就算掌握了${normalizedSettings.coreOption}，你以为就能改变结局吗？」\n\n「我不知道结局会怎样，」${heroName}终于开口，声音沙哑却坚定，「但至少，我要亲自走到那里。」`;
      const fallbackClimax = `话音未落，敌人已如鬼魅般扑来！${heroName}猛地吸一口气，全集中！${normalizedSettings.coreOption}的力量瞬间贯通四肢，刀锋划破空气发出ゴオオ的低鸣。第一次交锋，他被震退三步，虎口发麻；第二次交锋，他看清了对方攻击的轨迹。汗水流入眼角，刺痛让他更加清醒。\n\n「就是现在！」\n\nドン——！\n\n刀光如流星般斩落，带着他全部的决心与不甘。冲击波卷起漫天尘埃，落叶在空中狂舞。`;
      const fallbackAftermath = `当尘埃散去，${heroName}跪倒在地，胸口剧烈起伏。他望向远方渐渐亮起的天际，第一次感到那股力量不再陌生。${normalizedSettings.userPrompt || "这只是开始，属于他的番外，才刚刚写下第一页。"}`;
      story = {
        title: `${normalizedSettings.themeTitle}番外：${normalizedSettings.coreOption}`,
        chapterNumber: "番外 本地草稿",
        publishDate: "本地生成",
        正文: `【${normalizedSettings.themeTitle}番外】\n\n${fallbackOpening}\n\n${fallbackMonologue}\n\n${fallbackDialogue}\n\n${fallbackClimax}\n\n${fallbackAftermath}`,
        简介: `本地根据用户保存的 JSON 设定生成的番外草稿。核心设定为${normalizedSettings.coreSetting}「${normalizedSettings.coreOption}」，包含场景描写、内心独白、对话与战斗细节。`
      };
    }

    const creation: StoredCreation = {
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      settings: normalizedSettings,
      story
    };

    const creations = await readCreations();
    creations.unshift(creation);
    await writeCreations(creations);
    await writeCreationSnapshot(creation);

    res.status(201).json({ creation, model: generated ? DEEPSEEK_MODEL : "local-fallback" });
  } catch (error: any) {
    console.error("Error creating spinoff:", error);
    res.status(500).json({ error: error.message || "Could not create spinoff story." });
  }
});

// API Route: Continue an existing user-created story
app.post("/api/creations/continue", async (req, res) => {
  try {
    const userId = String(req.body.userId || "");
    const creationId = String(req.body.creationId || "");
    const continuationPrompt = String(req.body.continuationPrompt || "");

    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }
    if (!creationId) {
      return res.status(400).json({ error: "Missing creationId." });
    }

    const creations = await readCreations();
    const creationIndex = creations.findIndex((c) => c.id === creationId && c.userId === userId);
    if (creationIndex === -1) {
      return res.status(404).json({ error: "Creation not found." });
    }

    const creation = creations[creationIndex];
    const protagonistName = creation.settings.protagonistName || "无名剑士";

    const continuePrompt = `You are continuing an existing fan-fiction side story.

Original story settings:
${JSON.stringify(creation.settings, null, 2)}

Original story text so far:
"""
${creation.story.正文}
"""

User's request for the continuation theme/content:
${continuationPrompt || "请自然地续写故事的后续发展，保持原有风格和角色设定。"}

Requirements:
- Write the continuation in Chinese, matching the original manga/anime side-story tone.
- Keep the protagonist "${protagonistName}" as the point-of-view character and remain consistent with the original setting "${creation.settings.coreSetting} - ${creation.settings.coreOption}".
- The continuation should be 800–1200 Chinese characters long.
- Include vivid sensory details, at least one dialogue exchange, and a clear progression from the original ending.
- Do not repeat the original text; only output the new continuation content.
- Use Japanese manga sound effects where appropriate (e.g., ドン, ゴオオ, ズサァ).

Output valid JSON only:
{
  "continuationText": "后续正文内容，800-1200字"
}`;

    const generated = await generateDeepSeekJson(
      continuePrompt,
      `You are DeepSeek ${DEEPSEEK_MODEL}, a careful fan-fiction editor. Continue the user's story naturally and consistently. Output only valid JSON.`
    );

    let continuationText: string;
    if (generated) {
      continuationText = String(generated.continuationText || "后续故事生成完成，但内容为空。");
    } else {
      // Local fallback continuation
      const heroName = protagonistName;
      continuationText = `\n\n【续写】\n\n夜色更深了。${heroName}站在原地，胸口仍未从刚才的激战中平复。远处传来不知名的鸟鸣，像是一种催促。\n\n「还没有结束。」他低声说道，握紧刀柄。\n\n${continuationPrompt || "新的命运正在前方等待。"}\n\n风突然变冷，${creation.settings.coreOption}的力量再次在血脉中苏醒。${heroName}深吸一口气，迈出了下一步——无论前方是光明还是更深的黑暗，他都不会停下。`;
    }

    const separator = "\n\n———— 后续 ————\n\n";
    const updatedStory: StoredCreation["story"] = {
      ...creation.story,
      title: `${creation.story.title}（续）`,
      正文: `${creation.story.正文}${separator}${continuationText}`,
      简介: `${creation.story.简介}\n后续主题：${continuationPrompt || "自然续写"}`
    };

    const updatedCreation: StoredCreation = {
      ...creation,
      story: updatedStory,
      createdAt: new Date().toISOString()
    };

    creations[creationIndex] = updatedCreation;
    await writeCreations(creations);
    await writeCreationSnapshot(updatedCreation);

    res.json({ creation: updatedCreation, model: generated ? DEEPSEEK_MODEL : "local-fallback" });
  } catch (error: any) {
    console.error("Error continuing story:", error);
    res.status(500).json({ error: error.message || "Could not continue story." });
  }
});

// Ensure server handles API routes BEFORE mounting Vite middleware
// API Route 1: Generate Character
app.post("/api/generate-character", async (req, res) => {
  try {
    const { name, breathingStyle, customTraits, totalConcentration, stamina, techniqueMastery } = req.body;

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

    const data = await generateDeepSeekJson(
      prompt,
      "You are an expert anime lore creator, creative writer, and Demon Slayer scholar. Output perfectly formatted JSON conforming strictly to the requested schema. No markdown."
    );
    if (!data) {
      return res.status(500).json({ error: "DeepSeek API key is not configured. Set DEEPSEEK_API_KEY." });
    }
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

    const chatTranscript = (messages || [])
      .map((m: any) => `${m.role === "user" ? "User" : "Crow"}: ${m.text}`)
      .join("\n");
    const text = await generateDeepSeekText(chatTranscript, systemInstruction);
    if (!text) {
      return res.status(500).json({ error: "DeepSeek API key is not configured." });
    }

    res.json({ text });
  } catch (error: any) {
    console.error("Error in crow chat:", error);
    res.status(500).json({ error: error.message || "An error occurred in crow communication." });
  }
});

// API Route 3: Generate custom scrolling read scroll
app.post("/api/generate-scroll", async (req, res) => {
  try {
    const { title, summary } = req.body;

    const prompt = `Write a cinematic, traditional Japanese style scroll chapter from Demon Slayer based on the title: "${title || "煉獄の意志"}" and summary: "${summary || "炎柱・煉獄杏寿郎の最後の一戦。"}"
Formulate it into a highly poetic Japanese prose chapter, featuring sound effects (e.g., ドッ, ゴオオ, ズサァ) and intense vertical-scrolling appropriate storytelling.
Make the story longer and more detailed: aim for 800–1200 Chinese characters.
Structure the narrative with:
1. An atmospheric opening that paints the location, time, weather, and mood.
2. A clear protagonist and their emotional state.
3. At least one moment of internal reflection or remembered dialogue.
4. A rising conflict with two stages of escalation.
5. A vivid climax with detailed action, sensory imagery, and Japanese manga sound effects.
6. A brief aftermath that leaves a lingering emotional echo.
Output a valid JSON matching this schema:
{
  "chapterNumber": "第 198 話",
  "publishDate": "2024.05.20 公開",
  "正文": "用 writing-mode:vertical-rl 书写的诗意故事线。保持真实而深刻！约 800 到 1200 字。使用经典大正/日轮元素，刀剑交击、火花迸溅、雷霆轰鸣、环境细节与角色情绪。",
  "简介": "富有诗意的故事简介，点明核心冲突与情感。"
}`;

    const data = await generateDeepSeekJson(
      prompt,
      "You are a Japanese novelist and manga script editor. Output pure JSON matching the requested schema. No markdown."
    );
    if (!data) {
      return res.status(500).json({ error: "DeepSeek API key is not configured." });
    }
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
    console.log(`Veridia App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
