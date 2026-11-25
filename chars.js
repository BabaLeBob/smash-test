// Moteur des données personnage : chargement, brouillon local de l'éditeur, corps, objets, visuels, sons (les données sont dans personnage.js)
const CHAR_VERSION=2,SCHEMA=3;
// ---------- Corps : taille et forme
const BODY_DEFAULT={scale:1,headR:10,headShape:'round',headDeco:'none',eyes:'dot',torL:22,torW:13,torShape:'stick',armL:22,armW:8,legL:26,legW:9,tail:0,tailW:6,color:'',headColor:'',mc:0,skin:'',mcHead:'3q',mcLayer:1};
const HEAD_SHAPES=[['round','Rond'],['square','Carré'],['oval','Ovale (haut)'],['wide','Ovale (large)'],['triangle','Triangle']];
const HEAD_DECOS=[['none','Aucun'],['cat','Oreilles de chat'],['bunny','Oreilles de lapin'],['horns','Cornes'],['antenna','Antenne'],['spikes','Piques']];
const EYES=[['dot','Point'],['big','Grands yeux'],['angry','Méchant'],['visor','Visière'],['none','Aucun']];
const TORSO_SHAPES=[['stick','Bâton'],['ellipse','Ovale (ventre)'],['box','Boîte'],['cone','Cône (robe)']];
function bodyDims(b,m){b=Object.assign({},BODY_DEFAULT,b);const sc=(b.scale||1)*(m||1),H=(56+(b.legL-26)+(b.torL-22)+(b.headR-10)*2)*sc,W=Math.max(8,14+(Math.max(b.torW,b.headR*1.3)-13)*.5)*sc;return{sc,H,W,FW:W*12/14}}
const BD0=bodyDims();
function bodyCols(b,team,flash){b=b||BODY_DEFAULT;const col=flash?'#fff':(b.color||team);return{col,hcol:flash?'#fff':(b.headColor||col)}}
const BODY_PRESETS=[['Normal',{}],['Petit et vif',{scale:.7}],['Géant',{scale:1.6}],['Gros bonhomme',{torShape:'ellipse',torW:24,armW:11,legW:12,headR:11,scale:1.15}],['Grosse tête (chibi)',{headR:17,legL:18,torL:16,armL:16,scale:.9}],['Long et fin',{legL:36,torL:28,armL:28,torW:8,armW:6,legW:6,headR:8}],['Chat',{headDeco:'cat',tail:38,tailW:5,headR:11,scale:.85}],['Lapin',{headDeco:'bunny',tail:10,tailW:9,legL:30,headR:10}],['Robot',{headShape:'square',torShape:'box',torW:18,eyes:'visor',headDeco:'antenna',color:'#9aa4b0',headColor:'#7d8794'}],['Princesse',{torShape:'cone',torW:12,headDeco:'none',eyes:'big'}],['Minecraft (joueur)',{mc:1,headR:9,torL:26,torW:9,armL:26,armW:9,legL:26,legW:9,tail:0,headDeco:'none'}]];
// ---------- Sons (synthétisés, aucun fichier)
let SFX_ON=true,_ac=null;
const SFX_LIST=[['','(aucun)'],['punch','Coup'],['swish','Sifflement'],['whoosh','Souffle'],['zap','Électrique'],['boom','Explosion'],['laser','Laser'],['coin','Pièce'],['jump','Rebond'],['power','Montée de puissance'],['heal','Soin']];
const _S={punch:[['noise',0,0,.09,.5,900],['square',160,40,.1,.3]],swish:[['noise',0,0,.14,.25,3000]],whoosh:[['noise',0,0,.3,.3,1200]],zap:[['sawtooth',900,120,.18,.2],['noise',0,0,.12,.15,5000]],boom:[['noise',0,0,.5,.6,500],['sine',110,25,.4,.5]],laser:[['square',1400,200,.2,.18]],coin:[['square',880,880,.07,.15],['square',1320,1320,.12,.15,.07]],jump:[['sine',250,600,.15,.25]],power:[['sawtooth',120,700,.45,.2],['sine',240,1200,.45,.15]],heal:[['sine',500,900,.12,.2],['sine',700,1200,.2,.2,.1]]};
function playSfx(id){if(!SFX_ON||!id||!_S[id])return;try{_ac=_ac||new(window.AudioContext||window.webkitAudioContext)();const a=_ac;if(a.state==='suspended')a.resume();const t0=a.currentTime;
 for(const[ty,f0,f1,d,v,x]of _S[id]){const g=a.createGain(),st=t0+(ty==='noise'?0:(x||0));g.connect(a.destination);g.gain.setValueAtTime(v*.3,st);g.gain.exponentialRampToValueAtTime(.0001,st+d);
  if(ty==='noise'){const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),dt=b.getChannelData(0);for(let i=0;i<n;i++)dt[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type='bandpass';fl.frequency.value=x||1000;s.connect(fl);fl.connect(g);s.start(st)}
  else{const o=a.createOscillator();o.type=ty;o.frequency.setValueAtTime(f0,st);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),st+d);o.connect(g);o.start(st);o.stop(st+d+.02)}}}catch(e){}}
// ---------- Données : nouvelles attaques par défaut, migration
function newMoves(){return{exB:{k:'exB',n:'Spécial bonus (Bouclier + B)',s:12,a:2,e:18,d:0,box:null,kb:0,gr:0,ang:0,nc:1,cd:600,sheal:10,bf:300,bdm:1.4,bsp:1.2,bcl:'#ff8c28',sf:'power',
 anim:[{t:0,p:'neutral'},{t:10,p:'lean'},{t:16,p:'starfish'},{t:30,p:'neutral'}],
 fx:[{kind:'ring',x:0,y:-30,w:50,h:50,f0:12,f1:26,color:'#ffd24a',color2:'#ffffff',s0:.4,s1:2.2,a0:1,a1:0},{kind:'flame',x:0,y:-28,w:50,h:70,f0:12,f1:40,color:'#ff8c28',color2:'#ffd24a',n:10}]}}}
function migrate(c){const v=c.schema||1;
 if(v<2)for(const k in c.moves){const m=c.moves[k];
  if(m.fb&&!m.proj){m.proj=[{t:m.s,x:24,y:-34,vx:7,vy:0,g:0,life:90,r:9,d:6,kb:4,gr:.06,ang:30,color:'#ff8c28',color2:'#ffd24a',shape:'burst',n:1,spread:0,bounce:0,pierce:0,spin:0}];delete m.fb}
  if(/B$/.test(k)){if(m.nc===undefined)m.nc=1;if(m.vy&&m.rec===undefined)m.rec=1}}
 if(v<3){const N=newMoves();for(const k in N)if(!c.moves[k])c.moves[k]=N[k]}
 c.schema=SCHEMA}
function normChar(c){c.items=c.items||[];c.phys=c.phys||{};if((c.schema||1)<SCHEMA)migrate(c);c.body=Object.assign({},BODY_DEFAULT,c.body||{});if(c.phys.weight==null)c.phys.weight=1;return c}
function baseChar(){return normChar(JSON.parse(JSON.stringify(CHAR_DEFAULT)))}
function loadChar(id){id=id||'default';const c=baseChar();
 try{const s=JSON.parse(localStorage.getItem('char_'+id));
  if(s&&(s.v||1)>=CHAR_VERSION&&s.base===CHAR_BUILD){if(s.name)c.name=s.name;if(s.items)c.items=s.items;if(s.body)Object.assign(c.body,s.body);Object.assign(c.phys,s.phys);
   for(const k in s.moves){const m=c.moves[k];if(!m){if(s.moves[k]&&s.moves[k].k)c.moves[k]=s.moves[k];continue}for(const f in s.moves[k]){const val=s.moves[k][f];if(val==='__del')delete m[f];else m[f]=val}}}}catch(e){}
 return c}
function saveChar(c,id){id=id||'default';const DB=baseChar(),o={v:CHAR_VERSION,base:CHAR_BUILD,name:c.name,phys:{},moves:{}};
 if(JSON.stringify(c.items||[])!==JSON.stringify(DB.items||[]))o.items=c.items||[];for(const k in c.phys)if(c.phys[k]!==DB.phys[k])o.phys[k]=c.phys[k];
 const bd={};for(const k in c.body)if(c.body[k]!==DB.body[k])bd[k]=c.body[k];if(Object.keys(bd).length)o.body=bd;
 for(const k in c.moves){const d=DB.moves[k],m=c.moves[k],r={};if(!d){o.moves[k]=m;continue}
  for(const f in m)if(JSON.stringify(m[f])!==JSON.stringify(d[f]))r[f]=m[f];
  for(const f in d)if(!(f in m))r[f]='__del';
  if(Object.keys(r).length)o.moves[k]=r}
 try{localStorage.setItem('char_'+id,JSON.stringify(o))}catch(e){alert('Sauvegarde impossible (espace plein ?)')}}
const _ic={};
function getImg(u){if(!_ic[u]){const i=new Image();i.src=u;_ic[u]=i}return _ic[u]}

// ---------- Poses du corps (angles : 0 = vers l'avant, 90 = vers le bas, -90 = vers le haut, 180 = vers l'arrière)
const POSES={
 neutral:{t:0,c:0,af:80,ab:100,lf:88,lb:92},windup:{t:-14,c:4,af:175,ab:150,lf:80,lb:100},
 punchF:{t:12,c:0,af:0,ab:140,lf:70,lb:110},punchU:{t:0,c:0,af:-90,ab:120,lf:85,lb:95},
 uppercut:{t:-5,c:2,af:-70,ab:160,lf:80,lb:100},kickF:{t:-10,c:0,af:120,ab:60,lf:0,lb:95},
 kickB:{t:10,c:0,af:40,ab:140,lf:95,lb:180},kickU:{t:-15,c:0,af:100,ab:60,lf:-80,lb:95},
 kickD:{t:5,c:6,af:-60,ab:-120,lf:95,lb:85},crouch:{t:15,c:14,af:40,ab:130,lf:55,lb:125},
 lean:{t:25,c:4,af:20,ab:160,lf:40,lb:140},starfish:{t:0,c:0,af:-30,ab:210,lf:40,lb:140},
 armsWide:{t:0,c:0,af:-10,ab:190,lf:70,lb:110},grab:{t:10,c:0,af:-5,ab:5,lf:80,lb:100},throw:{t:15,c:0,af:30,ab:20,lf:75,lb:105}};
const POSE_NAMES=[['neutral','Repos'],['windup','Prépare le coup (arrière)'],['punchF','Coup de poing avant'],['punchU','Coup de poing haut'],['uppercut','Uppercut'],['kickF','Coup de pied avant'],['kickB','Coup de pied arrière'],['kickU','Coup de pied haut'],['kickD','Plongeon (pieds vers le bas)'],['crouch','Accroupi'],['lean','Penché (charge)'],['starfish','Étoile (bras/jambes écartés)'],['armsWide','Bras écartés'],['grab','Saisie (bras devant)'],['throw','Lancer']];
const PK=['t','c','af','ab','lf','lb','rf','rb'];
const mixPose=(a,b,u)=>{u=u*u*(3-2*u);const o={};for(const k of PK)o[k]=(a[k]||0)+((b[k]||0)-(a[k]||0))*u;return o};
function animPose(m,t){const k=(m.anim||[]).slice().sort((a,b)=>a.t-b.t),P=q=>q.pose||POSES[q.p]||POSES.neutral;
 if(!k.length)return POSES.neutral;if(t<=k[0].t)return P(k[0]);
 for(let i=1;i<k.length;i++)if(t<=k[i].t)return mixPose(P(k[i-1]),P(k[i]),(t-k[i-1].t)/Math.max(1,k[i].t-k[i-1].t));
 return P(k[k.length-1])}
function boxAt(m,t){const k=m.boxKeys;if(!k||!k.length)return m.box;const s=k.slice().sort((a,b)=>a.t-b.t);if(t<=s[0].t)return s[0].box;
 for(let i=1;i<s.length;i++)if(t<=s[i].t){const u=(t-s[i-1].t)/Math.max(1,s[i].t-s[i-1].t);return s[i-1].box.map((v,j)=>v+(s[i].box[j]-v)*u)}
 return s[s.length-1].box}
function statePose(p,f){const st=p.st;
 if(st==='shield'||st==='land')return POSES.crouch;if(st==='hold'||st==='throw')return POSES.grab;
 if(st==='ledge')return{t:0,c:0,af:-90,ab:-80,lf:100,lb:80};
 if(!p.g)return p.vy<0?{t:0,c:0,af:-60,ab:-120,lf:60,lb:120}:POSES.armsWide;
 if(Math.abs(p.vx)>.6){const w=Math.sin(f*(p.rt>12?.5:.3)),R=p.rt>12;return{t:R?22:8,c:0,af:90-w*50,ab:90+w*50,lf:90+w*(R?55:35),lb:90-w*(R?55:35)}}
 const b=Math.sin(f*.08);return{t:0,c:b*1.5,af:80+b*4,ab:100-b*4,lf:88,lb:92}}

function joints(po,b){b=b||BODY_DEFAULT;const R=Math.PI/180,c=po.c||0,L=b.legL??26,T=b.torL??22,A=b.armL??22,hr=b.headR??10,hy=-L+c,tr=(po.t||0)*R,sx=Math.sin(tr)*T,sy=hy-Math.cos(tr)*T,k=1-c/80;
 const tip=(ox,oy,a,l)=>[ox+Math.cos(a*R)*l,oy+Math.sin(a*R)*l];
 return{hip:[0,hy],sh:[sx,sy],hand:tip(sx,sy,po.af,A),handB:tip(sx,sy,po.ab,A),foot:tip(0,hy,po.lf,L*k),footB:tip(0,hy,po.lb,L*k),head:[sx+Math.sin(tr)*(hr+2),sy-Math.cos(tr)*(hr+2)]}}
// ---------- Objets portés (armes, boucliers, chapeaux, ailes…)
const ITEM_KINDS=[
 ['sword','Épée'],['greatsword','Grande épée'],['dagger','Dague'],['katana','Katana'],['saber','Sabre laser'],['axe','Hache'],['hammer','Marteau'],['spear','Lance'],['trident','Trident'],['scythe','Faux'],['pickaxe','Pioche'],['flail','Fléau'],['club','Massue'],['pan','Poêle'],['whip','Fouet'],['bow','Arc'],['blaster','Blaster'],['staff','Bâton magique'],['wand','Baguette étoilée'],['torch','Torche'],['glove','Gant de boxe'],['claws','Griffes'],
 ['shield','Bouclier rond'],['tower','Pavois'],
 ['helmet','Casque'],['viking','Casque viking'],['crown','Couronne'],['hat','Chapeau de sorcier'],['cap','Casquette'],['tophat','Haut-de-forme'],['cowboy','Chapeau de cowboy'],['pirate','Tricorne'],['santa','Bonnet de Noël'],['horns','Cornes'],['halo','Auréole'],['goggles','Lunettes'],['headband','Bandeau'],['mohawk','Crête'],['mask','Masque'],['antenna','Antenne'],['flower','Fleur'],
 ['cape','Cape'],['wings','Ailes'],['jetpack','Jetpack'],['backpack','Sac à dos'],['quiver','Carquois'],['shell','Carapace'],
 ['armor','Plastron'],['emblem','Emblème'],['scarf','Écharpe'],
 ['belt','Ceinture'],['skirt','Jupe'],['foxtail','Queue touffue'],
 ['boot','Botte'],['skate','Patin'],['hover','Plaque anti-gravité'],
 ['orb','Orbe flottant'],['drone','Drone'],['star','Étoile flottante'],['image','Image perso']];
const ITEM_AT=[['main','Main avant'],['off','Main arrière'],['back','Dans le dos'],['head','Tête'],['chest','Torse'],['hip','Taille'],['foot','Pied avant'],['footB','Pied arrière'],['float','Flottant']];
const ITEM_WHEN=[['','Toujours visible'],['atk','Seulement pendant une attaque'],['idle','Seulement hors attaque']];
const ABS_KINDS=['cape','wings','jetpack','backpack','quiver','shell'];
const ITEM_PRESETS=[
 {g:'Armes',n:'Épée',kind:'sword',at:'main',len:36,w:8,rot:-30,color:'#cfd8e6',color2:'#8a5a2b'},
 {g:'Armes',n:'Grande épée',kind:'greatsword',at:'main',len:58,w:13,rot:-30,color:'#bcd0e8',color2:'#5a3b1e'},
 {g:'Armes',n:'Dague',kind:'dagger',at:'main',len:18,w:5,rot:-20,color:'#dfe6ee',color2:'#6a4a2a'},
 {g:'Armes',n:'Katana',kind:'katana',at:'main',len:46,w:7,rot:-30,color:'#e8eef6',color2:'#2a2a2a'},
 {g:'Armes',n:'Sabre laser',kind:'saber',at:'main',len:44,w:7,rot:-30,color:'#4aa3ff',color2:'#888888',glow:12},
 {g:'Armes',n:'Hache',kind:'axe',at:'main',len:38,w:9,rot:-30,color:'#aab4c0',color2:'#7a4a22'},
 {g:'Armes',n:'Marteau',kind:'hammer',at:'main',len:40,w:10,rot:-30,color:'#9aa4b0',color2:'#6a4a22'},
 {g:'Armes',n:'Lance',kind:'spear',at:'main',len:72,w:6,rot:-20,color:'#dfe6ee',color2:'#8a5a2b'},
 {g:'Armes',n:'Trident',kind:'trident',at:'main',len:58,w:8,rot:-20,color:'#6fd0e8',color2:'#5a3b1e'},
 {g:'Armes',n:'Faux',kind:'scythe',at:'main',len:58,w:8,rot:-25,color:'#c9d2dc',color2:'#4a3a2a'},
 {g:'Armes',n:'Pioche',kind:'pickaxe',at:'main',len:40,w:8,rot:-30,color:'#9aa4b0',color2:'#6a4a22'},
 {g:'Armes',n:'Fléau',kind:'flail',at:'main',len:44,w:9,rot:-30,color:'#9aa4b0',color2:'#6a4a22'},
 {g:'Armes',n:'Massue',kind:'club',at:'main',len:36,w:10,rot:-30,color:'#9a6b3a',color2:'#6a4a22'},
 {g:'Armes',n:'Poêle',kind:'pan',at:'main',len:34,w:8,rot:-30,color:'#555a62',color2:'#3a2a1a'},
 {g:'Armes',n:'Fouet',kind:'whip',at:'main',len:56,w:6,rot:-20,color:'#c28a4a',color2:'#4a3020'},
 {g:'Armes',n:'Arc',kind:'bow',at:'main',len:46,w:7,rot:0,color:'#e8e0c8',color2:'#8a5a2b'},
 {g:'Armes',n:'Blaster',kind:'blaster',at:'main',len:28,w:7,rot:-10,color:'#8a96a8',color2:'#3a4250'},
 {g:'Armes',n:'Bâton magique',kind:'staff',at:'main',len:52,w:8,rot:-20,color:'#ff6bd6',color2:'#6a4a2a'},
 {g:'Armes',n:'Baguette',kind:'wand',at:'main',len:30,w:7,rot:-20,color:'#ffd24a',color2:'#6a4a2a',glow:8},
 {g:'Armes',n:'Torche',kind:'torch',at:'main',len:30,w:8,rot:-30,color:'#ff8c28',color2:'#6a4a22'},
 {g:'Armes',n:'Gant de boxe',kind:'glove',at:'main',len:26,w:8,rot:0,color:'#e03a3a',color2:'#ffffff'},
 {g:'Armes',n:'Griffes',kind:'claws',at:'main',len:20,w:6,rot:0,color:'#dfe6ee',color2:'#8a5a2b'},
 {g:'Boucliers',n:'Bouclier',kind:'shield',at:'off',len:30,w:8,rot:0,color:'#4aa3ff',color2:'#ffd24a'},
 {g:'Boucliers',n:'Pavois',kind:'tower',at:'off',len:50,w:10,rot:0,color:'#b8c2d0',color2:'#6a4a22'},
 {g:'Tête',n:'Casque',kind:'helmet',at:'head',len:30,w:8,rot:0,color:'#aab4c0',color2:'#6a4a22'},
 {g:'Tête',n:'Casque viking',kind:'viking',at:'head',len:24,w:8,rot:0,color:'#9aa4b0',color2:'#f0ead8'},
 {g:'Tête',n:'Couronne',kind:'crown',at:'head',len:30,w:8,rot:0,color:'#ffd24a',color2:'#6a4a22'},
 {g:'Tête',n:'Chapeau',kind:'hat',at:'head',len:26,w:8,rot:0,color:'#6a4aff',color2:'#ffd24a'},
 {g:'Tête',n:'Casquette',kind:'cap',at:'head',len:20,w:5,rot:0,color:'#e03a3a',color2:'#a02020'},
 {g:'Tête',n:'Haut-de-forme',kind:'tophat',at:'head',len:20,w:8,rot:0,color:'#222222',color2:'#c0392b'},
 {g:'Tête',n:'Cowboy',kind:'cowboy',at:'head',len:18,w:8,rot:0,color:'#b07a3a',color2:'#8a5a2b'},
 {g:'Tête',n:'Tricorne',kind:'pirate',at:'head',len:20,w:8,rot:0,color:'#2a2a33',color2:'#ffd24a'},
 {g:'Tête',n:'Bonnet de Noël',kind:'santa',at:'head',len:26,w:8,rot:0,color:'#d02a2a',color2:'#ffffff'},
 {g:'Tête',n:'Cornes',kind:'horns',at:'head',len:18,w:5,rot:0,color:'#e8e0c8',color2:'#8a5a2b'},
 {g:'Tête',n:'Auréole',kind:'halo',at:'head',len:4,w:6,rot:0,color:'#ffe680',color2:'#ffffff',glow:10},
 {g:'Tête',n:'Lunettes',kind:'goggles',at:'head',len:10,w:5,rot:0,color:'#8fd3ff',color2:'#444444'},
 {g:'Tête',n:'Bandeau',kind:'headband',at:'head',len:10,w:4,rot:0,color:'#e03a3a',color2:'#ffffff'},
 {g:'Tête',n:'Crête',kind:'mohawk',at:'head',len:18,w:8,rot:0,color:'#ff3ad0',color2:'#ffffff'},
 {g:'Tête',n:'Masque',kind:'mask',at:'head',len:10,w:8,rot:0,color:'#ffffff',color2:'#333333'},
 {g:'Tête',n:'Antenne',kind:'antenna',at:'head',len:12,w:5,rot:0,color:'#ff4a4a',color2:'#888888'},
 {g:'Tête',n:'Fleur',kind:'flower',at:'head',len:10,w:7,rot:0,color:'#ff7ac8',color2:'#ffd24a'},
 {g:'Dos',n:'Cape',kind:'cape',at:'back',len:40,w:10,rot:0,color:'#c0392b',color2:'#ffd24a'},
 {g:'Dos',n:'Ailes',kind:'wings',at:'back',len:40,w:12,rot:0,color:'#ffffff',color2:'#cfe3ff'},
 {g:'Dos',n:'Jetpack',kind:'jetpack',at:'back',len:30,w:8,rot:0,color:'#8a96a8',color2:'#ff8c28'},
 {g:'Dos',n:'Sac à dos',kind:'backpack',at:'back',len:26,w:9,rot:0,color:'#6a8a4a',color2:'#4a6a2a'},
 {g:'Dos',n:'Carquois',kind:'quiver',at:'back',len:30,w:9,rot:0,color:'#e8e0c8',color2:'#8a5a2b'},
 {g:'Dos',n:'Carapace',kind:'shell',at:'back',len:40,w:12,rot:0,color:'#4a8a4a',color2:'#2a5a2a'},
 {g:'Torse',n:'Plastron',kind:'armor',at:'chest',len:20,w:9,rot:0,color:'#aab4c0',color2:'#6a4a22'},
 {g:'Torse',n:'Emblème',kind:'emblem',at:'chest',len:10,w:8,rot:0,color:'#ffd24a',color2:'#c0392b'},
 {g:'Torse',n:'Écharpe',kind:'scarf',at:'chest',len:30,w:6,rot:0,color:'#e03a3a',color2:'#ffffff'},
 {g:'Taille',n:'Ceinture',kind:'belt',at:'hip',len:18,w:5,rot:0,color:'#6a4a22',color2:'#ffd24a'},
 {g:'Taille',n:'Jupe',kind:'skirt',at:'hip',len:22,w:16,rot:0,color:'#4a6aff',color2:'#ffffff'},
 {g:'Taille',n:'Queue touffue',kind:'foxtail',at:'hip',len:34,w:8,rot:0,color:'#e8903a',color2:'#ffffff'},
 {g:'Pieds',n:'Botte avant',kind:'boot',at:'foot',len:16,w:6,rot:0,color:'#6a4a22',color2:'#ffd24a'},
 {g:'Pieds',n:'Botte arrière',kind:'boot',at:'footB',len:16,w:6,rot:0,color:'#6a4a22',color2:'#ffd24a'},
 {g:'Pieds',n:'Patin avant',kind:'skate',at:'foot',len:16,w:6,rot:0,color:'#cfd8e6',color2:'#3a4250'},
 {g:'Pieds',n:'Plaque anti-gravité',kind:'hover',at:'foot',len:16,w:6,rot:0,color:'#4aa3ff',color2:'#ffffff',glow:10},
 {g:'Flottants',n:'Orbe',kind:'orb',at:'float',len:20,w:16,rot:0,color:'#8fd3ff',color2:'#4a6aff',glow:12},
 {g:'Flottants',n:'Drone',kind:'drone',at:'float',len:20,w:12,rot:0,color:'#aab4c0',color2:'#ff4a4a'},
 {g:'Flottants',n:'Étoile',kind:'star',at:'float',len:20,w:14,rot:0,color:'#ffd24a',color2:'#ff8c28',glow:10,spin:90},
 {g:'Divers',n:'Image perso',kind:'image',at:'main',len:40,w:40,rot:0,color:'#ffffff',color2:'#8a5a2b'}];
function drawItem(x,it,pos,ang,k){
 const L=it.len||34,W=it.w||8,c1=it.color||'#cfd8e6',c2=it.color2||'#8a5a2b',T=Date.now();
 x.save();x.translate(pos[0]+(it.ox||0),pos[1]+(it.oy||0));x.rotate(ang*Math.PI/180);
 if(it.spin)x.rotate(T/1000*it.spin*Math.PI/180);if(k&&k!==1)x.scale(k,k);
 x.lineCap='round';x.lineJoin='round';x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1;if(it.glow){x.shadowColor=c1;x.shadowBlur=it.glow}
 const line=(a,b,w,c)=>{x.save();x.strokeStyle=c||c2;x.lineWidth=w||4;x.beginPath();x.moveTo(a,0);x.lineTo(b,0);x.stroke();x.restore()};
 const ln=(ax,ay,bx,by,w,c)=>{x.save();x.strokeStyle=c||c2;x.lineWidth=w||3;x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();x.restore()};
 const poly=(pts,f)=>{x.fillStyle=f;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.stroke()};
 const dot=(px,r,f)=>{x.fillStyle=f;x.beginPath();x.arc(px,0,r,0,7);x.fill()};
 const circ=(px,py,r,f)=>{x.fillStyle=f;x.beginPath();x.arc(px,py,r,0,7);x.fill();x.stroke()};
 const ell=(px,py,rx,ry,f)=>{x.fillStyle=f;x.beginPath();x.ellipse(px,py,rx,ry,0,0,7);x.fill();x.stroke()};
 const rect=(a,b,w,h,f)=>{x.fillStyle=f;x.fillRect(a,b,w,h);x.strokeRect(a,b,w,h)};
 const star=(cx,cy,r1,r0,n,f)=>{x.fillStyle=f;x.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?r0:r1;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill();x.stroke()};
 const dome=(r,f)=>{x.fillStyle=f;x.beginPath();x.arc(0,0,r,-Math.PI/2,Math.PI/2);x.closePath();x.fill();x.stroke()};
 switch(it.kind){
 case'sword':case'greatsword':case'dagger':line(-8,2);x.fillStyle=c2;x.fillRect(1,-W*.9,4,W*1.8);poly([[5,-W/2],[5+L*.85,-W/2],[5+L,0],[5+L*.85,W/2],[5,W/2]],c1);break;
 case'katana':line(-9,2,3.5);ell(3,0,2,W*.8,c2);x.fillStyle=c1;x.beginPath();x.moveTo(4,-W*.3);x.quadraticCurveTo(4+L*.5,-W*1.05,4+L,-W*.9);x.lineTo(4+L,-W*.25);x.quadraticCurveTo(4+L*.5,W*.1,4,W*.3);x.closePath();x.fill();x.stroke();break;
 case'saber':line(-8,12,5,'#777');rect(12,-W*.7,3,W*1.4,c2);x.save();x.shadowColor=c1;x.shadowBlur=14;x.strokeStyle=c1;x.lineWidth=W*.8;x.beginPath();x.moveTo(16,0);x.lineTo(16+L,0);x.stroke();x.shadowBlur=0;x.strokeStyle='#fff';x.lineWidth=W*.35;x.beginPath();x.moveTo(16,0);x.lineTo(16+L,0);x.stroke();x.restore();break;
 case'axe':line(-8,L);poly([[L-W,0],[L-W*.2,-W*1.6],[L+W*.4,-W*1.1],[L+W*.4,W*1.1],[L-W*.2,W*1.6]],c1);break;
 case'hammer':line(-8,L);poly([[L-W,-W*1.2],[L+W*.6,-W*1.2],[L+W*.6,W*1.2],[L-W,W*1.2]],c1);break;
 case'spear':line(-8,L);poly([[L,-W/2],[L+W*2.2,0],[L,W/2]],c1);break;
 case'trident':line(-8,L);ln(L,-W*1.2,L,W*1.2,3,c1);ln(L,-W*1.2,L+W*2.2,-W*1.2,3,c1);ln(L,0,L+W*2.8,0,3,c1);ln(L,W*1.2,L+W*2.2,W*1.2,3,c1);break;
 case'scythe':line(-8,L);poly([[L-2,-2],[L+W*1.5,-W*.6],[L+W*2.4,-W*2.6],[L+W*.6,-W*1.7],[L-2,-W*.9]],c1);break;
 case'pickaxe':line(-8,L);poly([[L-3,-W*2.2],[L+W*.5,-W*.6],[L+W*.5,W*.6],[L-3,W*2.2],[L-W*.4,0]],c1);break;
 case'flail':line(-8,L*.4);for(let i=0;i<4;i++)circ(L*.4+i*L*.1,0,1.8,c2);circ(L*.85,0,W*.8,c1);for(let i=0;i<8;i++){const a=i*Math.PI/4;ln(L*.85+Math.cos(a)*W*.8,Math.sin(a)*W*.8,L*.85+Math.cos(a)*W*1.3,Math.sin(a)*W*1.3,2.5,c1)}break;
 case'club':poly([[-4,-W*.25],[L,-W*.7],[L,W*.7],[-4,W*.25]],c1);break;
 case'pan':line(-8,L*.55,4);circ(L*.55+W*1.3,0,W*1.4,c1);x.save();x.strokeStyle=c2;x.lineWidth=1.5;x.beginPath();x.arc(L*.55+W*1.3,0,W*1.0,0,7);x.stroke();x.restore();break;
 case'whip':line(-8,6,4);x.save();x.strokeStyle=c1;x.lineWidth=2.5;x.beginPath();x.moveTo(6,0);x.bezierCurveTo(L*.4,-W*2,L*.7,W*2,L,0);x.stroke();x.restore();break;
 case'bow':x.save();x.strokeStyle=c2;x.lineWidth=3.5;x.beginPath();x.moveTo(0,-L/2);x.quadraticCurveTo(W*2.2,0,0,L/2);x.stroke();x.strokeStyle=c1;x.lineWidth=1.2;x.beginPath();x.moveTo(0,-L/2);x.lineTo(0,L/2);x.stroke();x.restore();break;
 case'blaster':poly([[-4,-W*.6],[L*.75,-W*.6],[L*.75,-W*.25],[L,-W*.25],[L,W*.25],[L*.75,W*.25],[L*.75,W*.6],[-4,W*.6]],c1);poly([[0,W*.4],[L*.28,W*.4],[L*.2,W*1.8],[0,W*1.8]],c2);dot(L,W*.2,'#ffd24a');break;
 case'staff':line(-8,L);dot(L+W*.4,W*.8,c1);x.stroke();break;
 case'wand':line(-8,L*.9,3);star(L*.9+W*.5,0,W,W*.45,5,c1);break;
 case'torch':line(-8,L);dot(L+W*.3,W*.8,c1);dot(L+W*.3,W*.4,'#ffd24a');break;
 case'glove':rect(-6,-W*.5,8,W,c2);circ(L*.28,0,L*.34,c1);break;
 case'claws':for(const a of[-.35,0,.35]){x.save();x.rotate(a);poly([[0,-1.8],[L,0],[0,1.8]],c1);x.restore()}break;
 case'shield':dot(L*.25,L/2,c1);x.strokeStyle=c2;x.lineWidth=4;x.beginPath();x.arc(L*.25,0,L/2,0,7);x.stroke();dot(L*.25,L*.14,c2);break;
 case'tower':poly([[-W*.4,-L*.55],[W*.9,-L*.55],[W*.9,L*.3],[W*.25,L*.62],[-W*.4,L*.3]],c1);ln(W*.25,-L*.45,W*.25,L*.45,2.5,c2);ln(-W*.3,-L*.1,W*.8,-L*.1,2.5,c2);break;
 case'helmet':dome(11.5,c1);break;
 case'viking':dome(11,c1);for(const s of[-1,1]){x.save();x.strokeStyle=c2;x.lineWidth=4;x.beginPath();x.moveTo(5,s*9);x.quadraticCurveTo(8,s*(15+W*.5),L*.6+8,s*(14+W*.7));x.stroke();x.restore()}break;
 case'crown':poly([[8,-9],[8+W*1.2,-7],[8+W*.5,-4],[8+W*1.4,0],[8+W*.5,4],[8+W*1.2,7],[8,9]],c1);break;
 case'hat':x.fillStyle=c2;x.fillRect(5,-16,3,32);poly([[6,-13],[6,13],[6+L,0]],c1);break;
 case'cap':dome(10.5,c1);poly([[2,4],[2,10+W],[5,10+W],[5,4]],c2);break;
 case'tophat':rect(4,-13,3,26,c2);rect(6,-9,L,18,c1);rect(6,-9,L*.28,18,c2);break;
 case'cowboy':ell(4,0,3,20,c2);poly([[5,-8],[5+L*.7,-6],[5+L*.7,6],[5,8]],c1);break;
 case'pirate':poly([[2,-16],[9,-7],[8+L*.55,-9],[10+L*.55,0],[8+L*.55,9],[9,7],[2,16],[0,0]],c1);ln(2,-16,2,16,3,c2);break;
 case'santa':poly([[6,-10],[6,10],[6+L*.8,L*.3]],c1);ln(6,-10,6,10,4,c2);circ(6+L*.8,L*.3,3.5,c2);break;
 case'horns':for(const s of[-1,1]){x.fillStyle=c1;x.beginPath();x.moveTo(2,s*4);x.quadraticCurveTo(L*.5,s*(8+W),L*.9,s*(6+W*1.4));x.quadraticCurveTo(L*.5,s*(4+W*.3),8,s*7);x.closePath();x.fill();x.stroke()}break;
 case'halo':x.save();x.strokeStyle=c1;x.lineWidth=3;x.beginPath();x.ellipse(14+L*.1,0,2.5,W*1.2+4,0,0,7);x.stroke();x.restore();break;
 case'goggles':ln(1,-10,1,5,3,c2);x.fillStyle=c1;x.beginPath();x.arc(2,6.5,5.2,0,7);x.fill();x.save();x.strokeStyle=c2;x.lineWidth=2.5;x.stroke();x.restore();break;
 case'headband':ln(4,-10,4,10,W*.45,c1);ln(4,-10,-3,-18,3,c1);ln(4,-10,6,-19,3,c1);break;
 case'mohawk':for(let i=-2;i<=2;i++){const a=i*.35,r0=9,r1=10+L*.45*(1-Math.abs(i)*.18);poly([[Math.cos(a-.14)*r0,Math.sin(a-.14)*r0],[Math.cos(a)*r1,Math.sin(a)*r1],[Math.cos(a+.14)*r0,Math.sin(a+.14)*r0]],c1)}break;
 case'mask':ell(3,5,5,5.5,c1);ln(3,-10,3,0,2,c2);break;
 case'antenna':ln(9,0,9+L,0,2,c2);circ(9+L,0,W*.45,c1);break;
 case'flower':for(let i=0;i<5;i++){const a=i*1.2566;circ(12+Math.cos(a)*W*.45,Math.sin(a)*W*.45,W*.38,c1)}circ(12,0,W*.3,c2);break;
 case'cape':x.fillStyle=c1;x.beginPath();x.moveTo(1,-1);x.quadraticCurveTo(-W*1.4,L*.4,-W*.8,L);x.lineTo(W*.3,L*.95);x.quadraticCurveTo(W*.1,L*.45,3,2);x.closePath();x.fill();x.stroke();ln(1,-1,3,2,3,c2);break;
 case'wings':for(let i=0;i<4;i++){x.save();x.rotate((-125+i*16)*Math.PI/180);ell(L*.5,0,L*.5,W*.45*(1-i*.08),i%2?c1:c2);x.restore()}break;
 case'jetpack':{rect(-W*1.8,0,W*.9,L,c1);rect(-W*.8,0,W*.9,L,c1);const f=L*.4*(.7+.3*Math.sin(T/60));poly([[-W*1.8,L],[-W*.9,L],[-W*1.35,L+f]],c2);poly([[-W*.8,L],[W*.1,L],[-W*.35,L+f]],c2);break}
 case'backpack':rect(-W*1.8,0,W*1.8,L,c1);rect(-W*1.4,L*.15,W*.9,L*.3,c2);break;
 case'quiver':x.save();x.rotate(-.3);rect(-W*1.2,-3,W*.9,L,c2);for(let i=0;i<3;i++)ln(-W*1.05+i*W*.3,-3,-W*1.05+i*W*.3,-3-L*.25,1.5,c1);x.restore();break;
 case'shell':ell(-W*.9,L*.4,W*1.2,L*.55,c1);ln(-W*.9,-L*.1,-W*.9,L*.9,2,c2);ln(-W*1.8,L*.4,-W*.1,L*.4,2,c2);break;
 case'armor':rect(-L/2,-W,L,W*2,c1);ln(-L/2,0,L/2,0,2,c2);break;
 case'emblem':circ(0,0,W*.8,c1);star(0,0,W*.6,W*.25,5,c2);break;
 case'scarf':rect(-W*.4,-W*.9,W*.8,W*1.8,c1);x.save();x.strokeStyle=c1;x.lineWidth=W*.7;x.beginPath();x.moveTo(0,-W*.6);x.quadraticCurveTo(-L*.3,-W*2.5,-L*.5,-W*2.2-Math.sin(T/200)*3);x.stroke();x.restore();break;
 case'belt':rect(-L/2,-W/2,L,W,c1);rect(-W*.4,-W*.7,W*.8,W*1.4,c2);break;
 case'skirt':poly([[-L*.25,0],[L*.25,0],[L*.65,W],[-L*.65,W]],c1);ln(-L*.65,W,L*.65,W,2.5,c2);break;
 case'foxtail':x.save();x.strokeStyle=c1;x.lineWidth=W*1.4;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(-L*.6,W*.5,-L*.9,-L*.5);x.stroke();x.restore();circ(-L*.9,-L*.5,W*.5,c2);break;
 case'boot':rect(-L*.5,-W*.55,L*.5,W*1.1,c1);rect(-W*.5,-W*1.8,W*1.2,W*1.5,c1);ln(W*.7,-W*1.9,W*.7,0,2,c2);break;
 case'skate':rect(-L*.5,-W*.55,L*.5,W*1.1,c2);rect(-W*.5,-W*1.8,W*1.2,W*1.5,c2);ln(W*.9,-W*2,W*.9,W*.6,2.5,c1);break;
 case'hover':ell(W*.5,-W*.5,3,W*1.6,c1);ell(W*.5,-W*.5,1.5,W*1.0,c2);break;
 case'orb':circ(0,0,W*.55,c2);circ(0,0,W*.4,c1);circ(-W*.12,-W*.12,W*.14,'#fff');break;
 case'drone':rect(-W*.7,-W*.4,W*1.4,W*.8,c1);ln(-W*.9,-W*.8,W*.9,-W*.8,2,c2);ln(0,-W*.4,0,-W*.8,2,c2);circ(0,W*.15,W*.2,c2);break;
 case'star':star(0,0,W,W*.45,5,c1);break;
 case'image':if(it.img){const i=getImg(it.img);if(i.complete&&i.naturalWidth)x.drawImage(i,-L*(it.px??15)/100,-W*(it.py??50)/100,L,W)}break}
 x.restore()}
// ---------- Modèle Minecraft (skin 64x64 / 64x32, vue de profil)
const MC_PARTS={head:{o:[0,0],D:8,H:8,ov:[32,0]},body:{o:[16,16],D:4,H:12,ov:[16,32]},rarm:{o:[40,16],D:4,H:12,ov:[40,32]},larm:{o:[32,48],D:4,H:12,ov:[48,48],old:'rarm'},rleg:{o:[0,16],D:4,H:12,ov:[0,32]},lleg:{o:[16,48],D:4,H:12,ov:[0,48],old:'rleg'}};
const MC_HEADS=[['3q','Trois-quarts (visage visible)'],['face','De face'],['side','De profil']];
const _sk={};
function mcDefaultSkin(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
 const skin='#c99572',hair='#4a3320',shirt='#00a8a8',pants='#3c3c9c',shoe='#6b6b6b';
 R(0,8,32,8,skin);R(0,8,32,3,hair);R(24,8,8,8,hair);R(0,11,3,3,hair);R(21,11,3,3,hair);R(8,0,16,8,hair);
 R(9,12,1,1,'#fff');R(10,12,1,1,'#3b3b8f');R(13,12,1,1,'#3b3b8f');R(14,12,1,1,'#fff');R(11,13,2,1,'#b07a58');R(10,14,4,1,'#7d4a35');
 R(16,20,24,12,shirt);
 R(40,20,16,12,skin);R(40,20,16,4,shirt);R(32,52,16,12,skin);R(32,52,16,4,shirt);
 R(0,20,16,12,pants);R(0,30,16,2,shoe);R(16,52,16,12,pants);R(16,62,16,2,shoe);return c}
function getSkin(u){const k=u||'_def';let s=_sk[k];if(s)return s;
 s=_sk[k]={ok:false,c:null,f:1,old:false,dk:null,_s:{}};
 const fin=src=>{const w=src.width||src.naturalWidth,h=src.height||src.naturalHeight;s.c=src;s.f=w/64;s.old=h<w*.75;
  const d=document.createElement('canvas');d.width=w;d.height=h;const g=d.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(0,0,0,.38)';g.fillRect(0,0,w,h);s.dk=d;s.ok=true;
  if(typeof window!=='undefined'&&window.onSkinLoad)window.onSkinLoad()};
 if(!u)fin(mcDefaultSkin());else{const im=new Image();im.onload=()=>fin(im);im.src=u}
 return s}
function skinSil(s,col){let c=s._s[col];if(!c){const w=s.c.width||s.c.naturalWidth,h=s.c.height||s.c.naturalHeight;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(s.c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,w,h);s._s[col]=c}return c}
function mcMode(col){col=col||'';return{white:col==='#fff'||col==='#ffffff',ghost:/^rgba/.test(col),tint:col==='#ff8c28'?col:null}}
function mcFace(x,s,r,dx,dy,dw,dh,md,dark){const f=s.f,a=[r[0]*f,r[1]*f,r[2]*f,r[3]*f];
 if(md.white){x.drawImage(skinSil(s,'#ffffff'),a[0],a[1],a[2],a[3],dx,dy,dw,dh);return}
 x.drawImage(dark?s.dk:s.c,a[0],a[1],a[2],a[3],dx,dy,dw,dh);
 if(md.tint){x.save();x.globalAlpha*=.45;x.drawImage(skinSil(s,md.tint),a[0],a[1],a[2],a[3],dx,dy,dw,dh);x.restore()}}
function mcPart(x,s,key,dx,dy,dw,dh,md,dark,layer){const P=MC_PARTS[key],K=(s.old&&P.old)?MC_PARTS[P.old]:P,D=P.D,H=P.H;
 mcFace(x,s,[K.o[0],K.o[1]+D,D,H],dx,dy,dw,dh,md,dark);
 if(layer&&(!s.old||key==='head')){const q=P.ov,e=Math.min(dw,dh)*.06;mcFace(x,s,[q[0],q[1]+D,D,H],dx-e,dy-e,dw+2*e,dh+2*e,md,dark)}}
function mcHead(x,s,r,mode,md,layer){const w=2*r,part=(ux,uy,e)=>{const sw=mode==='side'?w:mode==='face'?0:w*.38,fw=w-sw;
  if(sw>0)mcFace(x,s,[ux,uy+8,8,8],-r-e,-r-e,sw+e,w+2*e,md);
  if(fw>0)mcFace(x,s,[ux+8,uy+8,8,8],-r+sw,-r-e,fw+e,w+2*e,md)};
 part(0,0,0);if(layer)part(32,0,r*.07)}
function drawMC(x,J,b,tr,col,IT){const s0=getSkin(b.skin),s=s0.ok?s0:getSkin(''),md=mcMode(col),lay=b.mcLayer!==0;
 x.imageSmoothingEnabled=false;if(md.ghost)x.globalAlpha=.35;
 const limb=(p,q,w,key,dark)=>{const dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1;x.save();x.translate(p[0],p[1]);x.rotate(Math.atan2(dy,dx)-Math.PI/2);mcPart(x,s,key,-w/2,0,w,len,md,dark,lay);x.restore()};
 limb(J.hip,J.footB,b.legW,'lleg',1);limb(J.sh,J.handB,b.armW,'larm',1);IT('footB');IT('off');
 x.save();x.translate(J.sh[0],J.sh[1]);x.rotate(tr);mcPart(x,s,'body',-b.torW/2,0,b.torW,b.torL,md,0,lay);x.restore();
 limb(J.hip,J.foot,b.legW,'rleg',0);IT('foot');IT('chest');limb(J.sh,J.hand,b.armW,'rarm',0);
 x.save();x.translate(J.head[0]-Math.sin(tr)*2,J.head[1]+Math.cos(tr)*2);x.rotate(tr);mcHead(x,s,b.headR,b.mcHead||'3q',md,lay);x.restore()}
function drawBody(x,px,py,face,po,col,S,items,body,opt){
 S=S||1;items=items||[];const b=Object.assign({},BODY_DEFAULT,body),o=opt||{},hcol=o.hcol||col,J=joints(po,b),tr=(po.t||0)*Math.PI/180;
 x.save();x.translate(px,py);x.scale(face*S,S);x.lineCap='round';x.lineJoin='round';x.strokeStyle=x.fillStyle=col||'#4aa3ff';
 const Ln=(a,c,w)=>{x.lineWidth=w;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(c[0],c[1]);x.stroke()};
 const IT=at=>{for(const it of items){if(it.show===0||it.at!==at)continue;if(it.when==='atk'&&!o.atk)continue;if(it.when==='idle'&&o.atk)continue;if(it.mv&&it.mv.length&&!(o.mk&&it.mv.includes(o.mk)))continue;let pos,ang,k=1;
  if(at==='main'){pos=J.hand;ang=po.af+(po.rf||0)}else if(at==='off'){pos=J.handB;ang=po.ab+(po.rb||0)}
  else if(at==='back'){pos=[J.sh[0]-3,J.sh[1]+4];ang=ABS_KINDS.includes(it.kind)?(po.t||0):-135+(po.t||0)}
  else if(at==='head'){pos=J.head;ang=-90+(po.t||0);k=b.headR/10}
  else if(at==='chest'){pos=[J.hip[0]+(J.sh[0]-J.hip[0])*.55,J.hip[1]+(J.sh[1]-J.hip[1])*.55];ang=-90+(po.t||0)}
  else if(at==='hip'){pos=J.hip;ang=0}
  else if(at==='foot'){pos=J.foot;ang=po.lf}else if(at==='footB'){pos=J.footB;ang=po.lb}
  else{pos=[J.sh[0]-26,J.sh[1]-22+Math.sin(Date.now()/350)*3];ang=0}
  drawItem(x,it,pos,ang+(it.rot||0),k)}};
 IT('back');IT('hip');
 if(b.mc){drawMC(x,J,b,tr,col,IT);IT('main');IT('head');IT('float');x.restore();return}
 if(b.tail>0){x.save();x.lineWidth=b.tailW;x.beginPath();x.moveTo(J.hip[0],J.hip[1]);x.quadraticCurveTo(J.hip[0]-b.tail*.6,J.hip[1]+b.tail*.15,J.hip[0]-b.tail*.85,J.hip[1]-b.tail*.6);x.stroke();x.restore()}
 x.globalAlpha=.6;Ln(J.hip,J.footB,b.legW*.9);Ln(J.sh,J.handB,b.armW*.875);x.globalAlpha=1;IT('footB');IT('off');
 // torse
 if(b.torShape==='stick')Ln(J.hip,J.sh,b.torW);
 else{const tl=Math.hypot(J.sh[0]-J.hip[0],J.sh[1]-J.hip[1])||1,ta=Math.atan2(J.sh[1]-J.hip[1],J.sh[0]-J.hip[0]),tw=b.torW;
  x.save();x.translate((J.hip[0]+J.sh[0])/2,(J.hip[1]+J.sh[1])/2);x.rotate(ta);
  if(b.torShape==='ellipse'){x.beginPath();x.ellipse(0,0,tl/2+tw*.25,tw*.8,0,0,7);x.fill()}
  else if(b.torShape==='box'){x.lineWidth=4;x.fillRect(-tl/2,-tw*.75,tl,tw*1.5);x.strokeRect(-tl/2,-tw*.75,tl,tw*1.5)}
  else{x.lineWidth=3;x.beginPath();x.moveTo(-tl/2,-tw*1.1);x.lineTo(-tl/2,tw*1.1);x.lineTo(tl/2,tw*.3);x.lineTo(tl/2,-tw*.3);x.closePath();x.fill();x.stroke()}
  x.restore()}
 Ln(J.hip,J.foot,b.legW);IT('foot');IT('chest');Ln(J.sh,J.hand,b.armW);
 // tête
 const r=b.headR,e=r/10;x.save();x.translate(J.head[0],J.head[1]);x.rotate(tr);x.fillStyle=x.strokeStyle=hcol;
 const tri=(a,c,d)=>{x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(c[0],c[1]);x.lineTo(d[0],d[1]);x.closePath();x.fill()};
 switch(b.headDeco){
  case'cat':tri([-r*.85,-r*.35],[-r*.75,-r*1.5],[-r*.05,-r*.85]);tri([r*.85,-r*.35],[r*.75,-r*1.5],[r*.05,-r*.85]);break;
  case'bunny':x.beginPath();x.ellipse(-r*.35,-r*1.7,r*.25,r*.8,-.15,0,7);x.fill();x.beginPath();x.ellipse(r*.15,-r*1.7,r*.25,r*.8,.15,0,7);x.fill();break;
  case'horns':x.lineWidth=r*.3;for(const s of[-1,1]){x.beginPath();x.moveTo(s*r*.5,-r*.8);x.quadraticCurveTo(s*r*.9,-r*1.6,s*r*.3,-r*1.8);x.stroke()}break;
  case'antenna':x.lineWidth=2;x.beginPath();x.moveTo(0,-r);x.lineTo(r*.2,-r*1.8);x.stroke();x.beginPath();x.arc(r*.2,-r*1.9,r*.2,0,7);x.fill();break;
  case'spikes':for(const s of[-1,0,1])tri([s*r*.6-r*.25,-r*.8],[s*r*.6,-r*1.6],[s*r*.6+r*.25,-r*.8]);break}
 x.beginPath();
 if(b.headShape==='square'){x.rect(-r,-r,r*2,r*2);x.fill();x.lineWidth=3;x.lineJoin='round';x.stroke()}
 else if(b.headShape==='oval')x.ellipse(0,0,r*.85,r*1.15,0,0,7),x.fill();
 else if(b.headShape==='wide')x.ellipse(0,0,r*1.2,r*.85,0,0,7),x.fill();
 else if(b.headShape==='triangle'){x.moveTo(0,-r*1.2);x.lineTo(r*1.05,r*.85);x.lineTo(-r*1.05,r*.85);x.closePath();x.fill();x.lineWidth=3;x.stroke()}
 else{x.arc(0,0,r,0,7);x.fill()}
 x.fillStyle='#000';x.strokeStyle='#000';
 if(b.eyes==='dot'||b.eyes==='angry')x.fillRect(3*e,-4*e,3*e,3*e);
 if(b.eyes==='angry'){x.lineWidth=2;x.beginPath();x.moveTo(1*e,-8*e);x.lineTo(7*e,-5.5*e);x.stroke()}
 if(b.eyes==='big'){x.fillStyle='#fff';x.beginPath();x.arc(3.5*e,-3*e,3.6*e,0,7);x.fill();x.fillStyle='#000';x.beginPath();x.arc(4.6*e,-3*e,1.8*e,0,7);x.fill()}
 if(b.eyes==='visor')x.fillRect(1*e,-5*e,9*e,3.5*e);
 x.restore();
 IT('main');IT('head');IT('float');x.restore()}

// ---------- Visuels d'attaque (calques animés)
const FXD={x:20,y:-40,w:60,h:40,rot:0,f0:0,f1:6,color:'#ffffff',color2:'#ffd24a',ease:'out',mx:0,my:0,s0:1,s1:1,a0:1,a1:0,spin:0,n:8,cols:4,rows:1,fps:12,txt:'POW!',glow:0,at:''};
const FX_KINDS=[['slash','Trait de coup'],['burst','Impact plein'],['ring','Onde de choc'],['star','Étoile'],['cross','Croix d\'impact'],['lines','Lignes de vitesse'],['spark','Étincelles'],['lightning','Éclair'],['flame','Flammes'],['smoke','Fumée'],['trail','Traînée'],['beam','Rayon'],['orb','Orbe lumineux'],['diamond','Cristal'],['heart','Cœur'],['wave','Croissant'],['sparkle','Scintillement'],['bubble','Bulle'],['text','Texte / emoji'],['image','Image'],['sheet','Image animée (feuille)']];
const FX_AT=[['','Corps (pieds)'],['hand','Main avant'],['handB','Main arrière'],['foot','Pied avant'],['footB','Pied arrière'],['head','Tête']];
const FX_EASE=[['out','Rapide puis lent'],['lin','Linéaire'],['in','Lent puis rapide'],['inout','Doux'],['bounce','Rebond']];
const _e={lin:u=>u,out:u=>1-(1-u)*(1-u),in:u=>u*u,inout:u=>u<.5?2*u*u:1-2*(1-u)*(1-u),bounce:u=>Math.abs(Math.sin(u*Math.PI*1.5))};
const _r=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
function drawLayer(x,v0,face,px,py,t,S){
 const v=Object.assign({},FXD,v0);if(t<v.f0||t>v.f1)return;
 const p=(t-v.f0)/Math.max(1,v.f1-v.f0),e=(_e[v.ease]||_e.out)(p),w=v.w,h=v.h,n=Math.max(2,v.n|0),sc=v.s0+(v.s1-v.s0)*e;
 x.save();x.translate(px+face*(v.x+v.mx*e)*S,py+(v.y+v.my*e)*S);x.scale(face*S,S);x.rotate((v.rot+v.spin*e)*Math.PI/180);x.scale(sc,sc);
 x.globalAlpha=Math.max(0,Math.min(1,v.a0+(v.a1-v.a0)*e));x.lineCap='round';x.lineJoin='round';x.strokeStyle=x.fillStyle=v.color;if(v.glow){x.shadowColor=v.color;x.shadowBlur=v.glow}
 switch(v.kind){
 case'slash':x.lineWidth=Math.max(4,h*.3);x.beginPath();x.ellipse(0,0,w/2,h/2,0,-1.3,1.3);x.stroke();x.strokeStyle='#fff';x.lineWidth=Math.max(2,h*.1);x.stroke();break;
 case'burst':x.beginPath();x.arc(0,0,Math.max(w,h)/2,0,7);x.fill();x.strokeStyle=v.color2;x.lineWidth=4;x.stroke();break;
 case'ring':x.lineWidth=Math.max(3,Math.min(w,h)*.12);x.beginPath();x.ellipse(0,0,w/2,h/2,0,0,7);x.stroke();x.strokeStyle=v.color2;x.lineWidth=2;x.beginPath();x.ellipse(0,0,w*.4,h*.4,0,0,7);x.stroke();break;
 case'star':x.beginPath();for(let i=0;i<2*n;i++){const a=i*Math.PI/n,r=i%2?w/4:w/2;x.lineTo(Math.cos(a)*r,Math.sin(a)*r*h/w)}x.closePath();x.fill();x.strokeStyle=v.color2;x.lineWidth=3;x.stroke();break;
 case'cross':x.lineWidth=Math.max(3,h*.12);x.beginPath();x.moveTo(-w/2,0);x.lineTo(w/2,0);x.moveTo(0,-h/2);x.lineTo(0,h/2);x.stroke();x.strokeStyle=v.color2;x.lineWidth=2;x.stroke();break;
 case'lines':x.lineWidth=3;for(let i=0;i<n;i++){const yy=(i/(n-1)-.5)*h,l=w*(.5+_r(i)*.5)*(.4+e*.6);x.beginPath();x.moveTo(w/2,yy);x.lineTo(w/2-l,yy);x.stroke()}break;
 case'spark':for(let i=0;i<n;i++){const a=i*6.2832/n+_r(i)*.5,d=w/2*(.3+.7*e)*(.6+_r(i+9)*.4);x.beginPath();x.arc(Math.cos(a)*d,Math.sin(a)*d*h/w,Math.max(1.5,4*(1-e*.6)),0,7);x.fill()}break;
 case'lightning':x.lineWidth=4;x.beginPath();for(let i=0;i<=n;i++)x.lineTo(-w/2+w*i/n,i&&i<n?(_r(i+Math.floor(t/2)*7)-.5)*h:0);x.stroke();x.strokeStyle=v.color2;x.lineWidth=1.5;x.stroke();break;
 case'flame':for(let i=0;i<n;i++){const u=(e+_r(i))%1;x.fillStyle=i%2?v.color:v.color2;x.beginPath();x.arc((_r(i+5)-.5)*w,h/2-u*h,Math.max(2,h*.18*(1-u)),0,7);x.fill()}break;
 case'smoke':for(let i=0;i<n;i++){const u=e*(.5+_r(i)*.5);x.beginPath();x.arc((_r(i)-.5)*w*(.4+u),-u*h*.8,6+u*h*.15,0,7);x.fill()}break;
 case'trail':{const g=x.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,v.color);x.fillStyle=g;x.beginPath();x.moveTo(-w/2,0);x.lineTo(w/2,-h/2);x.lineTo(w/2,h/2);x.closePath();x.fill();x.fillStyle=v.color2;x.beginPath();x.arc(w/2,0,h/2,0,7);x.fill();break}
 case'beam':{const ga=x.globalAlpha,g=x.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,v.color2);g.addColorStop(.5,v.color);g.addColorStop(1,v.color2);x.fillStyle=g;x.fillRect(-w/2,-h/2,w,h);x.globalAlpha=ga*.85;x.fillStyle='#fff';x.fillRect(-w/2,-h*.15,w,h*.3);break}
 case'orb':{const ga=x.globalAlpha,r=Math.max(w,h)/2;x.fillStyle=v.color2;x.globalAlpha=ga*.35;x.beginPath();x.arc(0,0,r,0,7);x.fill();x.fillStyle=v.color;x.globalAlpha=ga*.8;x.beginPath();x.arc(0,0,r*.66,0,7);x.fill();x.fillStyle='#fff';x.globalAlpha=ga;x.beginPath();x.arc(0,0,r*.32,0,7);x.fill();break}
 case'diamond':x.beginPath();x.moveTo(0,-h/2);x.lineTo(w/2,0);x.lineTo(0,h/2);x.lineTo(-w/2,0);x.closePath();x.fill();x.strokeStyle=v.color2;x.lineWidth=3;x.stroke();break;
 case'heart':{const r=Math.min(w,h)/2;x.beginPath();x.moveTo(0,r*.9);x.bezierCurveTo(-r*1.6,-r*.1,-r*.7,-r*1.2,0,-r*.4);x.bezierCurveTo(r*.7,-r*1.2,r*1.6,-r*.1,0,r*.9);x.fill();x.strokeStyle=v.color2;x.lineWidth=3;x.stroke();break}
 case'wave':x.beginPath();x.ellipse(0,0,w/2,h/2,0,-1.4,1.4);x.ellipse(-w*.15,0,w/2,h/2,0,1.4,-1.4,true);x.closePath();x.fill();x.strokeStyle=v.color2;x.lineWidth=2;x.stroke();break;
 case'sparkle':x.beginPath();[[0,-h/2],[w*.1,-h*.1],[w/2,0],[w*.1,h*.1],[0,h/2],[-w*.1,h*.1],[-w/2,0],[-w*.1,-h*.1]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.strokeStyle=v.color2;x.lineWidth=2;x.stroke();break;
 case'bubble':{const ga=x.globalAlpha;x.lineWidth=3;x.beginPath();x.ellipse(0,0,w/2,h/2,0,0,7);x.stroke();x.globalAlpha=ga*.25;x.fill();x.globalAlpha=ga;x.fillStyle='#fff';x.beginPath();x.arc(-w*.18,-h*.18,Math.max(2,w*.08),0,7);x.fill();break}
 case'text':if(face<0)x.scale(-1,1);x.font='bold '+Math.max(6,Math.round(h))+'px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=4;x.strokeStyle=v.color2;x.strokeText(v.txt||'',0,0);x.fillText(v.txt||'',0,0);break;
 case'image':if(v.img){const i=getImg(v.img);if(i.complete&&i.naturalWidth)x.drawImage(i,-w/2,-h/2,w,h)}break;
 case'sheet':if(v.img){const i=getImg(v.img);if(i.complete&&i.naturalWidth){const c=v.cols||1,r=v.rows||1,fw=i.naturalWidth/c,fh=i.naturalHeight/r,f=Math.floor((t-v.f0)*v.fps/60)%(c*r);x.drawImage(i,(f%c)*fw,Math.floor(f/c)*fh,fw,fh,-w/2,-h/2,w,h)}}break}
 x.restore()}
const _fxl=m=>m.fx||(m.vis&&m.vis.kind&&m.vis.kind!=='none'?[m.vis]:[]);
function hasFx(m){return _fxl(m).length>0}
function drawFx(x,m,face,px,py,t,S,body){S=S||1;const L=_fxl(m);if(!L.length)return;let J=null;
 for(const v of L){let ox=0,oy=0;if(v.at){if(!J)J=joints(animPose(m,t),body);const q=J[v.at];if(q){ox=q[0]*S*face;oy=q[1]*S}}drawLayer(x,v,face,px+ox,py+oy,t,S)}}
// effet visuel à l'impact (sur la victime) décrit par des champs « h… » d'une attaque ou d'un projectile
function hitFx(s){return s&&s.hk&&s.hk!=='none'?{kind:s.hk,x:0,y:0,w:s.hw||50,h:s.hw||50,f0:0,f1:s.hf||10,color:s.hc||'#ffffff',color2:s.hc2||'#ffd24a',n:s.hn||8,s0:.4,s1:1.3,a0:1,a1:0,txt:s.ht||'POW!',glow:s.hg||0}:null}
