const makeTeam=(teamName,prefecture,placementLabel,aliases=[],extra={})=>({
  teamName,prefecture,placementLabel,aliases,
  teamType:/中学校|中学部/u.test(teamName)?'中学校':'クラブチーム',
  ageGroup:'U15',
  ...extra
});

export const TOURNAMENT_2026_ALL_JAPAN_JHS_MEN={
  id:'2026-all-japan-jhs-basketball-men',
  year:2026,season:'2026-27',generation:'2026-27',
  name:'令和8年度全国中学校体育大会 第56回全国中学校バスケットボール大会（男子）',
  shortName:'2026 全中 男子',
  tournamentLevel:'national',type:'全国大会',category:'U15',gender:'男子',prefecture:'全国',
  startDate:'2026-08-18',endDate:'2026-08-20',venue:'島根県 出雲市・松江市',
  participantCount:24,resultScope:'allParticipants',resultConfirmed:true,resultStatus:'completed',teamPowerEligible:true,
  source:'https://u15.japanbasketball.jp/convention-news/3121/',
  sourceResults:'https://www.japanbasketball.jp/wp-content/uploads/zenchu2026_groupleague0818.pdf',
  sourceType:'officialJbaResult'
};
export const TEAMS_2026_ALL_JAPAN_JHS_MEN=[
  makeTeam('四日市メリノール学院中学校','三重県','優勝',['四日市メリノール学院','メリノール']),
  makeTeam('成立学園中学校','東京都','準優勝',['成立学園']),
  makeTeam('金沢学院大学附属中学校','石川県','ベスト4',['金沢学院大学附属','学院大附属中','金学大附']),
  makeTeam('京都精華学園中学校','京都府','ベスト4',['京都精華','京都精華学園']),
  makeTeam('福智町立方城中学校','福岡県','ベスト8',['方城中学校','方城中']),
  makeTeam('郡山市立郡山第三中学校','福島県','ベスト8',['郡山第三中学校','郡山三中']),
  makeTeam('倉敷市立南中学校','岡山県','ベスト8',['倉敷南','倉敷南中学校']),
  makeTeam('八戸市立白銀中学校','青森県','ベスト8',['白銀中学校','白銀中']),
  makeTeam('北九州市立菊陵中学校','福岡県','ベスト16',['菊陵中学校','菊陵']),
  makeTeam('札幌市立東月寒中学校','北海道','ベスト16',['東月寒中学校','東月寒']),
  makeTeam('江北町立江北中学校','佐賀県','ベスト16',['江北中学校','江北中']),
  makeTeam('高知中学校','高知県','ベスト16',['高知中']),
  makeTeam('城南静岡中学校','静岡県','ベスト16',['城南静岡']),
  makeTeam('浜松学院興誠中学校','静岡県','ベスト16',['学院興誠','浜松学院興誠']),
  makeTeam('広島市立古田中学校','広島県','ベスト16',['古田中学校','古田']),
  makeTeam('野々市市立布水中学校','石川県','ベスト16',['布水中学校','布水']),
  makeTeam('松江市立第二中学校','島根県','予選敗退',['松江第二中学校','松江二']),
  makeTeam('有田市立有和中学校','和歌山県','予選敗退',['有和中学校','有和中']),
  makeTeam('実践学園中学校','東京都','予選敗退',['実践学園']),
  makeTeam('湖南市立甲西北中学校','滋賀県','予選敗退',['甲西北中学校','甲西北']),
  makeTeam('埼玉栄中学校','埼玉県','予選敗退',['埼玉栄']),
  makeTeam('宇都宮市立一条中学校','栃木県','予選敗退',['一条中学校','一条中']),
  makeTeam('徳島市立八万中学校','徳島県','予選敗退',['八万中学校','八万']),
  makeTeam('札幌市立啓明中学校','北海道','予選敗退',['啓明中学校','啓明'])
];

export const TOURNAMENT_2025_ALL_JAPAN_JHS_MEN={
  id:'2025-all-japan-jhs-basketball-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'令和7年度全国中学校体育大会 第55回全国中学校バスケットボール大会（男子）',
  shortName:'2025 全中 男子',
  tournamentLevel:'national',type:'全国大会',category:'U15',gender:'男子',prefecture:'全国',
  startDate:'2025-08-22',endDate:'2025-08-24',venue:'鹿児島県 薩摩川内市・鹿児島市',
  participantCount:24,resultScope:'allParticipants',resultConfirmed:true,resultStatus:'completed',teamPowerEligible:true,
  source:'https://u15.japanbasketball.jp/convention-news/2582/',
  sourceResults:'https://www.japanbasketball.jp/wp-content/uploads/zenchu2025_torurnament0824.pdf',
  sourceType:'officialJbaResult'
};
export const TEAMS_2025_ALL_JAPAN_JHS_MEN=[
  makeTeam('金沢学院大学附属中学校','石川県','優勝',['金沢学院大学附属','金学大附']),
  makeTeam('世田谷区立梅丘中学校','東京都','準優勝',['梅丘中学校','梅丘']),
  makeTeam('四日市メリノール学院中学校','三重県','ベスト4',['四日市メリノール学院','メリノール']),
  makeTeam('京都精華学園中学校','京都府','ベスト4',['京都精華','京都精華学園']),
  makeTeam('北谷町立北谷中学校','沖縄県','ベスト8',['北谷中学校','北谷']),
  makeTeam('野々市市立布水中学校','石川県','ベスト8',['布水中学校','布水']),
  makeTeam('倉敷市立南中学校','岡山県','ベスト8',['倉敷南','倉敷南中学校']),
  makeTeam('東北学院中学校','宮城県','ベスト8',['東北学院']),
  makeTeam('実践学園中学校','東京都','ベスト16',['実践学園']),
  makeTeam('日野町立日野中学校','滋賀県','ベスト16',['日野中学校','日野']),
  makeTeam('大阪市立巽中学校','大阪府','ベスト16',['巽中学校','巽']),
  makeTeam('小山市立小山第三中学校','栃木県','ベスト16',['小山第三中学校','小山三']),
  makeTeam('春日部市立豊野中学校','埼玉県','ベスト16',['豊野中学校','豊野']),
  makeTeam('倉敷市立北中学校','岡山県','ベスト16',['倉敷北','倉敷北中学校']),
  makeTeam('札幌市立啓明中学校','北海道','ベスト16',['啓明中学校','啓明']),
  makeTeam('中村学園三陽中学校','福岡県','ベスト16',['中村三陽','中村学園三陽']),
  makeTeam('さつま町立宮之城中学校','鹿児島県','予選敗退',['宮之城中学校','宮之城']),
  makeTeam('高松市立香東中学校','香川県','予選敗退',['香東中学校','香東']),
  makeTeam('三種町立八竜中学校','秋田県','予選敗退',['八竜中学校','八竜']),
  makeTeam('浜松市立与進中学校','静岡県','予選敗退',['与進中学校','与進']),
  makeTeam('高知中学校','高知県','予選敗退',['高知中']),
  makeTeam('札幌市立東月寒中学校','北海道','予選敗退',['東月寒中学校','東月寒']),
  makeTeam('名古屋市立日比津中学校','愛知県','予選敗退',['日比津中学校','日比津']),
  makeTeam('玉名市立玉名中学校','熊本県','予選敗退',['玉名中学校','玉名'])
];

export const TOURNAMENT_2025_JR_WINTER_CUP_MEN={
  id:'2025-jr-winter-cup-national-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'京王 Jr.ウインターカップ2025-26 2025年度第6回全国U15バスケットボール選手権大会（男子）',
  shortName:'Jr.ウインターカップ2025-26 男子',
  tournamentLevel:'national',type:'全国大会',category:'U15',gender:'男子',prefecture:'全国',
  startDate:'2026-01-04',endDate:'2026-01-08',venue:'京王アリーナTOKYO',
  participantCount:52,resultScope:'allParticipants',resultConfirmed:true,resultStatus:'completed',teamPowerEligible:true,
  source:'https://juniorwintercup2025-26.japanbasketball.jp/news/370/',
  sourceResults:'https://juniorwintercup2025-26.japanbasketball.jp/schedule/',
  sourceType:'officialJbaResult'
};
export const TEAMS_2025_JR_WINTER_CUP_MEN=[
  makeTeam('京都精華学園中学校','京都府','優勝',['京都精華','京都精華学園']),
  makeTeam('立川ダイスU15','東京都','準優勝',['立川ダイス U15']),
  makeTeam('ライジングゼファー福岡 U15','福岡県','3位',['ライジングゼファー福岡U15']),
  makeTeam('滋賀レイクスU15','滋賀県','4位',['滋賀レイクス U15']),
  makeTeam('ゴッドドア','兵庫県','ベスト8'),
  makeTeam('金沢学院大学附属中学校','石川県','ベスト8',['金沢学院大学附属','金学大附']),
  makeTeam('四日市メリノール学院中学校','三重県','ベスト8',['四日市メリノール学院','メリノール']),
  makeTeam('琉球ゴールデンキングスU15','沖縄県','ベスト8',['琉球ゴールデンキングス U15']),
  makeTeam('ISC PANTHERS','愛知県','ベスト16',['ISC　PANTHERS']),
  makeTeam('NOSHIRO BASKETBALL ACADEMY','秋田県','ベスト16'),
  makeTeam('REDFORCES','大阪府','ベスト16'),
  makeTeam('SKT戸上','長野県','ベスト16'),
  makeTeam('バンビシャス奈良U15','奈良県','ベスト16'),
  makeTeam('レバンガ北海道U15','北海道','ベスト16'),
  makeTeam('熊本ヴォルターズU15','熊本県','ベスト16'),
  makeTeam('佐賀バルーナーズU15','佐賀県','ベスト16'),
  makeTeam('AIR JAM ジュニア','岐阜県','ベスト32'),
  makeTeam('B.FORCE 愛媛','愛媛県','ベスト32'),
  makeTeam('G-LiGAR','和歌山県','ベスト32'),
  makeTeam('HAK BRAVES','茨城県','ベスト32'),
  makeTeam('HYUGA D‘RISE','宮崎県','ベスト32'),
  makeTeam('LakeForce','滋賀県','ベスト32',['Lake Force']),
  makeTeam('NEXT WOLVES','大分県','ベスト32',['NEXT　WOLVES']),
  makeTeam('RIZINGS 徳島','徳島県','ベスト32',['RIZINGS　徳島']),
  makeTeam('U15 川崎ブレイブサンダース','神奈川県','ベスト32',['川崎ブレイブサンダースU15']),
  makeTeam('Yonago City SPARTANS','鳥取県','ベスト32'),
  makeTeam('ZIPS BASKETBALL ACADEMY','群馬県','ベスト32'),
  makeTeam('越谷アルファーズU15','埼玉県','ベスト32'),
  makeTeam('岩手ビッグブルズU15','岩手県','ベスト32'),
  makeTeam('山形ワイヴァンズU15','山形県','ベスト32'),
  makeTeam('実践学園中学校','東京都','ベスト32',['実践学園']),
  makeTeam('千葉ジェッツU15','千葉県','ベスト32'),
  makeTeam('AXLS','鹿児島県','出場'),
  makeTeam('Black Spartans','島根県','出場'),
  makeTeam('BOMBERS','新潟県','出場'),
  makeTeam('Bravely Nexus','福島県','出場'),
  makeTeam('Club Peace of Mind','埼玉県','出場'),
  makeTeam('DARK RED CRABS U15','福井県','出場'),
  makeTeam('groundwork CLUB','富山県','出場'),
  makeTeam('HARBOR','神奈川県','出場'),
  makeTeam('HOOPS4HOPE','千葉県','出場'),
  makeTeam('Kochi Crazy Diamond','高知県','出場'),
  makeTeam('KOGAKURA VICTORY','長崎県','出場'),
  makeTeam('ULTIMATES','静岡県','出場'),
  makeTeam('スプラッシュ','山梨県','出場'),
  makeTeam('宇都宮ブレックスU15','栃木県','出場'),
  makeTeam('下松 BIG BEARS','山口県','出場'),
  makeTeam('広島ドラゴンフライズU15','広島県','出場'),
  makeTeam('香川ファイブアローズU15','香川県','出場'),
  makeTeam('倉敷市立南中学校','岡山県','出場',['倉敷南','倉敷南中学校']),
  makeTeam('東北学院中学校','宮城県','出場',['東北学院']),
  makeTeam('八戸市立白銀中学校','青森県','出場',['白銀中学校','白銀中'])
];

export const TOURNAMENT_2025_U15_CBG_MEN={
  id:'2025-u15-club-basketball-games-national-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'第14回U15クラブバスケットボールゲームス（男子）',
  shortName:'第14回 U15 CBG 全国大会 男子',
  tournamentLevel:'national',type:'全国大会',category:'U15',gender:'男子',prefecture:'全国',
  startDate:'2025-12-25',endDate:'2025-12-27',venue:'愛知県',
  participantCount:47,resultScope:'top16AndParticipation',lowerRoundGranularity:'participationOnlyBelowBest16',
  resultConfirmed:true,resultStatus:'completed',teamPowerEligible:true,
  source:'https://u15cbg.info/boys.html',
  sourceResults:'https://u15cbg.info/pdf/tournament_final.pdf',
  sourceType:'officialTournamentPdf'
};
const CBG2025_PARTICIPANTS=[
  ['NORD BREZZA U15','北海道'],['OWLS U-15','青森県'],['YSI','岩手県'],['DUO BASKETBALL CLUB','宮城県'],['RCSクラブ','秋田県'],['青龍ＢＣ','山形県'],['福島SiriusBlacks U15','福島県'],
  ['BCつくばEvolution','茨城県'],['Eternity','栃木県'],['BIG EIGHT','群馬県'],['HANABUSA','埼玉県'],['LEOVISTA BASKETBALL CLUB','千葉県'],['CONFIANZA東京U15','東京都'],['GXAロケッツ','神奈川県'],['Yoshida','山梨県'],
  ['S&S PHOENIX','新潟県'],['奥田クラブ','富山県'],['Jamaney Youth','石川県'],['RISE MISSION','福井県'],['ASTERISM1','長野県'],
  ['BLUE MONSTERs','岐阜県'],['ULTIMATES','静岡県'],['ピュア・チャンプス','愛知県'],['津ジュニアゴールデンアウルズ','三重県'],
  ['ジュニアボーラーズ','滋賀県'],['KYOTO DREAMERS','京都府'],['KAGO CLUB','大阪府'],['KARTER','兵庫県'],['PIRATES U15','奈良県'],['adorare','和歌山県'],
  ['PHENOM','鳥取県'],['MASUDA BANDITS','島根県'],['SunBraves OKAYAMA','岡山県'],['SENDA Bloom','広島県'],['FIVE BRIDGE','山口県'],['TOKUSHIMA VERTEX','徳島県'],['Verde Marugame','香川県'],['EHIME INFINITY','愛媛県'],['龍馬バスケットボール教室U15','高知県'],
  ['KAGO CLUB FUKUOKA','福岡県'],['Nexus','佐賀県'],['WAGS U15','長崎県'],['BLUE UNISON','熊本県'],['TRIDENT','大分県'],['MIYAKONOJO・GRITS','宮崎県'],['ROOTS','鹿児島県'],['THE SOUTH U15','沖縄県']
];
const CBG2025_RESULTS=new Map([
  ['Jamaney Youth','優勝'],['BIG EIGHT','準優勝'],['HANABUSA','3位'],['ピュア・チャンプス','4位'],
  ['CONFIANZA東京U15','5位'],['KAGO CLUB','6位'],['S&S PHOENIX','7位'],['津ジュニアゴールデンアウルズ','8位']
]);
export const TEAMS_2025_U15_CBG_MEN=CBG2025_PARTICIPANTS.map(([teamName,prefecture])=>makeTeam(
  teamName,prefecture,CBG2025_RESULTS.get(teamName)||'出場',
  teamName==='津ジュニアゴールデンアウルズ'?['津ジュニア ゴールデンアウルズ']:[]
));
