import { Character, ScrollChapter, ArcSettings } from "./types";

export const IMAGES = {
  profile1: "https://demonslayer-anime.com/risshihen/assets/img/top/img_main_pc.jpg",
  silhouette: "https://demonslayer-anime.com/risshihen/assets/img/top/img_main_sp.jpg",
  heroFlame: "https://demonslayer-anime.com/risshihen/assets/img/top/img_main_pc.jpg",
  thunderKatana: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2022/02/Zenitsu-Agatsuma-Thunder-Breathing-Article.png",
  waterWaves: "https://cdn.shopify.com/s/files/1/0400/9767/7479/files/Demon-Slayer-Sakonji-Urokodaki-rigorously-training-Tanjiro.png?v=1681593076",
  insectWings: "https://cdn.shopify.com/s/files/1/0400/9767/7479/files/Demon_Slayer_Shinobu_Kocho_In_Motion.jpg?v=1693441647",
  mistyForest: "https://cdn.shopify.com/s/files/1/0400/9767/7479/files/Demon_Slayer_Inosuke_Hashibira_600x600.jpg?v=1696974568",
  kinoeRankAvatar: "https://gbaike-image.cdn.bcebos.com/0e2442a7d933c895d1436077d54a64f082025aafaa3c/0e2442a7d933c895d1436077d54a64f082025aafaa3c_url?x-bce-process=image/format,f_auto/resize,m_lfit,w_400,limit_1",
  mangaClash: "https://cdn.shopify.com/s/files/1/0400/9767/7479/files/Demon-Slayer-Kyojuro-Rengoku-and-Akaza.png?v=1678803969",
  mangaEye: "https://demonslayer-anime.com/hta/assets/img/img_fv_shinobu.jpg",
  mangaTorii: "https://demonslayer-anime.com/hta/assets/img/img_fv_giyu.jpg",
  profileSlayerRed: "https://demonslayer-anime.com/hta/assets/img/img_fv_tengen.jpg",
  profileSamuraiBeige: "https://demonslayer-anime.com/hta/assets/img/img_fv_muichiro.jpg",
  arcTraining: "https://demonslayer-anime.com/hta/assets/img/img_fv_giyu.jpg",
  arcNatagumo: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2022/09/demon-slayer-rui-header.jpg",
  arcMugenTrain: "https://demonslayer-anime.com/mugentrainarc/story/SYS/CONTENTS/story_2105_photo_163467792764791486",
  profileSwordFierce: "https://demonslayer-anime.com/hta/assets/img/img_fv_obanai.jpg",
  jujutsuHero: "https://static0.thegamerimages.com/wordpress/wp-content/uploads/2024/02/jujutsu-kaisen-overview.jpg",
  jujutsuGojo: "https://static.animecorner.me/2021/09/jjk-1.jpg",
  jujutsuGroup: "https://us.oricon-group.com/upimg/detail/6000/6593/img660/jujutsu-kaisen-pv-5.jpg",
  narutoHero: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2023/02/naruto-series.jpg",
  narutoShippuden: "https://animehunch.com/wp-content/uploads/2026/07/Naruto-Shippuden.jpg",
  narutoViz: "https://www.scifijapan.com/images/viz/NarutoShippuden-AnimeVIZa.jpg",
  onePieceHero: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2023/11/one-piece-egghead-arc-promo-poster.jpg",
  onePieceCrew: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2024/09/luffy-zoro-nami-sanji-and-usopp-from-one-piece.jpg",
  onePiecePoster: "https://img.animeschedule.net/production/assets/public/img/anime/jpg/default/one-piece-f2f2a983a8.jpg",
  myHeroHero: "https://static0.cbrimages.com/wordpress/wp-content/uploads/2023/01/my-hero-academia-deku.jpg",
  myHeroClass: "https://wallpapercave.com/wp/wp13519018.jpg",
  myHeroDeku: "https://wallpapercave.com/wp/wp13622553.jpg",
  bleachHero: "https://us.oricon-group.com/upimg/detail/7000/7264/img660/Bleach-Thousand-Year-Blood-War-The-Calamity-1.jpg",
  bleachScene1: "https://us.oricon-group.com/upimg/detail/7000/7264/img660/Bleach-Thousand-Year-Blood-War-The-Calamity-2.jpg",
  bleachScene2: "https://us.oricon-group.com/upimg/detail/7000/7264/img660/Bleach-Thousand-Year-Blood-War-The-Calamity-4.jpg",
};

export const DEFAULT_CHARACTER: Character = {
  name: "Tanjiro Kamado",
  japaneseTitle: "竈門 炭治郎",
  avatarUrl: IMAGES.profile1,
  breathingStyle: "Water Breathing",
  customTraits: "Kind-hearted, smelling faintly of coal, determined to cure Nezuko.",
  vibe: "A serene, flowy water dragon aura overlaid with hints of sunlit warmth.",
  appearance: "Wearing a standard charcoal tactical uniform with a green and black checkered haori. A conspicuous scar sits on the upper left forehead. The hilt of his Nichirin blade is wrapped in red and black, holding a circular black wheel guard.",
  backstory: "After returning to find a demon massacred his entire family and transformed his sister Nezuko, Tanjiro underwent two grueling years of training under Sakonji Urokodaki on Mount Sagiri. There, he learned the Water Breathing style, mastering vertical slashes, defensive waves, and calm state focus to break hard stones.",
  totalConcentration: 85,
  stamina: 62,
  techniqueMastery: 40,
  techniques: [
    {
      name: "First Form: Water Surface Slash",
      kanji: "壱ノ型・水面斬り",
      description: "Generates a horizontal concentrated water blade slash that slices swiftly ahead."
    },
    {
      name: "Second Form: Water Wheel",
      kanji: "弐ノ型・水車",
      description: "Tanjiro flips forward over enemies, creating a circulating wheel of water pressure across the battle path."
    },
    {
      name: "Third Form: Flowing Dance",
      kanji: "参ノ型・流流舞い",
      description: "A series of swift, continuous fluid zig-zag turns, weaving around attacks like a river cutting through stone structures."
    }
  ]
};

export const BREATHING_STYLES = [
  {
    id: "Water Breathing",
    japanese: "水の呼吸",
    textColor: "text-secondary",
    borderColor: "hover:border-secondary",
    wavesColor: "bg-secondary",
    icon: "waves",
    tags: "Fluid and adaptable. Devastate foes by turning their own momentum against them.",
  },
  {
    id: "Flame Breathing",
    japanese: "炎の呼吸",
    textColor: "text-primary",
    borderColor: "hover:border-primary",
    wavesColor: "bg-primary",
    icon: "local_fire_department",
    tags: "Passionate and explosive. Overwhelm your enemies with relentless, burning strikes.",
  },
  {
    id: "Thunder Breathing",
    japanese: "雷の呼吸",
    textColor: "text-tertiary",
    borderColor: "hover:border-tertiary",
    wavesColor: "bg-tertiary",
    icon: "bolt",
    tags: "Unparalleled speed. Strike with the swiftness of lightning before the enemy reacts.",
  },
  {
    id: "Beast Breathing",
    japanese: "獣の呼吸",
    textColor: "text-outline",
    borderColor: "hover:border-outline",
    wavesColor: "bg-outline",
    icon: "pets",
    tags: "Wild and unpredictable. Use raw instinct and dual-blade techniques to hunt.",
  }
];

export const SCROLL_PRESETS: ScrollChapter[] = [
  {
    id: "scroll_1",
    chapterNumber: "第 198 話",
    publishDate: "2024.05.20 公開",
    title: "煉獄の意志",
    japaneseTitle: "柱・特選記録",
    summary: "炎柱・煉獄杏寿郎の最後の一戦。その熱き魂が刻まれた未公開の記録。無限列車での激闘を追体験せよ。",
    正文: `那一刻，空气变了。少年的呼吸如冰般寒冷，又如太阳般炽热。一刀挥出，撕裂黑暗，改写命运！

鬼的惨叫在夜空中回荡，如同纷飞的花瓣，往昔的记忆满溢而出。

炼狱杏寿郎浑身燃烧着火焰般的鲜红斗志，站起身来。「我会履行我的职责！这里的人，一个都不会死！」`,
    简介: "炎柱炼狱杏寿郎的最后一战。重温无限列车上那炽热灵魂最为闪耀的激斗。",
    imageUrls: [IMAGES.heroFlame, IMAGES.mangaClash, IMAGES.mangaEye, IMAGES.mangaTorii]
  },
  {
    id: "scroll_2",
    chapterNumber: "第 01 話",
    publishDate: "2024.05.01 公開",
    title: "全集中・呼吸法",
    japaneseTitle: "剣士の起源",
    summary: "基礎から究極の奥義まで、全流派の源流を紐解く。呼吸の秘密を身につけ、刀身を覚醒させよ。",
    正文: `将氧气送至肺泡的每一个角落，让心跳响彻极限。

这正是「全集中呼吸」。当严苛到血管膨胀、骨骼作响的训练开始之时，背后寄宿的，便是自太古相传下来的属性化身。

水啊、炎啊、雷啊！流派的开端所昭示的，是超越五感极限的刀。`,
    简介: "全面记录所有呼吸法起源的卷轴，从简单的吸气法门到核心元素。",
    imageUrls: [IMAGES.arcTraining, IMAGES.mangaClash, IMAGES.mangaEye]
  },
  {
    id: "scroll_3",
    chapterNumber: "第 12 話",
    publishDate: "2024.05.10 公開",
    title: "十二鬼月・上弦",
    japaneseTitle: "宿敵の脅威",
    summary: "Upper Moons: 千年の時を生きる最凶の鬼たち。その悲しき過去と圧倒的な血鬼術の異能をあばく。",
    正文: `被赐予千年之血，最凶恶的怪物们。

刻在他们眼中的宿命数字。「上弦」即意味着，屠戮了无数柱的噩梦。

怨嗟之声、被撕裂的血缘联系之中，潜藏着鬼所隐藏的、属于人类的悲哀。`,
    简介: "上弦之月的编年史。解读无惨最强十二鬼的历史、悲剧与毁灭性的血鬼术。",
    imageUrls: [IMAGES.arcNatagumo, IMAGES.mangaEye]
  }
];

export const TRENDING_TECHNIQUES = [
  {
    style: "雷の呼吸・壱ノ型",
    title: "霹靂一閃",
    desc: "神速の踏み込みから放たれる、一撃必殺の居合。稲妻をまとう。",
    imageUrl: IMAGES.thunderKatana
  },
  {
    style: "水の呼吸・拾壱ノ型",
    title: "凪",
    desc: "冨岡義勇が生み出した、全てを無に帰す静寂の技。水面が鏡の如く静まり返る。",
    imageUrl: IMAGES.waterWaves
  },
  {
    style: "蟲の呼吸・蝶ノ舞",
    title: "戯れ",
    desc: "毒を塗り込んだ刃で、蝶のように舞い鬼を穿つ美しき刺突。",
    imageUrl: IMAGES.insectWings
  },
  {
    style: "獣の呼吸・漆ノ型",
    title: "空間識覚",
    desc: "全神経を研ぎ澄まし、空気の揺らぎから周囲の僅かな動向を捉え刃を交える。",
    imageUrl: IMAGES.mistyForest
  }
];

export const ARCS: ArcSettings[] = [
  {
    id: "training",
    title: "Training Arc",
    japaneseTitle: "修行篇",
    description: "Hone your breathing techniques under custom trial conditions in the butterfly mansion.",
    imageUrl: IMAGES.arcTraining,
    tag1: "BREATHING LV.5",
    tag2: "STAMINA BOOST",
    unlockedAt: "Unrestricted Access"
  },
  {
    id: "natagumo",
    title: "Mission to Mount Natagumo",
    japaneseTitle: "那田蜘蛛山篇",
    description: "Survive the spider clan's webs in the forest of death. Heavy demonic presence detected.",
    imageUrl: IMAGES.arcNatagumo,
    tag1: "EXTREME DANGER",
    tag2: "HASHIRA ASSIGNMENT",
    unlockedAt: "ACTIVE MISSION"
  },
  {
    id: "mugen_train",
    title: "Mugen Train Arc",
    japaneseTitle: "無限列車篇",
    description: "Protect the 200 passengers within the nightmare train containing nightmare anomalies.",
    imageUrl: IMAGES.arcMugenTrain,
    tag1: "FIRE BREATHING",
    tag2: "LOWER MOON ONE",
    unlockedAt: "LOCKED: RANK KINOE"
  }
];
