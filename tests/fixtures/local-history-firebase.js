import {DEFAULT_SEASON_ID} from '../../js/calculations/season-calculations.js';
export const auth={},db={},firestorePersistenceReady=Promise.resolve();
const players=[4,7,8,21,32].map(n=>({id:String(n),number:String(n),name:`検証選手${n}`,active:true,category:'U15'}));
const game={id:'qa-history',seasonId:DEFAULT_SEASON_ID,date:'2026-09-07',opponent:'履歴競合テスト',tournament:'自動検証',quarters:4,statsRegistrationType:'quarter',shotTrackingMode:'detailed',participationMode:'required',playEvents:[],quarterParticipation:{q1:{starters:players.map(p=>p.id),substitutions:[]}}};
const initial={'games/qa-history':game,...Object.fromEntries(players.map(p=>[`players/${p.id}`,p])),...Object.fromEntries(players.map(p=>[`playerSeasons/${p.id}`,{id:p.id,playerId:p.id,seasonId:DEFAULT_SEASON_ID,active:true}]))};
let documents=JSON.parse(localStorage.getItem('r32-qa-server')||'null')||initial,hold=true,online=true,releases=[];
const listeners=new Set(),old=structuredClone(documents);
export const collection=(_,name)=>({collection:name});
export const doc=(_,collection,id)=>({collection,id});
export const where=(field,operator,value)=>({field,operator,value});
export const query=(ref,...filters)=>({...ref,filters});
const snapshot=(key,data)=>({id:key.split('/')[1],exists:()=>data!==undefined,data:()=>structuredClone(data)});
function result(ref,source=documents){if(ref.id)return snapshot(`${ref.collection}/${ref.id}`,source[`${ref.collection}/${ref.id}`]);const rows=Object.entries(source).filter(([key,value])=>key.startsWith(`${ref.collection}/`)&&(!ref.filters||ref.filters.every(f=>f.operator==='in'?f.value.includes(value[f.field]):value[f.field]===f.value))).map(([key,data])=>snapshot(key,data));return {docs:rows,empty:!rows.length,docChanges:()=>rows.map(doc=>({doc}))}}
function emit(source=documents){for(const listener of [...listeners])listener.callback(result(listener.ref,source));document.querySelector('#qaStatus').textContent=`サーバーSHOT ${Object.entries(documents).filter(([k])=>k.startsWith('stats/')).flatMap(([,s])=>Object.values(s.quarters||{}).flatMap(q=>q.shots||[])).map(s=>s.result).join(',')||'0'} / 待機 ${releases.length}`}
export function onSnapshot(ref,callback){const entry={ref,callback};listeners.add(entry);queueMicrotask(()=>{if(listeners.has(entry))callback(result(ref))});return ()=>listeners.delete(entry)}
export const onAuthStateChanged=(_,callback)=>{queueMicrotask(()=>callback({uid:'qa-user'}));return ()=>{}};
export const serverTimestamp=()=>({seconds:Math.floor(Date.now()/1000),nanoseconds:(Date.now()%1000)*1e6});
export const getDoc=async ref=>result(ref),getDocs=getDoc;
function merge(a,b){if(!a||typeof a!=='object'||Array.isArray(a))return structuredClone(b);const result={...a};for(const [key,value] of Object.entries(b))result[key]=value&&typeof value==='object'&&!Array.isArray(value)?merge(a[key],value):structuredClone(value);return result}
export async function setDoc(ref,data,options={}){const key=`${ref.collection}/${ref.id}`;documents[key]=options.merge?merge(documents[key],data):structuredClone(data);localStorage.setItem('r32-qa-server',JSON.stringify(documents));emit()}
export async function deleteDoc(ref){delete documents[`${ref.collection}/${ref.id}`];emit()}
export async function runTransaction(_,callback){if(hold)await new Promise(resolve=>releases.push(resolve));if(!online)throw Object.assign(Error('offline'),{code:'unavailable'});const staged=[];const output=await callback({get:getDoc,set:(ref,data,options)=>staged.push({ref,data,options})});for(const {ref,data,options} of staged){const key=`${ref.collection}/${ref.id}`;documents[key]=options?.merge?merge(documents[key],data):structuredClone(data)}localStorage.setItem('r32-qa-server',JSON.stringify(documents));emit();return output}
export const signInWithEmailAndPassword=async()=>{},signOut=async()=>{};
Object.defineProperty(navigator,'onLine',{get:()=>online,configurable:true});
document.querySelector('#qaHold').onclick=()=>{hold=!hold;document.querySelector('#qaHold').textContent=hold?'保存停止中':'保存再開済み';if(!hold){for(const resolve of releases)resolve();releases=[]}emit()};
document.querySelector('#qaOld').onclick=()=>emit(old);
document.querySelector('#qaOffline').onclick=()=>{online=!online;document.querySelector('#qaOffline').textContent=online?'オフラインへ':'オンラインへ';window.dispatchEvent(new Event(online?'online':'offline'))};
