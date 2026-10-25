import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { derived, num, one, pct, sumStats } from '../js/calculations/stats-calculations.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const names=['statVal','analysisDivisor','analysisBasic','analysisShots','analysisBreak','analysisToBreakdown','analysisBreakdowns','homeStatsModeControl'];
const context=vm.createContext({derived,num,one,pct,state:{tab:'home',homeStatsMode:'perEightMinutes'},isMobileView:()=>true});
for(const name of names){const start=source.indexOf(`function ${name}(`);const end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end),context)}
test('8-minute normalization uses actual seconds, including fractional minutes, across all stat groups',()=>{
 const stats=sumStats([{twoPm:6,twoPa:12,ast:3,or:2,dr:4,passCut:3,passMiss:3}]);
 context.stats=stats;
 const html=vm.runInContext('[analysisBasic(stats,{perEightMinutes:true,seconds:1440}),analysisShots(stats,{perEightMinutes:true,seconds:1440}),analysisBreakdowns(stats,{perEightMinutes:true,seconds:1440})].join("")',context);
 assert.match(html,/PTS（ポイント）<\/span><b>4.0/);
 assert.match(html,/AST（アシスト）<\/span><b>1.0/);
 assert.match(html,/2PA<\/span><b>4.0/);
 assert.match(html,/50.0%/);
 assert.match(html,/\(ディフェンス\)<\/span><b>1.3/);
 assert.equal(vm.runInContext('statVal(3,analysisDivisor({}, {perEightMinutes:true,seconds:90}),{perEightMinutes:true})',context),'16.0');
});
test('missing time shows unavailable instead of zero or infinity; existing modes retain their values',()=>{
 assert.equal(vm.runInContext('statVal(12,0,{perEightMinutes:true})',context),'--');
 assert.equal(vm.runInContext('statVal(12,1,false)',context),'12');
 assert.equal(vm.runInContext('statVal(12,2,true)',context),'6.0');
 const html=vm.runInContext('homeStatsModeControl()',context);
 assert.equal((html.match(/class="home-stats-mode-btn active"/g)||[]).length,1);
 assert.match(html,/data-home-stats-mode="perEightMinutes"/);
});
