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
const select=(results,typeIds=SHOT_TYPE_ORDER,areaIds=SHOT_AREA_ORDER)=>filterShotsBySelections(shots,{areaIds,results,typeIds}).map(item=>item.id);

assert.deepEqual(new Set(shotAnalysisAreaIds('two')),new Set(SHOT_AREA_ORDER.filter(id=>!shotAnalysisAreaIds('three').includes(id))));
assert.deepEqual(shotAnalysisAreaIds('paint'),['inside','under_basket']);
assert.deepEqual(shotAnalysisAreaIds('mid'),['left_zero_mid','right_zero_mid','left_mid','center_mid','right_mid']);
assert.ok(shotAnalysisAreaIds('left').includes('left_corner_3p'));
assert.ok(shotAnalysisAreaIds('center').includes('center_3p'));
assert.ok(shotAnalysisAreaIds('right').includes('right_45_3p'));
assert.deepEqual(new Set(registeredShotTypeIds(shots)),new Set(['jump_shot','floater','layup','running_shot']));
assert.deepEqual(select(['made']),['made-mid','and-one']);
assert.deepEqual(select(['missed']),['miss-mid','shooting-foul','miss-three']);
assert.deepEqual(select(['fouled']),['and-one','shooting-foul']);
assert.deepEqual(select(['made','fouled']),['made-mid','and-one','shooting-foul']);
assert.deepEqual(select(['missed','fouled']),['miss-mid','and-one','shooting-foul','miss-three']);
assert.equal(filterShotsBySelections(shots,{areaIds:[],results:['made'],typeIds:SHOT_TYPE_ORDER}).length,0);
assert.equal(filterShotsBySelections(shots,{areaIds:SHOT_AREA_ORDER,results:[],typeIds:SHOT_TYPE_ORDER}).length,0);
assert.equal(filterShotsBySelections(shots,{areaIds:SHOT_AREA_ORDER,results:['made'],typeIds:[]}).length,0);
assert.deepEqual(select(['made','missed','fouled'],['layup']),['and-one']);
console.log('court analysis filter calculations: ok');
