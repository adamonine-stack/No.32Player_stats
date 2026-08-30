import assert from 'node:assert/strict';
import { SHOT_AREA_ORDER, SHOT_TYPE_ORDER } from '../js/calculations/shot-calculations.js';
import { filterShotsBySelections, registeredShotTypeIds, shotAnalysisAreaIds } from '../js/calculations/shot-analysis-calculations.js';

const shot=(id,shotArea,shotType,result,wasFouled=false)=>({id,shotArea,shotType,result,wasFouled});
const shots=[
  shot('made-mid','left_mid','jump_shot','made'),
  shot('miss-mid','center_mid','floater','missed'),
  shot('and-one','inside','layup','made',true),
  shot('shooting-foul','right_45_3p','running_shot','missed',true),
  shot('miss-three','left_corner_3p','jump_shot','missed')
];
const select=(result='',fouledOnly=false,typeIds=[],areaIds=SHOT_AREA_ORDER)=>filterShotsBySelections(shots,{areaIds,result,fouledOnly,typeIds}).map(item=>item.id);

assert.deepEqual(new Set(shotAnalysisAreaIds('two')),new Set(SHOT_AREA_ORDER.filter(id=>!shotAnalysisAreaIds('three').includes(id))));
assert.deepEqual(shotAnalysisAreaIds('paint'),['inside','under_basket']);
assert.deepEqual(shotAnalysisAreaIds('mid'),['left_zero_mid','right_zero_mid','left_mid','center_mid','right_mid']);
assert.ok(shotAnalysisAreaIds('left').includes('left_corner_3p'));
assert.ok(shotAnalysisAreaIds('center').includes('center_3p'));
assert.ok(shotAnalysisAreaIds('right').includes('right_45_3p'));
assert.deepEqual(new Set(registeredShotTypeIds(shots)),new Set(['jump_shot','floater','layup','running_shot']));
assert.deepEqual(select(),shots.map(item=>item.id));
assert.deepEqual(select('made'),['made-mid','and-one']);
assert.deepEqual(select('missed'),['miss-mid','shooting-foul','miss-three']);
assert.deepEqual(select('',true),['and-one','shooting-foul']);
assert.deepEqual(select('made',true),['and-one']);
assert.deepEqual(select('missed',true),['shooting-foul']);
assert.equal(filterShotsBySelections(shots,{areaIds:[]}).length,0);
assert.deepEqual(select('',false,['layup']),['and-one']);
assert.deepEqual(select('',false,['jump_shot','floater']),['made-mid','miss-mid','miss-three']);
console.log('court analysis filter calculations: ok');
