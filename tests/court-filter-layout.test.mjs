import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCourtShots} from '../js/calculations/shot-analysis-calculations.js';
const shots=[
 {id:'left',shotArea:'left_mid',shotType:'jump_shot',result:'made'},
 {id:'right',shotArea:'right_45_3p',shotType:'jump_shot',result:'missed'},
 {id:'inside',shotArea:'inside',shotType:'layup',result:'made',shotX:40,shotY:30},
 {id:'under',shotX:null,shotY:null,shotArea:'under_basket',shotType:'layup',result:'missed',wasFouled:true},
 {id:'center',shotArea:'center_3p',shotType:'floater',result:'made'}
];
const ids=filters=>filterCourtShots(shots,filters).map(s=>s.id);
test('empty filters and clearing all show every registered point',()=>assert.deepEqual(ids({}),shots.map(s=>s.id)));
test('range, angle, area and type restrictions intersect',()=>{
 assert.deepEqual(ids({range:'two'}),['left','inside','under']);
 assert.deepEqual(ids({range:'paint'}),['inside','under']);
 assert.deepEqual(ids({range:'mid',angle:'left'}),['left']);
 assert.deepEqual(ids({range:'three',angle:'right',typeIds:['jump_shot']}),['right']);
 assert.deepEqual(ids({range:'three',areaIds:['left_mid']}),[]);
 assert.deepEqual(ids({angle:'center'}),['under','center']);
});
test('multiple shot types and results combine within each group',()=>{
 assert.deepEqual(ids({typeIds:['jump_shot','floater']}),['left','right','center']);
 assert.deepEqual(ids({results:['made','missed']}),shots.map(s=>s.id));
 assert.deepEqual(ids({results:['made','fouled']}),['left','inside','under','center']);
});
