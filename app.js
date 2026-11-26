/* Ecos — comunicación con tarjetas. Datos solo en este dispositivo (localStorage). */
const KEY = 'ecos_v1';
const BASE = {};
TARJETAS_BASE.forEach(t => { BASE[t[0]] = {id:t[0], emoji:t[1], etiqueta:t[2], cat:t[3]}; });
const EMOJIS_MOD = ['⭐','🏠','🍽️','😊','🎮','🚌','🏫','🛁','🧩','🎵','🐶','❤️','🌈','📚','⚽','🧸'];

function paso(p){ return Array.isArray(p) ? p : [p]; }
function pasoTexto(p){ return paso(p).map(id=>{ const t=tarjeta(id); return t?t.etiqueta:''; }).join(' ').replace(/\s+/g,' ').trim(); }
function normPasos(a){ return (a||[]).map(p=>paso(p).filter(i=>tarjeta(i))).filter(p=>p.length); }
const OLD2NEW = {'ir-bano':['ir','al','baño'],'agarrar-pasta':['agarrar','pasta-dental'],'abrir-pasta':['abrir','pasta-dental'],'agarrar-cepillo':['agarrar','cepillo'],'poner-pasta':['poner','pasta-dental','en','cepillo'],'cepillar-1min':['cepillar','un-minuto'],'abrir-canilla':['abrir','canilla'],'enjuagar-boca':['enjuagar','boca'],'lavar-cepillo':['lavar','cepillo'],'guardar-cepillo':['guardar','cepillo'],'tapar-pasta':['tapar','pasta-dental'],'guardar-pasta':['guardar','pasta-dental'],'lavar-boca':['lavar','boca'],'cerrar-canilla':['cerrar','canilla'],'secar-boca':['secar','boca'],'mojar-manos':['mojar','manos'],'jabon':['poner','jabon'],'frotar':['frotar','manos'],'enjuagar-manos':['enjuagar','manos'],'secar-manos':['secar','manos'],'bajar-pantalon':['bajar','pantalon'],'sentarme-inodoro':['sentarme','en','inodoro'],'hacer-pipi':['hacer','pipi','o','caca'],'subir-pantalon':['subir','pantalon'],'tirar-cadena':['tirar','cadena'],'sacar-pijama':['sacarme','pijama'],'poner-remera':['ponerme','remera'],'poner-pantalon':['ponerme','pantalon'],'poner-medias':['ponerme','medias'],'poner-zapatillas':['ponerme','zapatillas'],'sacar-ropa':['sacarme','ropa'],'shampoo':['poner','shampoo']};
function uid(p){ return (p||'c_') + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function modsNuevos(){
  const m=(id,nombre,emoji,items)=>({id,nombre,emoji,items});
  const cat=k=>TARJETAS_BASE.filter(t=>t[3]===k).map(t=>t[0]);
  return {
    ini:[
      m('m_verbos','Verbos','🗣️',['quiero','no-quiero','necesito','siento','dame','tengo','puedo','vamos','me-gusta','no-me-gusta','hacer','ver','pedir','poner','sacar','abrir','cerrar','tocar','venir','sentarme','levantarme','prestame','mostrame','llevame','ir','comer','beber','jugar','dormir','mirar','escuchar','ayudar','esperar','terminar','parar']),
      m('m_conectores','Conectores','🔗',['el','la','los','las','un','una','mi','tu','y','o','con','sin','para','en','de','al','del','a','que','porque','pero','tambien','muy','mas','menos','poco','mucho','aca','ahi','si','no']),
      m('m_preguntas','Preguntas','❓',cat('preguntas')),
      m('m_diario','Rutina diaria','🕗',['despertarme','baño','lavar','vestir','desayunar','cepillar','mochila','ir-escuela','escuela','tarea','almorzar','merendar','jugar','bañarse','ducha','cenar','pijama','dormir','siesta','terapia','pastillas','paseo','pantalla','ordenar','visita','volver-casa','comer','beber','salir']),
      m('m_pasos','Paso a paso','🧼',[...new Set(['ir','al','del','baño','abrir','cerrar','poner','lavar','hacer','sentarme','cepillar','cepillo','manos','boca','pantalon','remera','medias','zapatillas','pijama','en','con','el','la','o',...cat('pasos')])])
    ],
    fin:[
      m('m_personas','Personas','👪',cat('personas')), m('m_lugares','Lugares','🏠',cat('lugares')),
      m('m_objetos','Objetos','🧸',cat('objetos')), m('m_tiempo','Tiempo','⏰',cat('tiempo')),
      m('m_social','Saludos','🙏',cat('social'))
    ],
    fin2:[
      m('m_colores','Colores','🎨',cat('colores')),
      m('m_ropa','Ropa','👖',['remera','campera','zapatillas',...cat('ropa')]),
      m('m_animales','Animales','🐶',cat('animales')), m('m_cuerpo','Cuerpo','🖐️',cat('cuerpo')),
      m('m_escuela','Escuela','🏫',['escuela','maestra','amigo','mochila','libro','lápiz',...cat('escuela')]),
      m('m_juegos','Juegos','🧩',['pelota','juguete','bici','tablet','tele',...cat('juegos')])
    ]
  };
}
function carteraEj(){ return {ficha:'⭐',total:0,canjeados:0,premios:[{id:'p_1',nombre:'Chocolate',emoji:'🍫',costo:3},{id:'p_2',nombre:'Helado',emoji:'🍦',costo:5},{id:'p_3',nombre:'Tele 15 minutos',emoji:'📺',costo:6}]}; }
function fichaEj_viejo(){ return {id:'f_'+Math.random().toString(36).slice(2,7),nombre:'Mis estrellas',ficha:'⭐',meta:5,premio:'Mi premio',premioEmoji:'🎁',ganadas:0,premios:0}; }
function defaults(){
  const m = (id,nombre,emoji,items)=>({id,nombre,emoji,items});
  return {
    v:1, activo:'m_verbos', mods3:true, mods4:true, mods5:true, mods6:true, mods7:true,
    modulos:[...modsNuevos().ini,
      m('m_necesito','Necesito','🙋',['agua','baño','ayuda','hambre','sed','sueño','dolor','frio','calor','descanso','silencio','pañal']),
      m('m_emociones','Cómo estoy','😊',['feliz','triste','enojado','miedo','cansado','nervioso','tranquilo','aburrido','te-quiero']),
      m('m_comida','Quiero comer','🍎',['manzana','banana','pan','leche','jugo','galletitas','fideos','arroz','pollo','huevo','queso','fruta','yogur','verdura','sopa','pizza','helado','sandwich','papas']),
      m('m_acciones','Quiero hacer','🎮',['jugar','mirar','escuchar','leer','dibujar','cantar','salir','abrazar']),
      ...modsNuevos().fin, ...modsNuevos().fin2
    ],
    rutinas:[
      {id:'r_manana',nombre:'Mañana',emoji:'🌅',pasos:[['despertarme'],['ir','al','baño'],['lavar','manos'],['ponerme','ropa'],['desayunar'],['cepillar'],['mochila']]},
      {id:'r_noche',nombre:'Antes de dormir',emoji:'🌙',pasos:[['cenar'],['bañarse'],['cepillar'],['ir','al','baño'],['ponerme','pijama'],['dormir']]}
    ],
    tarjetas:[], ajustes:{voz:true, tam:'m', sonido:true},
    semana:[[],[],[],[],[],[],[]], cartera:carteraEj(), hechos:{}
  };
}
function migrar(s){
  s.v = 2;
  s.ajustes = Object.assign({voz:true, tam:'m', sonido:true}, s.ajustes||{});
  if(!Array.isArray(s.semana) || s.semana.length!==7) s.semana = [[],[],[],[],[],[],[]];
  if(!s.cartera){ // pasa de "tableros" al sistema de fichas acumuladas con premios canjeables
    const old = Array.isArray(s.fichas) ? s.fichas : [];
    s.cartera = carteraEj();
    if(old.length){
      s.cartera.ficha = old[0].ficha || '⭐';
      s.cartera.total = old.reduce((a,f)=>a+(f.ganadas||0),0);
      s.cartera.canjeados = old.reduce((a,f)=>a+(f.premios||0),0);
      s.cartera.premios = old.map((f,i)=>({id:'p_m'+i,nombre:String(f.premio||'Premio').slice(0,40),emoji:f.premioEmoji||'🎁',costo:Math.max(1,f.meta||5)}));
    }
    s.rutinas.forEach(r=>{ r.fichas = r.tablero ? 1 : (r.fichas==null?1:r.fichas); delete r.tablero; });
    s.semana.forEach(d=>d.forEach(it=>{ if(it.tablero){ it.fichas = 1; } delete it.tablero; }));
  }
  delete s.fichas;
  s.rutinas.forEach(r=>{ if(r.fichas==null) r.fichas = 1; r.pasos = (r.pasos||[]).map(p=>typeof p==='string' ? (OLD2NEW[p]||[p]) : p); });
  if(!Array.isArray(s.favs)) s.favs = [];
  if(!Array.isArray(s.hist)) s.hist = [];
  if(!s.hechos || typeof s.hechos!=='object') s.hechos = {};
  if(!s.rutinas) s.rutinas = [];
  if(!s.tarjetas) s.tarjetas = [];
  if(!s.mods3){ // pestañas nuevas para quienes ya tenían datos: se suman sin tocar las propias
    const n = modsNuevos(), ya = id=>s.modulos.some(m=>m.id===id);
    s.modulos = n.ini.filter(m=>!ya(m.id)).concat(s.modulos, n.fin.filter(m=>!ya(m.id)));
    s.mods3 = true;
  }
  if(!s.mods5){
    if(!s.modulos.some(m=>m.id==='m_diario')){
      const d = modsNuevos().ini.find(m=>m.id==='m_diario'); const k = s.modulos.findIndex(m=>m.id==='m_preguntas');
      s.modulos.splice(k>=0?k+1:0, 0, d);
    }
    s.mods5 = true;
  }
  if(!s.mods6){
    if(!s.modulos.some(m=>m.id==='m_pasos')){
      const d = modsNuevos().ini.find(m=>m.id==='m_pasos'); const k = s.modulos.findIndex(m=>m.id==='m_diario');
      s.modulos.splice(k>=0?k+1:0, 0, d);
    }
    s.mods6 = true;
  }
  if(!s.mods7){
    const mp = s.modulos.find(x=>x.id==='m_pasos'); if(mp) mp.items = modsNuevos().ini.find(x=>x.id==='m_pasos').items;
    s.mods7 = true;
  }
  if(!s.mods4){
    const ya4 = id=>s.modulos.some(m=>m.id===id);
    s.modulos = s.modulos.concat(modsNuevos().fin2.filter(m=>!ya4(m.id)));
    s.mods4 = true;
  }
  if(!s.modulos.some(m=>m.id===s.activo) && s.activo!=='_favs' && s.activo!=='_hist') s.activo = (s.modulos[0]||{}).id || '';
  return s;
}
function cargar(){
  try{ const s = JSON.parse(localStorage.getItem(KEY)||'null'); if(s && s.modulos) return migrar(s); }catch(e){}
  return migrar(defaults());
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
let curAudio=null;
function hablarIds(ids){
  ids=(ids||[]).filter(i=>tarjeta(i));
  if(!ids.some(i=>tarjeta(i).audio)) return hablar(ids.map(i=>tarjeta(i).etiqueta).join(' '));
  if(!S.ajustes.voz) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  if(curAudio){ try{curAudio.pause();}catch(e){} }
  let k=0; const sig=()=>{
    if(k>=ids.length) return; const t=tarjeta(ids[k++]);
    if(t.audio){ const a=curAudio=new Audio(t.audio); a.onended=sig; a.onerror=sig; a.play().catch(sig); }
    else if(window.speechSynthesis){ try{ const u=new SpeechSynthesisUtterance(t.etiqueta); u.lang='es-AR'; u.rate=.9; u.onend=sig; u.onerror=sig; speechSynthesis.speak(u); }catch(e){ sig(); } }
    else sig();
  }; sig();
}
let rec=null;
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

function usar(id){ S.hist = [id].concat(S.hist.filter(x=>x!==id)).slice(0,30); guardar(); }
function pestanas(mias){
  const l = [{id:'_favs',nombre:'Favoritos',emoji:'⭐',items:S.favs,virtual:true},{id:'_hist',nombre:'Historial',emoji:'🕘',items:S.hist,virtual:true}].concat(S.modulos);
  if(mias && S.tarjetas.length) l.push({id:'_mias',nombre:'Mis tarjetas',emoji:'✨',items:S.tarjetas.map(t=>t.id),virtual:true});
  return l;
}
function favBtn(id){ return `<span class="fav" data-act="fav" data-id="${esc(id)}">${S.favs.includes(id)?'★':'☆'}</span>`; }
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
let V = {n:'home'}, edit = false, frase = [], playing = null, cele = null, subRut = 'sem', sheet = null, W = {ref:null,tipo:'c',hora:'',dias:[]}, SQ = {nombre:'',pasos:[],cur:[],at:null,fichas:1,edit:null};
function ir(n, p){ sheet = null; V = Object.assign({n}, p||{}); render(); window.scrollTo(0,0); }
function porId(lista, id){ return lista.find(x=>x.id===id); }

/* ---- vistas ---- */
function cab(titulo, izq, der){
  return `<div class="top">${izq||''}<h1>${titulo}</h1>${der||''}</div>`;
}
function backBtn(a){ return `<button data-act="${a||'home'}">‹</button>`; }

function vHome(){
  const act = S.activo, tabs = pestanas(false);
  const chips = tabs.map(m=>`<button class="chip ${act===m.id?'sel':''}" data-act="mod" data-id="${m.id}">${esc(m.emoji)} ${esc(m.nombre)}</button>`).join('')
    + (edit ? `<button class="chip add" data-act="newmod">➕ Módulo</button>` : '');
  const tira = frase.length ? frase.map(miniHtml).join('') : '<span class="vvacia">Tocá las tarjetas para armar una frase</span>'.replace('vvacia','vacia');
  const m = tabs.find(x=>x.id===act) || tabs[2];
  let cuerpo = '';
  if(!m){ cuerpo = '<div class="vacio">No hay pestañas.</div>'; }
  else{
    const items = m.items.filter(id=>tarjeta(id));
    if(items.length) cuerpo = `<div class="grid">${items.map(id=>cardHtml(id, edit?favBtn(id):'')).join('')}</div>`;
    else if(m.id==='_favs') cuerpo = '<div class="vacio">Acá van tus tarjetas favoritas.<br>Activá ✏️, entrá a cualquier pestaña y tocá la ☆ de las que quieras tener a mano.</div>';
    else if(m.id==='_hist') cuerpo = '<div class="vacio">Acá aparecen las últimas tarjetas que se usaron, la más reciente primero.</div>';
    else cuerpo = '<div class="vacio">Este módulo está vacío. Activá ✏️ y agregá tarjetas.</div>';
    if(edit && !m.virtual) cuerpo += `<div class="page"><button class="btn" data-act="emod" data-id="${m.id}">✏️ Editar “${esc(m.nombre)}” (orden, tarjetas, nombre)</button></div>`;
    if(edit && m.id==='_hist' && items.length) cuerpo += `<div class="page"><button class="btn del" data-act="clrhist">🗑️ Borrar el historial</button></div>`;
  }
  return cab('💬 Ecos','',topBtns())
    + `<div class="frase"><div class="tira">${tira}</div><button class="fbtn" data-act="back1" aria-label="Borrar última">⌫</button><button class="fbtn say" data-act="speak" aria-label="Hablar">🔊</button></div>`
    + `<div class="chips">${chips}</div>` + cuerpo;
}
function topBtns(){ return `<button class="${edit?'on':''}" data-act="toggleEdit" aria-label="Editar">✏️</button><button data-act="aj" aria-label="Ajustes">⚙️</button>`; }
function nav(){
  const n = V.n;
  return `<nav class="nav3">${[['home','💬','Hablar'],['rut','🔁','Rutinas'],['fic','⭐','Fichas']].map(([k,e,t])=>`<button class="${n===k?'sel':''} " data-act="go" data-k="${k}"><span>${e}</span>${t}</button>`).join('')}</nav>`;
}

/* ---- Rutinas: semana + lista ---- */
function itemInfo(it){
  if(it.tipo==='r'){ const r=porId(S.rutinas,it.ref); return r?{e:r.emoji,t:r.nombre,sub:r.pasos.length+' pasos'}:null; }
  const t=tarjeta(it.ref); return t?{e:t.foto?`<img src="${t.foto}" alt="">`:esc(t.emoji),t:t.etiqueta,sub:''}:null;
}
function fichasDe(it){
  if(typeof it.fichas==='number') return it.fichas;
  if(it.tipo==='r'){ const r=porId(S.rutinas,it.ref); return r&&typeof r.fichas==='number' ? r.fichas : 1; }
  return 0;
}
function ordenarDia(i){
  const k = x=>x.hora||'99:99';
  S.semana[i] = S.semana[i].map((x,j)=>[x,j]).sort((a,b)=>k(a[0])<k(b[0])?-1:k(a[0])>k(b[0])?1:a[1]-b[1]).map(x=>x[0]);
}
function fh(h){ return h ? h.replace(/^0/,'') : ''; }

/* ---- Mi día: pantalla principal de Rutinas ---- */
function vRut(){
  const hoy = hoyIdx(), di = V.dia==null ? hoy : V.dia, esHoy = di===hoy;
  const items = S.semana[di].filter(it=>itemInfo(it)), hechos = hechosHoy();
  const sig = esHoy ? items.find(it=>!hechos.includes(it.id)) : null;
  const hechosN = esHoy ? items.filter(it=>hechos.includes(it.id)).length : 0;
  const tabs = DIAS.map((n,i)=>`<button class="dtab ${i===di?'sel':''} ${i===hoy?'hoy':''}" data-act="dia" data-i="${i}">${n}</button>`).join('');
  const fecha = new Date();
  const titulo = esHoy ? `Hoy · ${DIAS_L[di]} ${fecha.getDate()}` : DIAS_L[di];
  const intro = S.ajustes.introRut===false ? '' : `<div class="intro"><b>Así de fácil:</b><ol><li>Tocá <b>➕ Agregar</b> y elegí qué hace en el día.</li><li>Cuando lo haga, <b>tocá la actividad</b>: se pone verde ✓.</li><li>¡Gana fichas y premios! ⭐</li></ol><button class="btn pri" data-act="introok" style="text-align:center">Entendido</button></div>`;
  const prog = esHoy && items.length ? `<div class="prog"><div style="width:${Math.round(hechosN*100/items.length)}%"></div><span>${hechosN} de ${items.length} hechos</span></div>` : '';
  const filas = items.map(it=>{
    const inf = itemInfo(it), done = esHoy && hechos.includes(it.id), esSeq = it.tipo==='r', nf = fichasDe(it);
    return `<div class="rw ${done?'done':''} ${sig&&sig.id===it.id?'next':''}">
      <button class="rmain" data-act="ropen" data-id="${it.id}" data-d="${di}">
        <span class="rhora">${esc(fh(it.hora))}</span><span class="re">${inf.e}</span>
        <span class="rt">${esc(inf.t)}<small>${sig&&sig.id===it.id?'👉 Ahora':''}${esSeq?(sig&&sig.id===it.id?' · ':'')+inf.sub+' (paso a paso)':''}${nf?(sig&&sig.id===it.id||esSeq?' · ':'')+'gana '+(nf>1?nf+' ':'')+esc(S.cartera.ficha):''}</small></span>
        <span class="rchk ${done?'on':''}">${done?'✓':(esSeq&&esHoy?'▶':'')}</span></button>
      <button class="rmore" data-act="rmore" data-id="${it.id}" data-d="${di}" aria-label="Opciones">⋯</button></div>`;
  }).join('');
  const vacio = !items.length ? `<div class="vacio" style="padding:18px 10px">Este día está libre.<br>Tocá el botón de abajo para armarlo.</div>` : '';
  return cab('🔁 Mi día','',`<button data-act="aj" aria-label="Ajustes">⚙️</button>`)
    + `<div class="dtabs">${tabs}</div>
    <div class="page"><div class="dtit">${titulo}</div>${intro}${prog}${filas}${vacio}
      <button class="btn pri gran" style="text-align:center" data-act="addgo">➕ Agregar algo a ${esHoy?'hoy':'este día'}</button>
      ${items.length?`<button class="btn" style="text-align:center" data-act="cpsheet" data-d="${di}">📋 Copiar este día a otros días</button>`:''}</div>`;
}

/* ---- elegir tarjetas SIN buscador: siempre por pestañas ---- */
function tabsPick(act){
  const mods = pestanas(true);
  const tab = V.tab || (S.favs.length ? '_favs' : (S.modulos[0]||{}).id);
  const chips = mods.map(m=>`<button class="chip ${tab===m.id?'sel':''}" data-act="${act}" data-id="${m.id}">${esc(m.emoji)} ${esc(m.nombre)}</button>`).join('');
  const m = mods.find(x=>x.id===tab) || mods[2];
  return {tab, html:`<div class="chips">${chips}</div>`, items: m ? m.items.filter(id=>tarjeta(id)) : []};
}
const PLANTILLAS = [
  {n:'Lavarse los dientes',e:'🪥',p:[['ir','al','baño'],['agarrar','pasta-dental'],['abrir','pasta-dental'],['agarrar','cepillo'],['poner','pasta-dental','en','cepillo'],['cepillar','un-minuto'],['abrir','canilla'],['enjuagar','boca'],['lavar','cepillo'],['guardar','cepillo'],['tapar','pasta-dental'],['guardar','pasta-dental'],['lavar','boca'],['cerrar','canilla'],['secar','boca']]},
  {n:'Lavarse las manos',e:'🧼',p:[['abrir','canilla'],['mojar','manos'],['poner','jabon'],['frotar','manos'],['enjuagar','manos'],['cerrar','canilla'],['secar','manos']]},
  {n:'Ir al baño',e:'🚽',p:[['ir','al','baño'],['bajar','pantalon'],['sentarme','en','inodoro'],['hacer','pipi','o','caca'],['limpiarme'],['subir','pantalon'],['tirar','cadena'],['abrir','canilla'],['poner','jabon'],['frotar','manos'],['enjuagar','manos'],['cerrar','canilla'],['secar','manos']]},
  {n:'Vestirse',e:'👕',p:[['sacarme','pijama'],['ponerme','remera'],['ponerme','pantalon'],['ponerme','medias'],['ponerme','zapatillas']]},
  {n:'Bañarse',e:'🛁',p:[['sacarme','ropa'],['abrir','canilla'],['mojarme'],['poner','shampoo'],['poner','jabon'],['enjuagarme'],['cerrar','canilla'],['secarme','con','toalla'],['ponerme','pantalon']]}
];
function vAdd1(){
  const t = tabsPick('ptab');
  const rut = S.rutinas.length ? `<div class="box"><h2>🔁 Rutinas paso a paso</h2>${S.rutinas.map(r=>`<button class="btn" data-act="pickr" data-id="${r.id}">${esc(r.emoji)} ${esc(r.nombre)} <small style="color:var(--muted)">· ${r.pasos.length} pasos</small></button>`).join('')}</div>` : '';
  const tpl = `<div class="box"><h2>✨ Rutinas listas para usar</h2><p>Ya vienen armadas paso a paso. Tocá una para usarla.</p>${PLANTILLAS.map((t,i)=>`<button class="btn" data-act="tpl" data-i="${i}">${t.e} ${esc(t.n)} <small style="color:var(--muted)">· ${t.p.length} pasos</small></button>`).join('')}</div>`;
  return cab('Paso 1 de 3', backBtn('rutback'))
    + `<div class="page"><div class="paso">¿Qué va a hacer?</div><p class="ayuda">Elegí una tarjeta de las pestañas, como en Hablar.</p></div>`
    + t.html
    + `<div class="grid">${t.items.map(id=>{ const c=tarjeta(id); return c?`<button class="card" style="--c:${color(c)}" data-act="pickc" data-id="${esc(id)}">${imHtml(c)}<span class="lb">${esc(c.etiqueta)}</span></button>`:''; }).join('')}</div>`
    + `<div class="page">${rut}${tpl}<button class="btn pri" style="text-align:center" data-act="newseq">🔁 Armar una rutina paso a paso</button></div>`;
}
function selInfo(){ return itemInfo({tipo:W.tipo,ref:W.ref}) || {e:'',t:''}; }
function vAdd2(){
  const inf = selInfo();
  const horas = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  return cab('Paso 2 de 3', backBtn('go:add1'))
    + `<div class="page"><div class="sel1"><span>${inf.e}</span><b>${esc(inf.t)}</b></div><div class="paso">¿A qué hora?</div>
      <div class="horas">${horas.map(h=>`<button class="${W.hora===h?'sel':''}" data-act="hora" data-h="${h}">${fh(h)}</button>`).join('')}</div>
      <button class="btn" style="text-align:center" data-act="hora" data-h="">🕒 Sin hora</button>
      <div class="box"><h2>Otra hora</h2><div class="row"><input type="time" value="${esc(W.hora||'')}" data-in="whora2"><button class="btn sm" style="margin:0;width:auto" data-act="hora2">Siguiente ›</button></div></div></div>`;
}
function vAdd3(){
  const inf = selInfo(), d = W.dias;
  const chips = DIAS.map((n,i)=>`<button class="${d.includes(i)?'sel':''}" data-act="wd" data-i="${i}">${n}</button>`).join('');
  return cab('Paso 3 de 3', backBtn('go:add2'))
    + `<div class="page"><div class="sel1"><span>${inf.e}</span><b>${esc(inf.t)}</b>${W.hora?`<i>${fh(W.hora)}</i>`:''}</div><div class="paso">¿Qué días?</div>
      <div class="dias7">${chips}</div>
      <div class="row"><button class="btn" style="text-align:center" data-act="dpre" data-k="todos">Todos los días</button><button class="btn" style="text-align:center" data-act="dpre" data-k="lav">Lunes a viernes</button></div>
      <button class="btn pri gran" style="text-align:center" data-act="addsave">✅ Guardar</button></div>`;
}
/* rutina paso a paso (armada con tarjetas de las pestañas) */
function stepHtml(p){
  return paso(p).map(id=>{ const t=tarjeta(id); return t?`<span class="sc">${t.foto?`<img src="${t.foto}" alt="">`:esc(t.emoji)}<i>${esc(t.etiqueta)}</i></span>`:''; }).join('<em>+</em>');
}
function vSeq(){
  const t = tabsPick('ptab'), c = S.cartera;
  const pasos = SQ.pasos.map((p,i)=>`<div class="sqr"><b>${i+1}</b><div class="sqs2">${stepHtml(p)}</div>
    <button data-act="sqedit" data-i="${i}" aria-label="Editar paso">✏️</button><button data-act="squp" data-i="${i}" ${i===0?'disabled':''}>▲</button><button data-act="sqdown" data-i="${i}" ${i===SQ.pasos.length-1?'disabled':''}>▼</button><button data-act="sqrm" data-i="${i}">✕</button></div>`).join('');
  const cur = `<div class="box curbox"><h2>${SQ.at!=null?'Editando el paso '+(SQ.at+1):'Armando el paso '+(SQ.pasos.length+1)}</h2><p>Tocá las tarjetas de abajo en orden, como una frase. Ej.: <b>IR + AL + BAÑO</b>. Para sacar una, tocala acá.</p>
    <div class="sqcur">${SQ.cur.length?SQ.cur.map((id,i)=>{ const k=tarjeta(id); return k?`<button class="sc" data-act="curx" data-i="${i}">${k.foto?`<img src="${k.foto}" alt="">`:esc(k.emoji)}<i>${esc(k.etiqueta)}</i></button>`:''; }).join('<em>+</em>'):'<span class="vacia">Todavía no elegiste tarjetas</span>'}</div>
    ${SQ.cur.length?`<div class="fraseprev">“${esc(pasoTexto(SQ.cur))}”</div>`:''}
    <button class="btn pri" style="text-align:center" data-act="sqstep" ${SQ.cur.length?'':'disabled'}>✅ Listo este paso</button></div>`;
  const edicion = SQ.edit ? `<div class="page"><div class="box"><button class="btn" data-act="exprut" data-id="${SQ.edit}">📤 Exportar esta rutina</button><button class="btn del" data-act="delrut" data-id="${SQ.edit}">🗑️ Eliminar esta rutina</button></div></div>` : '';
  const total = SQ.pasos.length + (SQ.cur.length?1:0);
  return cab(SQ.edit?'Editar rutina':'Rutina paso a paso', backBtn(SQ.edit?'go:rut':'go:add1'))
    + `<div class="page"><div class="box"><h2>Nombre</h2><input type="text" maxlength="30" placeholder="Ej.: Lavarse los dientes" value="${esc(SQ.nombre)}" data-in="sqn"></div>
      <div class="box"><h2>${esc(c.ficha)} Fichas que gana al terminarla</h2><div class="dias7" style="grid-template-columns:repeat(4,1fr)">${[0,1,2,3].map(n=>`<button class="${SQ.fichas===n?'sel':''}" data-act="sqf" data-n="${n}">${n}</button>`).join('')}</div></div>
      ${pasos?`<div class="box"><h2>Pasos armados</h2><div class="sqlist">${pasos}</div></div>`:''}${cur}</div>`
    + t.html
    + `<div class="grid">${t.items.map(id=>{ const k=tarjeta(id); return k?`<button class="card" style="--c:${color(k)}" data-act="sqadd" data-id="${esc(id)}">${imHtml(k)}<span class="lb">${esc(k.etiqueta)}</span></button>`:''; }).join('')}</div>
      <div class="page"><button class="btn" style="text-align:center" data-act="sqncard">➕ Crear una tarjeta propia (con foto)</button></div>${edicion}
      <div class="foot"><button class="btn pri gran" style="text-align:center" data-act="sqdone">${SQ.edit?'Guardar cambios':'Guardar rutina'} · ${total} ${total===1?'paso':'pasos'} ›</button></div>`;
}
function vSheet(){
  if(!sheet) return '';
  if(sheet.tipo==='copy'){
    const di = sheet.d;
    return `<div class="sbk" data-act="sheetx"></div><div class="sheet"><h2>📋 Copiar el ${DIAS_L[di].toLowerCase()} a…</h2><p>Se copia todo lo del día. Reemplaza lo que ya haya en los días elegidos.</p>
      <div class="dias7">${DIAS.map((n,i)=>i===di?'':`<button class="${sheet.cp.includes(i)?'sel':''}" data-act="cpt" data-i="${i}">${n}</button>`).join('')}</div>
      <button class="btn pri gran" style="text-align:center" data-act="cpgo">📋 Copiar</button><button class="btn" style="text-align:center" data-act="sheetx">Cancelar</button></div>`;
  }
  const it = S.semana[sheet.d].find(x=>x.id===sheet.id); const inf = it && itemInfo(it); if(!inf){ sheet=null; return ''; }
  return `<div class="sbk" data-act="sheetx"></div><div class="sheet"><h2>${inf.e.startsWith('<')?'':inf.e} ${esc(inf.t)}</h2>
    <label class="lbl">🕒 Hora</label><div class="row"><input type="time" value="${esc(it.hora||'')}" data-in="whora" data-id="${it.id}" data-d="${sheet.d}"><button class="btn sm" style="margin:0;width:auto" data-act="whora0">Sin hora</button></div>
    <label class="lbl">${esc(S.cartera.ficha)} Fichas que gana al hacerlo</label><div class="dias7" style="grid-template-columns:repeat(4,1fr)">${[0,1,2,3].map(n=>`<button class="${fichasDe(it)===n?'sel':''}" data-act="wfn" data-id="${it.id}" data-d="${sheet.d}" data-n="${n}">${n}</button>`).join('')}</div>
    ${it.tipo==='r'?`<button class="btn" data-act="erut" data-id="${it.ref}">✏️ Cambiar los pasos de la rutina</button>`:''}
    <button class="btn del" data-act="wrm2" data-id="${it.id}" data-d="${sheet.d}">🗑️ Sacar de este día</button>
    <button class="btn pri" style="text-align:center" data-act="sheetx">Listo</button></div>`;
}

function completar(it, esRut){
  const inf = itemInfo(it) || {t:''}, n = fichasDe(it);
  if(n>0){ dar(n, (esRut?'Terminó: ':'Hizo: ')+inf.t); return; }
  const todos = S.semana[hoyIdx()].filter(x=>itemInfo(x));
  if(todos.length && todos.every(x=>hechosHoy().includes(x.id))) celebrar('ok','¡Día completo!','Hizo todo lo de hoy','🌟','¡Día completo! Muy bien');
  else if(esRut) celebrar('ok','¡Muy bien!','Terminamos: '+inf.t,'🎉','¡Muy bien! Terminamos');
  else { tono('ok'); hablar('¡Muy bien!'); render(); }
}
/* ---- Fichas: se juntan y se canjean por premios ---- */
const EMOJIS_FICHA = ['⭐','🌟','🏅','🍀','❤️','🚀','🐶','🧩','🍎','🐸','🦄','⚽'];
const EMOJIS_PREMIO = ['🍫','🍦','📺','🎮','🍕','🎈','⚽','🧸','🎡','📱','🏊','🍿','🎁','🍪','🚲','🎬'];
function vFic(){
  const c = S.cartera, t = c.total;
  const monedas = Array.from({length:Math.min(t,24)},()=>`<span>${esc(c.ficha)}</span>`).join('') + (t>24?`<b class="mas">+${t-24}</b>`:'');
  const premios = c.premios.slice().sort((a,b)=>a.costo-b.costo).map(p=>{
    const ok = t>=p.costo, pct = Math.min(100,Math.round(t*100/p.costo));
    return `<div class="pre ${ok?'ok':''}"><div class="pe">${esc(p.emoji)}</div>
      <div class="pt"><b>${esc(p.nombre)}</b><div class="pbar"><div style="width:${pct}%"></div></div><small>Cuesta ${p.costo} ${esc(c.ficha)} · ${ok?'¡Ya alcanza!':'faltan '+(p.costo-t)}</small></div>
      ${edit?`<button class="btn sm" style="margin:0;width:auto" data-act="epre" data-id="${p.id}">✏️</button>`
            :(ok?`<button class="btn pri" style="margin:0;width:auto;text-align:center" data-act="canjear" data-id="${p.id}">🎁 Canjear</button>`:`<span class="falta">${p.costo-t}</span>`)}</div>`;
  }).join('');
  return cab('⭐ Fichas','',topBtns())
    + `<div class="page"><div class="cartera"><div class="ct">Mis fichas</div><div class="cn">${t}</div><div class="monedas">${monedas||'<span class="vacia">Todavía no tiene fichas</span>'}</div></div>
    <div class="box"><p style="margin:0">Cada rutina o actividad que termina suma fichas. Cuando junta las necesarias, ¡las canjea por un premio!</p></div>
    <div class="paso" style="font-size:1.25rem">🎁 Premios</div>
    ${premios||'<div class="vacio">Todavía no hay premios. Activá ✏️ y agregá los que quieras.</div>'}
    ${edit?`<button class="btn pri" style="text-align:center" data-act="newpre">➕ Agregar un premio</button>
      <div class="box"><h2>Ficha</h2>${emojiPicker(c.ficha,'fichaemoji','c',EMOJIS_FICHA)}</div>
      <div class="box"><h2>Ajustar fichas a mano</h2><div class="row"><button class="btn" style="text-align:center;margin:0" data-act="menos1">− 1</button><button class="btn" style="text-align:center;margin:0" data-act="mas1">+ 1</button></div></div>`
      :`<button class="btn" style="text-align:center" data-act="mas1x">${esc(c.ficha)} Dar 1 ficha por otra cosa</button>`}
    ${c.canjeados?`<p style="text-align:center;color:var(--muted);font-weight:600">Premios canjeados: ${c.canjeados} 🏆</p>`:''}</div>`;
}
function vEPre(){
  const p = porId(S.cartera.premios, V.id); if(!p) return vFic();
  return cab('Editar premio', backBtn('go:fic'))
    + `<div class="page"><div class="box"><h2>¿Qué es el premio?</h2><p>Ej.: “Chocolate”, “Ver la tele 20 minutos”, “Salir a la plaza”.</p><input type="text" maxlength="40" value="${esc(p.nombre)}" data-in="pnom" data-id="${p.id}">
      <h2 style="margin-top:12px">Ícono</h2>${emojiPicker(p.emoji,'premoji',p.id,EMOJIS_PREMIO)}</div>
      <div class="box"><h2>¿Cuántas fichas cuesta?</h2><div class="row" style="margin-top:8px"><button class="btn" style="text-align:center;margin:0" data-act="pcdec" data-id="${p.id}">−</button><div style="text-align:center;font-size:1.8rem;font-weight:700;flex:none;width:80px">${p.costo}</div><button class="btn" style="text-align:center;margin:0" data-act="pcinc" data-id="${p.id}">+</button></div></div>
      <div class="box"><button class="btn del" data-act="delpre" data-id="${p.id}">🗑️ Eliminar premio</button></div></div>`;
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

function dar(n, motivo){
  const c = S.cartera, antes = c.total; c.total += n; guardar();
  const nuevo = c.premios.filter(p=>p.costo<=c.total && p.costo>antes).sort((x,y)=>y.costo-x.costo)[0];
  const sub = (motivo?motivo+' · ':'')+'Tenés '+c.total+' '+c.ficha + (nuevo?' · ¡Ya alcanza para '+nuevo.emoji+' '+nuevo.nombre+'!':'');
  celebrar('ficha', n>1?'¡Ganó '+n+' fichas!':'¡Ganó una ficha!', sub, c.ficha, '¡Muy bien! Ganaste '+(n>1?n+' fichas':'una ficha')+(nuevo?'. Ya podés canjear '+nuevo.nombre:''));
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
      <h2 style="margin-top:12px">Sonido / nombre</h2><p>Grabá la voz con el micrófono (hasta 6 segundos). Si no grabás, la app lo lee con voz automática.</p>
      <button class="btn ${rec?'del':''}" data-act="mic">${rec?'⏹️ Parar la grabación':(c.audio?'🎙️ Grabar de nuevo':'🎙️ Grabar con el micrófono')}</button>
      ${c.audio?`<div style="text-align:center;margin-top:8px"><button class="btn" data-act="oir">▶️ Escuchar</button><button class="btn del" data-act="noaudio">Quitar sonido</button></div>`:''}
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
  const ids = paso(r.pasos[playing.i]).filter(i=>tarjeta(i)); const fin = playing.i >= r.pasos.length-1;
  const tiles = ids.map((id,k)=>{ const t=tarjeta(id); return (k?'<span class="plus">+</span>':'')+`<div class="pc">${t.foto?`<img src="${t.foto}" alt="">`:`<div class="pe2">${esc(t.emoji)}</div>`}<div class="pl">${esc(t.etiqueta)}</div></div>`; }).join('');
  return `<div class="play"><button class="x" data-act="stopPlay">✕</button>
    <div class="pro">${esc(r.nombre)} · paso ${playing.i+1} de ${r.pasos.length}</div>
    <div class="pcards n${Math.min(ids.length,5)}">${tiles}</div>
    <div class="nm">${esc(pasoTexto(r.pasos[playing.i]))}</div>
    <div class="nav"><button data-act="pprev" ${playing.i===0?'disabled':''}>‹ Antes</button><button data-act="pspeak">🔊</button><button class="go" data-act="pnext">${fin?'¡Listo! ✓':'Siguiente ›'}</button></div></div>`;
}

function render(){
  const app = document.getElementById('app');
  document.documentElement.style.setProperty('--card-size', ({s:'86px',m:'104px',l:'132px'})[S.ajustes.tam] || '104px');
  const vistas = {home:vHome, rut:vRut, add1:vAdd1, add2:vAdd2, add3:vAdd3, seq:vSeq, fic:vFic, epre:vEPre, emod:vEditMod, pick:vPick, ncard:vNCard, aj:vAj};
  app.innerHTML = (vistas[V.n]||vHome)() + (['home','rut','fic'].includes(V.n) && !playing ? nav() : '') + (playing ? vPlay() : '') + vSheet() + vCele();
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
  tap(d){ frase.push(d.id); usar(d.id); const t=tarjeta(d.id); hablarIds([d.id]); render(); },
  fav(d){ const i=S.favs.indexOf(d.id); if(i>=0) S.favs.splice(i,1); else S.favs.push(d.id); guardar(); const y=window.scrollY; render(); window.scrollTo(0,y); },
  clrhist(){ if(!confirm('¿Borrar el historial?')) return; S.hist=[]; guardar(); render(); },
  back1(){ frase.pop(); render(); },
  speak(){ if(!frase.length){ toast('Primero tocá algunas tarjetas'); return; } hablarIds(frase); },
  newmod(){ const m={id:uid('m_'),nombre:'Nuevo módulo',emoji:'⭐',items:[]}; S.modulos.push(m); S.activo=m.id; guardar(); ir('emod',{id:m.id}); },
  newrut(){ const r={id:uid('r_'),nombre:'Nueva rutina',emoji:'🔁',pasos:[]}; S.rutinas.push(r); guardar(); ir('erut',{id:r.id}); },
  go(d){ ir(d.k); },
  emod(d){ ir('emod',{id:d.id}); },
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
  delrut(d){ if(!confirm('¿Eliminar esta rutina?')) return; S.rutinas=S.rutinas.filter(r=>r.id!==d.id); S.semana=S.semana.map(dia=>dia.filter(it=>!(it.tipo==='r'&&it.ref===d.id))); guardar(); ir('rut'); },
  ncard(){ ir('ncard',{ret:{t:V.t,id:V.id}}); },
  foto(){ document.getElementById('fotoIn').click(); },
  nofoto(){ V.c.foto=''; render(); },
  oir(){ if(V.c.audio){ try{ new Audio(V.c.audio).play(); }catch(e){} } },
  noaudio(){ delete V.c.audio; render(); },
  async mic(){
    if(rec){ rec.stop(); return; }
    if(!navigator.mediaDevices||!window.MediaRecorder){ toast('Este navegador no permite grabar'); return; }
    try{
      const st = await navigator.mediaDevices.getUserMedia({audio:true}); const ch=[];
      const r = new MediaRecorder(st); rec = r;
      r.ondataavailable = e=>{ if(e.data.size) ch.push(e.data); };
      r.onstop = ()=>{ st.getTracks().forEach(t=>t.stop()); clearTimeout(tm); rec=null;
        const fr=new FileReader(); fr.onload=()=>{ V.c.audio=fr.result; render(); }; fr.readAsDataURL(new Blob(ch,{type:r.mimeType||'audio/webm'})); };
      const tm=setTimeout(()=>{ if(rec) rec.stop(); },6000);
      r.start(); render(); toast('Grabando… hablá ahora');
    }catch(e){ rec=null; toast('No se pudo usar el micrófono (revisá el permiso)'); }
  },
  saveCard(){
    const c = V.c; if(!c.etiqueta.trim()){ toast('Escribí qué dice la tarjeta'); return; }
    const t = {id:uid('c_'), etiqueta:c.etiqueta.trim(), emoji:(c.emoji||'⭐').trim()||'⭐', foto:c.foto||'', cat:c.cat};
    if(!t.foto) delete t.foto; if(c.audio) t.audio=c.audio;
    S.tarjetas.push(t);
    if(V.ret.t==='sq'){ SQ.cur.push(t.id); guardar(); toast('Tarjeta creada y agregada'); ir('seq'); return; }
    const l = lista(V.ret.t,V.ret.id); if(l) l.push(t.id);
    guardar(); toast('Tarjeta creada y agregada'); ir('pick',{t:V.ret.t,id:V.ret.id,q:''});
  },
  togvoz(){ S.ajustes.voz=!S.ajustes.voz; guardar(); render(); },
  tam(d){ S.ajustes.tam=d.k; guardar(); render(); },
  play(d){ playing={id:d.id,i:0,w:d.w||null}; render(); const r=porId(S.rutinas,d.id); hablarIds(paso(r.pasos[0])); },
  stopPlay(){ playing=null; render(); },
  pprev(){ if(playing.i>0){ playing.i--; render(); ACC.pspeak(); } },
  pnext(){ const r=porId(S.rutinas,playing.id); if(playing.i>=r.pasos.length-1){ const w=playing.w; playing=null; if(w) marcar(w,true); const itw=w&&S.semana[hoyIdx()].find(x=>x.id===w); if(itw) completar(itw,true); else { const n=typeof r.fichas==='number'?r.fichas:1; if(n>0) dar(n,'Terminó: '+r.nombre); else celebrar('ok','¡Muy bien!','Terminamos: '+r.nombre,'🎉','¡Muy bien! Terminamos'); } } else { playing.i++; render(); ACC.pspeak(); } },
  pspeak(){ const r=porId(S.rutinas,playing.id); hablarIds(paso(r.pasos[playing.i])); },
  expmod(d){ const m=porId(S.modulos,d.id); descargar({tipo:'ecos_modulo_v1',modulo:{nombre:m.nombre,emoji:m.emoji,items:m.items},tarjetas:usadas(m.items)},`ecos-modulo-${slug(m.nombre)}.json`); },
  exprut(d){ const r=porId(S.rutinas,d.id); descargar({tipo:'ecos_rutina_v1',rutina:{nombre:r.nombre,emoji:r.emoji,pasos:r.pasos},tarjetas:usadas([].concat(...r.pasos.map(paso)))},`ecos-rutina-${slug(r.nombre)}.json`); },
  expall(){ descargar({tipo:'ecos_respaldo_v1',generado:new Date().toISOString(),datos:S},`ecos-respaldo-${new Date().toISOString().slice(0,10)}.json`); },
  imp(){ document.getElementById('impIn').click(); },
  togson(){ S.ajustes.sonido = S.ajustes.sonido===false; guardar(); render(); if(S.ajustes.sonido) tono('ok'); },
  celeok(){ cele=null; clearTimeout(celebrar._t); render(); },
  /* mi día */
  dia(d){ V.dia=+d.i; render(); },
  introok(){ S.ajustes.introRut=false; guardar(); render(); },
  ropen(d){
    const di=+d.d, it=S.semana[di].find(x=>x.id===d.id); if(!it) return; const inf=itemInfo(it); if(!inf) return;
    if(di!==hoyIdx()){ hablar(inf.t); toast('Se tilda el mismo día 😊'); return; }
    const done = hechosHoy().includes(it.id);
    if(it.tipo==='r' && !done){ const r=porId(S.rutinas,it.ref); if(!r||!r.pasos.length){ toast('Esta rutina todavía no tiene pasos'); return; } ACC.play({id:r.id,w:it.id}); return; }
    if(done){ marcar(it.id,false); render(); return; }
    marcar(it.id,true); completar(it,false);
  },
  rmore(d){ sheet={tipo:'item',d:+d.d,id:d.id}; render(); },
  cpsheet(d){ sheet={tipo:'copy',d:+d.d,cp:[]}; render(); },
  cpt(d){ const c=sheet.cp, i=c.indexOf(+d.i); if(i>=0) c.splice(i,1); else c.push(+d.i); render(); },
  cpgo(){ if(!sheet.cp.length){ toast('Elegí a qué días'); return; } const o=S.semana[sheet.d]; sheet.cp.forEach(j=>{ S.semana[j]=o.map(it=>Object.assign({},it,{id:uid('w_')})); }); const n=sheet.cp.length; sheet=null; guardar(); toast('Copiado a '+n+(n===1?' día':' días')+' ✓'); render(); },
  sheetx(){ if(sheet&&sheet.tipo==='item') ordenarDia(sheet.d); sheet=null; guardar(); render(); },
  whora0(){ const it=S.semana[sheet.d].find(x=>x.id===sheet.id); if(it){ it.hora=''; guardar(); render(); } },
  wrm2(d){ if(!confirm('¿Sacar esto de este día?')) return; S.semana[+d.d]=S.semana[+d.d].filter(x=>x.id!==d.id); sheet=null; guardar(); render(); },
  /* agregar en 3 pasos */
  addgo(){ const di=V.dia==null?hoyIdx():V.dia; W={ref:null,tipo:'c',hora:'',dias:[di],back:di}; ir('add1'); },
  rutback(){ ir('rut',{dia:W.back}); },
  ptab(d){ V.tab=d.id; const y=window.scrollY; render(); window.scrollTo(0,y); },
  pickc(d){ usar(d.id); W.tipo='c'; W.ref=d.id; hablarIds([d.id]); ir('add2'); },
  pickr(d){ W.tipo='r'; W.ref=d.id; ir('add2'); },
  hora(d){ W.hora=d.h; ir('add3'); },
  hora2(){ ir('add3'); },
  wd(d){ const i=W.dias.indexOf(+d.i); if(i>=0) W.dias.splice(i,1); else W.dias.push(+d.i); render(); },
  dpre(d){ W.dias = d.k==='todos' ? [0,1,2,3,4,5,6] : [0,1,2,3,4]; render(); },
  addsave(){
    if(!W.dias.length){ toast('Elegí al menos un día'); return; }
    W.dias.forEach(i=>{ S.semana[i].push({id:uid('w_'),tipo:W.tipo,ref:W.ref,hora:W.hora||''}); ordenarDia(i); });
    guardar(); tono('ok'); toast('¡Listo! Agregado ✓');
    ir('rut',{dia: W.dias.includes(hoyIdx()) ? hoyIdx() : W.dias[0]});
  },
  newseq(){ SQ={nombre:'',pasos:[],cur:[],at:null,fichas:1,edit:null}; ir('seq'); },
  tpl(d){ const t=PLANTILLAS[+d.i]; const r={id:uid('r_'),nombre:t.n,emoji:t.e,pasos:t.p.map(x=>x.slice()),fichas:1}; S.rutinas.push(r); guardar(); W.tipo='r'; W.ref=r.id; W.hora=''; ir('add2'); },
  erut(d){ const r=porId(S.rutinas,d.id); if(!r) return; SQ={nombre:r.nombre,pasos:r.pasos.map(x=>paso(x).slice()),cur:[],at:null,fichas:typeof r.fichas==='number'?r.fichas:1,edit:r.id}; ir('seq'); },
  sqf(d){ SQ.fichas=+d.n; const y=window.scrollY; render(); window.scrollTo(0,y); },
  squp(d){ mover(SQ.pasos,+d.i,-1); const y=window.scrollY; render(); window.scrollTo(0,y); },
  sqdown(d){ mover(SQ.pasos,+d.i,1); const y=window.scrollY; render(); window.scrollTo(0,y); },
  sqadd(d){ SQ.cur.push(d.id); usar(d.id); hablarIds([d.id]); const y=window.scrollY; render(); window.scrollTo(0,y); },
  curx(d){ SQ.cur.splice(+d.i,1); const y=window.scrollY; render(); window.scrollTo(0,y); },
  sqstep(){ if(!SQ.cur.length) return; if(SQ.at!=null) SQ.pasos.splice(SQ.at,0,SQ.cur); else SQ.pasos.push(SQ.cur); SQ.cur=[]; SQ.at=null; tono('ok'); const y=window.scrollY; render(); window.scrollTo(0,y); },
  sqedit(d){ if(SQ.cur.length){ toast('Primero terminá el paso que estás armando'); return; } SQ.at=+d.i; SQ.cur=SQ.pasos.splice(+d.i,1)[0]; render(); },
  sqrm(d){ SQ.pasos.splice(+d.i,1); const y=window.scrollY; render(); window.scrollTo(0,y); },
  sqncard(){ ir('ncard',{ret:{t:'sq'}}); },
  sqdone(){
    if(SQ.cur.length){ if(SQ.at!=null) SQ.pasos.splice(SQ.at,0,SQ.cur); else SQ.pasos.push(SQ.cur); SQ.cur=[]; SQ.at=null; }
    if(!SQ.pasos.length){ toast('Armá al menos un paso'); return; }
    const nombre=(SQ.nombre||'').trim() || (pasoTexto(SQ.pasos[0])+(SQ.pasos.length>1?' y '+(SQ.pasos.length-1)+' más':''));
    if(SQ.edit){ const r=porId(S.rutinas,SQ.edit); if(r){ r.nombre=nombre.slice(0,30); r.pasos=SQ.pasos.map(x=>x.slice()); r.fichas=SQ.fichas; guardar(); toast('Rutina guardada ✓'); } ir('rut'); return; }
    const r={id:uid('r_'),nombre:nombre.slice(0,30),emoji:'🔁',pasos:SQ.pasos.map(x=>x.slice()),fichas:SQ.fichas}; S.rutinas.push(r); guardar();
    W.tipo='r'; W.ref=r.id; W.hora=''; ir('add2');
  },
  /* fichas */
  canjear(d){
    const c=S.cartera, p=porId(c.premios,d.id); if(!p) return;
    if(c.total<p.costo){ toast('Todavía no alcanzan las fichas'); return; }
    if(!confirm('¿Canjear “'+p.nombre+'” por '+p.costo+' fichas?')) return;
    c.total-=p.costo; c.canjeados=(c.canjeados||0)+1; guardar();
    celebrar('premio','¡Premio!',p.emoji+' '+p.nombre+' · Le quedan '+c.total+' '+c.ficha,p.emoji,'¡Ganaste '+p.nombre+'!');
  },
  mas1(){ S.cartera.total++; guardar(); render(); },
  menos1(){ if(S.cartera.total>0){ S.cartera.total--; guardar(); render(); } },
  mas1x(){ dar(1,''); },
  epre(d){ ir('epre',{id:d.id}); },
  newpre(){ const p={id:uid('p_'),nombre:'Nuevo premio',emoji:'🎁',costo:5}; S.cartera.premios.push(p); guardar(); ir('epre',{id:p.id}); },
  fichaemoji(d){ S.cartera.ficha=d.e; guardar(); render(); },
  premoji(d){ porId(S.cartera.premios,d.id).emoji=d.e; guardar(); render(); },
  pcdec(d){ const p=porId(S.cartera.premios,d.id); if(p.costo>1){ p.costo--; guardar(); render(); } },
  pcinc(d){ const p=porId(S.cartera.premios,d.id); if(p.costo<99){ p.costo++; guardar(); render(); } },
  delpre(d){ if(!confirm('¿Eliminar este premio?')) return; S.cartera.premios=S.cartera.premios.filter(p=>p.id!==d.id); guardar(); ir('fic'); },
  wfn(d){ const it=S.semana[+d.d].find(x=>x.id===d.id); if(it){ it.fichas=+d.n; guardar(); render(); } }
};
function acc(a, d){
  if(a.startsWith('emod:')) return ir('emod',{id:a.slice(5)});
  if(a.startsWith('erut:')) return ACC.erut({id:a.slice(5)});
  if(a==='go:lista'){ return ir('rut'); }
  if(a.startsWith('go:')) return ir(a.slice(3));
  if(a==='pick' && !d.t) return V.ret.t==='sq' ? ir('seq') : ir('pick',{t:V.ret.t,id:V.ret.id,q:''});
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
  else if(k==='pnom'){ porId(S.cartera.premios,e.target.dataset.id).nombre=v; guardar(); }
  else if(k==='whora'){ const it=S.semana[+e.target.dataset.d].find(x=>x.id===e.target.dataset.id); if(it){ it.hora=v; guardar(); } }
  else if(k==='sqn'){ SQ.nombre=v; }
  else if(k==='whora2'){ W.hora=v; }
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
    if(!S.tarjetas.some(x=>x.id===t.id)) S.tarjetas.push({id:String(t.id),etiqueta:String(t.etiqueta).slice(0,40),emoji:String(t.emoji||'⭐').slice(0,4),foto:typeof t.foto==='string'&&t.foto.startsWith('data:image/')?t.foto:undefined,audio:typeof t.audio==='string'&&t.audio.startsWith('data:audio/')?t.audio:undefined,cat:CATEGORIAS[t.cat]?t.cat:'propias'});
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
      S.rutinas.push({id:uid('r_'),nombre:String(d.rutina.nombre||'Rutina').slice(0,30),emoji:String(d.rutina.emoji||'🔁').slice(0,4),pasos:normPasos(d.rutina.pasos)});
      guardar(); toast('Rutina importada'); ir('rut');
    }else if(d.tipo==='ecos_respaldo_v1' && d.datos && d.datos.modulos){
      if(!confirm('Esto REEMPLAZA todo lo que hay en este dispositivo. ¿Seguir?')) return;
      S = migrar(d.datos); guardar(); toast('Respaldo restaurado'); ir('home');
    }else throw 0;
  }catch(e){ toast('No pude leer ese archivo'); }
}

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
