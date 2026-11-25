/* Ecos — comunicación con tarjetas. Datos solo en este dispositivo (localStorage). */
const KEY = 'ecos_v1';
const BASE = {};
TARJETAS_BASE.forEach(t => { BASE[t[0]] = {id:t[0], emoji:t[1], etiqueta:t[2], cat:t[3]}; });
const EMOJIS_MOD = ['⭐','🏠','🍽️','😊','🎮','🚌','🏫','🛁','🧩','🎵','🐶','❤️','🌈','📚','⚽','🧸'];

function uid(p){ return (p||'c_') + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function modsNuevos(){
  const m=(id,nombre,emoji,items)=>({id,nombre,emoji,items});
  const cat=k=>TARJETAS_BASE.filter(t=>t[3]===k).map(t=>t[0]);
  return {
    ini:[
      m('m_verbos','Verbos','🗣️',['quiero','no-quiero','necesito','siento','dame','tengo','puedo','vamos','me-gusta','no-me-gusta','hacer','ver','pedir','poner','sacar','abrir','cerrar','tocar','venir','sentarme','levantarme','prestame','mostrame','llevame','ir','comer','beber','jugar','dormir','mirar','escuchar','ayudar']),
      m('m_conectores','Conectores','🔗',['el','la','los','las','un','una','mi','tu','y','o','con','sin','para','en','de','a','que','porque','pero','tambien','muy','mas','menos','poco','mucho','aca','ahi','si','no']),
      m('m_preguntas','Preguntas','❓',cat('preguntas'))
    ],
    fin:[
      m('m_personas','Personas','👪',cat('personas')), m('m_lugares','Lugares','🏠',cat('lugares')),
      m('m_objetos','Objetos','🧸',cat('objetos')), m('m_tiempo','Tiempo','⏰',cat('tiempo')),
      m('m_social','Saludos','🙏',cat('social'))
    ]
  };
}
function fichaEj(){ return {id:'f_'+Math.random().toString(36).slice(2,7),nombre:'Mis estrellas',ficha:'⭐',meta:5,premio:'Mi premio',premioEmoji:'🎁',ganadas:0,premios:0}; }
function defaults(){
  const m = (id,nombre,emoji,items)=>({id,nombre,emoji,items});
  return {
    v:1, activo:'m_verbos', mods3:true,
    modulos:[...modsNuevos().ini,
      m('m_necesito','Necesito','🙋',['agua','baño','ayuda','hambre','sed','sueño','dolor','frio','calor','descanso','silencio']),
      m('m_emociones','Cómo estoy','😊',['feliz','triste','enojado','miedo','cansado','nervioso','tranquilo','aburrido','te-quiero']),
      m('m_comida','Quiero comer','🍎',['manzana','banana','pan','leche','jugo','galletitas','fideos','arroz','pollo','huevo','queso','fruta']),
      m('m_acciones','Quiero hacer','🎮',['jugar','mirar','escuchar','leer','dibujar','cantar','salir','abrazar']),
      ...modsNuevos().fin
    ],
    rutinas:[
      {id:'r_manana',nombre:'Mañana',emoji:'🌅',pasos:['dormir','baño','lavar','vestir','comer','cepillar','mochila']},
      {id:'r_noche',nombre:'Antes de dormir',emoji:'🌙',pasos:['comer','bañarse','cepillar','baño','dormir']}
    ],
    tarjetas:[], ajustes:{voz:true, tam:'m', sonido:true},
    semana:[[],[],[],[],[],[],[]], fichas:[fichaEj()], hechos:{}
  };
}
function migrar(s){
  s.v = 2;
  s.ajustes = Object.assign({voz:true, tam:'m', sonido:true}, s.ajustes||{});
  if(!Array.isArray(s.semana) || s.semana.length!==7) s.semana = [[],[],[],[],[],[],[]];
  if(!Array.isArray(s.fichas)) s.fichas = [fichaEj()];
  if(!s.hechos || typeof s.hechos!=='object') s.hechos = {};
  if(!s.rutinas) s.rutinas = [];
  if(!s.tarjetas) s.tarjetas = [];
  if(!s.mods3){ // pestañas nuevas para quienes ya tenían datos: se suman sin tocar las propias
    const n = modsNuevos(), ya = id=>s.modulos.some(m=>m.id===id);
    s.modulos = n.ini.filter(m=>!ya(m.id)).concat(s.modulos, n.fin.filter(m=>!ya(m.id)));
    s.mods3 = true;
  }
  if(!s.modulos.some(m=>m.id===s.activo)) s.activo = (s.modulos[0]||{}).id || '';
  return s;
}
function cargar(){
  try{ const s = JSON.parse(localStorage.getItem(KEY)||'null'); if(s && s.modulos) return migrar(s); }catch(e){}
  return defaults();
}
let S = cargar();
function guardar(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ toast('No se pudo guardar: poco espacio. Probá con menos fotos.'); } }
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}

function tarjeta(id){ return BASE[id] || S.tarjetas.find(t=>t.id===id) || null; }
function color(t){ return (CATEGORIAS[t.cat]||CATEGORIAS.propias).c; }
function imHtml(t){ return t.foto ? `<img src="${t.foto}" alt="">` : `<span class="im">${esc(t.emoji)}</span>`; }
function cardHtml(id, extra){
  const t = tarjeta(id); if(!t) return '';
  return `<button class="card" style="--c:${color(t)}" data-act="tap" data-id="${esc(id)}">${extra||''}${imHtml(t)}<span class="lb">${esc(t.etiqueta)}</span></button>`;
}
function miniHtml(id){ const t=tarjeta(id); return t?`<div class="mini" style="--c:${color(t)}">${t.foto?`<img src="${t.foto}" alt="">`:`<span class="im">${esc(t.emoji)}</span>`}${esc(t.etiqueta)}</div>`:''; }

/* ---- voz ---- */
function hablar(texto){
  if(!S.ajustes.voz || !window.speechSynthesis || !texto) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-AR'; u.rate = .9;
    speechSynthesis.speak(u);
  }catch(e){}
}
function toast(t){ const el=document.getElementById('toast'); el.textContent=t; el.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),2600); }
function descargar(obj, nombre){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
  a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function slug(s){ return String(s||'x').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x'; }

/* ---- sonido (se genera en el dispositivo, sin archivos) ---- */
let AC = null;
const SON = {ficha:[[660,.14],[880,.24]], ok:[[784,.12],[988,.22]], premio:[[523,.13],[659,.13],[784,.13],[1047,.45],[784,.12],[1047,.6]]};
function tono(k){
  if(S.ajustes.sonido===false) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    let t = AC.currentTime;
    SON[k].forEach(([f,d])=>{
      const o=AC.createOscillator(), g=AC.createGain();
      o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.3,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+d+.03); t += d*.8;
    });
  }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate(k==='premio'?[120,60,120,60,240]:[60]); }catch(e){}
}

/* ---- fechas ---- */
const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DIAS_L = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
function hoyIdx(){ return (new Date().getDay()+6)%7; }
function hoyKey(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function hechosHoy(){ return S.hechos[hoyKey()] || []; }
function marcar(id, on){
  const k = hoyKey(); const l = S.hechos[k] || (S.hechos[k]=[]);
  const i = l.indexOf(id);
  if(on && i<0) l.push(id); else if(!on && i>=0) l.splice(i,1);
  Object.keys(S.hechos).sort().slice(0,-10).forEach(x=>delete S.hechos[x]);
  guardar();
}

/* ---- estado de pantalla ---- */
let V = {n:'home'}, edit = false, frase = [], playing = null, cele = null, subRut = 'sem';
function ir(n, p){ V = Object.assign({n}, p||{}); render(); window.scrollTo(0,0); }
function porId(lista, id){ return lista.find(x=>x.id===id); }

/* ---- vistas ---- */
function cab(titulo, izq, der){
  return `<div class="top">${izq||''}<h1>${titulo}</h1>${der||''}</div>`;
}
function backBtn(a){ return `<button data-act="${a||'home'}">‹</button>`; }

function vHome(){
  const act = S.activo;
  const chips = S.modulos.map(m=>`<button class="chip ${act===m.id?'sel':''}" data-act="mod" data-id="${m.id}">${esc(m.emoji)} ${esc(m.nombre)}</button>`).join('')
    + (edit ? `<button class="chip add" data-act="newmod">➕ Módulo</button>` : '');
  const tira = frase.length ? frase.map(miniHtml).join('') : '<span class="vacia">Tocá las tarjetas para armar una frase</span>';
  let cuerpo = '';
  const m = porId(S.modulos, act) || S.modulos[0];
  if(!m){ cuerpo = '<div class="vacio">No hay módulos. Activá ✏️ y creá uno.</div>'; }
  else{
    cuerpo = m.items.length ? `<div class="grid">${m.items.map(id=>cardHtml(id)).join('')}</div>` : '<div class="vacio">Este módulo está vacío. Activá ✏️ y agregá tarjetas.</div>';
    if(edit) cuerpo += `<div class="page"><button class="btn" data-act="emod" data-id="${m.id}">✏️ Editar “${esc(m.nombre)}” (orden, tarjetas, nombre)</button></div>`;
  }
  return cab('💬 Ecos','',topBtns())
    + `<div class="frase"><div class="tira">${tira}</div><button class="fbtn" data-act="back1" aria-label="Borrar última">⌫</button><button class="fbtn say" data-act="speak" aria-label="Hablar">🔊</button></div>`
    + `<div class="chips">${chips}</div>` + cuerpo;
}
function topBtns(){ return `<button class="${edit?'on':''}" data-act="toggleEdit" aria-label="Editar">✏️</button><button data-act="aj" aria-label="Ajustes">⚙️</button>`; }
function nav(){
  const n = V.n;
  return `<nav class="nav3">${[['home','💬','Hablar'],['rut','🔁','Rutinas'],['fic','⭐','Fichas']].map(([k,e,t])=>`<button class="${n===k?'sel':''} ${k==='rut'?'big':''}" data-act="go" data-k="${k}"><span>${e}</span>${t}</button>`).join('')}</nav>`;
}

/* ---- Rutinas: semana + lista ---- */
function itemInfo(it){
  if(it.tipo==='r'){ const r=porId(S.rutinas,it.ref); return r?{e:r.emoji,t:r.nombre,sub:r.pasos.length+' pasos'}:null; }
  const t=tarjeta(it.ref); return t?{e:t.foto?`<img src="${t.foto}" alt="">`:esc(t.emoji),t:t.etiqueta,sub:''}:null;
}
function vRut(){
  const seg = `<div class="seg"><button class="${subRut==='sem'?'sel':''}" data-act="sub" data-k="sem">📅 Mi semana</button><button class="${subRut==='lista'?'sel':''}" data-act="sub" data-k="lista">🔁 Mis rutinas</button></div>`;
  return cab('🔁 Rutinas','',topBtns()) + seg + (subRut==='sem' ? vSemana() : vRutLista());
}
function vRutLista(){
  return `<div class="page">${S.rutinas.map(r=>`<div class="box"><div class="row"><button class="btn pri" style="margin:0" data-act="play" data-id="${r.id}">${esc(r.emoji)} ${esc(r.nombre)} · ${r.pasos.length} pasos</button>${edit?`<button class="btn sm" style="margin:0;width:auto" data-act="erut" data-id="${r.id}">✏️</button>`:''}</div></div>`).join('')}
    ${edit?`<button class="btn" data-act="newrut">➕ Nueva rutina</button>`:''}
    ${!S.rutinas.length?'<div class="vacio">Todavía no hay rutinas. Activá ✏️ para crear una.</div>':''}</div>`;
}
function itf(it){ return it.tablero ? porId(S.fichas,it.tablero) : null; }
function vSemana(){
  const hoy = hoyIdx(), di = V.dia==null ? hoy : V.dia, esHoy = di===hoy;
  const items = S.semana[di], hechos = hechosHoy();
  const tabs = DIAS.map((n,i)=>`<button class="dtab ${i===di?'sel':''} ${i===hoy?'hoy':''}" data-act="dia" data-i="${i}">${n}</button>`).join('');
  const validos = items.filter(it=>itemInfo(it));
  const hechosN = esHoy ? validos.filter(it=>hechos.includes(it.id)).length : 0;
  const prog = esHoy && validos.length ? `<div class="prog"><div style="width:${Math.round(hechosN*100/validos.length)}%"></div><span>${hechosN} de ${validos.length} hechos</span></div>` : '';
  const lista = items.map((it,ix)=>{
    const inf = itemInfo(it); if(!inf) return '';
    const done = esHoy && hechos.includes(it.id);
    return `<div class="wi ${done?'done':''}">
      ${edit?`<input type="time" class="hora" value="${esc(it.hora||'')}" data-in="whora" data-id="${it.id}" data-d="${di}">`:`<div class="hora">${esc(it.hora||'')}</div>`}
      <button class="wmain" data-act="wopen" data-id="${it.id}" data-d="${di}"><span class="e">${inf.e}</span><span class="t">${esc(inf.t)}${inf.sub?`<small>${inf.sub}${it.tipo==='r'?' · tocá para empezar':''}${itf(it)?' · da '+esc(itf(it).ficha):''}</small>`:(itf(it)?`<small>da ${esc(itf(it).ficha)}</small>`:'')}</span></button>
      ${esHoy&&!edit?`<button class="wchk ${done?'on':''}" data-act="wchk" data-id="${it.id}" aria-label="Hecho">${done?'✓':''}</button>`:''}
      ${edit&&S.fichas.length?`<select class="wfic" data-in="wfic" data-id="${it.id}" data-d="${di}"><option value="">Sin ficha</option>${S.fichas.map(f=>`<option value="${f.id}" ${it.tablero===f.id?'selected':''}>Da una ficha: ${esc(f.ficha)} ${esc(f.nombre)}</option>`).join('')}</select>`:''}
      ${edit?`<button class="mv" data-act="wup" data-d="${di}" data-j="${ix}" ${ix===0?'disabled':''}>▲</button><button class="mv" data-act="wdown" data-d="${di}" data-j="${ix}" ${ix===items.length-1?'disabled':''}>▼</button><button class="mv" data-act="wrm" data-d="${di}" data-j="${ix}">✕</button>`:''}
    </div>`;
  }).join('');
  const cp = V.cp || [];
  const copiar = edit && items.length ? `<div class="box"><h2>Copiar este día</h2><p>Elegí a qué días copiar lo que armaste el ${DIAS_L[di].toLowerCase()} (reemplaza lo que haya).</p>
    <div class="emojis">${DIAS.map((n,i)=>i===di?'':`<button class="${cp.includes(i)?'sel':''}" style="width:auto;padding:0 12px;font-size:1rem;font-weight:700" data-act="wcp" data-i="${i}">${n}</button>`).join('')}</div>
    <button class="btn" data-act="wcopy" data-d="${di}" ${cp.length?'':'disabled'}>📋 Copiar a los días elegidos</button></div>` : '';
  return `<div class="dtabs">${tabs}</div>
    <div class="page"><div class="dtit">${DIAS_L[di]}${esHoy?' · hoy':''}</div>${prog}
    ${lista || `<div class="vacio">${edit?'Todavía no hay nada en este día. Agregá rutinas o actividades.':'Este día está libre. Activá ✏️ para armar el día desde que arranca hasta que termina.'}</div>`}
    ${edit?`<button class="btn pri" data-act="wadd" data-d="${di}">➕ Agregar al día</button>${items.length>1?`<button class="btn" data-act="wsort" data-d="${di}">🕒 Ordenar por hora</button>`:''}`:''}
    ${copiar}</div>`;
}
function vWPick(){
  const q = (V.q||'').trim().toLowerCase();
  const rut = S.rutinas.map(r=>`<button class="btn" data-act="waddr" data-id="${r.id}">${esc(r.emoji)} ${esc(r.nombre)} <small style="color:var(--muted)">· rutina</small></button>`).join('');
  const ts = todasTarjetas().filter(t=>!q || t.etiqueta.toLowerCase().includes(q)).slice(0,60);
  return cab('Agregar al '+DIAS_L[V.d].toLowerCase(), backBtn('goSem'))
    + `<div class="page"><div class="box"><h2>Rutinas</h2>${rut||'<p>No hay rutinas todavía.</p>'}</div>
      <div class="box"><h2>Actividades (tarjetas)</h2><p>Por ejemplo: merienda, plaza, baño, terapia.</p>
      <input type="text" placeholder="Buscar tarjeta…" value="${esc(V.q||'')}" data-in="wq"></div></div>
      <div class="grid">${ts.map(t=>`<button class="card" style="--c:${color(t)}" data-act="waddc" data-id="${esc(t.id)}">${imHtml(t)}<span class="lb">${esc(t.etiqueta)}</span></button>`).join('')}</div>
      <div class="foot"><button class="btn pri" data-act="goSem">Listo</button></div>`;
}

/* ---- Fichas (economía de fichas) ---- */
function vFic(){
  const tableros = S.fichas.map(f=>{
    const lleno = f.ganadas>=f.meta;
    const slots = Array.from({length:f.meta},(_,i)=>`<span class="slotf ${i<f.ganadas?'on':''}">${esc(f.ficha)}</span>`).join('');
    return `<div class="box ficha"><div class="row"><h2 style="margin:0">${esc(f.nombre)}</h2>${edit?`<button class="btn sm" style="margin:0;width:auto" data-act="efic" data-id="${f.id}">✏️</button>`:''}</div>
      <div class="slots">${slots}</div>
      <div class="meta">${f.ganadas} de ${f.meta} · Premio: ${esc(f.premioEmoji)} ${esc(f.premio)}</div>
      ${lleno?`<button class="btn pri gran" data-act="canjear" data-id="${f.id}">🎁 ¡Reclamar el premio!</button>`
             :`<button class="btn pri gran" data-act="ficha" data-id="${f.id}">${esc(f.ficha)} ¡Lo cumplió!</button>`}
      ${edit&&f.ganadas>0?`<button class="btn" data-act="quitaf" data-id="${f.id}">↩ Quitar una ficha</button>`:''}
      ${f.premios?`<p style="margin:8px 0 0">Premios ganados: ${f.premios} 🏆</p>`:''}</div>`;
  }).join('');
  return cab('⭐ Fichas','',topBtns())
    + `<div class="page"><div class="box"><p style="margin:0">Cada vez que cumple lo acordado (por ejemplo, terminar una rutina), tocá el botón: gana una ficha. Al completar el tablero, recibe su premio. También podés vincular una rutina a un tablero desde ✏️.</p></div>
    ${tableros}${edit?`<button class="btn" data-act="newfic">➕ Nuevo tablero</button>`:''}
    ${!S.fichas.length?'<div class="vacio">No hay tableros. Activá ✏️ para crear uno.</div>':''}</div>`;
}
const EMOJIS_FICHA = ['⭐','🌟','🏅','🍀','❤️','🚀','🐶','🧩','🍎','🐸','🦄','⚽'];
const EMOJIS_PREMIO = ['🎁','🍦','🎮','📺','🍫','🎈','⚽','🧸','🎡','📱','🍕','🏊'];
function vEFic(){
  const f = porId(S.fichas, V.id); if(!f) return vFic();
  return cab('Editar tablero', backBtn('go:fic'))
    + `<div class="page"><div class="box"><h2>¿Qué se premia?</h2><p>Escribí lo acordado. Ej.: “Lavarse los dientes”.</p><input type="text" maxlength="40" value="${esc(f.nombre)}" data-in="fname" data-id="${f.id}">
      <h2 style="margin-top:12px">Ficha</h2>${emojiPicker(f.ficha,'fichaemoji',f.id,EMOJIS_FICHA)}</div>
      <div class="box"><h2>Fichas para el premio</h2><div class="row" style="margin-top:8px"><button class="btn" style="text-align:center;margin:0" data-act="metadec" data-id="${f.id}">−</button><div style="text-align:center;font-size:1.6rem;font-weight:700;flex:none;width:70px">${f.meta}</div><button class="btn" style="text-align:center;margin:0" data-act="metainc" data-id="${f.id}">+</button></div></div>
      <div class="box"><h2>Premio</h2><input type="text" maxlength="40" value="${esc(f.premio)}" data-in="fprem" data-id="${f.id}">
      <h2 style="margin-top:12px">Ícono del premio</h2>${emojiPicker(f.premioEmoji,'premoji',f.id,EMOJIS_PREMIO)}</div>
      <div class="box"><button class="btn del" data-act="delfic" data-id="${f.id}">🗑️ Eliminar tablero</button></div></div>`;
}
function vCele(){
  if(!cele) return '';
  const conf = ['🎉','⭐','✨','🎊',cele.emoji].map(e=>e||'🎉');
  const piezas = Array.from({length:26},(_,i)=>`<i style="left:${(i*37)%100}%;animation-delay:${(i%9)*0.18}s;animation-duration:${2.4+(i%5)*0.4}s">${conf[i%conf.length]}</i>`).join('');
  return `<div class="cele ${cele.tipo}" data-act="celeok"><div class="conf">${piezas}</div>
    <div class="cbig">${esc(cele.emoji)}</div><div class="ctit">${esc(cele.titulo)}</div><div class="csub">${esc(cele.sub||'')}</div><div class="cok">Tocá para seguir</div></div>`;
}
function celebrar(tipo, titulo, sub, emoji, voz){
  cele = {tipo,titulo,sub,emoji};
  tono(tipo==='premio'?'premio':(tipo==='ficha'?'ficha':'ok'));
  setTimeout(()=>hablar(voz||titulo), 450);
  render();
  clearTimeout(celebrar._t);
  if(tipo!=='premio') celebrar._t = setTimeout(()=>{ if(cele){ cele=null; render(); } }, 4200);
}
function darFicha(f, motivo){
  f.ganadas = Math.min(f.meta, f.ganadas+1); guardar();
  if(f.ganadas>=f.meta) celebrar('premio','¡Completó el tablero!','Premio: '+f.premioEmoji+' '+f.premio, f.premioEmoji, '¡Ganaste tu premio! '+f.premio);
  else celebrar('ficha','¡Muy bien!', motivo||('Ficha '+f.ganadas+' de '+f.meta), f.ficha);
}

function listaItems(arr, tipo, id){
  return arr.map((cid,i)=>{
    const t = tarjeta(cid); if(!t) return '';
    return `<div class="item"><span class="e">${t.foto?`<img src="${t.foto}" style="width:34px;height:34px;border-radius:8px;object-fit:cover" alt="">`:esc(t.emoji)}</span><span class="t">${esc(t.etiqueta)}</span>
      <button data-act="up" data-t="${tipo}" data-id="${id}" data-i="${i}" ${i===0?'disabled':''}>▲</button>
      <button data-act="down" data-t="${tipo}" data-id="${id}" data-i="${i}" ${i===arr.length-1?'disabled':''}>▼</button>
      <button data-act="rm" data-t="${tipo}" data-id="${id}" data-i="${i}">✕</button></div>`;
  }).join('');
}
function emojiPicker(sel, act, id, lista){
  return `<div class="emojis">${(lista||EMOJIS_MOD).map(e=>`<button class="${e===sel?'sel':''}" data-act="${act}" data-id="${id}" data-e="${e}">${e}</button>`).join('')}</div>`;
}
function vEditMod(){
  const m = porId(S.modulos, V.id); if(!m) return vHome();
  return cab('Editar módulo', backBtn('home'))
    + `<div class="page"><div class="box"><h2>Nombre</h2><input type="text" maxlength="30" value="${esc(m.nombre)}" data-in="modname" data-id="${m.id}">
      <h2 style="margin-top:12px">Ícono</h2>${emojiPicker(m.emoji,'modemoji',m.id)}</div>
      <div class="box"><h2>Tarjetas, en este orden</h2><p>Las tarjetas se muestran en el orden que elijas. Usá ▲ ▼ para moverlas.</p>
      ${listaItems(m.items,'m',m.id) || '<p>Todavía no hay tarjetas.</p>'}
      <button class="btn pri" data-act="pick" data-t="m" data-id="${m.id}" style="margin-top:12px">➕ Agregar tarjetas</button></div>
      <div class="box"><button class="btn" data-act="expmod" data-id="${m.id}">📤 Exportar este módulo</button><button class="btn del" data-act="delmod" data-id="${m.id}">🗑️ Eliminar módulo</button></div></div>`;
}
function vEditRut(){
  const r = porId(S.rutinas, V.id); if(!r) return vHome();
  return cab('Editar rutina', backBtn('go:lista'))
    + `<div class="page"><div class="box"><h2>Nombre</h2><input type="text" maxlength="30" value="${esc(r.nombre)}" data-in="rutname" data-id="${r.id}">
      <h2 style="margin-top:12px">Ícono</h2>${emojiPicker(r.emoji,'rutemoji',r.id)}</div>
      <div class="box"><h2>Ficha al terminar</h2><p>Si la vinculás a un tablero de Fichas, al terminar la rutina gana una ficha automáticamente.</p>
        <select data-in="rtab" data-id="${r.id}"><option value="">Ninguna</option>${S.fichas.map(f=>`<option value="${f.id}" ${r.tablero===f.id?'selected':''}>${esc(f.ficha)} ${esc(f.nombre)}</option>`).join('')}</select></div>
      <div class="box"><h2>Pasos, en orden</h2><p>Cada paso es una tarjeta (una acción, un lugar, un objeto…). Podés repetir tarjetas.</p>
      ${listaItems(r.pasos,'r',r.id) || '<p>Todavía no hay pasos.</p>'}
      <button class="btn pri" data-act="pick" data-t="r" data-id="${r.id}" style="margin-top:12px">➕ Agregar pasos</button>
      ${r.pasos.length?`<button class="btn" data-act="play" data-id="${r.id}">▶ Probar la rutina</button>`:''}</div>
      <div class="box"><button class="btn" data-act="exprut" data-id="${r.id}">📤 Exportar esta rutina</button><button class="btn del" data-act="delrut" data-id="${r.id}">🗑️ Eliminar rutina</button></div></div>`;
}
function todasTarjetas(){ return Object.values(BASE).concat(S.tarjetas); }
function vPick(){
  const dest = V.t==='m' ? porId(S.modulos,V.id) : porId(S.rutinas,V.id);
  if(!dest) return vHome();
  const lista = V.t==='m' ? dest.items : dest.pasos;
  const q = (V.q||'').toLowerCase().trim();
  const todas = todasTarjetas().filter(t=>!q || t.etiqueta.toLowerCase().includes(q));
  let html = '';
  Object.keys(CATEGORIAS).forEach(cat=>{
    const ts = todas.filter(t=>t.cat===cat); if(!ts.length) return;
    html += `<div class="cat">${CATEGORIAS[cat].e} ${CATEGORIAS[cat].n}</div><div class="grid">${ts.map(t=>{
      const n = lista.filter(x=>x===t.id).length;
      return `<button class="card" style="--c:${color(t)}" data-act="pickone" data-id="${esc(t.id)}">${n?`<span class="n">${V.t==='m'?'✓':'×'+n}</span>`:''}${imHtml(t)}<span class="lb">${esc(t.etiqueta)}</span></button>`;
    }).join('')}</div>`;
  });
  return cab(V.t==='m'?'Agregar tarjetas':'Agregar pasos', backBtn(V.t==='m'?'emod:'+V.id:'erut:'+V.id), `<button data-act="ncard">➕ Nueva</button>`)
    + `<div class="search"><input type="text" placeholder="Buscar…" value="${esc(V.q||'')}" data-in="q"></div>`
    + (html || '<div class="vacio">No hay tarjetas con ese nombre. Tocá “Nueva” para crearla.</div>')
    + `<div class="foot"><button class="btn pri" data-act="${V.t==='m'?'emod:'+V.id:'erut:'+V.id}">Listo · ${lista.length} ${V.t==='m'?'tarjetas':'pasos'}</button></div>`;
}
function vNCard(){
  const c = V.c || (V.c = {etiqueta:'', emoji:'⭐', foto:'', cat:'propias'});
  const cats = Object.keys(CATEGORIAS).filter(k=>k!=='propias').concat(['propias']);
  return cab('Nueva tarjeta', backBtn('pick'))
    + `<div class="page"><div class="box"><h2>¿Qué dice?</h2><input type="text" maxlength="40" value="${esc(c.etiqueta)}" data-in="cl" placeholder="Ej: tobogán">
      <h2 style="margin-top:12px">Imagen</h2><p>Usá un emoji (podés escribir o pegar uno) o sacá una foto.</p>
      <input type="text" maxlength="4" value="${esc(c.emoji)}" data-in="ce" style="font-size:1.6rem;text-align:center">
      <button class="btn" data-act="foto">📷 Elegir o sacar una foto</button><input type="file" id="fotoIn" accept="image/*" style="display:none">
      ${c.foto?`<div style="text-align:center;margin-top:10px"><img src="${c.foto}" style="width:110px;height:110px;object-fit:cover;border-radius:18px" alt=""><br><button class="btn del" data-act="nofoto">Quitar foto</button></div>`:''}
      <h2 style="margin-top:12px">Categoría</h2><select data-in="cc">${cats.map(k=>`<option value="${k}" ${c.cat===k?'selected':''}>${CATEGORIAS[k].e} ${CATEGORIAS[k].n}</option>`).join('')}</select></div>
      <button class="btn pri" data-act="saveCard">Guardar tarjeta</button></div>`;
}
function vAj(){
  const a = S.ajustes;
  return cab('Ajustes', backBtn('home'))
    + `<div class="page">
      <div class="box"><h2>Voz</h2><p>Dice en voz alta cada tarjeta y las frases. Depende de la voz en español de tu celular.</p>
        <button class="btn" data-act="togvoz">${a.voz?'🔊 Voz activada (tocar para silenciar)':'🔇 Voz silenciada (tocar para activar)'}</button>
        <button class="btn" data-act="togson">${a.sonido!==false?'🔔 Sonidos de premio activados (tocar para silenciar)':'🔕 Sonidos de premio silenciados (tocar para activar)'}</button>
        <h2 style="margin-top:12px">Tamaño de las tarjetas</h2>
        <div class="row">${[['s','Chicas'],['m','Medianas'],['l','Grandes']].map(([k,n])=>`<button class="btn ${a.tam===k?'pri':''}" style="text-align:center" data-act="tam" data-k="${k}">${n}</button>`).join('')}</div></div>
      <div class="box"><h2>Importar y exportar</h2><p>Cada módulo y cada rutina se puede exportar desde su pantalla de edición (✏️) y compartir con otra familia o con un terapeuta.</p>
        <button class="btn" data-act="imp">📥 Importar módulo, rutina o respaldo</button><input type="file" id="impIn" accept="application/json,.json" style="display:none">
        <button class="btn" data-act="expall">💾 Descargar respaldo de todo</button></div>
      <div class="box"><h2>Apoyar el proyecto</h2><p>Ecos es gratis y de código abierto. Si te sirvió, un aporte me ayuda a seguir. Es opcional.</p>
        <div class="row"><a class="btn" style="text-align:center" href="https://link.mercadopago.com.ar/abelg88" target="_blank" rel="noopener">Mercado Pago</a><a class="btn" style="text-align:center" href="https://cafecito.app/abelg88" target="_blank" rel="noopener">Cafecito</a></div>
        <div class="row"><a class="btn" style="text-align:center" href="https://paypal.me/AbelG88" target="_blank" rel="noopener">PayPal</a><a class="btn" style="text-align:center" href="https://buymeacoffee.com/abelg88" target="_blank" rel="noopener">Buy Me a Coffee</a></div></div>
      <div class="box"><h2>Acerca de</h2><p>Hecha por Abel con vibe coding, en constante evolución. Código abierto (MIT). Tus datos están solo en este celular: hacé respaldos seguido. Las imágenes son emojis del sistema; no usa pictogramas de terceros.</p>
        <a class="btn" href="https://orbita-tea.pages.dev" target="_blank" rel="noopener">Más apps en Órbita TEA</a></div></div>`;
}
function vPlay(){
  const r = porId(S.rutinas, playing.id); if(!r) return '';
  const id = r.pasos[playing.i], t = tarjeta(id); const fin = playing.i >= r.pasos.length-1;
  return `<div class="play"><button class="x" data-act="stopPlay">✕</button>
    <div class="pro">${esc(r.nombre)} · paso ${playing.i+1} de ${r.pasos.length}</div>
    ${t?(t.foto?`<img src="${t.foto}" alt="">`:`<div class="big">${esc(t.emoji)}</div>`):''}
    <div class="nm">${t?esc(t.etiqueta):''}</div>
    <div class="nav"><button data-act="pprev" ${playing.i===0?'disabled':''}>‹ Antes</button><button data-act="pspeak">🔊</button><button class="go" data-act="pnext">${fin?'¡Listo! ✓':'Siguiente ›'}</button></div></div>`;
}

function render(){
  const app = document.getElementById('app');
  document.documentElement.style.setProperty('--card-size', ({s:'86px',m:'104px',l:'132px'})[S.ajustes.tam] || '104px');
  const vistas = {home:vHome, rut:vRut, fic:vFic, efic:vEFic, wpick:vWPick, emod:vEditMod, erut:vEditRut, pick:vPick, ncard:vNCard, aj:vAj};
  app.innerHTML = (vistas[V.n]||vHome)() + (['home','rut','fic'].includes(V.n) && !playing ? nav() : '') + (playing ? vPlay() : '') + vCele();
}

/* ---- acciones ---- */
function mover(arr, i, d){ const j=i+d; if(j<0||j>=arr.length) return; [arr[i],arr[j]]=[arr[j],arr[i]]; }
function lista(t,id){ if(t==='m'){ const m=porId(S.modulos,id); return m&&m.items; } const r=porId(S.rutinas,id); return r&&r.pasos; }
function usadas(ids){ return S.tarjetas.filter(t=>ids.includes(t.id)); }

const ACC = {
  home(){ ir('home'); },
  toggleEdit(){ edit = !edit; render(); },
  aj(){ ir('aj'); },
  mod(d){ S.activo = d.id; guardar(); render(); },
  tap(d){ frase.push(d.id); const t=tarjeta(d.id); hablar(t&&t.etiqueta); render(); },
  back1(){ frase.pop(); render(); },
  speak(){ if(!frase.length){ toast('Primero tocá algunas tarjetas'); return; } hablar(frase.map(id=>{const t=tarjeta(id);return t?t.etiqueta:'';}).join(' ')); },
  newmod(){ const m={id:uid('m_'),nombre:'Nuevo módulo',emoji:'⭐',items:[]}; S.modulos.push(m); S.activo=m.id; guardar(); ir('emod',{id:m.id}); },
  newrut(){ const r={id:uid('r_'),nombre:'Nueva rutina',emoji:'🔁',pasos:[]}; S.rutinas.push(r); guardar(); ir('erut',{id:r.id}); },
  go(d){ ir(d.k); },
  sub(d){ subRut=d.k; render(); },
  goSem(){ subRut='sem'; ir('rut',{dia:V.d}); },
  dia(d){ V.dia=+d.i; V.cp=[]; render(); },
  emod(d){ ir('emod',{id:d.id}); }, erut(d){ ir('erut',{id:d.id}); },
  modemoji(d){ porId(S.modulos,d.id).emoji=d.e; guardar(); render(); },
  rutemoji(d){ porId(S.rutinas,d.id).emoji=d.e; guardar(); render(); },
  up(d){ mover(lista(d.t,d.id),+d.i,-1); guardar(); render(); },
  down(d){ mover(lista(d.t,d.id),+d.i,1); guardar(); render(); },
  rm(d){ lista(d.t,d.id).splice(+d.i,1); guardar(); render(); },
  pick(d){ ir('pick',{t:d.t,id:d.id,q:''}); },
  pickone(d){
    const l = lista(V.t,V.id); const at = l.indexOf(d.id);
    if(V.t==='m' && at>=0) l.splice(at,1); else l.push(d.id);
    guardar(); const y=window.scrollY; render(); window.scrollTo(0,y);
  },
  delmod(d){ if(!confirm('¿Eliminar este módulo? Las tarjetas no se borran.')) return; S.modulos=S.modulos.filter(m=>m.id!==d.id); if(S.activo===d.id) S.activo=(S.modulos[0]||{id:''}).id; guardar(); ir('home'); },
  delrut(d){ if(!confirm('¿Eliminar esta rutina?')) return; S.rutinas=S.rutinas.filter(r=>r.id!==d.id); S.semana=S.semana.map(dia=>dia.filter(it=>!(it.tipo==='r'&&it.ref===d.id))); guardar(); subRut='lista'; ir('rut'); },
  ncard(){ ir('ncard',{ret:{t:V.t,id:V.id}}); },
  foto(){ document.getElementById('fotoIn').click(); },
  nofoto(){ V.c.foto=''; render(); },
  saveCard(){
    const c = V.c; if(!c.etiqueta.trim()){ toast('Escribí qué dice la tarjeta'); return; }
    const t = {id:uid('c_'), etiqueta:c.etiqueta.trim(), emoji:(c.emoji||'⭐').trim()||'⭐', foto:c.foto||'', cat:c.cat};
    if(!t.foto) delete t.foto;
    S.tarjetas.push(t);
    const l = lista(V.ret.t,V.ret.id); if(l) l.push(t.id);
    guardar(); toast('Tarjeta creada y agregada'); ir('pick',{t:V.ret.t,id:V.ret.id,q:''});
  },
  togvoz(){ S.ajustes.voz=!S.ajustes.voz; guardar(); render(); },
  tam(d){ S.ajustes.tam=d.k; guardar(); render(); },
  play(d){ playing={id:d.id,i:0,w:d.w||null}; render(); const r=porId(S.rutinas,d.id); const t=tarjeta(r.pasos[0]); hablar(t&&t.etiqueta); },
  stopPlay(){ playing=null; render(); },
  pprev(){ if(playing.i>0){ playing.i--; render(); ACC.pspeak(); } },
  pnext(){ const r=porId(S.rutinas,playing.id); if(playing.i>=r.pasos.length-1){ const w=playing.w; playing=null; if(w) marcar(w,true); const itw=w&&S.semana[hoyIdx()].find(x=>x.id===w); const f=(itw&&itf(itw))||(r.tablero&&porId(S.fichas,r.tablero)); if(f) darFicha(f,'Terminó: '+r.nombre); else celebrar('ok','¡Muy bien!','Terminamos: '+r.nombre,'🎉','¡Muy bien! Terminamos'); } else { playing.i++; render(); ACC.pspeak(); } },
  pspeak(){ const r=porId(S.rutinas,playing.id); const t=tarjeta(r.pasos[playing.i]); hablar(t&&t.etiqueta); },
  expmod(d){ const m=porId(S.modulos,d.id); descargar({tipo:'ecos_modulo_v1',modulo:{nombre:m.nombre,emoji:m.emoji,items:m.items},tarjetas:usadas(m.items)},`ecos-modulo-${slug(m.nombre)}.json`); },
  exprut(d){ const r=porId(S.rutinas,d.id); descargar({tipo:'ecos_rutina_v1',rutina:{nombre:r.nombre,emoji:r.emoji,pasos:r.pasos},tarjetas:usadas(r.pasos)},`ecos-rutina-${slug(r.nombre)}.json`); },
  expall(){ descargar({tipo:'ecos_respaldo_v1',generado:new Date().toISOString(),datos:S},`ecos-respaldo-${new Date().toISOString().slice(0,10)}.json`); },
  imp(){ document.getElementById('impIn').click(); },
  togson(){ S.ajustes.sonido = S.ajustes.sonido===false; guardar(); render(); if(S.ajustes.sonido) tono('ok'); },
  celeok(){ cele=null; clearTimeout(celebrar._t); render(); },
  /* semana */
  wopen(d){
    const it = S.semana[+d.d].find(x=>x.id===d.id); if(!it) return;
    if(it.tipo==='r'){ const r=porId(S.rutinas,it.ref); if(!r||!r.pasos.length){ toast('Esa rutina no tiene pasos'); return; } ACC.play({id:r.id, w:(+d.d===hoyIdx()?it.id:null)}); }
    else { const t=tarjeta(it.ref); hablar(t&&t.etiqueta); }
  },
  wchk(d){ const on=!hechosHoy().includes(d.id); marcar(d.id,on); const it0=S.semana[hoyIdx()].find(x=>x.id===d.id), f0=on&&it0&&itf(it0); if(f0){ const i0=itemInfo(it0); darFicha(f0,'Hizo: '+(i0?i0.t:'')); return; } const todos=S.semana[hoyIdx()].filter(it=>itemInfo(it)); if(on && todos.length && todos.every(it=>hechosHoy().includes(it.id))) celebrar('ok','¡Día completo!','Hizo todo lo de hoy','🌟','¡Día completo! Muy bien'); else { if(on) tono('ok'); render(); } },
  wup(d){ mover(S.semana[+d.d],+d.j,-1); guardar(); render(); },
  wdown(d){ mover(S.semana[+d.d],+d.j,1); guardar(); render(); },
  wrm(d){ S.semana[+d.d].splice(+d.j,1); guardar(); render(); },
  wadd(d){ ir('wpick',{d:+d.d,q:''}); },
  waddr(d){ S.semana[V.d].push({id:uid('w_'),tipo:'r',ref:d.id,hora:''}); guardar(); toast('Agregado ✓'); },
  waddc(d){ S.semana[V.d].push({id:uid('w_'),tipo:'c',ref:d.id,hora:''}); guardar(); toast('Agregado ✓'); },
  wsort(d){ const l=S.semana[+d.d]; const con=l.filter(x=>x.hora).sort((a,b)=>a.hora<b.hora?-1:a.hora>b.hora?1:0), sin=l.filter(x=>!x.hora); S.semana[+d.d]=con.concat(sin); guardar(); render(); },
  wcp(d){ const c=V.cp||(V.cp=[]); const i=c.indexOf(+d.i); if(i>=0) c.splice(i,1); else c.push(+d.i); render(); },
  wcopy(d){ const o=S.semana[+d.d]; (V.cp||[]).forEach(j=>{ S.semana[j]=o.map(it=>Object.assign({},it,{id:uid('w_')})); }); const n=(V.cp||[]).length; V.cp=[]; guardar(); toast('Copiado a '+n+(n===1?' día':' días')); render(); },
  /* fichas */
  ficha(d){ const f=porId(S.fichas,d.id); if(f) darFicha(f); },
  canjear(d){ const f=porId(S.fichas,d.id); if(!f) return; f.ganadas=0; f.premios=(f.premios||0)+1; guardar(); tono('ok'); toast('¡A disfrutar el premio! '+f.premioEmoji); render(); },
  quitaf(d){ const f=porId(S.fichas,d.id); if(f&&f.ganadas>0){ f.ganadas--; guardar(); render(); } },
  efic(d){ ir('efic',{id:d.id}); },
  newfic(){ const f=fichaEj(); f.nombre='Nuevo tablero'; S.fichas.push(f); guardar(); ir('efic',{id:f.id}); },
  fichaemoji(d){ porId(S.fichas,d.id).ficha=d.e; guardar(); render(); },
  premoji(d){ porId(S.fichas,d.id).premioEmoji=d.e; guardar(); render(); },
  metadec(d){ const f=porId(S.fichas,d.id); if(f.meta>2){ f.meta--; f.ganadas=Math.min(f.ganadas,f.meta); guardar(); render(); } },
  metainc(d){ const f=porId(S.fichas,d.id); if(f.meta<12){ f.meta++; guardar(); render(); } },
  delfic(d){ if(!confirm('¿Eliminar este tablero?')) return; S.fichas=S.fichas.filter(f=>f.id!==d.id); S.rutinas.forEach(r=>{ if(r.tablero===d.id) delete r.tablero; }); S.semana.forEach(dia=>dia.forEach(it=>{ if(it.tablero===d.id) delete it.tablero; })); guardar(); ir('fic'); }
};
function acc(a, d){
  if(a.startsWith('emod:')) return ir('emod',{id:a.slice(5)});
  if(a.startsWith('erut:')) return ir('erut',{id:a.slice(5)});
  if(a==='go:lista'){ subRut='lista'; return ir('rut'); }
  if(a.startsWith('go:')) return ir(a.slice(3));
  if(a==='pick' && !d.t) return ir('pick',{t:V.ret.t,id:V.ret.id,q:''});
  (ACC[a]||function(){})(d);
}
document.getElementById('app').addEventListener('click', e=>{
  const b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
  acc(b.dataset.act, b.dataset);
});
document.getElementById('app').addEventListener('input', e=>{
  const k = e.target.dataset.in; if(!k) return; const v = e.target.value;
  if(k==='modname'){ porId(S.modulos,e.target.dataset.id).nombre=v; guardar(); }
  else if(k==='rutname'){ porId(S.rutinas,e.target.dataset.id).nombre=v; guardar(); }
  else if(k==='rtab'){ const r=porId(S.rutinas,e.target.dataset.id); if(v) r.tablero=v; else delete r.tablero; guardar(); }
  else if(k==='fname'){ porId(S.fichas,e.target.dataset.id).nombre=v; guardar(); }
  else if(k==='fprem'){ porId(S.fichas,e.target.dataset.id).premio=v; guardar(); }
  else if(k==='wfic'){ const it=S.semana[+e.target.dataset.d].find(x=>x.id===e.target.dataset.id); if(it){ if(v) it.tablero=v; else delete it.tablero; guardar(); } }
  else if(k==='whora'){ const it=S.semana[+e.target.dataset.d].find(x=>x.id===e.target.dataset.id); if(it){ it.hora=v; guardar(); } }
  else if(k==='wq'){ V.q=v; const pos=e.target.selectionStart; render(); const i=document.querySelector('[data-in=wq]'); if(i){ i.focus(); i.setSelectionRange(pos,pos); } }
  else if(k==='q'){ V.q=v; const pos=e.target.selectionStart; render(); const i=document.querySelector('[data-in=q]'); if(i){ i.focus(); i.setSelectionRange(pos,pos); } }
  else if(k==='cl') V.c.etiqueta=v; else if(k==='ce') V.c.emoji=v; else if(k==='cc') V.c.cat=v;
});
document.getElementById('app').addEventListener('change', e=>{
  if(e.target.id==='fotoIn' && e.target.files[0]){
    const img = new Image(), fr = new FileReader();
    fr.onload = ()=>{ img.onload = ()=>{
      const s=200, cv=document.createElement('canvas'); cv.width=cv.height=s; const x=cv.getContext('2d');
      const m=Math.min(img.width,img.height), sx=(img.width-m)/2, sy=(img.height-m)/2;
      x.drawImage(img,sx,sy,m,m,0,0,s,s); V.c.foto=cv.toDataURL('image/jpeg',.72); render();
    }; img.src=fr.result; };
    fr.readAsDataURL(e.target.files[0]);
  }
  if(e.target.id==='impIn' && e.target.files[0]){
    const rd = new FileReader(); rd.onload = ()=>importar(rd.result); rd.readAsText(e.target.files[0]); e.target.value='';
  }
});

/* ---- importar ---- */
function mezclarTarjetas(ts){
  (ts||[]).forEach(t=>{
    if(!t||!t.id||!t.etiqueta||BASE[t.id]) return;
    if(!S.tarjetas.some(x=>x.id===t.id)) S.tarjetas.push({id:String(t.id),etiqueta:String(t.etiqueta).slice(0,40),emoji:String(t.emoji||'⭐').slice(0,4),foto:typeof t.foto==='string'&&t.foto.startsWith('data:image/')?t.foto:undefined,cat:CATEGORIAS[t.cat]?t.cat:'propias'});
  });
}
function importar(txt){
  try{
    const d = JSON.parse(txt);
    if(d.tipo==='ecos_modulo_v1'){
      mezclarTarjetas(d.tarjetas);
      const m={id:uid('m_'),nombre:String(d.modulo.nombre||'Módulo').slice(0,30),emoji:String(d.modulo.emoji||'⭐').slice(0,4),items:(d.modulo.items||[]).filter(i=>tarjeta(i))};
      S.modulos.push(m); S.activo=m.id; guardar(); toast('Módulo importado'); ir('home');
    }else if(d.tipo==='ecos_rutina_v1'){
      mezclarTarjetas(d.tarjetas);
      S.rutinas.push({id:uid('r_'),nombre:String(d.rutina.nombre||'Rutina').slice(0,30),emoji:String(d.rutina.emoji||'🔁').slice(0,4),pasos:(d.rutina.pasos||[]).filter(i=>tarjeta(i))});
      guardar(); toast('Rutina importada'); subRut='lista'; ir('rut');
    }else if(d.tipo==='ecos_respaldo_v1' && d.datos && d.datos.modulos){
      if(!confirm('Esto REEMPLAZA todo lo que hay en este dispositivo. ¿Seguir?')) return;
      S = migrar(d.datos); guardar(); toast('Respaldo restaurado'); ir('home');
    }else throw 0;
  }catch(e){ toast('No pude leer ese archivo'); }
}

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
