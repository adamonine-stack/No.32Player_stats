import {fileURLToPath} from 'node:url';
// Run with Node and Playwright available (NODE_PATH supported); no production writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const names=['quickModalClass','quickStatsForm','quickActionSheet','quickSelectedHeader','quickDetailForPlayer','quickSaveSimple','quickFreeThrow','quickShotRegistration','assistSelectionSheet','assistPlayerLabel'];
const functions=names.map(name=>{const start=app.search(new RegExp(`^(?:async )?function ${name}\\(`,'m')),tail=app.slice(start),end=tail.search(/\n(?:async function |function |const |window\.)/);assert.ok(start>=0,name);return end<0?tail:tail.slice(0,end)}).join('\n');
const fixture=`
const players=[32,7,11,18,24].map(n=>({id:String(n),number:n,name:'選手'+n}));
const game={id:'test',quarters:4,opponent:'テスト'},state={user:{},games:[game],stats:[]};
const $=s=>document.querySelector(s),escapeHtml=String,num=Number,requireLogin=()=>true,detailStatsView=()=> 'q1';
const participationRequired=()=>false,quarterParticipation=()=>({}),quickPlayers=()=>players,participationPlayers=()=>players,participationPlayer=(g,id)=>players.find(p=>p.id===id),assistCandidates=(g,q,s)=>players.filter(p=>p.id!==s.playerId);
const quickSession=()=>({remainingSeconds:'',undo:null}),quarterDurationSeconds=()=>600,quickClockValue=()=>'',quickParseClock=v=>({valid:true,remainingSeconds:v}),quickSetSession=()=>{},getGameStatsRegistrationType=()=> 'quarter';
const modal=html=>{$('#modalRoot').innerHTML='<div class="modal"><div class="card">'+html+'</div></div>'},closeModal=()=>{$('#modalRoot').innerHTML=''},toast=()=>{};
const statsEntryForm=()=>modal('<input id="normal">'),gameHistoryForm=()=>modal('<h2>履歴</h2>'),substitutionForm=()=>modal('<input id="subTime"><select><option>32</option></select>');
window.saved=[];
const saveQuickStats=async(g,q,p,changes,time,label)=>{saved.push({kind:'stat',player:p.id,changes,time});return {queued:!navigator.onLine}},saveQuickFreeThrow=async(g,q,p,attempts,made)=>saved.push({kind:'ft',player:p.id,attempts,made}),saveAssistPlay=async(g,action)=>{saved.push(action);return {queued:!navigator.onLine}},quickAfterSave=()=>quickStatsForm(game.id,1);
const SHOT_AREAS={area:{label:'位置',value:2}},SHOT_TYPES={jump:'ジャンプ',layup:'レイアップ'},allowedShotTypes=area=>area?['jump','layup']:[],shotTypeButtonLabel=id=>SHOT_TYPES[id],shotCourtSvg=()=>'<svg class="shot-court" width="300" height="200"><rect width="300" height="200" fill="tan"/></svg>',courtPoint=e=>({x:e.offsetX,y:e.offsetY}),detectShotArea=()=> 'area',prepareHistoryOperation=()=>({createdAt:1,sequence:1}),createShot=x=>x;
${functions}
window.start=()=>quickStatsForm(game.id,1);start();
`;
const browser=await chromium.launch({headless:true,channel:process.env.R32_BROWSER_CHANNEL||'msedge'});
const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
page.setDefaultTimeout(5000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.setContent('<!doctype html><html><body><div id="modalRoot"></div></body></html>');
for(const name of ['app','quick-input','shot-registration','mobile-modal-viewport-fit'])await page.addStyleTag({content:fs.readFileSync(new URL('../styles/'+name+'.css',import.meta.url),'utf8')});
await page.addStyleTag({path:fileURLToPath(new URL('../styles/quick-keyboard.css',import.meta.url))});
await page.addScriptTag({content:fixture});
await page.addScriptTag({content:fs.readFileSync(new URL('../js/ui/quick-keyboard.js',import.meta.url),'utf8')});
const key=async k=>{await page.keyboard.press(k)},start=async()=>{await page.evaluate(()=>start());await page.waitForTimeout(20)},badge=async s=>page.locator(s).getAttribute('data-quick-key');
assert.equal(await badge('[data-quick-player="32"]'),'1');
await key('1');assert.equal(await badge('[data-quick-action="out"]'),'0');
await key('4');assert.equal(await badge('[data-quick-detail="dr"]'),'2');await key('2');
assert.deepEqual(await page.evaluate(()=>saved.pop()),{kind:'stat',player:'32',changes:{dr:1},time:''});
// Same button handlers and saved arguments for click, main digits and numpad.
for(const [action,detail,changes] of [['stl','dribbleCut',{dribbleCut:1}],['to','catchMiss',{catchMiss:1}],['reb','or',{or:1}]]){
  const results=[];
  for(const mode of ['click','digit','numpad']){
    await start();
    const choose=async selector=>{if(mode==='click')await page.locator(selector).click();else{const n=await badge(selector);assert.notEqual(n,null);await key(mode==='numpad'?'Numpad'+n:n)}};
    await choose('[data-quick-player="32"]');await choose('[data-quick-action="'+action+'"]');await choose('[data-quick-detail="'+detail+'"]');results.push(await page.evaluate(()=>saved.pop()));
  }
  assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);assert.deepEqual(results[0].changes,changes);
}
for(const [action,stored] of [['ast','ast'],['blk','blk'],['pf','pf'],['fouled','fouled']]){await start();await key('1');await key(await badge('[data-quick-action="'+action+'"]'));assert.deepEqual((await page.evaluate(()=>saved.pop())).changes,{[stored]:1})}
await start();await key('1');await key('2');await key(await badge('[data-ft-attempts="3"]'));await key(await badge('[data-ft-made="2"]'));await key(await badge('#saveQuickFt'));assert.deepEqual(await page.evaluate(()=>saved.pop()),{kind:'ft',player:'32',attempts:3,made:2});
// Position stays a direct click; disabled results and the court never receive numbers.
for(const result of ['made','missed']){
  await start();await key('1');await key('1');assert.equal(await badge('.shot-court'),null);assert.equal(await badge('[data-quick-shot-result="made"]'),null);
  await page.locator('.shot-court').click({position:{x:100,y:70}});await key(await badge('[data-quick-shot-type="jump"]'));
  await key(await badge('.shot-foul-check'));assert.equal(await page.locator('#quickShotFoul').isChecked(),true);
  await key(await badge('[data-quick-shot-result="'+result+'"]'));
  if(result==='made')await key(await badge('[data-assist-player="7"]'));
  const saved=await page.evaluate(()=>window.saved.pop());assert.equal(saved.kind,'saveShot');assert.equal(saved.shot.result,result);assert.equal(saved.shot.wasFouled,true);assert.equal(saved.shot.shotX,100);if(result==='made')assert.equal(saved.assistPlayerId,'7');
}
await start();await page.locator('#quickClock').focus();await page.keyboard.type('32');assert.equal(await page.locator('#quickClock').inputValue(),'32');assert.equal(await page.locator('[data-quick-player]').count(),5);
for(const markup of ['<textarea></textarea>','<select><option>32</option></select>','<div contenteditable="true"></div>','<input type="number">']){await page.evaluate(html=>{$('#modalRoot .card').insertAdjacentHTML('beforeend',html);$('#modalRoot .card').lastElementChild.focus()},markup);await key('1');assert.equal(await page.locator('[data-quick-player]').count(),5)}
await start();await key('Control+1');await key('Alt+1');await key('Shift+1');assert.equal(await page.locator('[data-quick-player]').count(),5);
await page.keyboard.down('1');await page.keyboard.down('1');assert.equal(await page.locator('[data-quick-action]').count(),10);await page.keyboard.up('1');await key('Escape');assert.equal(await page.locator('[data-quick-player]').count(),5);
await start();await page.evaluate(()=>{$('[data-quick-player="32"]').hidden=true;$('[data-quick-player="7"]').disabled=true});await key('1');assert.match(await page.locator('#quickChangePlayer').textContent(),/#11/);
await start();await page.evaluate(()=>{const grid=$('.quick-player-grid');for(let n=0;n<7;n++){const b=document.createElement('button');b.dataset.quickPlayer='extra'+n;b.textContent='extra'+n;grid.append(b)}});assert.equal(await page.locator('[data-quick-player][data-quick-key]').count(),10);assert.equal(await page.locator('[data-quick-player]').count(),12);
await start();await key('1');await key('0');assert.equal(await page.locator('#subTime').count(),1);assert.equal(await page.locator('[data-quick-key]').count(),0);
await start();await page.evaluate(()=>document.querySelector('.modal').dataset.quickKeyboard='false');await key('1');assert.equal(await page.locator('[data-quick-action]').count(),0);
await start();await context.setOffline(true);await key('1');await key('4');await key('2');assert.deepEqual((await page.evaluate(()=>saved.pop())).changes,{dr:1});await context.setOffline(false);
await page.screenshot({path:fileURLToPath(new URL('../tmp/keyboard-desktop.png',import.meta.url))});
await page.setViewportSize({width:390,height:844});await key('1');assert.equal(await page.locator('[data-quick-player]').count(),5);assert.equal(await page.locator('[data-quick-key]').count(),0);await page.locator('[data-quick-player="32"]').click();assert.equal(await page.locator('[data-quick-action]').count(),10);
await page.screenshot({path:fileURLToPath(new URL('../tmp/keyboard-mobile.png',import.meta.url))});

const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),touchPage=await mobile.newPage();
await touchPage.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="modalRoot"></div>');
for(const name of ['app','quick-input','shot-registration','mobile-modal-viewport-fit'])await touchPage.addStyleTag({content:fs.readFileSync(new URL('../styles/'+name+'.css',import.meta.url),'utf8')});
await touchPage.addScriptTag({content:fixture});
const before=await touchPage.locator('[data-quick-player="32"]').boundingBox();
await touchPage.addStyleTag({content:fs.readFileSync(new URL('../styles/quick-keyboard.css',import.meta.url),'utf8')});
await touchPage.addScriptTag({content:fs.readFileSync(new URL('../js/ui/quick-keyboard.js',import.meta.url),'utf8')});
assert.deepEqual(await touchPage.locator('[data-quick-player="32"]').boundingBox(),before);
await touchPage.locator('[data-quick-player="32"]').tap();await touchPage.locator('[data-quick-action="reb"]').tap();await touchPage.locator('[data-quick-detail="dr"]').tap();
assert.deepEqual((await touchPage.evaluate(()=>saved.pop())).changes,{dr:1});assert.equal(await touchPage.locator('[data-quick-key]').count(),0);
await touchPage.screenshot({path:fileURLToPath(new URL('../tmp/keyboard-mobile.png',import.meta.url))});
assert.deepEqual(errors,[]);await browser.close();console.log('Keyboard browser checks passed: clicks, digits, numpad, all stat paths, shot/AST, forms, repeat, disabled/hidden, overflow, Esc, offline adapter, mobile width.');
