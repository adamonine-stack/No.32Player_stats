import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const release='20260908-quarter-session-v2';
const modules=new Set(['core/offline-sync.js','core/offline-operation-queue.js','core/quarter-session-model.js','core/quarter-session-store.js','core/history-journal.js','core/local-history.js','core/normal-stats-store.js','core/assist-play-store.js','core/quick-history-store.js','calculations/game-event-calculations.js','calculations/history-order.js','calculations/assist-play-calculations.js','ui/pending-history-rehydrate.js'].map(p=>'js/'+p));
test('all session dependency URLs use one release, including cached-shell compatibility entry',()=>{
 for(const name of fs.readdirSync(new URL('js/',root),{recursive:true}).filter(p=>p.endsWith('.js'))){
  const source=fs.readFileSync(new URL('js/'+name,root),'utf8');
  for(const m of source.matchAll(/['"](\.{1,2}\/[^'"]+\.js)(\?[^'"]*)?['"]/g)){
   const target=path.posix.normalize(path.posix.join('js',path.posix.dirname(name),m[1]));
   if(modules.has(target))assert.equal(m[2],'?v='+release,name+' -> '+target);
  }
 }
 const html=fs.readFileSync(new URL('index.html',root),'utf8');
 assert.ok(html.includes('app.js?v='+release));assert.ok(html.includes('pending-history-rehydrate.js?v='+release));
});
