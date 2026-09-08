// Disposable full-app fixture. Only Firebase transport is replaced; UI, journal,
// IndexedDB queue, mutation planners and transaction stores are production code.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),target=path.join(root,'tmp/local-history-qa');
fs.mkdirSync(target,{recursive:true});
for(const name of ['js','styles','assets','icons'])fs.cpSync(path.join(root,name),path.join(target,name),{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<body class="app-bg">','<body class="app-bg"><div id="qaControls" style="position:fixed;z-index:99999;top:0;right:0;background:white;color:black;padding:8px"><b>架空データ QA</b><button id="qaHold">保存停止中</button><button id="qaOld">古いsnapshot</button><button id="qaOffline">オフラインへ</button><output id="qaStatus"></output></div>');
fs.writeFileSync(path.join(target,'index.html'),html);
for(const name of ['assist-play-store.js','quick-history-store.js','quarter-session-store.js','normal-stats-store.js']){const p=path.join(target,'js/core',name);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace("'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js'","'./firebase.js?v=20260901-scoped-reads-v1'"))}
fs.writeFileSync(path.join(target,'js/core/firebase.js'),fs.readFileSync(new URL('./fixtures/local-history-firebase.js',import.meta.url),'utf8').replace('../../js/calculations/','../calculations/'));
// No service worker on the fixture: keep transport stubs out of the live cache.
const p=path.join(target,'js/app.js');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace("if('serviceWorker' in navigator && !location.pathname.includes('/tests/'))","if(false)"));
console.log(target);

// A hosted QA entry uses import maps and a separate IndexedDB database. It cannot
// access production Firebase or consume the user's real pending operations.
const queue=fs.readFileSync(path.join(root,'js/core/offline-operation-queue.js'),'utf8').replace('r32-offline-operations','r32-qa-offline-operations').replace('./quarter-session-model.js','r32-session-model');
const storage=fs.readFileSync(path.join(root,'js/core/storage.js'),'utf8').replaceAll('localStorage.getItem(',"localStorage.getItem('qa:'+").replaceAll('localStorage.setItem(',"localStorage.setItem('qa:'+");
const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const imports={
 'r32-session-model':'./js/core/quarter-session-model.js',
 './js/core/firebase.js?v=20260901-scoped-reads-v1':'./tests/fixtures/local-history-firebase.js',
 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js':'./tests/fixtures/local-history-firebase.js',
 './js/core/offline-operation-queue.js?v=20260904-offline-v1':moduleURL(queue),
 './js/core/storage.js':moduleURL(storage)
};
fs.writeFileSync(path.join(root,'tests/local-history-qa.html'),html.replace('<head>','<head><base href="../"><script type="importmap">'+JSON.stringify({imports})+'</script>'));
