
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=document.getElementById('ral3d');
const loadEl=document.getElementById('v-load');
const dimEl=document.getElementById('v-dim');
if(cv){
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(38,1,0.05,100);
  const controls=new OrbitControls(cam,cv);
  controls.enableDamping=true;controls.dampingFactor=.06;
  controls.enablePan=false;controls.minDistance=1.2;controls.maxDistance=22;
  controls.maxPolarAngle=Math.PI*.52;

  scene.add(new THREE.HemisphereLight(0xb9bcc8,0x16161a,1.15));
  const key=new THREE.DirectionalLight(0xffffff,2.1);key.position.set(4,6,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xbf1322,1.1);rim.position.set(-6,3,-4);scene.add(rim);
  const fill=new THREE.DirectionalLight(0x8a90a3,.7);fill.position.set(-3,2,6);scene.add(fill);

  // ground
  const grid=new THREE.GridHelper(30,60,0x3a3a3a,0x1e1e1e);
  grid.material.transparent=true;grid.material.opacity=.5;scene.add(grid);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(7,64),
    new THREE.MeshBasicMaterial({color:0xbf1322,transparent:true,opacity:.05}));
  disc.rotation.x=-Math.PI/2;disc.position.y=.001;scene.add(disc);

  // person silhouette (1.75 m) on a canvas texture
  // Draws a standing site worker as a smooth contour line drawing. Shared by the preview and the 3D viewer.
  function drawWorker(c){
    const x=c.getContext('2d'), W=c.width, H=c.height, s=H/1024; x.clearRect(0,0,W,H); x.save(); x.scale(s,s);
    const CX=232;
    // right half contour (dx from centre, y); mirrored for the left. Catmull-Rom smoothed.
    const R=[[0,588],[10,600],[16,700],[18,790],[17,880],[20,950],[24,972],[60,980],[86,984],[90,976],[80,962],[70,948],[72,880],[80,790],[86,700],[88,610],[84,540],
             [76,470],[78,400],[86,330],[90,300],[94,360],[96,440],[94,520],[96,566],[104,584],[114,580],[120,560],[122,520],[126,440],[128,360],[124,290],[114,252],[90,236],[50,224],[30,214],[28,196],
             [42,184],[52,160],[56,132],[58,118]];
    const L=R.slice().reverse().map(([a,b])=>[-a,b]);
    const pts=[...R,...L].map(([a,b])=>[CX+a,b]);
    const spline=(P,closed)=>{x.beginPath();x.moveTo(P[0][0],P[0][1]);const n=P.length;
      for(let i=0;i<(closed?n:n-1);i++){const p0=P[(i-1+n)%n],p1=P[i],p2=P[(i+1)%n],p3=P[(i+2)%n];
        x.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}
      if(closed)x.closePath();};
    x.lineJoin='round';x.lineCap='round';
    // body
    spline(pts,true); const g=x.createLinearGradient(0,120,0,990); g.addColorStop(0,'rgba(255,255,255,.10)'); g.addColorStop(1,'rgba(255,255,255,.03)');
    x.fillStyle=g; x.fill(); x.strokeStyle='#ececec'; x.lineWidth=5; x.stroke();
    // hard hat: dome + brim, ember
    x.beginPath(); x.moveTo(CX-64,118); x.bezierCurveTo(CX-64,48,CX+64,48,CX+64,118); x.closePath(); x.fillStyle='rgba(255,136,60,.18)'; x.fill();
    x.strokeStyle='#ff883c'; x.lineWidth=5; x.stroke();
    x.beginPath(); x.moveTo(CX-78,120); x.lineTo(CX+78,120); x.lineWidth=6; x.stroke();
    x.beginPath(); x.moveTo(CX,58); x.lineTo(CX,116); x.lineWidth=3; x.stroke();
    // details: collar, vest, reflective stripes, belt, inner arms, knees
    x.strokeStyle='rgba(236,236,236,.55)'; x.lineWidth=3;
    [[[CX-30,214],[CX,250],[CX+30,214]],[[CX-86,300],[CX-80,470]],[[CX+86,300],[CX+80,470]],[[CX-2,250],[CX-2,520]]].forEach(P=>{x.beginPath();x.moveTo(...P[0]);P.slice(1).forEach(p=>x.lineTo(...p));x.stroke();});
    x.strokeStyle='#ff883c'; x.lineWidth=7; [380,430].forEach(y=>{x.beginPath();x.moveTo(CX-80,y);x.lineTo(CX+80,y);x.stroke();});
    x.strokeStyle='rgba(236,236,236,.6)'; x.lineWidth=4; x.beginPath(); x.moveTo(CX-78,500); x.lineTo(CX+78,500); x.stroke();
    x.lineWidth=2.5; x.strokeStyle='rgba(236,236,236,.35)'; [[CX-50,790],[CX+50,790]].forEach(([a,b])=>{x.beginPath();x.moveTo(a-22,b);x.quadraticCurveTo(a,b+10,a+22,b);x.stroke();});
    // dimension line, red, with arrows and ticks
    x.strokeStyle='#ff3b30'; x.fillStyle='#ff3b30'; x.lineWidth=4;
    x.beginPath(); x.moveTo(430,52); x.lineTo(430,980); x.stroke();
    [[52,1],[980,-1]].forEach(([y,d])=>{x.beginPath();x.moveTo(400,y);x.lineTo(460,y);x.stroke();x.beginPath();x.moveTo(430,y);x.lineTo(418,y+24*d);x.lineTo(442,y+24*d);x.closePath();x.fill();});
    x.restore();
  }
  
  function personTexture(){const c=document.createElement('canvas');c.width=512;c.height=1024;drawWorker(c);const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;}
  const PERSON_H=1.75;
  const DIA_K=1.22; // displayed number is the rotor diameter; the valve overall is ~22% bigger
  const pTex=personTexture();
  const PH=PERSON_H*1024/932, PW=PH*.5;
  const person=new THREE.Mesh(new THREE.PlaneGeometry(PW,PH),
    new THREE.MeshBasicMaterial({map:pTex,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false}));
  person.position.y=PH/2-PH*40/1024;scene.add(person);
  const pLabel=(()=>{ // small "1.75 m" plate under person
    const c=document.createElement('canvas');c.width=256;c.height=64;
    const x=c.getContext('2d');x.fillStyle='#8e9099';x.font='600 34px Rajdhani,Arial';
    x.textAlign='center';x.fillText('1.75 m',128,44);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,.18),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
    scene.add(m);return m;})();

  // RAL group
  const ralGroup=new THREE.Group();scene.add(ralGroup);
  const steelMat=new THREE.MeshStandardMaterial({color:0xb9bdc7,metalness:.92,roughness:.34});
  let baseSize=1, ready=false, fallback=false;

  function frame(sizeM){
    // place person beside model
    const gap=Math.max(sizeM*.18,.45);
    person.position.x=-(sizeM/2+gap+PERSON_H*.25);
    pLabel.position.set(person.position.x,.12,.45);
    const span=Math.max(sizeM,PERSON_H);
    const d=span*2.05+1.4;
    cam.position.set(d*.78,span*.62+.65,d*.82);
    controls.target.set(-(gap*.4),Math.max(sizeM,PERSON_H)*.42,0);
    controls.update();
  }
  function setSize(mm){
    const m=mm/1000*DIA_K;
    if(ready)ralGroup.scale.setScalar(m/baseSize);
    ralGroup.position.y=0;
    if(ready){
      const bb=new THREE.Box3().setFromObject(ralGroup);
      ralGroup.position.y=-bb.min.y;
    }
    dimEl.innerHTML='&Oslash; <i>'+mm.toLocaleString('en-IN')+'</i> mm';
    frame(m);
  }

  const loader=new STLLoader();
  loader.load('https://raw.githubusercontent.com/shauryamanglik/Ferrous/main/General%20Site%20Media/ral3d.stl',geo=>{
    geo.computeVertexNormals();geo.center();
    const mesh=new THREE.Mesh(geo,steelMat);
    const bb=new THREE.Box3().setFromObject(mesh);
    const sz=new THREE.Vector3();bb.getSize(sz);
    baseSize=Math.max(sz.x,sz.y,sz.z);
    ralGroup.add(mesh);
    ready=true;loadEl.classList.add('done');
    setSize(+slider.value);
  },undefined,()=>{ // fallback: procedural RAL
    fallback=true;
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.62,48),steelMat);
    body.rotation.z=Math.PI/2;g.add(body);
    [-0.34,0.34].forEach(z=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.05,48),steelMat);f.rotation.z=Math.PI/2;f.position.x=z;g.add(f);});
    const hop=new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.42),steelMat);hop.position.y=.62;g.add(hop);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.0,24),new THREE.MeshStandardMaterial({color:0x8f0e19,metalness:.8,roughness:.35}));
    shaft.rotation.z=Math.PI/2;g.add(shaft);
    ralGroup.add(g);baseSize=1.12;ready=true;loadEl.classList.add('done');
    setSize(+slider.value);
  });

  const slider=document.getElementById('v-range');
  const out=document.getElementById('v-out');
  const cue=document.getElementById('v-cue');
  let demo=false;
  function upd(){out.textContent=(+slider.value).toLocaleString('en-IN')+' mm';if(ready)setSize(+slider.value);
    document.querySelectorAll('.viewer-presets button').forEach(b=>b.classList.toggle('on',+b.dataset.mm===+slider.value));}
  slider.addEventListener('input',upd);
  slider.addEventListener('pointerdown',()=>demo=false);
  slider.addEventListener('input',()=>demo=false);
  document.querySelectorAll('.viewer-presets button').forEach(b=>b.addEventListener('click',()=>{demo=false;slider.value=b.dataset.mm;upd();}));
  upd();

  // auto size demo: sweep 2500 -> 400 -> 2500 once on first view, so the slider is obvious
  if(!reduced){
    const shell=cv.closest('.viewer-shell');
    const dIO=new IntersectionObserver(es=>{es.forEach(en=>{
      if(!en.isIntersecting||!ready)return;dIO.disconnect();
      demo=true;const t0=performance.now(),DUR=5600;
      (function sweep(t){
        if(!demo){return}
        const p=Math.min((t-t0)/DUR,1);
        const tri=p<.5?1-p*2:(p-.5)*2;            // 1 -> 0 -> 1
        const ease=tri<.5?2*tri*tri:1-Math.pow(-2*tri+2,2)/2;
        const mm=Math.round((400+(2500-400)*ease)/50)*50;
        slider.value=mm;upd();
        if(p<1)requestAnimationFrame(sweep);else{demo=false;slider.value=2500;upd();}
      })(t0);
    })},{threshold:.45});
    const waitReady=setInterval(()=>{if(ready){clearInterval(waitReady);dIO.observe(shell)}},150);
  }

  function resize(){const r=cv.parentElement.getBoundingClientRect();
    const h=r.width<640?Math.min(r.width*1.0,440):Math.min(r.width*.62,560);
    renderer.setSize(r.width,h);cam.aspect=renderer.domElement.width/renderer.domElement.height;
    cam.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();

  let userTouched=false;
  controls.addEventListener('start',()=>{userTouched=true;if(cue)cue.classList.add('gone');});
  (function anim(){requestAnimationFrame(anim);
    if(!userTouched&&ready)ralGroup.rotation.y+=.0035;
    person.quaternion.copy(cam.quaternion);person.rotation.x=0;person.rotation.z=Math.sin(performance.now()*.0011)*.012;person.position.y=PH/2-PH*40/1024+Math.sin(performance.now()*.0018)*.006;
    controls.update();renderer.render(scene,cam);})();
}
