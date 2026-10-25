import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const app=fs.readFileSync(new URL('js/app.js',root),'utf8');
const worker=fs.readFileSync(new URL('service-worker.js',root),'utf8');
const modules=new Set(['core/state.js','core/offline-sync.js','core/offline-operation-queue.js','core/quarter-session-model.js','core/quarter-session-store.js','core/history-journal.js','core/local-history.js','core/normal-stats-store.js','core/assist-play-store.js','core/quick-history-store.js','calculations/game-event-calculations.js','calculations/history-order.js','calculations/assist-play-calculations.js','ui/pending-history-rehydrate.js'].map(p=>'js/'+p));
test('session dependencies and state singleton use one URL per module across entry points',()=>{
 const versions=new Map();
 const check=(target,query,source)=>{if(!modules.has(target))return;assert.match(query||'',/^\?v=[\w-]+$/,source+' -> '+target);if(versions.has(target))assert.equal(query,versions.get(target),source+' -> '+target);versions.set(target,query)};
 for(const name of fs.readdirSync(new URL('js/',root),{recursive:true}).filter(p=>p.endsWith('.js'))){
  const source=fs.readFileSync(new URL('js/'+name,root),'utf8');
  for(const m of source.matchAll(/['"](\.{1,2}\/[^'"]+\.js)(\?[^'"]*)?['"]/g))check(path.posix.normalize(path.posix.join('js',path.posix.dirname(name),m[1])),m[2],name);
 }
 for(const m of html.matchAll(/src="(?:\.\/)?(js\/[^"?]+)(\?[^" ]*)?"/g))check(m[1],m[2],'index.html');
 assert.ok(versions.has('js/core/state.js'));assert.ok(versions.has('js/core/local-history.js'));
});
test('current shell assets exist and are precached with their exact entry URLs',()=>{
 const assets=JSON.parse(worker.match(/const APP_SHELL = (\[[\s\S]*?\]);/)[1]);
 for(const m of html.matchAll(/(?:src|href)="((?:\.\/)?(?:js|styles)\/[^"\s]+)"/g)){
  const url='./'+m[1].replace(/^\.\//,'');assert.ok(assets.includes(url),'missing precache: '+url);assert.ok(fs.existsSync(new URL(url.split('?')[0],root)),'missing file: '+url);
 }
 const release=app.match(/service-worker\.js\?v=([^'"]+)/)[1];assert.equal(worker.match(/const CACHE_NAME = '([^']+)'/)[1],'r32-shell-'+release);
 assert.match(html,/type="module" src="\.\/js\/app\.js\?v=[\w-]+"/);
});
test('worker activation removes both legacy cache formats and preserves unrelated caches',async()=>{
 const handlers={},deleted=[],current=worker.match(/const CACHE_NAME = '([^']+)'/)[1];
 vm.runInNewContext(worker,{self:{addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['r32-shell-old','r32-20261025-game-action-status-v3',current,'another-app'],delete:async key=>deleted.push(key)}});
 let done;handlers.activate({waitUntil:p=>done=p});await done;assert.deepEqual(deleted,['r32-shell-old','r32-20261025-game-action-status-v3']);
});
