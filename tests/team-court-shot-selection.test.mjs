import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as stats from '../js/calculations/stats-calculations.js';
import * as filters from '../js/calculations/game-filter-calculations.js';
import * as shots from '../js/calculations/shot-calculations.js';
import { filterCourtShots } from '../js/calculations/shot-analysis-calculations.js';
import { OPPONENT_RANKS } from '../js/calculations/opponent-team-calculations.js';

function fixture() {
  const base = {id:'duplicate',shotX:40,shotY:35,shotArea:'left_mid',shotType:'jump_shot',result:'made'};
  const state = {games:[{id:'g',quarters:4}], stats:[
    {id:'s1',gameId:'g',playerId:'p1',twoPa:1,shots:[base]},
    {id:'s2',gameId:'g',playerId:'p2',twoPa:2,shots:[{...base,shotX:80,shotY:60,shotArea:'right_45_3p',result:'missed'}, {...base,id:'missing',shotX:null,shotY:null}]}
  ],players:[{id:'p1',number:32,name:'<KT>'},{id:'p2',number:9,name:'SOTA'}],teamMode:'game',teamTargetId:'g',teamCategoryId:'',teamOpponentRankMin:'',teamOpponentRankMax:'',opponentTeams:[]};
  const nodes = new Map(); let scrolls = 0;
  const makeNode = () => ({innerHTML:'',textContent:'',onclick:null,scrollIntoView(){scrolls++;}});
  const root = {innerHTML:'',querySelector(selector){if(!nodes.has(selector))nodes.set(selector,makeNode());return nodes.get(selector);},querySelectorAll(selector){
    const field=selector.match(/^\[data-team-(.+)\]$/)?.[1];
    if(!field)return [];
    return [...[...nodes.values()].map(n=>n.innerHTML).join('').matchAll(new RegExp(`data-team-${field}="([^"]+)"`,'g'))].map(match=>({dataset:{['team'+field[0].toUpperCase()+field.slice(1)]:match[1]},onclick:null}));
  }};
  // Preserve the actual row/filter event handlers bound by render.
  const buttons = new Map(); const findAll = root.querySelectorAll.bind(root);
  root.querySelectorAll = selector => {const result=findAll(selector);buttons.set(selector,result);return result;};
  const classes = {add(){},remove(){}};
  const document = {createElement:()=>({}),head:{appendChild(){}},body:{style:{},classList:classes},documentElement:{classList:classes},getElementById:()=>root};
  const context=vm.createContext({...stats,...filters,...shots,filterCourtShots,OPPONENT_RANKS,state,document,window:{scrollY:0,scrollTo(){}}});
  let source=fs.readFileSync(new URL('../js/ui/team-shot-analysis.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  source=source.slice(0,source.indexOf('  function injectButton()'))+'globalThis.openTeamCourt=openModal;})();';
  vm.runInContext(source,context);context.openTeamCourt();
  return {root,nodes,buttons,state,scrolls:()=>scrolls};
}

test('filtered list shows parent player, type, result and safely escaped names',()=>{
  const f=fixture(), html=f.nodes.get('[data-team-shot-list]').innerHTML;
  assert.match(html, /#32 &lt;KT&gt;/);assert.match(html, /#9 SOTA/);
  assert.match(html, /ジャンプシュート/);assert.match(html, /成功/);assert.match(html, /失敗/);
  assert.equal(f.buttons.get('[data-team-shot]').length,3);
  assert.ok(f.root.innerHTML.indexOf('選択したシュート一覧') > f.root.innerHTML.indexOf('data-team-clear'));
  f.buttons.get('[data-team-range]').find(b=>b.dataset.teamRange==='three').onclick();
  assert.equal(f.buttons.get('[data-team-shot]').length,1);
  assert.doesNotMatch(f.nodes.get('[data-team-shot-list]').innerHTML, /#32/);
});
test('selecting a list row highlights only its point despite duplicate shot IDs, and scrolls to court',()=>{
  const f=fixture();f.buttons.get('[data-team-shot]')[1].onclick();
  const svg=f.nodes.get('#teamAnalysisShotCourt').innerHTML;
  assert.equal((svg.match(/class="team-shot-selected"/g)||[]).length,1);
  assert.match(svg, /team-shot-selected-halo" cx="80" cy="60"/);
  assert.match(f.nodes.get('[data-team-shot-focus]').textContent, /#9 SOTA.*失敗/);
  assert.match(f.nodes.get('[data-team-shot-list]').innerHTML,/data-team-shot="1" aria-pressed="true"/);
  assert.equal(f.scrolls(),1);
  f.buttons.get('[data-team-range]').find(b=>b.dataset.teamRange==='two').onclick();
  assert.doesNotMatch(f.nodes.get('#teamAnalysisShotCourt').innerHTML, /class="team-shot-selected"/);
  assert.equal(f.nodes.get('[data-team-shot-focus]').textContent,'');
});
test('missing coordinates never create a point at zero; clear removes selection; empty filters show empty list',()=>{
  const f=fixture();f.buttons.get('[data-team-shot]')[2].onclick();
  assert.match(f.nodes.get('[data-team-shot-focus]').textContent,/シュート位置未登録/);
  assert.doesNotMatch(f.nodes.get('#teamAnalysisShotCourt').innerHTML,/class="team-shot-selected"/);
  assert.doesNotMatch(f.nodes.get('#teamAnalysisShotCourt').innerHTML,/cx="0.000" cy="0.000"/);
  f.root.querySelector('[data-team-clear]').onclick();
  assert.equal(f.nodes.get('[data-team-shot-focus]').textContent,'');
  f.buttons.get('[data-team-range]').find(b=>b.dataset.teamRange==='three').onclick();
  f.buttons.get('[data-team-result]').find(b=>b.dataset.teamResult==='made').onclick();
  assert.match(f.nodes.get('[data-team-shot-list]').innerHTML,/該当するシュートはありません/);
});
