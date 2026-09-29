export const TOURNAMENT_2026_CBG_HYOGO_MEN={
  id:'2026-27-cbg-hyogo-men',
  competitionId:'2026-27-cbg-hyogo-men',
  year:2026,
  season:'2026-27',
  generation:'2026-27',
  name:'2026 U15 CLUB BASKETBALL GAMES 兵庫県予選大会 男子',
  shortName:'2026 CBG兵庫県予選大会',
  competitionName:'2026 U15 CLUB BASKETBALL GAMES 兵庫県予選大会',
  prefecture:'兵庫県',
  category:'U15男子',
  gender:'男子',
  type:'県大会 / CBG兵庫県予選',
  tournamentLevel:'prefecture',
  participantCount:50,
  resultConfirmed:true,
  resultStatus:'completed',
  teamPowerEligible:true,
  sourceType:'user_confirmed_final_bracket',
  source:{
    document:'2026 U15 CLUB BASKETBALL GAMES 兵庫県予選大会 男子 トーナメント表 + 最終結果',
    confirmedDate:'2026-09-30',
    note:'ユーザー提供トーナメント表でベスト16・ベスト32まで再検証し、最終順位情報と統合'
  }
};

const TOP8=new Map([
  ['BRAVE BIRDS',['優勝','S',1]],
  ['North Wave',['準優勝','A+',2]],
  ['センターサークル',['3位','A',3]],
  ['BAY CROWN JUNIOR',['4位','A',4]],
  ['Three B',['5位','B',5]],
  ['DunkGo Club',['6位','B',6]],
  ['HDC Academy Cranes',['7位','B',7]],
  ['DIVE basketball academy',['8位','B',8]]
]);

const BEST16=new Set([
  'V-WAVE','SAMURAI','VLakers Basketball Club U15 男子','中崎B.B.C.U15',
  'G.Dark Horse','EPIC BASKETBALL CLUB U15','GOAT','KARTER'
]);

const BEST32=new Set([
  'DREAM SEEKER','ICE','U14 ゴッドドア','UNICORN BASKETBALL CLUB',
  '神戸センターサークル2','Dpro Laluz','Turkeys','Three B U14',
  'B-LION','神戸ストークスU14','cantera karter','Wild Wolves',
  'ARMS','ZERO','EPIC BASKETBALL CLUB U14','VEARTH'
]);

const PARTICIPANTS=[
  ['Three B'],
  ['All blacks',['All Blacks']],
  ['DREAM SEEKER'],
  ['V-WAVE'],
  ['FightingArts'],
  ['ICE'],
  ['Turkeys 2nd'],
  ['BRAVE BIRDS'],
  ['U14 ゴッドドア'],
  ['Westrick U15 basketball club',['Westrick U15']],
  ['SAMURAI'],
  ['UNICORN BASKETBALL CLUB',['UNCOON BASKETBALL CLUB']],
  ['センターサークル'],
  ['ZENITH'],
  ['神戸センターサークル2',['Kobe Center Circle 2','神戸センターサークル２']],
  ['OCTOPUS'],
  ['Dpro Laluz',['Dpro Lakuz']],
  ['VLakers Basketball Club U15 男子'],
  ['Turkeys',['TURKEYS']],
  ['B.P.F ACADEMY'],
  ['HYOGO KOREA'],
  ['中崎B.B.C.U15',['中嶋B.B.C U15']],
  ['MIRRORS'],
  ['Three B U14'],
  ['HDC Academy Cranes'],
  ['G.Dark Horse',['Q.DarkHorse']],
  ['A.C.T BASKETBALL CLUB'],
  ['B-LION'],
  ['神戸ストークスU14',['神戸ストークス U14']],
  ['BCJ Academy'],
  ['North Wave'],
  ['DunkGo Club'],
  ['cantera karter'],
  ['team DENY'],
  ['Improve Basketball Club'],
  ['Wild Wolves',['Wild wolves']],
  ['EPIC BASKETBALL CLUB U15',['EPIC BASKETBALL CLUB','EPG BASKETBALL CLUB U15']],
  ['ARMS'],
  ['BAY CROWN JUNIOR'],
  ['神戸センターサークル',['Kobe Center Circle']],
  ['ZERO'],
  ['BRAVE BIRDS u14'],
  ['GOAT'],
  ['DIVE basketball academy'],
  ['BRUINS ashiya'],
  ['西神戸ユニバース',['西神戸UNIVERS']],
  ['EPIC BASKETBALL CLUB U14',['EPG BASKETBALL CLUB U14']],
  ['YEBS Basketball Club'],
  ['VEARTH'],
  ['KARTER']
];

export const TEAMS_2026_CBG_HYOGO_MEN=PARTICIPANTS.map(([teamName,aliases=[]],index)=>{
  const top=TOP8.get(teamName);
  let placementLabel='ベスト64以下・県大会出場',rank='E',roundEliminated='preliminary',numericPlacement=null;
  if(BEST32.has(teamName)){placementLabel='ベスト32';rank='D';roundEliminated='round_of_32'}
  if(BEST16.has(teamName)){placementLabel='ベスト16';rank='C';roundEliminated='round_of_16'}
  if(top){placementLabel=top[0];rank=top[1];numericPlacement=top[2];roundEliminated=numericPlacement<=4?'final_stage':'placement_stage'}
  return {
    bracketSeed:index+1,
    teamName,
    aliases,
    placementLabel,
    placement:placementLabel,
    numericPlacement,
    rank,
    roundEliminated,
    ageGroup:/U14/i.test(teamName)?'U14':'U15',
    teamType:'クラブチーム',
    teamPowerEligible:true
  };
});

const match=(matchNumber,round,teamA,teamAScore,teamB,teamBScore,winner,date=null)=>({
  matchNumber,date,round,teamA,teamAScore,teamB,teamBScore,winner,
  loser:winner===teamA?teamB:teamA,result:'completed'
});

export const QUARTERFINALS_2026_CBG_HYOGO_MEN=[
  match('QF1','準々決勝','Three B',45,'BRAVE BIRDS',74,'BRAVE BIRDS'),
  match('QF2','準々決勝','センターサークル',88,'HDC Academy Cranes',61,'センターサークル'),
  match('QF3','準々決勝','North Wave',80,'DunkGo Club',52,'North Wave'),
  match('QF4','準々決勝','BAY CROWN JUNIOR',59,'DIVE basketball academy',57,'BAY CROWN JUNIOR')
];

export const MATCHES_2026_CBG_HYOGO_FINAL_MEN=[
  match(1,'決勝','BRAVE BIRDS',63,'North Wave',51,'BRAVE BIRDS','2026-09-23'),
  match(2,'3位決定戦','センターサークル',58,'BAY CROWN JUNIOR',45,'センターサークル','2026-09-23'),
  match(3,'5位決定戦','Three B',62,'DunkGo Club',58,'Three B','2026-09-23'),
  match(4,'7位決定戦','HDC Academy Cranes',68,'DIVE basketball academy',54,'HDC Academy Cranes','2026-09-23')
];
