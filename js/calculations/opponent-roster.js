// Keep uniform numbers as text: 0 and 00 are distinct.
export const OPPONENT_GRADES=['小1','小2','小3','小4','小5','小6','中1','中2','中3','高1','高2','高3','その他'];
export function normalizeOpponentPlayers(players=[]){return players.map(p=>({...p,number:String(p.number??'').normalize('NFKC').trim(),name:String(p.name??'').trim(),grade:String(p.grade??'').trim(),height:p.height===''||p.height==null?'':Number(p.height)}));}
export function opponentPlayers(team={}){
 const players=normalizeOpponentPlayers(team.players||[]),numbers=new Set(players.map(p=>p.number));
 for(const n of team.playerNumbers||[])if(!numbers.has(String(n))){players.push({number:String(n),name:'',grade:'',height:''});numbers.add(String(n));}
 return players.sort((a,b)=>Number(a.number)-Number(b.number)||a.number.localeCompare(b.number));
}
export function validateOpponentPlayers(players){
 players=normalizeOpponentPlayers(players);
 const seen=new Set();
 for(const p of players){if(!/^\d{1,3}$/.test(p.number))return 'No.は0〜999の数字で入力してください（00も登録できます）';if(seen.has(p.number))return `No.${p.number}が重複しています`;seen.add(p.number);if(p.grade&&!OPPONENT_GRADES.includes(p.grade))return '学年を確認してください';if(p.height!==''&&(!Number.isFinite(p.height)||p.height<50||p.height>250))return '身長は50〜250cmで入力してください';}
 return '';
}
export function mergeOpponentPlayers(current=[],incoming=[]){
 const merged=normalizeOpponentPlayers(current).map(p=>({...p}));
 for(const p of normalizeOpponentPlayers(incoming)){const i=merged.findIndex(x=>x.number===p.number&&(!x.name||!p.name||x.name.replace(/\s/g,'')===p.name.replace(/\s/g,'')));if(i<0)merged.push(p);else{const old=merged[i];merged[i]={...p,...old,name:old.name||p.name,grade:old.grade||p.grade,height:old.height===''?p.height:old.height};}}
 return merged;
}
