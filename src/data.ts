import { Character, ScrollChapter, ArcSettings } from "./types";

export const IMAGES = {
  profile1: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4HRDzV6wjesaQXJaU4wS7aDsre_bUgu2kVCQlhcX90z19CTUi5YxTpkzEa7ybSXJWLBYOroibpHvP9wJnvADyaP480tRxPWcuflfMzwEFP-VkcYSR7rjTOFry8Lwja4Lm7i50OHwfYuDedUUHRqR9JdzmpcIS2ORWqSJ6KArJQwrorTqnRAt-jpOVpMqROGENtuUZfel_3-CtLP-hUA3Rxh206ZZHUSLfM7Dt06rTSrdES4kD8K1MSgYSjYv8BJPotwx1NaL1zcut",
  silhouette: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtQIbkWofQVSmUfpnUm716b8FYps-xdOt3MnDn0tDYSvVXF2BjALKPGoYjcKCFcgN3HFTF9uj91Qv_qwsl3fDuDp8hyXNlgqOrPO83MIzFMlczoaXY25n5XC6igYkFEU4Cc-afnYZk94L9DAjDyVHzHQNzFJbYwb2WmNPiXDH2xNwT-xqvqDcpDNUwXOi0Ll-tPLgpPaL4BFmi0MKHPcFWTJF71yfsjoJY-_88Mb_G0NvigBwStzFa--JbQ1g2OrdFrdH74GeDfeXV",
  heroFlame: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSqxsGdgnqgt2wK4yj8PNViNot0R6Hu1dt6fc-TE0CIiZg1svToLpEux5sVypUAZbb6JKEF6PzLfv0PghdrODWxlhXFV_KFpqEM67xJPR3GM_-l9p9_izpg6svZdgjhKhICgRxfUJKbhW4wTpIMHXnKMX4pTRxB4cuiaZbfPHYT49tiv1afB_R4cSi0R4c4z6o3LnwfsZ-fI9uxMat6yPGHxt3qL_ga0j40pPOic241dABhPeBKFpRoG5P-kUNa3YU3TODGf-qkUpe",
  thunderKatana: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhOLuYF0HUHTfa-l0gOzUwlcG8BdgVoIyeTirxXW-XOpD-Vyb9r2pGboUzm0WhQumxpaROf_f3lq0ZkTfzzZpwazHuxA10rJlDjNMcxaookn5H0JE_oMH3fywdrNuhPfVZyBcE_xDPQe4PNkWas-EoC6bfEPFQts6teZMc5mdiFO53HjCA3SeG8KoHeX-3LSjHKQclZKbcl0E_yr9_dchb3FawaPvDkU1A9ISaFH9kKgf7GgXJw241vz92gs1eqeVNEy74Qwayx8oG",
  waterWaves: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2HWkKCt1jjzDI7oFdI_aatOU-E8m7UGvD82DA31Tp49fyAiutNwba6QY2ZK5W_PM2i7gb8O8-3ewq9Qld5c7Ahg7nQvIrIleoe7Wd35TuvqDwMuVNnrhTy8EfXmIMxlpovQ3ngym2co7nn8ulico4wGzhRFFHjaqFA8J216uKo1F5NhIl-NAoJeRcHN6zeKwamlkXnJ1_9baYcD6rStRAm2KMypmnWVsmd5BmpQCVigvdnEiPmehjbga2ynWGhDzCMQiimoxZtlPk",
  insectWings: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmMQ7uj2fG_V06pjNl8X7hWeCe-YLU5Mqoy3m1kZAB8j_LjnCoDFB3LzqU0fnZH1vBG4mU80pS1K8uDlEGlNOIBCpB3TczzV1dVlIEkBA_Vam5sEBhUTtFO4yHgvOflvEixP1tuQhuE6HBl2MgtMmQTu60vbpQT4K-qrs9lIILIPM1rI_NKCzW79QgCNU7xH-Jrn3VBDdUnaVTAlMHnU_73cKblRaQCSL2az5XbnVcNd_yGWOCAKmSvYXR-KXMdIodxI772TcO7dkO",
  mistyForest: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTVDMO3e5qOnzLv-cnkoLporOSCpacfinzJOsNQaGoX3VfG5RjZB78ZDwHOZAUNHJQX0-5JyZIM067LtvmUDxM2QFdbx0Y5WntAOp44Q7I1L1CWCE3pkZhOwLJxoVuC_MKMg058n81mdBmBM-IkQb3AZnEO7UY7z6cLqFMzNI6PTlLBMo-X4nwmjaREKG-ZwFYJ88DdR44YAtKSPcUjUroT9mTJuHC6y-Ga-EO4oxL_uExXHiaC57EVOlUn3N-Hj7ZN7c_6g06AL7j",
  kinoeRankAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIBkgRpui-OXpFRqtbfApejNk4hp8-k6aBpPiMErIdrKm93yRM09qTqPmnHSHFCCOgNqEpPQoXDgFu8nkQiEriGZPoT-87aq1yRSr4wI0NvCI5mpLln2rKTpskQbzFVGpK35DY-8jgU1lzjfEo_tQ_a1vnE-rMA2R4_Q3coppFXucDe8Xjp0jv7g5khdqkaIq5kTTDmvhCqvfE_1RZn8l-ryLlE8Tf6ZGdA3ULYKe7o8YEHZ9p3ndCYsTc9CaCsMUqNfL3RBgN76hX",
  mangaClash: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5axYxEhfXBvYYYi59sMl9Dwq7V9KwbmoWGKwSL99xw7UBEn9kH1OaFsVQIZoRlzEt-_JsIw1OTSDf-PzeNHlkNKzbeUV0OTNAcVqLfG6S87gEruv7pXQ64s_xAW9HiTOV0vGk_X12ghKV8ISq2dtkrdQeSsxPjo321JbuDXcOrXbdKXFDN5BGZtyzAkYYj7RiWRoCkaHu27qtRYU4_sD9fKtnaFfwzUcB1f0UQEsSIiC_s0_Nj4cZIWRy7HyW2vboNlRcweeorcME",
  mangaEye: "https://lh3.googleusercontent.com/aida-public/AB6AXuDppzwWFNW8RVg7e0g_d63GnUYcXu_y1YIofS1ZW0drPAKBZm6soGlJUjCLfJNEAKnWvqb30rISG1cuDU_YA3JXgFBt3EZ70MVp-l5uG1w5fffJmV1NDWT6PY0X8mP5hHigytNjSoAq3WCcvFN8RN6lmZdv386HH2tsNfc1rlVvsDvV_jaSKEid9lLYiWj6ttj73I9IL-OIcvW39hcjYVk6KThJhtJz6rUFW5jIxvof3YaFGQD9ez5hWShHeLt8N5p9fyxqJlIBX5WZ",
  mangaTorii: "https://lh3.googleusercontent.com/aida-public/AB6AXuBge2invuZ6Nz5VyghMeeIPDX0l28SX3m31VfBfZdZ0HuE--0nMUmKUtxZWWPZc3zWkegvx8SovRBAWj5A0H8NKUCj7oHKDpbIFG_2cpeZbvPyGTJIR7rWcVwirm8cig3yqMW2MNVPFB0NVwiPldTnXRyb9R3YGtAGxatMEvbl4lAjjPBox353Ppm6Li6zwrkRvDdYvsk8mj7-4SJXDSKfO8uNtetsXRHL54IkoSaP3paK7xcLBmR_ofUsd6rbnbgo0bHmjuZ_hFdyb",
  profileSlayerRed: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx73EUH9WbwQ3MLk9-H-wt0Iaf3DBx3YwgMPxnBsI-6CfFYVdtjP9rpWJcs_0zZOoTsjD2TwZj2hk-IHpiQHo39-OAh_awTFTHgEEM_MwOvQaXSZDvQAwUX_huDK67ckTbhrIpjHREFdvzLGqrFFkHgKzJYpnQ4cj-3Zt62VrmddM767UJF0xjHYL-by2Di5mE1Esfdg-nTR0j_0LRAxKlHlc0xIhZyt_hZxVjyaOSJBpzmG4b6PXtNWq9i695pv3tGhc3_wu7Hc3f",
  profileSamuraiBeige: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0EmDG2zmBdNo7ssjcUqjm6gWFpdkABp9E_W0HvdvkuvUrFwEbwl6_nLMi-JEzSYbUlrQsywW0Mgt-IrkAyV4UCUHUSZ1CqSTITLLu2eapvHWJ7z51Ik07DOpkWi2D9qqwpH9BND-jAinNPzttq-waX4_FvxPIgLHKWnWgNvBRgLQ4PFsz2WQauIUPmfd4JGVN5LC-Qjrnise-v_R2_vWAsDIn1L4MeFKypM3UhH-qaiFNf2EJAXjMaIunIeC5ZEJYQZOrzX6Dvm3R",
  arcTraining: "https://lh3.googleusercontent.com/aida-public/AB6AXuCini5042G4Nw6uVk3m88xRjgxQnKHHMCO172u2xj0M_WAqaMEtc95SAGTsxymGj1lvNUvxEDcbFEjBYNg6Jhp7q79qz9f79nCDElUGS2CdnkqECB9wUsz1XbLawcSc8uYU77u_DhtXktV6TM7O-CMH1PCisbX6xSxJ1BfhkulClPLW7WfxVbTMi22FS5SBoOeva66FPB4dnlBqMRaOAOdT-OdCTKI6QnXZgJwstA9EB0OpooQARGkPuDELakLuI6TIH_l11aN-68-N",
  arcNatagumo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9uuD-8quXfDeU23LTqINVP2djPeojWLnaOQvB6LE3o0u8_DZSJJ66fcyUm_NEgPeboxj1WH-i6TGtL8jhE9bxlE0BsHPGi9zxU8E_HaZ4HxK6bHLNyfHDP0dJmX8O9E7uQsW1t6jJ6CKHJNCMNQZMl4obaVMXLRRDU8pZzgqn8zj_BSAOiPKUfA6leCnjECyqeFhW1brU7vgSH0TB5RLCwId7Cid-3Do_GfNKnPxhap_w4gs6YoVsW8ScYfF1i-DOiSdXPtNavAUV",
  arcMugenTrain: "https://lh3.googleusercontent.com/aida-public/AB6AXuAK5tF5O1q7UlKa8p7Ljfb6YZ0rYHhm-JS-X_4wt3VJ3MSzaYYu9VA566OQj0ILp9c5uWiGnBLN3PUTbHpdpSjr7CjoGQJKRah2COxvYLMGTKiC47R4Q8NPg-Ry0cv44pkahI7SRkxiJCyXLMJtNX5NsHqZ-yPR9EL2hl8dXNa3fY508xHSb83IijKVgbepfyt6dFYg6T5XDmbTp5qmmL2ZDv2o3tLOAJJBqYkm7CvA0HsM0tgCnHCwNIyjuVdAsVAEMjFmNK35zxFc",
  profileSwordFierce: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuFYg_TsGodZ-kSs3tCjyFKfSF5ucIlqfMIw28BYE9l4ZGSzCqvhCbMEfs6qcQqit3oh3LV2stXljph6mwy4WNpuIWVR2eaD7Y3FXCddo6yL-m-VLJ6_EvZppZ4UAjNUniD2SNAvmlSACs4BG8yrCviR1GKUBNDuXQKbCNrEq4E-sXLkJxl_5JWS87MVyDTThEsM1Qbci1bs6RfthItDOy5KOar3OuYorrk1xmhxpAhOrz3ZMhnhVkVqYxRwvtgU5hEyrBTBFxB9Rb",
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
    japaneseStoryText: `その時、空気が変わった。少年の呼吸は、氷のように冷たく、それでいて太陽のように熱い。一振りの刀が、闇を切り裂き、運命を塗り替えていく！

鬼の絶叫が夜に響き渡り、散りゆく花弁のように、過去の記憶が溢れ出した。

炎の如き真っ赤な闘志をみなぎらせて、煉獄杏寿郎は立ち上がった。「俺は俺の責務を全うする！ここにいる者は誰も死なせない！」`,
    englishSummary: "The final stand of Kyojuro Rengoku, the Flame Hashira. Re-live the fierce battle on the Mugen Train where his red-hot soul shines brightest.",
    imageUrls: [IMAGES.heroFlame, IMAGES.mangaClash, IMAGES.mangaEye, IMAGES.mangaTorii]
  },
  {
    id: "scroll_2",
    chapterNumber: "第 01 話",
    publishDate: "2024.05.01 公開",
    title: "全集中・呼吸法",
    japaneseTitle: "剣士の起源",
    summary: "基礎から究極の奥義まで、全流派の源流を紐解く。呼吸の秘密を身につけ、刀身を覚醒させよ。",
    japaneseStoryText: `肺胞の隅々にまで酸素を送り込み、心音を最大に響かせる。

これこそが「全集中の呼吸」也。血管が膨張し、骨が軋むほどの過酷な訓練が始まりし時、背後に宿るは太古より相伝されし属性の化身なり。 

水よ、炎よ、雷よ！流派の始まりが示すは五感の限界を超越せし刀。`,
    englishSummary: "A comprehensive scroll cataloging the origins of all breathing techniques, starting from simple inhalation routines to the core elements.",
    imageUrls: [IMAGES.arcTraining, IMAGES.mangaClash, IMAGES.mangaEye]
  },
  {
    id: "scroll_3",
    chapterNumber: "第 12 話",
    publishDate: "2024.05.10 公開",
    title: "十二鬼月・上弦",
    japaneseTitle: "宿敵の脅威",
    summary: "Upper Moons: 千年の時を生きる最凶の鬼たち。その悲しき過去と圧倒的な血鬼術の異能をあばく。",
    japaneseStoryText: `千年の血を分け与えられし、最凶の怪物たち。

彼らの瞳に刻まれる宿命の数字。「上弦」とはすなわち、数多の柱を屠って来し悪夢。 

怨嗟の声、引き裂かれた血の繋がりに、鬼の秘められたる人間の悲しみが潜む。`,
    englishSummary: "The chronicle of the Upper Moons. Decipher the history, tragedies, and devastating Blood Demon Arts of Muzan's strongest twelve combatants.",
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
