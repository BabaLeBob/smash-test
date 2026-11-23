// Moteur des données personnage : chargement, brouillon local de l'éditeur, dessin des visuels (les données sont dans personnage.js)
const CHAR_VERSION=2;
function migrate(c){for(const k in c.moves){const m=c.moves[k];
 if(m.fb&&!m.proj){m.proj=[{t:m.s,x:24,y:-34,vx:7,vy:0,g:0,life:90,r:9,d:6,kb:4,gr:.06,ang:30,color:'#ff8c28',color2:'#ffd24a',shape:'burst',n:1,spread:0,bounce:0,pierce:0,spin:0}];delete m.fb}
 if(/B$/.test(k)){if(m.nc===undefined)m.nc=1;if(m.vy&&m.rec===undefined)m.rec=1}}
 c.schema=2}
function baseChar(){const c=JSON.parse(JSON.stringify(CHAR_DEFAULT));c.items=c.items||[];if((c.schema||1)<2)migrate(c);return c}
function loadChar(id){id=id||'default';const c=baseChar();
 try{const s=JSON.parse(localStorage.getItem('char_'+id));
  if(s&&(s.v||1)>=CHAR_VERSION&&s.base===CHAR_BUILD){if(s.name)c.name=s.name;if(s.items)c.items=s.items;Object.assign(c.phys,s.phys);
   for(const k in s.moves){const m=c.moves[k];if(!m){if(s.moves[k]&&s.moves[k].k)c.moves[k]=s.moves[k];continue}for(const f in s.moves[k]){const val=s.moves[k][f];if(val==='__del')delete m[f];else m[f]=val}}}}catch(e){}
 return c}
function saveChar(c,id){id=id||'default';const DB=baseChar(),o={v:CHAR_VERSION,base:CHAR_BUILD,name:c.name,phys:{},moves:{}};
 if(JSON.stringify(c.items||[])!==JSON.stringify(DB.items||[]))o.items=c.items||[];for(const k in c.phys)if(c.phys[k]!==DB.phys[k])o.phys[k]=c.phys[k];
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
function joints(po){const R=Math.PI/180,c=po.c||0,hy=-26+c,tr=(po.t||0)*R,sx=Math.sin(tr)*22,sy=hy-Math.cos(tr)*22,k=1-c/80;
 const tip=(ox,oy,a,l)=>[ox+Math.cos(a*R)*l,oy+Math.sin(a*R)*l];
 return{hip:[0,hy],sh:[sx,sy],hand:tip(sx,sy,po.af,22),handB:tip(sx,sy,po.ab,22),foot:tip(0,hy,po.lf,26*k),footB:tip(0,hy,po.lb,26*k),head:[sx+Math.sin(tr)*12,sy-Math.cos(tr)*12]}}
// ---------- Objets portés (armes, boucliers, chapeaux…)
const ITEM_KINDS=[['sword','Épée'],['greatsword','Grande épée'],['dagger','Dague'],['axe','Hache'],['hammer','Marteau'],['spear','Lance'],['staff','Bâton magique'],['club','Massue'],['torch','Torche'],['shield','Bouclier'],['helmet','Casque'],['crown','Couronne'],['hat','Chapeau de sorcier'],['image','Image perso']];
const ITEM_AT=[['main','Main avant'],['off','Main arrière'],['back','Dans le dos'],['head','Tête']];
const ITEM_PRESETS=[
 {n:'Épée',kind:'sword',at:'main',len:36,w:8,rot:-30,color:'#cfd8e6',color2:'#8a5a2b'},
 {n:'Grande épée',kind:'greatsword',at:'main',len:58,w:13,rot:-30,color:'#bcd0e8',color2:'#5a3b1e'},
 {n:'Dague',kind:'dagger',at:'main',len:18,w:5,rot:-20,color:'#dfe6ee',color2:'#6a4a2a'},
 {n:'Hache',kind:'axe',at:'main',len:38,w:9,rot:-30,color:'#aab4c0',color2:'#7a4a22'},
 {n:'Marteau',kind:'hammer',at:'main',len:40,w:10,rot:-30,color:'#9aa4b0',color2:'#6a4a22'},
 {n:'Lance',kind:'spear',at:'main',len:72,w:6,rot:-20,color:'#dfe6ee',color2:'#8a5a2b'},
 {n:'Bâton magique',kind:'staff',at:'main',len:52,w:8,rot:-20,color:'#ff6bd6',color2:'#6a4a2a'},
 {n:'Massue',kind:'club',at:'main',len:36,w:10,rot:-30,color:'#9a6b3a',color2:'#6a4a22'},
 {n:'Torche',kind:'torch',at:'main',len:30,w:8,rot:-30,color:'#ff8c28',color2:'#6a4a22'},
 {n:'Bouclier',kind:'shield',at:'off',len:30,w:8,rot:0,color:'#4aa3ff',color2:'#ffd24a'},
 {n:'Casque',kind:'helmet',at:'head',len:30,w:8,rot:0,color:'#aab4c0',color2:'#6a4a22'},
 {n:'Couronne',kind:'crown',at:'head',len:30,w:8,rot:0,color:'#ffd24a',color2:'#6a4a22'},
 {n:'Chapeau',kind:'hat',at:'head',len:26,w:8,rot:0,color:'#6a4aff',color2:'#ffd24a'},
 {n:'Image perso',kind:'image',at:'main',len:40,w:40,rot:0,color:'#ffffff',color2:'#8a5a2b'}];
function drawItem(x,it,pos,ang){
 const L=it.len||34,W=it.w||8,c1=it.color||'#cfd8e6',c2=it.color2||'#8a5a2b';
 x.save();x.translate(pos[0]+(it.ox||0),pos[1]+(it.oy||0));x.rotate(ang*Math.PI/180);x.lineCap='round';x.lineJoin='round';x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1;
 const line=(a,b)=>{x.save();x.strokeStyle=c2;x.lineWidth=4;x.beginPath();x.moveTo(a,0);x.lineTo(b,0);x.stroke();x.restore()};
 const poly=(pts,f)=>{x.fillStyle=f;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.stroke()};
 const dot=(px,r,f)=>{x.fillStyle=f;x.beginPath();x.arc(px,0,r,0,7);x.fill()};
 switch(it.kind){
 case'sword':case'greatsword':case'dagger':line(-8,2);x.fillStyle=c2;x.fillRect(1,-W*.9,4,W*1.8);poly([[5,-W/2],[5+L*.85,-W/2],[5+L,0],[5+L*.85,W/2],[5,W/2]],c1);break;
 case'axe':line(-8,L);poly([[L-W,0],[L-W*.2,-W*1.6],[L+W*.4,-W*1.1],[L+W*.4,W*1.1],[L-W*.2,W*1.6]],c1);break;
 case'hammer':line(-8,L);poly([[L-W,-W*1.2],[L+W*.6,-W*1.2],[L+W*.6,W*1.2],[L-W,W*1.2]],c1);break;
 case'spear':line(-8,L);poly([[L,-W/2],[L+W*2.2,0],[L,W/2]],c1);break;
 case'staff':line(-8,L);dot(L+W*.4,W*.8,c1);x.stroke();break;
 case'club':poly([[-4,-W*.25],[L,-W*.7],[L,W*.7],[-4,W*.25]],c1);break;
 case'torch':line(-8,L);dot(L+W*.3,W*.8,c1);dot(L+W*.3,W*.4,'#ffd24a');break;
 case'shield':dot(L*.25,L/2,c1);x.strokeStyle=c2;x.lineWidth=4;x.beginPath();x.arc(L*.25,0,L/2,0,7);x.stroke();dot(L*.25,L*.14,c2);break;
 case'helmet':x.fillStyle=c1;x.beginPath();x.arc(0,0,11.5,-Math.PI/2,Math.PI/2);x.closePath();x.fill();x.stroke();break;
 case'crown':poly([[8,-9],[8+W*1.2,-7],[8+W*.5,-4],[8+W*1.4,0],[8+W*.5,4],[8+W*1.2,7],[8,9]],c1);break;
 case'hat':x.fillStyle=c2;x.fillRect(5,-16,3,32);poly([[6,-13],[6,13],[6+L,0]],c1);break;
 case'image':if(it.img){const i=getImg(it.img);if(i.complete&&i.naturalWidth)x.drawImage(i,-L*.15,-W/2,L,W)}break}
 x.restore()}
function drawBody(x,px,py,face,po,col,S,items){
 S=S||1;items=items||[];const J=joints(po);
 x.save();x.translate(px,py);x.scale(face*S,S);x.lineCap='round';x.strokeStyle=x.fillStyle=col||'#4aa3ff';
 const Ln=(a,b,w)=>{x.lineWidth=w;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()};
 const IT=at=>{for(const it of items){if(it.show===0||it.at!==at)continue;let pos,ang;
  if(at==='main'){pos=J.hand;ang=po.af+(po.rf||0)}else if(at==='off'){pos=J.handB;ang=po.ab+(po.rb||0)}
  else if(at==='back'){pos=[J.sh[0]-3,J.sh[1]+4];ang=-135+(po.t||0)}else{pos=J.head;ang=-90+(po.t||0)}
  drawItem(x,it,pos,ang+(it.rot||0))}};
 IT('back');x.globalAlpha=.6;Ln(J.hip,J.footB,8);Ln(J.sh,J.handB,7);x.globalAlpha=1;IT('off');
 Ln(J.hip,J.sh,13);Ln(J.hip,J.foot,9);Ln(J.sh,J.hand,8);
 x.beginPath();x.arc(J.head[0],J.head[1],10,0,7);x.fill();x.fillStyle='#000';x.fillRect(J.head[0]+3,J.head[1]-4,3,3);
 IT('main');IT('head');x.restore()}
// ---------- Visuels d'attaque (calques animés)
const FXD={x:20,y:-40,w:60,h:40,rot:0,f0:0,f1:6,color:'#ffffff',color2:'#ffd24a',ease:'out',mx:0,my:0,s0:1,s1:1,a0:1,a1:0,spin:0,n:8,cols:4,rows:1,fps:12};
const FX_KINDS=[['slash','Trait de coup'],['burst','Impact plein'],['ring','Onde de choc'],['star','Étoile'],['cross','Croix d\'impact'],['lines','Lignes de vitesse'],['spark','Étincelles'],['lightning','Éclair'],['flame','Flammes'],['smoke','Fumée'],['trail','Traînée'],['image','Image'],['sheet','Image animée (feuille)']];
const FX_EASE=[['out','Rapide puis lent'],['lin','Linéaire'],['in','Lent puis rapide'],['inout','Doux'],['bounce','Rebond']];
const _e={lin:u=>u,out:u=>1-(1-u)*(1-u),in:u=>u*u,inout:u=>u<.5?2*u*u:1-2*(1-u)*(1-u),bounce:u=>Math.abs(Math.sin(u*Math.PI*1.5))};
const _r=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
function drawLayer(x,v0,face,px,py,t,S){
 const v=Object.assign({},FXD,v0);if(t<v.f0||t>v.f1)return;
 const p=(t-v.f0)/Math.max(1,v.f1-v.f0),e=(_e[v.ease]||_e.out)(p),w=v.w,h=v.h,n=Math.max(2,v.n|0),sc=v.s0+(v.s1-v.s0)*e;
 x.save();x.translate(px+face*(v.x+v.mx*e)*S,py+(v.y+v.my*e)*S);x.scale(face*S,S);x.rotate((v.rot+v.spin*e)*Math.PI/180);x.scale(sc,sc);
 x.globalAlpha=Math.max(0,Math.min(1,v.a0+(v.a1-v.a0)*e));x.lineCap='round';x.lineJoin='round';x.strokeStyle=x.fillStyle=v.color;
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
 case'image':if(v.img){const i=getImg(v.img);if(i.complete&&i.naturalWidth)x.drawImage(i,-w/2,-h/2,w,h)}break;
 case'sheet':if(v.img){const i=getImg(v.img);if(i.complete&&i.naturalWidth){const c=v.cols||1,r=v.rows||1,fw=i.naturalWidth/c,fh=i.naturalHeight/r,f=Math.floor((t-v.f0)*v.fps/60)%(c*r);x.drawImage(i,(f%c)*fw,Math.floor(f/c)*fh,fw,fh,-w/2,-h/2,w,h)}}break}
 x.restore()}
const _fxl=m=>m.fx||(m.vis&&m.vis.kind&&m.vis.kind!=='none'?[m.vis]:[]);
function hasFx(m){return _fxl(m).length>0}
function drawFx(x,m,face,px,py,t,S){S=S||1;for(const v of _fxl(m))drawLayer(x,v,face,px,py,t,S)}
