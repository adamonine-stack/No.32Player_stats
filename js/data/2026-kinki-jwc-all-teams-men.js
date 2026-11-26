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
// 兵庫: 2026年男子JWC公式77枠。#42の名称は公式最終表の再抽出で team DENY と確認。
// 上位8位は 2026-kinki-jwc-soutai-results-men.js に登録済み。
const HYOGO_ALL=[
 [1,'センターサークル'],[2,'MIRRORS'],[3,'VLakers Basketball Club U14 男子'],
 [4,'SAKURA PRESS 男子'],[5,'COULEUR'],[6,'ZENITH'],[7,'甲南中学校'],
 [8,'B-LION'],[9,'Falcons U15 basketball club team'],[10,'ARMS'],
 [11,'G.Dark Horse'],[12,'BAYCROWN JUNIOR'],[13,'BAMBOO Shoot U15'],[14,'神戸HOPES'],
 [15,'WEST RIVER'],[16,'YFT PRESTO'],[17,'B.P.F ACADEMY'],[18,'Dpro Laluz'],
 [19,'神戸ストークスU15'],[20,'BRAVE BIRDS'],[21,'ZERO'],[22,'ICE'],
 [23,'EPIC BASKETBALL CLUB U14'],[24,'中崎B.B.C. U15'],[25,'HDC Academy Cranes'],
 [26,'えびす'],[27,'尼崎市立大庄中学校'],[28,'えびすTHIRD'],
 [29,'U15 ドリームメーカーズ'],[30,'神戸ブライアンツ'],[31,'All Blacks'],[32,'BELUGA'],
 [33,'Turkeys 2nd'],[34,'VLakers Basketball Club U15 男子'],[35,'V-WAVE'],[36,'Westrick'],
 [37,'VEARTH'],[38,'HYOGO KOREA'],[39,'ゴッド ドア'],[40,'NorthWave'],
 [41,'池田バスケットボールクラブ'],[42,'team DENY'],
 [43,'DIVE basketball academy'],[44,'DRAGON basketball'],[45,'WINGS'],
 [46,'明石市立野々池中学校'],[47,'KARTER'],[48,'Grow wings'],
 [49,'EPIC BASKETBALL CLUB U15'],[50,'西神戸ユニバース'],[51,'BCJ Academy'],
 [52,'DunkGo Club'],[53,'UNICORN BASKETBALL CLUB'],[54,'BRUINS ashiya'],
 [55,'Improve Basketball Club'],[56,'SKYBLUEZ BASKETBALL CLUB'],
 [57,'神戸ストークスU14'],[58,'Three B'],[59,'BRAVEBIRDS U14'],[60,'Three B U14'],
 [61,'えびすSECOND'],[62,'SAMURAI'],[63,'FightingArts'],[64,'TURKEYS'],
 [65,'RIVER WEST'],[66,'Kobe Center Circle'],[67,'RED PIECE'],[68,'GOAT'],
 [69,'cantera karter'],[70,'Kobe Center Circle 2'],[71,'Wild Wolves'],
 [72,'報徳学園中学校'],[73,'尼崎市立塚口中学校'],[74,'U14 ゴッドドア'],
 [75,'A.C.T. BASKETBALL CLUB 2026'],[76,'DREAMSEEKER'],[77,'明石市立望海中学校']
];
const HYOGO_TOP_SEEDS=new Set([1,19,20,39,40,58,72,77]);
const HYOGO=HYOGO_ALL.filter(([seed])=>!HYOGO_TOP_SEEDS.has(seed)).map(([bracketSeed,teamName])=>officialEntry(teamName,{
  bracketSeed,sourceType:'officialHyogoJwc2026FinalBracket',
  sourceUrl:'https://www.hyogo-jhs-basketball.net/_files/ugd/7b84d6_705b4913120a480581c138f089974a4b.pdf'
}));
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
  '2026-hyogo-jwc-qualifier-men':{unknownSeeds:[],note:'全77枠の名称を収録。上位8以外の敗退ラウンドは未検証'},
  '2026-osaka-jwc-qualifier-men':{note:'全チーム名称確認を優先。PDFブラケット内の多くの敗退ラウンドは位置対応未検証'},
  '2026-shiga-jwc-qualifier-men':{note:'PDFブラケットの一部対応・得点に矛盾。ベスト4以外は敗退順位未検証'}
};
