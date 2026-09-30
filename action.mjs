// A small original side-scrolling port stage. All art is drawn on the canvas.
export function setupPortAction({onWin,onClose,onPunch}){
 const panel=document.getElementById('port-action');
 const canvas=document.getElementById('port-canvas');
 const ctx=canvas.getContext('2d');
 const status=document.getElementById('port-status');
 const controls={left:false,right:false};
 const world=1500,view=960,ground=294;
 let player,enemies,open=false,finished=false,frame=0,last=0,damageFlash=0,score=0;
 const roster=[
  {type:'ヤクザ',x:470,hp:2,speed:76,color:'#30343c',line:'港の場所代、払ってもらおうか！'},
  {type:'おばちゃん',x:900,hp:3,speed:91,color:'#a34581',line:'その場所、私が先に見つけたのよ！'},
  {type:'警官',x:1310,hp:3,speed:82,color:'#38618f',line:'ちょっと！ 港で騒いでいるのは君か！'}
 ];
 function reset(){
  player={x:110,y:0,vy:0,face:1,hp:6,invuln:0,punchCd:0,punchTime:0};
  enemies=roster.map(e=>({...e,maxHp:e.hp,cd:0,stun:0,active:false,dead:false}));
  finished=false;score=0;last=0;damageFlash=0;controls.left=false;controls.right=false;
  document.getElementById('port-result').hidden=true;
  status.textContent='← → 移動　ジャンプで避けて、パンチで進もう。';
 }
 function start(){
  if(open)return;
  reset();open=true;panel.hidden=false;
  document.getElementById('port-left').focus();
  frame=requestAnimationFrame(loop);
 }
 function close(){
  if(!open)return;
  open=false;cancelAnimationFrame(frame);controls.left=false;controls.right=false;
  panel.hidden=true;onClose?.();
 }
 function jump(){
  if(!open||finished||player.y!==0)return;
  player.vy=390;player.y=.01;
 }
 function punch(){
  if(!open||finished||player.punchCd>0)return;
  player.punchCd=.32;player.punchTime=.18;onPunch?.();
  let hit=false;
  for(const e of enemies){
   const dx=e.x-player.x;
   if(e.dead||Math.abs(dx)>76||dx*player.face < -16)continue;
   e.hp--;e.stun=.35;e.x=Math.max(24,Math.min(world-30,e.x+player.face*24));hit=true;
   if(e.hp<=0){e.dead=true;score++;status.textContent=e.type+'「参った！」　あと'+(enemies.length-score)+'人';}
   else status.textContent=e.type+'にパンチ！';
   break;
  }
  if(!hit)status.textContent='空振り。少し近づこう。';
  if(score===enemies.length)win();
 }
 function win(){
  finished=true;
  status.textContent='港を突破！';
  const reward=onWin?.()||'港を突破した！';
  document.getElementById('port-result-text').textContent=reward;
  document.getElementById('port-result').hidden=false;
 }
 function lose(){
  finished=true;status.textContent='押し戻された。もう一度挑める。';
  document.getElementById('port-result-text').textContent='おじさんが安全な場所まで引き上げてくれた。所持金と釣果はそのまま。';
  document.getElementById('port-result').hidden=false;
 }
 function update(dt){
  if(finished)return;
  player.invuln=Math.max(0,player.invuln-dt);
  player.punchCd=Math.max(0,player.punchCd-dt);
  player.punchTime=Math.max(0,player.punchTime-dt);
  damageFlash=Math.max(0,damageFlash-dt);
  const move=(controls.right?1:0)-(controls.left?1:0);
  if(move){player.face=move;player.x=Math.max(28,Math.min(world-30,player.x+move*200*dt));}
  if(player.y>0||player.vy>0){player.y+=player.vy*dt;player.vy-=950*dt;if(player.y<=0){player.y=0;player.vy=0;}}
  for(const e of enemies){
   if(e.dead)continue;
   e.cd=Math.max(0,e.cd-dt);e.stun=Math.max(0,e.stun-dt);
   const dx=player.x-e.x;
   if(Math.abs(dx)<260&&!e.active){e.active=true;status.textContent=e.type+'「'+e.line+'」';}
   if(!e.active||e.stun>0)continue;
   if(Math.abs(dx)>37)e.x+=Math.sign(dx)*e.speed*dt;
   else if(e.cd===0&&player.invuln===0&&player.y<28){
    e.cd=1.25;player.hp--;player.invuln=1.1;damageFlash=.16;
    status.textContent=e.type+'の体当たり！　残り体力 '+player.hp;
    if(player.hp<=0){lose();break;}
   }
  }
 }
 function rectangle(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function person(x,color,type,face=1,hit=false,offset=0){
  const sx=Math.round(x);const foot=ground-Math.round(offset);
  if(type==='警官'){rectangle(sx-13,foot-64,26,8,'#172d44');rectangle(sx-9,foot-72,18,8,'#365a8a');}
  else if(type==='おばちゃん'){rectangle(sx-14,foot-64,28,12,'#42283e');rectangle(sx-6,foot-70,12,8,'#503047');}
  else rectangle(sx-10,foot-70,20,8,'#20232b');
  rectangle(sx-9,foot-58,18,17,'#e0b796');
  rectangle(sx-16,foot-41,32,28,hit?'#ffe0a3':color);
  rectangle(sx-11,foot-13,9,13,'#242b36');rectangle(sx+2,foot-13,9,13,'#242b36');
  rectangle(sx+face*14-4,foot-39,9,8,'#e0b796');
  if(type==='おばちゃん')rectangle(sx+face*18-4,foot-26,14,13,'#d7a652');
  if(type==='ヤクザ')rectangle(sx-7,foot-51,14,3,'#111c27');
  if(type==='警官')rectangle(sx-7,foot-50,5,4,'#f2df93');
 }
 function draw(){
  const camera=Math.max(0,Math.min(world-view,player.x-300));
  const sky=ctx.createLinearGradient(0,0,0,ground);sky.addColorStop(0,'#72b8d8');sky.addColorStop(.72,'#c5d8d0');sky.addColorStop(1,'#6ba2ab');
  ctx.fillStyle=sky;ctx.fillRect(0,0,view,360);
  for(let x=0;x<view;x+=80)rectangle(x,72+(x%240?10:0),55,7,'#e4ebd8');
  rectangle(0,190,view,90,'#2a86a5');
  for(let x=-(camera*.28)%100;x<view;x+=100){rectangle(x,232,66,4,'#9ecbd0');rectangle(x+38,253,42,3,'#6cb7c1');}
  for(let x=220;x<world;x+=360){
   const sx=x-camera;rectangle(sx,147,86,43,'#435d69');rectangle(sx+19,129,48,18,'#bdc5b7');rectangle(sx+32,173,17,17,'#183c50');
  }
  rectangle(0,ground,view,66,'#755c45');rectangle(0,ground,view,8,'#c19b6c');
  for(let x=-(camera%74);x<view;x+=74)rectangle(x,ground+15,3,49,'#5a493d');
  for(let x=120;x<world;x+=320){
   const sx=x-camera;rectangle(sx,ground-24,34,24,'#ae8550');rectangle(sx+7,ground-33,23,9,'#8f704d');
  }
  for(const e of enemies){if(e.dead)continue;const sx=e.x-camera;if(sx<-40||sx>view+40)continue;
   person(sx,e.color,e.type,Math.sign(player.x-e.x)||1,e.stun>0);
   rectangle(sx-18,ground-84,36,5,'#253542');rectangle(sx-18,ground-84,36*(e.hp/e.maxHp),5,'#d8a960');
   ctx.fillStyle='#102d3f';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText(e.type,sx,ground-92);
  }
  if(player.invuln===0||Math.floor(player.invuln*12)%2===0){
   person(player.x-camera,'#2c6679','主人公',player.face,player.punchTime>0,player.y);
   if(player.punchTime>0)rectangle(player.x-camera+player.face*20-6,ground-42-player.y,22,10,'#f5dfbd');
  }
  // The jump is drawn separately as an offset by moving the player pixels above the ground.
  if(player.y>0){
   rectangle(player.x-camera-19,ground-2,38,3,'#493d35');
  }
  if(damageFlash>0)rectangle(0,0,view,360,'#e8786466');
  rectangle(0,0,view,38,'#082f42d9');
  ctx.fillStyle='#fff0c6';ctx.font='bold 18px sans-serif';ctx.textAlign='left';
  ctx.fillText('体力 '+ '♥'.repeat(player.hp)+'♡'.repeat(6-player.hp),18,26);
  ctx.textAlign='right';ctx.fillText('残り '+(enemies.length-score)+'人',view-18,26);
 }
 function loop(now){
  if(!open)return;
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  if(!document.hidden)update(dt);
  draw();
  frame=requestAnimationFrame(loop);
 }
 for(const [id,key] of [['port-left','left'],['port-right','right']]){
  const button=document.getElementById(id);
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);controls[key]=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>controls[key]=false);
 }
 document.getElementById('port-jump').onclick=jump;
 document.getElementById('port-punch').onclick=punch;
 document.getElementById('port-close').onclick=close;
 document.getElementById('port-retry').onclick=()=>{reset();document.getElementById('port-left').focus();};
 document.getElementById('port-exit').onclick=close;
 document.addEventListener('keydown',e=>{
  if(!open)return;
  if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','j','Escape'].includes(e.key))e.preventDefault();
  if(e.key==='ArrowLeft'||e.key==='a')controls.left=true;
  if(e.key==='ArrowRight'||e.key==='d')controls.right=true;
  if(e.key==='ArrowUp'||e.key==='w')jump();
  if(e.key===' '||e.key==='j')punch();
  if(e.key==='Escape')close();
 });
 document.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key==='a')controls.left=false;
  if(e.key==='ArrowRight'||e.key==='d')controls.right=false;
 });
 window.addEventListener('blur',()=>{controls.left=false;controls.right=false;});
 return {open:start,close,isOpen:()=>open};
}
