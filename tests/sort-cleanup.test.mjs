import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function setup(){
 const document=new EventTarget(),window=new EventTarget();let saves=0,timer;
 const classes=new Set();const parent={insertBefore(){}};
 const item={isConnected:true,parentNode:parent,nextSibling:null,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
 document.querySelectorAll=()=>[item];
 const context=vm.createContext({document,window,console,toast(){},setTimeout:fn=>(timer=fn,1),clearTimeout:()=>timer=null});
 vm.runInContext(source.slice(source.indexOf('let activeSort='),source.indexOf('function bindPlayerSorting()'))+';this.start=startHandleSort;this.schedule=scheduleHandleSort;this.cancel=cancelHandleSort;',context);
 const event=(type,id=1)=>Object.assign(new Event(type,{cancelable:true}),{pointerId:id,clientY:10});
 const start=(type='pointerdown')=>context.start({},item,'.game-sort-item',()=>{saves++},event(type));
 return {document,window,item,classes,context,event,start,saves:()=>saves,tick:()=>timer?.()};
}
for(const termination of ['pointerup','pointercancel','blur','visibilitychange','render'])test(`drag releases scrolling after ${termination}`,async()=>{
 const h=setup();h.start();const during=h.event('pointermove');h.document.dispatchEvent(during);assert.equal(during.defaultPrevented,true);
 if(termination==='render')h.context.cancel();else (termination==='blur'?h.window:h.document).dispatchEvent(h.event(termination));
 const after=h.event('pointermove');h.document.dispatchEvent(after);assert.equal(after.defaultPrevented,false);assert.equal(h.classes.size,0);
 await Promise.resolve();assert.equal(h.saves(),termination==='pointerup'?1:0);
 h.start();h.document.dispatchEvent(h.event('pointerup'));await Promise.resolve();assert.equal(h.saves(),termination==='pointerup'?2:1);
});
test('cancel during long press prevents delayed drag',()=>{const h=setup();h.context.schedule({},h.item,'.game-sort-item',()=>{},h.event('pointerdown'));h.document.dispatchEvent(h.event('pointercancel'));h.tick();assert.equal(h.classes.size,0)});
test('unrelated pointer cannot complete drag',async()=>{const h=setup();h.start();h.document.dispatchEvent(h.event('pointerup',2));assert.equal(h.classes.size,1);h.document.dispatchEvent(h.event('pointerup'));await Promise.resolve();assert.equal(h.saves(),1)});
test('touch cancellation releases touch scrolling',()=>{const h=setup();h.start('touchstart');h.document.dispatchEvent(h.event('touchcancel'));const move=h.event('touchmove');h.document.dispatchEvent(move);assert.equal(move.defaultPrevented,false);assert.equal(h.classes.size,0)});
