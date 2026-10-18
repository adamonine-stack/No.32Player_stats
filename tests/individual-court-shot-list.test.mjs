import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as shots from '../js/calculations/shot-calculations.js';
import * as courtList from '../js/ui/court-shot-list.js';
import { collectTeamAnalysisShots } from '../js/calculations/team-shot-list-calculations.js';
import { filterCourtShots } from '../js/calculations/shot-analysis-calculations.js';
function fixture(){
 const shot={id:'same',shotX:40,shotY:35,shotType:'jump_shot',result:'made',createdAt:10};
 const games=[{id:'g',statsRegistrationType:'quarter',date:'2026-10-18'}];
 const state={lastPlayerId:'p1',statsMode:'all',players:[{id:'p1',number:32,name:'<KT>'},{id:'p2',number:9,name:'SOTA'}],stats:[
  {id:'s1',gameId:'g',playerId:'p1',quarters:{q2:{shots:[{...shot,shotX:80,shotY:60,result:'missed',createdAt:1}]},q1:{shots:[shot]}}},
  {id:'s2',gameId:'g',playerId:'p2',quarters:{q1:{shots:[{...shot,id:'p2',shotX:null,shotY:null,shotArea:'under_basket'}]}}}
 ]};
 let modalHtml='',scrolls=0;const nodes=new Map(),buttons=new Map();
 const $=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',onclick:null,classList:{add(){}},scrollIntoView(){scrolls++;}});return nodes.get(selector);};
 const document={querySelector:$,querySelectorAll(selector){
  const field=selector.match(/^\[data-analysis-(.+)\]$/)?.[1];
  if(!field)return [];
  const html=[...nodes.values()].map(n=>n.innerHTML).join('');
  const result=[...html.matchAll(new RegExp(`data-analysis-${field}="([^"]+)"`,'g'))].map(m=>({dataset:{['analysis'+field[0].toUpperCase()+field.slice(1)]:m[1]},onclick:null}));buttons.set(field,result);return result;
 }};
 const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 const source=app.slice(app.indexOf('function openShotAnalysis(){'),app.indexOf('window.openShotAnalysis=openShotAnalysis;'));
 const context=vm.createContext({...shots,...courtList,collectTeamAnalysisShots,filterCourtShots,state,$,document,player:()=>state.players.find(p=>p.id===state.lastPlayerId),analysisShotItems:()=>state.stats.filter(s=>s.playerId===state.lastPlayerId),targetGames:()=>games,sortPlayersByCategoryAndNumber:p=>p,escapeHtml:v=>String(v).replaceAll('<','&lt;').replaceAll('>','&gt;'),setLastPlayerId(){},modal:html=>modalHtml=html,closeModal(){},shotTypeButtonLabel:id=>shots.SHOT_TYPES[id],shotCourtSvg:rows=>`<svg data-markers="${rows.length}"><rect class="court-tap-surface"/></svg>`});
 vm.runInContext(source,context);context.openShotAnalysis();
 return {state,nodes,buttons,$,html:()=>modalHtml,scrolls:()=>scrolls};
}
test('individual list includes player/Q, area, type and result in corrected Q/registration order',()=>{
 const f=fixture(),html=f.$('#analysisShotList').innerHTML;
 assert.match(html,/#32 &lt;KT&gt; 1Q/);assert.match(html,/#32 &lt;KT&gt; 2Q/);
 assert.ok(html.indexOf('1Q')<html.indexOf('2Q'));
 assert.match(html,/インサイド/);assert.match(html,/右45°3P/);assert.match(html,/ジャンプシュート/);assert.match(html,/成功/);assert.match(html,/失敗/);
 assert.equal(f.buttons.get('shot').length,2);
 assert.ok(f.html().indexOf('id="analysisShotList"')>f.html().indexOf('id="analysisClearAll"'));
});
test('row selection highlights exact coordinates; filtering removes hidden selection and clear restores all rows',()=>{
 const f=fixture();f.buttons.get('shot')[1].onclick();
 assert.match(f.$('#analysisShotCourt').innerHTML,/team-shot-selected-halo" cx="80" cy="60"/);
 assert.match(f.$('#analysisShotFocus').textContent,/2Q.*失敗/);assert.equal(f.scrolls(),1);
 f.buttons.get('result').find(b=>b.dataset.analysisResult==='made').onclick();
 assert.equal(f.buttons.get('shot').length,1);assert.equal(f.$('#analysisShotFocus').textContent,'');
 assert.doesNotMatch(f.$('#analysisShotCourt').innerHTML,/class="team-shot-selected"/);
 f.$('#analysisClearAll').onclick();assert.equal(f.buttons.get('shot').length,2);
});
test('player change updates the list and clears selection; missing positions never get highlighted',()=>{
 const f=fixture();f.buttons.get('shot')[0].onclick();
 f.$('#analysisPlayerSelect').onchange({target:{value:'p2'}});
 assert.match(f.$('#analysisShotList').innerHTML,/#9 SOTA 1Q/);assert.doesNotMatch(f.$('#analysisShotList').innerHTML,/#32/);
 assert.equal(f.$('#analysisShotFocus').textContent,'');
 assert.match(f.$('#analysisShotCourt').innerHTML,/data-markers="0"/);
 f.buttons.get('shot')[0].onclick();assert.match(f.$('#analysisShotFocus').textContent,/位置未登録/);
 assert.doesNotMatch(f.$('#analysisShotCourt').innerHTML,/class="team-shot-selected"/);
});
