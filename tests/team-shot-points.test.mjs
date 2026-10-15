import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { num, pct, derived, sumStats } from '../js/calculations/stats-calculations.js';

const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const context=vm.createContext({num,pct,derived,sumStats,
  state:{players:[{id:'p1',number:32,name:'Player'}]},
  teamStatsForGames:()=>[{playerId:'p1',twoPa:10,twoPm:4,threePa:5,threePm:2,fta:8,ftm:8}],
  getPlayerTargetQuarterCount:()=>4,teamDetailPlayerPlayingTime:()=> '10:00'
});
for(const name of ['teamFgSummary','teamDetailType','teamDetailRows']){
  vm.runInContext(source.split('\n').find(line=>line.startsWith('function '+name+'(')),context);
}
for(const [type,label,points,rate] of [['two','2P',8,'0.80'],['three','3P',6,'1.20'],['fg','FG',14,'0.93']]){
  test(`${label} shows only its own points and points per attempt`,()=>{
    const html=vm.runInContext(`teamDetailRows([],teamDetailType('${type}'))[0].html`,context);
    assert.ok(html.includes(`${label}得点：<b>${points}点`));
    assert.ok(html.includes(`1本あたり：<b>${rate}点`));
  });
  test(`${label} zero attempts is undefined, missed shots are zero`,()=>{
    assert.match(vm.runInContext(`teamFgSummary({},'${label}')`,context),/1本あたり：<b>—/);
    assert.match(vm.runInContext(`teamFgSummary({twoPa:10,threePa:5},'${label}')`,context),/1本あたり：<b>0.00点/);
  });
}
test('FT remains unchanged',()=>{
  assert.doesNotMatch(vm.runInContext("teamDetailRows([],teamDetailType('ft'))[0].html",context),/1本あたり/);
});
