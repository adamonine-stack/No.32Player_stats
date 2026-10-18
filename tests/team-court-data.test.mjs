import * as courtList from '../js/ui/court-shot-list.js';
import { collectTeamAnalysisShots } from '../js/calculations/team-shot-list-calculations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as stats from '../js/calculations/stats-calculations.js';
import * as filters from '../js/calculations/game-filter-calculations.js';
import * as shots from '../js/calculations/shot-calculations.js';
import {filterCourtShots} from '../js/calculations/shot-analysis-calculations.js';
import {OPPONENT_RANKS} from '../js/calculations/opponent-team-calculations.js';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const team=fs.readFileSync(new URL('../js/ui/team-shot-analysis.js',import.meta.url),'utf8');
globalThis.localStorage={getItem:()=>null};
const appStateURL=new URL(app.match(/import \{ state \} from "([^"]+)"/)[1],new URL('../js/app.js',import.meta.url));
const teamStateURL=new URL(team.match(/import \{ state \} from '([^']+)'/)[1],new URL('../js/ui/team-shot-analysis.js',import.meta.url));
const {state}=await import(appStateURL.href);

test('team court reads the exact state module used by the main application',async()=>{
 const {state:teamState}=await import(teamStateURL.href);
 assert.equal(teamState,state);
});

test('team court displays shared game data, selected Q and empty games',async()=>{
 const {state:shared}=await import(teamStateURL.href);
 const game={id:'g',statsRegistrationType:'quarter',quarters:4};
 const shot={id:'one',shotArea:'center_mid',shotType:'jump_shot',shotX:50,shotY:47,result:'made'};
 Object.assign(state,{games:[game],stats:[{id:'s',gameId:'g',playerId:'p',quarters:{q1:{registered:true,shots:[shot]},q2:{registered:true,shots:[{...shot,id:'two',result:'missed'}]}}}],teamMode:'game',teamTargetId:'g',teamCategoryId:'',teamOpponentRankMin:'',teamOpponentRankMax:'',opponentTeams:[],detailStatsViews:{g:'game'}});
 const nodes=new Map();const classes={add(){},remove(){}};
 const root={innerHTML:'',querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',onclick:null});return nodes.get(selector)},querySelectorAll(){return []}};
 const document={createElement:()=>({}),head:{appendChild(){}},body:{style:{},classList:classes},documentElement:{classList:classes},getElementById:()=>root};
 const context=vm.createContext({...stats,...filters,...shots,...courtList,collectTeamAnalysisShots,filterCourtShots,OPPONENT_RANKS,state:shared,document,window:{scrollY:0,scrollTo(){}},console});
 let source=team.replace(/^import .*;\n/gm,'');source=source.slice(0,source.indexOf('  function injectButton()'))+'globalThis.openTeamCourt=openModal;})();';
 vm.runInContext(source,context);
 context.openTeamCourt();
 assert.match(nodes.get('[data-team-totals]').innerHTML,/全体シュート数<\/span><b>2/);
 assert.match(nodes.get('[data-team-totals]').innerHTML,/50.0%/);
 assert.match(nodes.get('#teamAnalysisShotCourt').innerHTML,/shot-marker made/);
 assert.match(nodes.get('#teamAnalysisShotCourt').innerHTML,/shot-marker missed/);
 assert.match(nodes.get('[data-team-shot-list]').innerHTML,/1Q/);
 assert.match(nodes.get('[data-team-shot-list]').innerHTML,/2Q/);
 state.detailStatsViews.g='q1';context.openTeamCourt();
 assert.match(nodes.get('[data-team-totals]').innerHTML,/全体シュート数<\/span><b>1/);
 assert.match(nodes.get('[data-team-totals]').innerHTML,/100.0%/);
 assert.match(nodes.get('[data-team-shot-list]').innerHTML,/1Q/);
 assert.doesNotMatch(nodes.get('[data-team-shot-list]').innerHTML,/2Q/);
 state.stats=[];context.openTeamCourt();
 assert.match(nodes.get('[data-team-totals]').innerHTML,/全体シュート数<\/span><b>0/);
});
