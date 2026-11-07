import { QUESTIONS, CATEGORIES } from './questions.js';
export const VERSION = 1;
export const byId = new Map(QUESTIONS.map(q => [q.id, q]));
export function validateDatabase() {
  if (QUESTIONS.length !== 300 || CATEGORIES.length !== 6 || byId.size !== 300 || new Set(QUESTIONS.map(q=>q.text)).size !== 300 || QUESTIONS.some(q=>!q.text.trim()) || CATEGORIES.some(c=>QUESTIONS.filter(q=>q.category===c.id).length!==50)) throw Error('Nieprawidłowa baza pytań.');
  return true;
}
export function poolFor(categories) { return QUESTIONS.filter(q=>categories.includes(q.category)); }
export function validateConfig(c) {
  if (!c || !Array.isArray(c.names) || c.names.length<1 || c.names.length>10) throw Error('Wybierz od 1 do 10 graczy.');
  if (c.names.some(n=>typeof n!=='string'||!n.trim()||n.trim().length>40)) throw Error('Każdy gracz potrzebuje imienia (1–40 znaków).');
  const names=c.names.map(n=>n.trim().normalize('NFC').toLocaleLowerCase('pl'));
  if(new Set(names).size!==names.length) throw Error('Imiona graczy muszą być unikalne.');
  if(!Array.isArray(c.categories)||!c.categories.length||new Set(c.categories).size!==c.categories.length||c.categories.some(id=>!CATEGORIES.some(x=>x.id===id))) throw Error('Wybierz przynajmniej jedną kategorię.');
  if(!Number.isInteger(c.seconds)||c.seconds<5||c.seconds>10) throw Error('Czas musi wynosić od 5 do 10 sekund.');
  const max=Math.floor(poolFor(c.categories).length/c.names.length);
  if(!Number.isInteger(c.rounds)||c.rounds<1||c.rounds>max) throw Error(`Wybierz od 1 do ${max} pytań na gracza. Brak powtórek!`);
  return {...c,names:c.names.map(n=>n.trim()),muted:!!c.muted};
}
export function shuffle(items, random=Math.random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function newGame(config, random=Math.random) {
  const c=validateConfig(config);
  return {version:VERSION,config:c,queue:shuffle(poolFor(c.categories).map(q=>q.id),random).slice(0,c.names.length*c.rounds),cursor:0,stage:'handoff',history:[]};
}
export function reveal(g) { if(g.stage!=='handoff')return false;g.stage='running';return true; }
export function expire(g) {if(g.stage!=='running')return false;g.stage='judging';return true;}
export function grade(g, accepted) {
  if(g.stage!=='judging'||typeof accepted!=='boolean'||g.history.length!==g.cursor)return false;
  g.history.push({index:g.cursor,accepted});g.stage=g.history.length===g.queue.length?'finished':'reviewed';return true;
}
export function next(g) {if(g.stage!=='reviewed')return false;g.cursor++;g.stage='handoff';return true;}
export function canUndo(g) {return g.history.length>0&&['reviewed','finished','handoff'].includes(g.stage);}
export function undo(g) {if(!canUndo(g))return false;const last=g.history.pop();g.cursor=last.index;g.stage='judging';return true;}
export function scores(g) {
  return g.config.names.map((name,i)=>{
    const turns=g.history.filter(h=>h.index%g.config.names.length===i);
    const points=turns.filter(h=>h.accepted).length;
    return {name,points,played:turns.length,remaining:g.config.rounds-turns.length,percent:turns.length?Math.round(100*points/turns.length):0};
  });
}
export function winners(g) {const rows=scores(g);const best=Math.max(...rows.map(r=>r.points));return rows.filter(r=>r.points===best);}
export function restore(raw) {
  const g=JSON.parse(raw);
  if(!g||g.version!==VERSION)throw Error('Nieobsługiwana wersja zapisu.');
  g.config=validateConfig(g.config);
  const total=g.config.names.length*g.config.rounds;
  if(!Array.isArray(g.queue)||g.queue.length!==total||new Set(g.queue).size!==total||g.queue.some(id=>!byId.has(id)||!g.config.categories.includes(byId.get(id).category))||!Number.isInteger(g.cursor)||g.cursor<0||g.cursor>=total||!['handoff','running','judging','reviewed','finished'].includes(g.stage)||!Array.isArray(g.history))throw Error('Uszkodzony zapis rozgrywki.');
  if(g.history.some((h,i)=>!h||h.index!==i||typeof h.accepted!=='boolean'))throw Error('Uszkodzona historia ocen.');
  const graded=['reviewed','finished'].includes(g.stage);
  if(g.history.length!==g.cursor+(graded?1:0)|| (g.stage==='finished')!==(g.history.length===total))throw Error('Niespójny etap rozgrywki.');
  if(g.stage==='running')g.stage='judging';
  return g;
}
