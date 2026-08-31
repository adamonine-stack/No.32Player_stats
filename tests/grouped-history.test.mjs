import test from 'node:test';
import assert from 'node:assert/strict';
import {groupGameHistory,historyActionOrderOverrides,historyInsertionOverrides} from '../js/calculations/game-event-calculations.js';
const shot={eventId:'shot:s',type:'shot',playerId:'32',quarter:1,result:'made',playId:'p',assistEventId:'ast:a'};
const assist={eventId:'ast:a',type:'stat',statKey:'ast',playerId:'8',quarter:1,playId:'p',shotEventId:'shot:s'};
const other={eventId:'other',type:'stat',statKey:'or',playerId:'32',quarter:1};
test('nonadjacent reciprocal links render one action anchored at the shot',()=>{
 const items=[assist,other,shot],before=JSON.stringify(items),actions=groupGameHistory(items);
 assert.equal(actions.length,2);assert.deepEqual(actions.map(a=>a.eventId),['other','shot:s']);
 assert.deepEqual(actions[1].eventIds,['shot:s','ast:a']);assert.equal(actions[1].linkedAssist.playerId,'8');assert.equal(JSON.stringify(items),before);
});
test('orphan, invalid, Miss, cross-quarter and old unlinked events remain visible',()=>{
 for(const patch of [{shotEventId:'missing'},{playId:'wrong'},{quarter:2},{playerId:'32'}])assert.equal(groupGameHistory([shot,{...assist,...patch}]).length,2);
 assert.equal(groupGameHistory([{...shot,result:'missed'},assist]).length,2);
 assert.equal(groupGameHistory([{...shot,playId:undefined},assist]).length,2);
 assert.equal(groupGameHistory([other,assist]).length,2);
});
test('group ordering saves both IDs and insertion never splits a linked action',()=>{
 const items=[assist,other,shot],actions=groupGameHistory(items);
 assert.deepEqual(historyActionOrderOverrides([...actions].reverse()),{'shot:s':1,'ast:a':2,other:3});
 assert.deepEqual(historyInsertionOverrides(items,['new'],'shot:s'),{other:1,'shot:s':2,'ast:a':3,new:4});
 assert.deepEqual(historyInsertionOverrides(items,['new'],'ast:a'),{other:1,'shot:s':2,'ast:a':3,new:4});
 assert.deepEqual(historyInsertionOverrides(items,['new'],null),{new:1,other:2,'shot:s':3,'ast:a':4});
});
test('new shot plus AST insertion preserves all independent IDs',()=>{
 assert.deepEqual(historyInsertionOverrides([other,shot,assist],['shot:s','ast:a'],'other'),{other:1,'shot:s':2,'ast:a':3});
});
test('unlink restores two actions without removing either source event',()=>{
 assert.equal(groupGameHistory([shot,assist]).length,1);
 const unlinked=[{...shot,assistEventId:null},{...assist,shotEventId:null,playId:null}];
 assert.equal(groupGameHistory(unlinked).length,2);
});
test('legacy made-counter and AST links also render as one action',()=>{
 assert.equal(groupGameHistory([{...shot,type:'stat',statKey:'threePm'},assist]).length,1);
});
