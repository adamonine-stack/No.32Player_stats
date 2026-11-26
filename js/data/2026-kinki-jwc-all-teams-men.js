// 2026年度近畿 JWC 男子: 公式トーナメントに記載された全チームの補完。
// 確認できていない敗退ラウンドは「出場」として記録し、Team Power/Rankには計上しない。
// 公式大会への参加自体は確認済み。ただし「最終順位」の確定とは別の情報。
const officialEntry=(teamName,extra={})=>({
  teamName,aliases:[],teamType:/中学校|中学$/.test(teamName)?'中学校':'クラブチーム',
  ageGroup:/U14/i.test(teamName)?'U14':'U15',
  placementLabel:'県大会出場（敗退ラウンド未検証）',
  placementConfirmed:false,resultConfirmed:false,teamPowerEligible:false,
  rank:null,...extra
});
const known=(teamName,placementLabel,extra={})=>({
  ...officialEntry(teamName),placementLabel,placementConfirmed:true,resultConfirmed:true,
  rank:/ベスト8/.test(placementLabel)?'B':/ベスト16/.test(placementLabel)?'C':/ベスト32/.test(placementLabel)?'D':null,
  teamPowerEligible:true,...extra
});
// 兵庫県公式最終トーナメント表（2026-11-15、添付 202611151636398.pdf）を勝ち上がり線と得点で照合。
// 77枠。13番・75番は取消線・0点のため棄権として記録し、Power対象外とする。
const HYOGO_FINAL_TABLE=[
  [1,"センターサークル","5位・ベスト8",["センターサークル"]],
  [2,"MIRRORS","ベスト64"],
  [3,"VLakers Basketball Club U14 男子","1回戦敗退",["VLakers U14"]],
  [4,"SAKURA PRESS 男子","ベスト32",["SAKURA PRESS"]],
  [5,"COULEUR","ベスト64"],
  [6,"ZENITH","ベスト64"],
  [7,"甲南中学校","ベスト32"],
  [8,"B-LION","ベスト64"],
  [9,"Falcons U15 basketball club team","ベスト16"],
  [10,"ARMS","ベスト16"],
  [11,"G.Dark Horse","1回戦敗退"],
  [12,"BAYCROWN JUNIOR","ベスト64"],
  [13,"BAMBOO Shoot U15","棄権（出場なし）"],
  [14,"神戸HOPES","ベスト32"],
  [15,"WEST RIVER","ベスト64"],
  [16,"YFT PRESTO","ベスト32"],
  [17,"B.P.F ACADEMY","ベスト64"],
  [18,"Dpro Laluz","1回戦敗退"],
  [19,"神戸ストークスU15","優勝",["神戸ストークス","神戸ストークス U15"]],
  [20,"BRAVE BIRDS","7位・ベスト8",["BRAVEBIRDS"]],
  [21,"ZERO","1回戦敗退"],
  [22,"ICE","ベスト64"],
  [23,"EPIC BASKETBALL CLUB U14","ベスト64"],
  [24,"中崎B.B.C. U15","ベスト32"],
  [25,"HDC Academy Cranes","ベスト16"],
  [26,"えびす","ベスト64"],
  [27,"尼崎市立大庄中学校","ベスト64"],
  [28,"えびすTHIRD","1回戦敗退"],
  [29,"U15 ドリームメーカーズ","ベスト32"],
  [30,"神戸ブライアンツ","ベスト64"],
  [31,"All Blacks","1回戦敗退"],
  [32,"U14 ゴッドドア","ベスト32"],
  [33,"Turkeys 2nd","ベスト64"],
  [34,"VLakers Basketball Club U15 男子","ベスト16"],
  [35,"V-WAVE","ベスト32"],
  [36,"Westrick","ベスト64"],
  [37,"VEARTH","ベスト64"],
  [38,"HYOGO KOREA","1回戦敗退"],
  [39,"報徳学園中学校","4位",["報德学園中学校","報徳学園"]],
  [40,"NorthWave","3位",["North Wave","NorthWave U15"]],
  [41,"池田バスケットボールクラブ","1回戦敗退"],
  [42,"BRAVEBIRDS U14","ベスト64",["BRAVE BIRDS U14"]],
  [43,"DIVE basketball academy","ベスト32"],
  [44,"DRAGON basketball","ベスト64"],
  [45,"WINGS","ベスト32"],
  [46,"明石市立野々池中学校","ベスト64"],
  [47,"KARTER","ベスト16"],
  [48,"Grow wings","ベスト64"],
  [49,"EPIC BASKETBALL CLUB U15","ベスト32"],
  [50,"西神戸ユニバース","ベスト64"],
  [51,"BCJ Academy","1回戦敗退"],
  [52,"DunkGo Club","ベスト16"],
  [53,"UNICORN BASKETBALL CLUB","ベスト64"],
  [54,"BRUINS ashiya","ベスト32"],
  [55,"Improve Basketball Club","ベスト64"],
  [56,"SKYBLUEZ BASKETBALL CLUB","1回戦敗退"],
  [57,"神戸ストークスU14","ベスト64"],
  [58,"Three B","8位・ベスト8"],
  [59,"ゴッド ドア","準優勝",["ゴッドドア","GODDOOR"]],
  [60,"Three B U14","ベスト64"],
  [61,"えびすSECOND","1回戦敗退"],
  [62,"SAMURAI","ベスト32"],
  [63,"FightingArts","ベスト64"],
  [64,"TURKEYS","ベスト16"],
  [65,"RIVER WEST","ベスト64"],
  [66,"Kobe Center Circle","ベスト64"],
  [67,"RED PIECE","1回戦敗退"],
  [68,"GOAT","ベスト32"],
  [69,"cantera karter","ベスト16"],
  [70,"Kobe Center Circle 2","ベスト64"],
  [71,"Wild Wolves","ベスト32"],
  [72,"team DENY","ベスト64"],
  [73,"尼崎市立塚口中学校","ベスト32"],
  [74,"BELUGA","ベスト64"],
  [75,"A.C.T. BASKETBALL CLUB 2026","棄権（出場なし）"],
  [76,"DREAMSEEKER","ベスト64"],
  [77,"明石市立望海中学校","6位・ベスト8",["望海中学校","望海"]]
];
export const HYOGO_2026_JWC_FINAL_ROWS=HYOGO_FINAL_TABLE.map(([bracketSeed,teamName,placementLabel,aliases=[]])=>({
  ...officialEntry(teamName),aliases,bracketSeed,placementLabel,placementConfirmed:true,resultConfirmed:true,
  teamPowerEligible:![13,75].includes(bracketSeed),
  rank:placementLabel==='優勝'?'S':placementLabel==='準優勝'?'A+':/^[34]位/.test(placementLabel)?'A':/ベスト8/.test(placementLabel)?'B':/ベスト16/.test(placementLabel)?'C':/ベスト32/.test(placementLabel)?'D':[13,75].includes(bracketSeed)?null:'E',
  sourceType:'officialHyogoJwc2026FinalBracket',sourceUrl:'https://www.hyogo-jhs-basketball.net/_files/ugd/7b84d6_705b4913120a480581c138f089974a4b.pdf'
}));
const HYOGO=HYOGO_2026_JWC_FINAL_ROWS.filter(row=>![19,59,40,39,1,77,20,58].includes(row.bracketSeed));
// 大阪府公式資料：地区予選男子154チーム（1〜7頁）と決勝トーナメント男子92チーム（91試合）。
// 重複84チームを統合した162チーム。決勝進出チームは最終到達段階のみ。
// 大阪エヴェッサBユースとクラブは別チーム。地区予選順位欄には矛盾があるため、決勝表への掲載有無で敗退を判定。
const OSAKA_FINAL_GROUPS=[
  [
    "優勝",
    "KAGO CLUB"
  ],
  [
    "準優勝",
    "AIR"
  ],
  [
    "ベスト4",
    "EAST.O.ACADEMY U15 TEAM|T-SMILE BASKETBALL TEAM U15"
  ],
  [
    "ベスト8",
    "RGS|ANGRY OWLS|RED FROGS|REDFORCES"
  ],
  [
    "ベスト16",
    "CLUB SPIRITS|sHow time|泉大津ジュニアバスケットボールクラブ|豊中市立第十三中学校|EL.DRAGON U-15|FRONTIER SPIRITS U15|大阪市立東生野中学校|大阪エヴェッサU15"
  ],
  [
    "ベスト32",
    "Sw!tch U15|大阪市立新豊崎中学校|摂津市立第四中学校|大阪市立三国中学校|寝屋川ＢＣ|吹田市立千里丘中学校|大阪市立東淀中学校|SUNHEARTS|TEAM GRIT|大阪市立蒲生中学校|Osaka Firefly|NEXTEST|大阪市立長吉中学校|明星中学校|吹田市立第五中学校|RISING STAR"
  ],
  [
    "ベスト64",
    "RAW STONES|枚方市立枚方中学校|大阪市立大宮中学校|B-NETZ|大阪市立住之江中学校|八上ワイルドキャッツU-15|大阪市立大正東中学校|BLACK UNICORN|大阪市立文の里中学校|Alma|SecretBase U15|大阪市立港南中学校|大阪市立港中学校|K'sLEO BASKETBALL CLUB|高槻市立第十中学校|HOOPERS|IBARAKI BASKETBALL CLUB|大東市立谷川中学校|近畿大学附属中学校|ENERGY|大阪GOLDEN EGG|B☆MAX|東大阪市立花園中学校|T's CROWS|GRITS|EDGE|SPARTANS|門真市立第二中学校"
  ],
  [
    "決勝トーナメント1回戦敗退",
    "大阪市立大正西中学校|大阪市立南中学校|大阪市立茨田北中学校|HOS|大阪市立大和川中学校|大阪市立今津中学校|大阪市立新北島中学校|GORILLAS|東大阪市立新喜多中学校|八尾市立東中学校|大阪市立阪南中学校|ディノニクスU15|東大阪市立石切中学校|monolith U15|吹田市立佐井寺中学校|大阪市立宮原中学校|東大阪市立金岡中学校|大阪市立巽中学校|なみはやバスケットボールクラブ|大阪市立美津島中学校|茨木市立天王中学校|大阪市立住吉中学校|大阪市立大正中央中学校|大東市立住道中学校|八尾市立上之島中学校|吹田市立第六中学校|Sparkle Basketball Club|大阪市立今市中学校|SHINE|吹田市立第一中学校|NEXT HEROES|大阪市立東陽中学校"
  ],
  [
    "地区予選敗退",
    "D SELECT|E.M.B.C U15|GOLDEN BEARS Jr.|Golden Wombats|HOSOGO GIBSONS|SkyHookU15|TAKATSU CLUB U15|八尾市立亀井中学校|八尾市立八尾中学校|八尾市立大正中学校|八尾市立曙川中学校|八尾市立高安小中学校|八尾市立龍華中学校|北大阪HORNETS|吹田市立南千里中学校|吹田市立山田中学校|吹田市立片山中学校|吹田市立第三中学校|吹田市立第二中学校|吹田市立豊津中学校|吹田市立青山台中学校|堺市立長尾中学校|大東市立諸福中学校|大阪エヴェッサU-15（クラブ）|大阪市立三稜中学校|大阪市立井高野中学校|大阪市立八阪中学校|大阪市立南港北中学校|大阪市立城陽中学校|大阪市立夕陽丘中学校|大阪市立大池中学校|大阪市立天下茶屋中学校|大阪市立平野北中学校|大阪市立成南中学校|大阪市立新北野中学校|大阪市立旭陽中学校|大阪市立東住吉中学校|大阪市立松虫中学校|大阪市立桜宮中学校|大阪市立歌島中学校|大阪市立淡路中学校|大阪市立花乃井中学校|大阪市立菫中学校|大阪市立西中学校|大阪市立高津中学校|大阪市立鯰江中学校|大阪市立鶴見橋中学校|大阪金剛インターナショナル中学校|太子町立中学校|寝屋川市立第一中学校|東大阪市立上小阪中学校|東大阪市立小阪中学校|東大阪市立枚岡中学校|東大阪市立義務教育学校くすは縄手南校|東大阪市立長瀬中学校|枚方市立楠葉中学校|枚方市立第四中学校|柏原市立堅下南中学校|池田市立池田中学校|羽曳野市立河原城中学校|羽曳野市立高鷲南中学校|茨木市立平田中学校|豊中市立第十五中学校|関西大学中等部|関西大学第一中学校|高槻市立柳川中学校|高槻市立第三中学校|高槻市立第六中学校|高槻市立芝谷中学校|高槻市立阿武野中学校"
  ]
];
const OSAKA_ALIASES={
  "KAGO CLUB": [
    "KAGO"
  ],
  "EAST.O.ACADEMY U15 TEAM": [
    "EAST.O.ACADEMY",
    "EAST O ACADEMY"
  ],
  "T-SMILE BASKETBALL TEAM U15": [
    "T-SMILE",
    "Tスマ"
  ],
  "Alma": [
    "BC Alma枚方",
    "BC Alma",
    "Alma枚方"
  ],
  "SUNHEARTS": [
    "SUN HEARTS"
  ],
  "SecretBase U15": [
    "Secret Base",
    "Secret Base U15"
  ],
  "近畿大学附属中学校": [
    "近大付属中学校",
    "近大附属中学校",
    "近大附属"
  ],
  "IBARAKI BASKETBALL CLUB": [
    "IBBC"
  ],
  "K'sLEO BASKETBALL CLUB": [
    "K's LEO BASKETBALL CLUB"
  ],
  "大阪エヴェッサU15": [
    "大阪エヴェッサU15（Bユース）",
    "大阪エヴェッサ Bユース"
  ],
  "大阪エヴェッサU-15（クラブ）": [
    "大阪エヴェッサ クラブ",
    "大阪エヴェッサU15クラブ"
  ],
  "SkyHookU15": [
    "SkyHook U15"
  ],
  "寝屋川ＢＣ": [
    "寝屋川BC"
  ]
};
export const OSAKA_2026_JWC_FINAL_ROWS=OSAKA_FINAL_GROUPS.flatMap(([placementLabel,names])=>names.split('|').map(teamName=>({
  ...officialEntry(teamName),aliases:OSAKA_ALIASES[teamName]||[],
  teamType:/中学校|中等部|小中学校|義務教育学校/u.test(teamName)?'中学校':'クラブチーム',
  placementLabel,placementConfirmed:true,resultConfirmed:true,teamPowerEligible:true,
  rank:placementLabel==='優勝'?'S':placementLabel==='準優勝'?'A+':placementLabel==='ベスト4'?'A':placementLabel==='ベスト8'?'B':placementLabel==='ベスト16'?'C':placementLabel==='ベスト32'?'D':'E',
  sourceType:placementLabel==='地区予選敗退'?'officialOsakaJwc2026DistrictResults':'officialOsakaJwc2026FinalBracket',
  sourceUrl:placementLabel==='地区予選敗退'?null:'https://u15.osakabasketball.jp/wp/wp-content/uploads/2026/11/U15選手権-結果（男子）-1.pdf'
})));
const OSAKA=OSAKA_2026_JWC_FINAL_ROWS.filter(row=>!['優勝','準優勝','ベスト4'].includes(row.placementLabel));
// 滋賀: 当該ページは勝ち上がりの一部に左右表記のずれがあるため、敗退段階は未確定。
const SHIGA=['ジュニアボーラーズ','JUMP','REDNEX.','Re:Bloom','GENESIS','SILVER SHARKS','NINJA AIRS'].map(teamName=>officialEntry(teamName,{
  sourceUrl:'http://shiga.japanbasketball.jp/U15/img/2026JWC_boy.pdf'
}));
// 奈良は全8チームのトーナメント結果を確認済み。残り4チーム=初戦敗退。
const NARA=['BANZAI jr.','Rafioants','ARAN ARDENT','PIRATES'].map(teamName=>known(teamName,'ベスト8',{
  sourceUrl:'https://www.iezo.net/forum/basketball-j/155259/'
}));
// 和歌山県協会公式最終組合せ・得点結果（2026-11-09公開）を照合。男子17枠・16試合。
// 3位決定戦は実施されていないため準決勝敗退2チームはベスト4。
const WAKAYAMA_FINAL_TABLE=[
  [1,"JOKER","ベスト16",[]],
  [2,"adorare","優勝",["ADORARE"]],
  [3,"ASLEAD有田","ベスト32",["ASLEAD 有田"]],
  [4,"高雄中学校","ベスト16",["高雄中"]],
  [5,"Gr’ｓ","ベスト8",["Gr’s","Gr's"]],
  [6,"RED KINGS","ベスト4",["REDKINGS"]],
  [7,"adorare second","ベスト16",["adoraresecond"]],
  [8,"Jr御坊","ベスト8",["Jr 御坊"]],
  [9,"ブランリオン","ベスト16",[]],
  [10,"Laissez Faire Jr.","ベスト16",["LaissezFaireJr.","Lassez Faire Jr.","LassezFaire jr."]],
  [11,"ROOKIES","準優勝",[]],
  [12,"W","ベスト16",[]],
  [13,"有和中学校","ベスト8",["有和中"]],
  [14,"GLÄNZ","ベスト8",["GLANZ"]],
  [15,"GLÄNZ ZWEI","ベスト16",["GLÄNZZWEI","GLANZ ZWEI"]],
  [16,"ONELYS wakayama U15","ベスト16",["ONELYSwakayama","ONELYSwakayamaU15"]],
  [17,"G-LiGAR","ベスト4",["GLiGAR","G-LIGAR"]]
];
export const WAKAYAMA_2026_JWC_FINAL_ROWS=WAKAYAMA_FINAL_TABLE.map(([bracketSeed,teamName,placementLabel,aliases])=>({
  ...known(teamName,placementLabel,{aliases,bracketSeed,
    rank:placementLabel==='優勝'?'S':placementLabel==='準優勝'?'A+':placementLabel==='ベスト4'?'A':placementLabel==='ベスト8'?'B':placementLabel==='ベスト16'?'C':'D',
    sourceType:'officialWakayamaJwc2026FinalBracket',
    sourceUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2026/11/U15senshuken_kachi.pdf'
  })
}));
const WAKAYAMA=WAKAYAMA_2026_JWC_FINAL_ROWS.filter(row=>![2,6,11,17].includes(row.bracketSeed));
// Source presentation differences are aliases, not extra teams. No result invented for Kyoto unfinished qualifier.
export const JWC_2026_ALL_TEAM_SUPPLEMENTS={
  '2026-hyogo-jwc-qualifier-men':HYOGO,
  '2026-osaka-jwc-qualifier-men':OSAKA,
  '2026-shiga-jwc-qualifier-men':SHIGA,
  '2026-nara-jwc-qualifier-men':NARA,
  '2026-wakayama-jwc-qualifier-men':WAKAYAMA
};
export const JWC_2026_UNRESOLVED={
  '2026-hyogo-jwc-qualifier-men':{unknownSeeds:[],note:'全77枠の名称・最終到達順位を公式最終表で照合済み'},
  '2026-shiga-jwc-qualifier-men':{note:'PDFブラケットの一部対応・得点に矛盾。ベスト4以外は敗退順位未検証'}
};
