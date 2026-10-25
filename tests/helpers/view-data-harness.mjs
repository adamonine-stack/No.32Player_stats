import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../../js/app.js',import.meta.url),'utf8');
export function viewDataHarness(state){
 const start=app.indexOf('function ensureDataForView('),source=app.slice(start,app.indexOf('\nfunction ',start+1)),calls=[];
 const context=vm.createContext({state,DEFAULT_SEASON_ID:'default',homeSummaryKey:'',publicGameSummarySnapshotReady:true,publicGameSummaryCoverageReady:()=>true,
  releasePublicGameSummaries:()=>calls.push(['releasePublic']),ensureHomeSummarySync:()=>calls.push(['homeSummary']),ensurePublicGameSummariesSync:id=>calls.push(['publicSummary',id]),
  firestoreListeners:{remove:key=>calls.push(['remove',key])},ensureStatsSync:(ids,season)=>calls.push(['stats',[...ids],season])});
 vm.runInContext(source,context);context.ensureDataForView();return calls;
}
