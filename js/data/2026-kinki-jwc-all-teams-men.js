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
// 77枠。13番は取消線・0点のため棄権として記録し、Power対象外とする。
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
  [75,"A.C.T. BASKETBALL CLUB 2026","1回戦敗退"],
  [76,"DREAMSEEKER","ベスト64"],
  [77,"明石市立望海中学校","6位・ベスト8",["望海中学校","望海"]]
];
export const HYOGO_2026_JWC_FINAL_ROWS=HYOGO_FINAL_TABLE.map(([bracketSeed,teamName,placementLabel,aliases=[]])=>({
  ...officialEntry(teamName),aliases,bracketSeed,placementLabel,placementConfirmed:true,resultConfirmed:true,
  teamPowerEligible:bracketSeed!==13,
  rank:placementLabel==='優勝'?'S':placementLabel==='準優勝'?'A+':/^[34]位/.test(placementLabel)?'A':/ベスト8/.test(placementLabel)?'B':/ベスト16/.test(placementLabel)?'C':/ベスト32/.test(placementLabel)?'D':bracketSeed===13?null:'E',
  sourceType:'officialHyogoJwc2026FinalBracket',sourceUrl:'https://www.hyogo-jhs-basketball.net/_files/ugd/7b84d6_705b4913120a480581c138f089974a4b.pdf'
}));
const HYOGO=HYOGO_2026_JWC_FINAL_ROWS.filter(row=>![19,59,40,39,1,77,20,58].includes(row.bracketSeed));
// 大阪: 府協会U15部会公式決勝トーナメントに列記されているチーム。
// 元PDFは左右2列でテキスト化すると数チームが連結するため、明確に独立して読めた名称のみ収録。
// 1〜4位は既存データ側にあり、この配列から除外する。
const OSAKA_NAMES=[
 'REDFORCES','SUN HEARTS','門真市立第二中学校','NEXT HEROES',
 "K's LEO BASKETBALL CLUB",'RISING STAR','吹田市立佐井寺中学校',
 '大阪市立東陽中学校','大阪市立宮原中学校','EDGE','豊中市立第十三中学校',
 '吹田市立第一中学校','monolith U15','大阪エヴェッサU15','大阪市立東淀中学校',
 'SHINE','東大阪市立石切中学校','SPARTANS','大阪市立港中学校','GRITS',
 'SecretBase U15','明星中学校','吹田市立第五中学校','ディノニクスU15',
 '大阪市立港南中学校','大阪市立阪南中学校','Sparkle Basketball Club',
 'BC Alma枚方',"T's CROWS",'吹田市立千里丘中学校','大阪市立今市中学校',
 '東大阪市立花園中学校','寝屋川BC','大阪市立長吉中学校',
 '泉大津ジュニアバスケットボールクラブ','大阪市立文の里中学校',
 '大阪市立東生野中学校','東大阪市立新喜多中学校','八尾市立上之島中学校',
 'BLACK UNICORN','B☆MAX','八尾市立東中学校','吹田市立第六中学校',
 '大阪市立三国中学校','RED FROGS','ANGRY OWLS','Osaka Firefly',
 '大阪市立新北島中学校','大阪市立大正中央中学校','RGS','ENERGY',
 '大阪市立大正東中学校','大阪市立住之江中学校','近大付属中学校',
 '八上ワイルドキャッツU-15','NEXTEST','大阪GOLDEN EGG','sHow time',
 'GORILLAS','大東市立住道中学校','B-NETZ','茨木市立天王中学校',
 '大阪市立大和川中学校','FRONTIER SPIRITS U15','大阪市立今津中学校',
 '大阪市立住吉中学校','大阪市立大宮中学校','大阪市立蒲生中学校',
 '摂津市立第四中学校','大東市立谷川中学校','枚方市立枚方中学校',
 'EL.DRAGON U-15','大阪市立茨田北中学校','なみはやバスケットボールクラブ',
 '大阪市立新豊崎中学校','大阪市立美津島中学校',
 'HOS','IBARAKI BASKETBALL CLUB','大阪市立南中学校','TEAM GRIT',
 'CLUB SPIRITS','HOOPERS','大阪市立大正西中学校','高槻市立第十中学校',
 'RAW STONES','東大阪市立金岡中学校','Sw!tch U15','大阪市立巽中学校'
];
const OSAKA=[...new Set(OSAKA_NAMES)].map(teamName=>officialEntry(teamName,{
  sourceType:'osakaU15OfficialFinalBracketNames',
  sourceUrl:'https://u15.osakabasketball.jp/wp/wp-content/uploads/2026/11/U15選手権-結果（男子）-1.pdf'
}));
// 滋賀: 当該ページは勝ち上がりの一部に左右表記のずれがあるため、敗退段階は未確定。
const SHIGA=['ジュニアボーラーズ','JUMP','REDNEX.','Re:Bloom','GENESIS','SILVER SHARKS','NINJA AIRS'].map(teamName=>officialEntry(teamName,{
  sourceUrl:'http://shiga.japanbasketball.jp/U15/img/2026JWC_boy.pdf'
}));
// 奈良は全8チームのトーナメント結果を確認済み。残り4チーム=初戦敗退。
const NARA=['BANZAI jr.','Rafioants','ARAN ARDENT','PIRATES'].map(teamName=>known(teamName,'ベスト8',{
  sourceUrl:'https://www.iezo.net/forum/basketball-j/155259/'
}));
// 和歌山は1予備戦・8二回戦・4準々決勝・2準決勝・決勝を確認済み。
const WAKAYAMA=[
 ...['Gr’ｓ','Jr御坊','有和中学校','GLÄNZ'].map(teamName=>known(teamName,'ベスト8',{
   sourceUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/5412/',
   teamType:/中学校/.test(teamName)?'中学校':'クラブチーム'
 })),
 ...['JOKER','高雄中学校','adorare second','ブランリオン','LaissezFaireJr.','W','GLÄNZZWEI','ONELYSwakayama'].map(teamName=>known(teamName,'ベスト16',{
   sourceUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/5412/',
   teamType:/中学校/.test(teamName)?'中学校':'クラブチーム'
 })),
 known('ASLEAD有田','ベスト32',{
   sourceUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/5412/'
 })
];
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
  '2026-osaka-jwc-qualifier-men':{note:'全チーム名称確認を優先。PDFブラケット内の多くの敗退ラウンドは位置対応未検証'},
  '2026-shiga-jwc-qualifier-men':{note:'PDFブラケットの一部対応・得点に矛盾。ベスト4以外は敗退順位未検証'}
};
