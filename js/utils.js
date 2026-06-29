export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
export const uid = () => 'local_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
export const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
export const pct = (made, att) => att ? Math.round((made / att) * 1000) / 10 : 0;
export const fmt = (n, d=1) => Number.isFinite(Number(n)) ? Number(n).toFixed(d).replace(/\.0$/,'') : '0';
export const dateKey = d => (d || '').slice(0,10);
export const monthKey = d => (d || '').slice(0,7);
export function sum(arr, key){ return arr.reduce((a,b)=>a+num(b[key]),0); }
export function escapeHtml(str=''){
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
export function toDateInput(date=new Date()){
  const z = new Date(date.getTime() - date.getTimezoneOffset()*60000);
  return z.toISOString().slice(0,10);
}
export function download(filename, text, type='application/json'){
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}
