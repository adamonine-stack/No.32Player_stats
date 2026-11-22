// Navigation tabs always reopen their section at its initial view.
// Keep Firestore data, selected season/player, and user preferences intact.
export function resetNavigationViewState(state, tab) {
  switch (tab) {
    case 'home':
      state.homeStatsMode='total';
      break;
    case 'opponentTeams':
      state.selectedOpponentTeamId='';
      state.opponentTeamListReturnPosition=null;
      break;
    case 'games':
      state.selectedGameId='';
      state.gameListReturnPosition=null;
      break;
    case 'stats':
      Object.assign(state, {
        statsMode:'game',
        targetId:'',
        categoryId:'',
        opponentRankId:'',
        opponentRankMin:'',
        opponentRankMax:'',
        analysisReturn:null,
        analysisPreserveEmptyTarget:false,
        analysisCalendarMonth:'',
        analysisPeriodGameId:'',
        periodStart:'',
        periodEnd:'',
        detailStatsViews:{}
      });
      break;
    case 'team':
      Object.assign(state, {
        teamMode:'game',
        teamTargetId:'',
        teamCategoryId:'',
        teamOpponentRankId:'',
        teamOpponentRankMin:'',
        teamOpponentRankMax:'',
        teamPreserveEmptyTarget:false,
        teamCalendarMonth:'',
        teamPeriodStart:'',
        teamPeriodEnd:'',
        teamReturn:null,
        teamDetail:null,
        detailStatsViews:{}
      });
      break;
  }
  state.tab=tab;
  return state;
}
