/* Ecos — comunicación con tarjetas. Datos solo en este dispositivo (localStorage). */
const KEY = 'ecos_v1';
const BASE = {};
TARJETAS_BASE.forEach(t => { BASE[t[0]] = {id:t[0], emoji:t[1], etiqueta:t[2], cat:t[3]}; });
const EMOJIS_MOD = ['⭐','🏠','🍽️','😊','🎮','🚌','🏫','🛁','🧩','🎵','🐶','❤️','🌈','📚','⚽','🧸'];

function uid(p){ return (p||'c_') + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function defaults(){
  const m = (id,nombre,emoji,items)=>({id,nombre,emoji,items});
  return {
    v:1, activo:'m_necesito',
    modulos:[
      m('m_necesito','Necesito','🙋',['agua','baño','ayuda','hambre','sed','sueño','dolor','frio','calor','descanso','silencio']),
      m('m_emociones','Cómo estoy','😊',['feliz','triste','enojado','miedo','cansado','nervioso','tranquilo','aburrido','te-quiero']),
      m('m_comida','Quiero comer','🍎',['manzana','banana','pan','leche','jugo','galletitas','fideos','arroz','pollo','huevo','queso','fruta']),
      m('m_acciones','Quiero hacer','🎮',['jugar','mirar','escuchar','leer','dibujar','cantar','salir','abrazar'])
    ],
    rutinas:[
      {id:'r_manana',nombre:'Mañana',emoji:'🌅',pasos:['dormir','baño','lavar','vestir','comer','cepillar','mochila']},
      {id:'r_noche',nombre:'Antes de dormir',emoji:'🌙',pasos:['comer','bañarse','cepillar','baño','dormir']}
    ],
    tarjetas:[], ajustes:{voz:true, tam:'m'}
  };
}
function cargar(){
  try{ const s = JSON.parse(localStorage.getItem(KEY)||'null'); if(s && s.modulos) return s; }catch(e){}
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

/* ---- estado de pantalla ---- */
let V = {n:'home'}, edit = false, frase = [], playing = null;
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
    + `<button class="chip ${act==='rutinas'?'sel':''}" data-act="mod" data-id="rutinas">🔁 Rutinas</button>`
    + (edit ? `<button class="chip add" data-act="newmod">➕ Módulo</button>` : '');
  const tira = frase.length ? frase.map(miniHtml).join('') : '<span class="vacia">Tocá las tarjetas para armar una frase</span>';
  let cuerpo = '';
  if(act==='rutinas'){
    cuerpo = `<div class="page">${S.rutinas.map(r=>`<div class="box"><div class="row"><button class="btn pri" style="margin:0" data-act="play" data-id="${r.id}">${esc(r.emoji)} ${esc(r.nombre)} · ${r.pasos.length} pasos</button>${edit?`<button class="btn sm" style="margin:0;width:auto" data-act="erut" data-id="${r.id}">✏️</button>`:''}</div></div>`).join('')}
      ${edit?`<button class="btn" data-act="newrut">➕ Nueva rutina</button>`:''}
      ${!S.rutinas.length?'<div class="vacio">Todavía no hay rutinas. Activá ✏️ para crear una.</div>':''}</div>`;
  }else{
    const m = porId(S.modulos, act) || S.modulos[0];
    if(!m){ cuerpo = '<div class="vacio">No hay módulos. Activá ✏️ y creá uno.</div>'; }
    else{
      cuerpo = m.items.length ? `<div class="grid">${m.items.map(id=>cardHtml(id)).join('')}</div>` : '<div class="vacio">Este módulo está vacío. Activá ✏️ y agregá tarjetas.</div>';
      if(edit) cuerpo += `<div class="page"><button class="btn" data-act="emod" data-id="${m.id}">✏️ Editar “${esc(m.nombre)}” (orden, tarjetas, nombre)</button></div>`;
    }
  }
  return cab('💬 Ecos','',`<button class="${edit?'on':''}" data-act="toggleEdit" aria-label="Editar">✏️</button><button data-act="aj" aria-label="Ajustes">⚙️</button>`)
    + `<div class="frase"><div class="tira">${tira}</div><button class="fbtn" data-act="back1" aria-label="Borrar última">⌫</button><button class="fbtn say" data-act="speak" aria-label="Hablar">🔊</button></div>`
    + `<div class="chips">${chips}</div>` + cuerpo;
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
function emojiPicker(sel, act, id){
  return `<div class="emojis">${EMOJIS_MOD.map(e=>`<button class="${e===sel?'sel':''}" data-act="${act}" data-id="${id}" data-e="${e}">${e}</button>`).join('')}</div>`;
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
  return cab('Editar rutina', backBtn('home'))
    + `<div class="page"><div class="box"><h2>Nombre</h2><input type="text" maxlength="30" value="${esc(r.nombre)}" data-in="rutname" data-id="${r.id}">
      <h2 style="margin-top:12px">Ícono</h2>${emojiPicker(r.emoji,'rutemoji',r.id)}</div>
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
  const vistas = {home:vHome, emod:vEditMod, erut:vEditRut, pick:vPick, ncard:vNCard, aj:vAj};
  app.innerHTML = (vistas[V.n]||vHome)() + (playing ? vPlay() : '');
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
  delmod(d){ if(!confirm('¿Eliminar este módulo? Las tarjetas no se borran.')) return; S.modulos=S.modulos.filter(m=>m.id!==d.id); if(S.activo===d.id) S.activo=(S.modulos[0]||{id:'rutinas'}).id; guardar(); ir('home'); },
  delrut(d){ if(!confirm('¿Eliminar esta rutina?')) return; S.rutinas=S.rutinas.filter(r=>r.id!==d.id); guardar(); ir('home'); },
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
  play(d){ playing={id:d.id,i:0}; render(); const r=porId(S.rutinas,d.id); const t=tarjeta(r.pasos[0]); hablar(t&&t.etiqueta); },
  stopPlay(){ playing=null; render(); },
  pprev(){ if(playing.i>0){ playing.i--; render(); ACC.pspeak(); } },
  pnext(){ const r=porId(S.rutinas,playing.id); if(playing.i>=r.pasos.length-1){ hablar('¡Muy bien! Terminamos'); playing=null; render(); toast('¡Rutina completa! 🎉'); } else { playing.i++; render(); ACC.pspeak(); } },
  pspeak(){ const r=porId(S.rutinas,playing.id); const t=tarjeta(r.pasos[playing.i]); hablar(t&&t.etiqueta); },
  expmod(d){ const m=porId(S.modulos,d.id); descargar({tipo:'ecos_modulo_v1',modulo:{nombre:m.nombre,emoji:m.emoji,items:m.items},tarjetas:usadas(m.items)},`ecos-modulo-${slug(m.nombre)}.json`); },
  exprut(d){ const r=porId(S.rutinas,d.id); descargar({tipo:'ecos_rutina_v1',rutina:{nombre:r.nombre,emoji:r.emoji,pasos:r.pasos},tarjetas:usadas(r.pasos)},`ecos-rutina-${slug(r.nombre)}.json`); },
  expall(){ descargar({tipo:'ecos_respaldo_v1',generado:new Date().toISOString(),datos:S},`ecos-respaldo-${new Date().toISOString().slice(0,10)}.json`); },
  imp(){ document.getElementById('impIn').click(); }
};
function acc(a, d){
  if(a.startsWith('emod:')) return ir('emod',{id:a.slice(5)});
  if(a.startsWith('erut:')) return ir('erut',{id:a.slice(5)});
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
      S.activo='rutinas'; guardar(); toast('Rutina importada'); ir('home');
    }else if(d.tipo==='ecos_respaldo_v1' && d.datos && d.datos.modulos){
      if(!confirm('Esto REEMPLAZA todo lo que hay en este dispositivo. ¿Seguir?')) return;
      S = d.datos; guardar(); toast('Respaldo restaurado'); ir('home');
    }else throw 0;
  }catch(e){ toast('No pude leer ese archivo'); }
}

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
