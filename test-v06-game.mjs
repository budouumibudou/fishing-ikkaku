import {setupExtras} from './test-v06-extras.mjs?v=0.7.3-test1';
import {setupVoyage,SEA_SPRITES} from './test-v06-voyage.mjs?v=0.7.3-test1';
import {Soundtrack,musicScene} from './test-v06-music.mjs?v=0.7.3-test1';
import {SPRITES} from './test-v06-sprites.mjs?v=0.7.3-test1';
import {setupPortAction} from './test-v06-action.mjs?v=0.7.3-test1';
import {ITEMS,BY_ID,FRIENDS,DIALOGUES,SMALLTALK,CAPTAIN_TALK} from './test-v06-data.mjs?v=0.7.3-test1';
import {STORAGE_KEY as LIVE_STORAGE_KEY,fresh,hydrate,availableStory,readStory,successWidth,beginCast,completeCast,resolveBlackBream,sell,sellAll,buy,ROD_PRICES,criticalWidth,keepAji,storeCatch,dryStarfish,encodeBackup,decodeBackup,voyageAction,canVisitBerth,canSail,canPractice,canMeetDeity,knowsRumor,portVictory,EDIBLE,eatCatch} from './test-v06-core.mjs?v=0.7.3-test1';
const STORAGE_KEY=LIVE_STORAGE_KEY+'-preview-v06';
const PRIOR_TEST_KEY=LIVE_STORAGE_KEY+'-preview-v05';
const $=id=>document.getElementById(id);
let s=fresh(),storageOk=true,saveBlocked=false,unreadableSave='',loadNote='';
try{
 const raw=localStorage.getItem(STORAGE_KEY)??localStorage.getItem(PRIOR_TEST_KEY)??localStorage.getItem(LIVE_STORAGE_KEY+'-preview');
 if(raw){s=decodeBackup(raw);loadNote='以前のテスト記録を読み込みました。';}
}catch(error){saveBlocked=true;storageOk=false;try{unreadableSave=localStorage.getItem(STORAGE_KEY)||localStorage.getItem(PRIOR_TEST_KEY)||localStorage.getItem(LIVE_STORAGE_KEY+'-preview')||'';}catch{}loadNote=error.message;}
let phase='idle',elapsed=0,waitTime=3,needle=0,lastFrame=0,active=false,toastTimer,lastChat=-1,shopTab='sell',audio=null,waves=null,music=null,endingPreview=false;
const quantities=new Map();let stockTab='deposit',previewNext=null,lastCaptainChat=-1,lastNotice='';
function iconArt(body){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="crispEdges">'+body+'</svg>');}
const sprites={...SPRITES,...SEA_SPRITES,gold:'test-v06-gold-fixed.png',black_bream:'test-v06-black-bream-fixed.png',sea_grapes:'test-v06-sea_grapes.png',aori_squid:'test-v06-aori_squid.png',playerJacket:'test-v06-player_jacket.png',captain:'test-v06-captain.png',
 sandal:'test-v06-sandal.png',police:'test-v06-police.png',uncleJacket:'test-v06-uncle_jacket.png',
 ballpen:'test-v06-ballpen.png',octopus:'test-v06-octopus.png',sealed_book:'test-v06-sealed_book.png'};
sprites.dried_starfish=sprites.starfish;
function save(){
 if(saveBlocked){$('save-note').textContent='元の記録を保護中。復元または書き出してください';return false;}
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));storageOk=true;}catch{storageOk=false;}
 $('save-note').textContent=storageOk?'テスト用の記録に保存':'保存できません。バックアップを取ってください';return storageOk;
}
function toast(text){const feedback=$('modal-feedback');if($('modal').open){feedback.textContent=text;feedback.hidden=false;} $('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function log(text){$('log').textContent=text;}
function image(src,alt,cls=''){return `<img src="${src||''}" alt="${alt}" class="${cls}">`;}
let startupStep='素材を配置';
function assets(){
 // Sprite PNGs are already embedded. Let actual DOM images render them directly.
 // Do not depend on Image(), URL bases, canvas, or a preloading gate.
 for(const id of ['player','neighbor','bobber']){$(id).src=sprites[id];$(id).hidden=false;}
 $('harbor-background').src='test-v06-harbor.png';$('black-fish').src=sprites.black_bream;$('ending-fish').src=sprites.ending;
 startupStep='釣り場の画面を準備';
 render();
 startupStep='開始ボタンを準備';
 $('start').disabled=false;$('start').textContent=s.castCount||s.readDialogueIds.length?'つづきから釣る':'釣り場へ';
 $('startup-error').hidden=!saveBlocked;if(saveBlocked){$('startup-error').textContent=loadNote;$('start').disabled=true;}else if(loadNote)log(loadNote);
}
function soundInit(){if(!s.settings.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});music??=new Soundtrack(audio);music.enabled=true;syncMusic();if(!waves){const b=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);let previous=0;const data=b.getChannelData(0);for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.08-.04)*.985;data[i]=previous;}const source=audio.createBufferSource();source.buffer=b;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;const gain=audio.createGain();gain.gain.value=.055;source.connect(filter).connect(gain).connect(audio.destination);source.start();waves={source,gain};}}catch{toast('この環境では音を再生できません。');}}
function syncMusic(){if(!music)return;music.setScene(musicScene(active,phase,!$('ending').hidden||!$('true-ending').hidden||(active&&s.endingPending),s.location));}
function effect(name){try{music?.effect(name);}catch{}}
function soundToggle(){s.settings.sound=!s.settings.sound;if(s.settings.sound)soundInit();else{music?.mute();audio?.suspend().catch(()=>{});}save();render();}
function render(){
 syncMusic();
 $('title-sound').textContent=s.settings.sound&&audio?'♪ 音あり · タップでオフ':'♪ 音楽をオンにする';
 $('money').innerHTML=s.money.toLocaleString('ja-JP')+' <small>G</small>';$('casts').textContent=s.castCount+' 投目';
 $('sound').setAttribute('aria-pressed',String(s.settings.sound));$('sound').setAttribute('aria-label',s.settings.sound?'音をオフにする':'音をオンにする');$('sound').style.opacity=s.settings.sound?'1':'.65';
 document.body.classList.toggle('reduce-motion',!s.settings.motion);
 $('book-count').textContent=s.discovered.filter(id=>BY_ID[id]&&!BY_ID[id].secret).length+'/'+ITEMS.filter(it=>!it.secret).length;$('friend-label').textContent=s.location==='berth'?'船長に釣果を見せる':FRIENDS[s.friendStage];$('friend-person').textContent=s.location==='berth'?'船着場の船長':s.location==='sea'?'同乗中のおじさん':'隣のおじさん';
 $('port').lastElementChild.textContent='港の裏通り・遊ぶ';
 document.body.classList.toggle('at-sea',s.location==='sea');document.body.classList.toggle('at-berth',s.location==='berth');$('player').src=s.location==='sea'?sprites.playerJacket:sprites.player;$('neighbor').hidden=s.location==='berth';
 $('boat-scene-image').src=s.boatLevel===2?'test-v06-boat_scene_upgrade.png':'test-v06-boat_scene.png';
 $('sea-uncle').src=sprites.uncleJacket;
 $('harbor-background').src=s.location==='berth'?'test-v06-berth.png':'test-v06-harbor.png';
 $('line').setAttribute('d',s.location==='sea'?'M547 159 Q630 285 731 414':'M557 241 Q580 340 665 388');
 document.querySelector('.location').textContent=s.location==='sea'?(s.boat?(s.boatLevel===2?'沖の岩礁 · 改装した一獲丸':'沖の岩礁 · 一獲丸'):'沖の岩礁 · 船長の船'):(s.location==='berth'?'港の船着場':'波止場の昼下がり');
 $('voyage').textContent=s.location==='sea'?'船の受付・帰港':s.location==='berth'?'船長・船の受付':'船の受付';
 const story=availableStory(s);$('talk-dot').hidden=!story;$('talk-label').textContent=s.location==='berth'?(story==='berthGold'?'！ 船長に金塊を見せる':'船長と話す'):story?'！ 新しい話あり':s.location==='sea'?'おじさんと話す':'おじさんと話す';$('gold-dot').hidden=!(s.inventory.gold>0);
 const next=[6,15,25][s.friendStage];$('friend-fill').style.width=(s.friendStage===3?100:Math.min(100,s.castCount/next*100))+'%';
 $('friend-hint').textContent=s.location==='berth'?(s.berthGoldReady?'船長が出航を許してくれた。受付へ。':'金塊を釣って船長に見せよう。3投目には大きな当たりが来る。'):story?'新しい話があります。上の案内を押すと、この場で聞けます。':s.location==='sea'?'おじさんも同乗中。話したくなったら声をかけよう。':s.friendStage===3?'気負わずに、今日も隣で釣ろう。':`あと${Math.max(0,next-s.castCount)}投で、次の話を聞けそう。`;
 $('rod-label').textContent=['初心者の竿','扱いやすい竿','なじんだ竿','大物用の竿'][s.rodLevel]+(s.mealCasts>0?' · 食事あと'+s.mealCasts+'投':'');
 $('rare-bait-option').textContent=`珍味の餌 · ${s.baitCount}個`;$('rare-bait-option').disabled=s.baitCount===0;
 $('live-bait-option').textContent=`生きたアジ · ${s.liveBaitCount}匹`;$('live-bait-option').disabled=s.liveBaitCount===0;if((!s.baitCount&&s.settings.bait==='rare')||(!s.liveBaitCount&&s.settings.bait==='live_aji'))s.settings.bait='base';for(const [id,key,label] of [['krill','krillCount','オキアミ'],['sage','sageCount','賢者の餌'],['pork_fat','fatCount','豚の脂身']]){const option=$(id+'-bait-option');option.textContent=label+' · '+s[key]+'個';option.disabled=s[key]<1;option.hidden=id==='sage'&&s[key]<1;if(s.settings.bait===id&&s[key]<1)s.settings.bait='base';}$('bait').value=s.settings.bait;
 const entries=ITEMS.filter(it=>(s.inventory[it.id]||0)>0);const value=entries.reduce((n,it)=>n+it.price*s.inventory[it.id],0);
 $('pocket-value').textContent=value.toLocaleString('ja-JP')+' G';$('pocket-list').innerHTML=entries.length?entries.map(it=>`<button class="pocket-item" data-pocket="${it.id}">${image(sprites[it.id],it.name)}<span>${it.name}<br>×${s.inventory[it.id]}</span></button>`).join(''):'まだ空っぽ。次の一投を。';document.querySelectorAll('[data-pocket]').forEach(btn=>btn.onclick=()=>showPocketItem(btn.dataset.pocket));
 $('goal-title').textContent=s.trueEndingSeen?'今日も、この港で。':s.location==='sea'?(s.catchCounts.kue>0?'船長と、金塊の噂が始まった岩礁へ。':'沖の岩礁で、大物クエを狙おう。'):s.location==='berth'&&!s.berthGoldReady?'船着場で金塊を釣り、船長に見せよう。':!knowsRumor(s)?(s.friendStage===0?'まずは波止場で妙な釣果を見せよう。':'おじさんと釣り、船着場の噂を聞こう。'):!s.portCleared?'港の裏通りを抜けて船着場へ。':!s.berthGoldReady?'受付から船着場へ。金塊を探そう。':'受付からおじさんと船へ。';
 $('goal-eyebrow').textContent='今日のねらい';
 $('tutorial-badge').hidden=s.castCount>=3;$('tutorial-badge').textContent=`練習 ${Math.min(3,s.castCount+1)} / 3`;
 $('reef-entry').hidden=!canMeetDeity(s);
 const busy=phase!=='idle';for(const id of ['talk','shop','buy-shop','reef-entry','book','port','voyage','bait','settings','home-stock','save-menu'])$(id).disabled=busy;
 $('port').disabled=busy;
 $('fish').disabled=!active||['result','black','action','squid_wait','octopus_hold'].includes(phase);$('meter').hidden=phase!=='reeling';
 $('fish').classList.toggle('bite',phase==='bite');$('scene').classList.toggle('bite-scene',phase==='bite');
 if(phase==='idle'){$('fish').textContent='釣り糸を投げる';$('phase-label').textContent='のんびり、糸を垂らそう。';$('caption').textContent='今日も、何かが釣れる。';}
 else if(phase==='waiting'){$('fish').textContent='ウキを見守る…';$('phase-label').textContent='沈んだら、タップ。';$('caption').textContent=s.pendingCast?.safe&&s.pendingCast.id==='gold'?(s.location==='berth'?'船長「その重さだ。ゆっくり。」':'おじさん「その重さだ。ゆっくり。」'):'しばらく、海を見ていよう。';}
 else if(phase==='bite'){$('fish').textContent='今！ 合わせる';$('phase-label').textContent='ウキが沈んだ！';$('caption').textContent='今！';}
 else if(phase==='octopus_hold'){$('fish').textContent='底から離れるのを待つ…';$('phase-label').textContent='タコが岩に張りついた。少し待とう。';$('caption').textContent='竿を構えて、離れる瞬間を待つ。';}
 else if(phase==='squid_wait'){$('fish').textContent='食い込むまで、ひと呼吸…';$('phase-label').textContent='アジを抱いた！ あわてず待とう。';$('caption').textContent='アオリイカがアジを抱いている。';}
 else if(phase==='reeling'){$('fish').textContent='引き上げる！';$('phase-label').textContent=s.pendingCast?.safe?'練習中は、いつ押しても大丈夫。':'緑で成功。中央の金色でクリティカル！';$('caption').textContent='何か、かかった。';const width=successWidth(s);$('safe-zone').style.width=width*100+'%';$('safe-zone').style.left=(1-width)*50+'%';const cw=criticalWidth(s);$('critical-zone').style.width=cw*100+'%';$('critical-zone').style.left=(1-cw)*50+'%';}
 updateStoryNotice();save();
}
function setPhase(value){phase=value;elapsed=0;render();}

function updateStoryNotice(){
 const story=availableStory(s),ready=!!story&&phase==='idle'&&active;
 $('story-bubble').hidden=!ready;$('story-notice').hidden=!ready;
 if(ready){const subject=s.location==='berth'&&story==='berthGold'?'船長が金塊を見ている':s.location==='sea'?'同乗中のおじさんに新しい話':'おじさんに新しい話';$('story-bubble').innerHTML='<span>！</span> '+subject;$('story-notice-title').textContent='！ '+subject;$('story-notice-detail').textContent='タップして会話を聞く';}
 $('talk').classList.toggle('has-news',ready);
}
function talkNow(){
 if(phase!=='idle')return;
 const id=availableStory(s);
 if(id){dialogue(id);return;}
 if(s.location==='berth'){dialogue([['船長',s.berthGoldReady?'救命胴衣を用意した。受付から出航できるよ。':'この辺りで重いものが沈んだ。釣れたら見せてくれ。']]);return;}
 if(s.location==='sea'){lastCaptainChat=(lastCaptainChat+1)%(CAPTAIN_TALK.length+2);if(lastCaptainChat<CAPTAIN_TALK.length)dialogue(CAPTAIN_TALK[lastCaptainChat]);else dialogue(lastCaptainChat===CAPTAIN_TALK.length?[[ '隣のおじさん','波止場じゃ見られない魚がいるね。船長の舵は確かだ。'],['あなた','一緒に来てくれて、心強いです。']]:[['あなた','こんな遠くまで来るとは。'],['隣のおじさん','最初のヒトデから、ずいぶん釣ったね。帰ったらまた隣を空けておくよ。']]);return;}
 const chats=SMALLTALK.filter((_,i)=>i!==3||s.discovered.includes('grapes'));lastChat=(lastChat+1)%chats.length;dialogue(chats[lastChat]);
}
$('story-bubble').onclick=talkNow;
$('story-notice').onclick=talkNow;
const extras=setupExtras({getState:()=>s,modal:openModal,commit:()=>{save();render();},toast});
function showMenu(){
 if(phase!=='idle')return;
 const shore=s.location==='harbor',hasStory=!!availableStory(s);
 openModal(shore?'波止場のメニュー':s.location==='berth'?'船着場のメニュー':'船上のメニュー',`<div class="menu-grid"><button id="menu-people" class="small-btn" ${shore&&s.seaIntroRead?'':'disabled'}>ほかの釣り人と話す</button><button id="menu-challenge" class="small-btn">10投チャレンジ・端末内記録</button><button id="menu-talk" class="small-btn gold">${hasStory?'！ 新しい話を聞く':s.location==='berth'?'船長と話す':'おじさんと話す'}</button><button id="menu-book" class="small-btn">釣果図鑑</button><button id="menu-voyage" class="small-btn">${shore?'船の受付':'船の受付・移動'}</button><button id="menu-shop" class="small-btn" ${shore?'':'disabled'}>売る・買う${shore?'':'（波止場で）'}</button><button id="menu-port" class="small-btn">港の裏通り・アクション</button><button id="menu-stock" class="small-btn" ${shore?'':'disabled'}>家の保管箱${shore?'':'（波止場で）'}</button><button id="menu-backup" class="small-btn">セーブのバックアップ</button><button id="menu-settings" class="small-btn">設定・試遊用ボタン</button></div><p class="modal-desc menu-summary">手元の釣果：${$('pocket-list').textContent}<br>売却額：${$('pocket-value').textContent}</p>`);
 const actions={people:extras.people,challenge:extras.competition,talk:talkNow,book:showBook,voyage:()=>voyage.menu(),shop:()=>{shopTab='sell';showShop();},port:openPort,stock:showStock,backup:showBackup,settings:showSettings};
 for(const [id,fn] of Object.entries(actions))$('menu-'+id).onclick=()=>{modalCloseAction=null;$('modal').close();$('modal-body').innerHTML='';fn();};
}
$('menu-open').onclick=showMenu;

function openModal(title,html,onClose=null){mandatoryDialogue=false;$('close-modal').hidden=false;$('modal-feedback').hidden=true;$('modal-title').textContent=title;$('modal-body').innerHTML=html;modalCloseAction=onClose;if(!$('modal').open)$('modal').showModal();}
let modalCloseAction=null,closing=false,mandatoryDialogue=false;
function closeModal(force=false){if(mandatoryDialogue&&force!==true)return;if(closing)return;closing=true;const cb=modalCloseAction;modalCloseAction=null;$('modal').close();$('modal-body').innerHTML='';setTimeout(()=>{closing=false;cb?.();updateStoryNotice();},40);}
$('close-modal').onclick=closeModal;$('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
function dialogue(idOrLines,onEnd,mandatory=false){
 const id=typeof idOrLines==='string'?idOrLines:null;
 const lines=id?(id==='friend2'&&!s.discovered.includes('grapes')?DIALOGUES.friend2BeforeGrapes:DIALOGUES[id]):idOrLines;
 if(!Array.isArray(lines)||!lines.length){onEnd?.();return;}
 let page=0,advancing=false,finished=false;
 const finish=()=>{
  if(finished)return;finished=true;
  if(id){readStory(s,id);if(id.startsWith('friend')){
   const text={friend1:'おじさんと釣り仲間になった。引き上げが少し楽になった。',friend2:'常連同士になった。金塊の噂を聞ける。',friend3:'おじさんとの仲が深まった。'}[id];
   toast(text);log(text);
  }}
  render();onEnd?.();
 };
 // Keep the same dialog, portrait nodes and next button for the whole conversation.
 // Never replace a tapped button or recreate the dialog between lines.
 openModal(s.location==='sea'?'船上の会話':s.location==='berth'?'船着場の会話':'波止場の会話','<div class="dialogue"><div class="dialogue-portraits"><img id="chat-player" alt="あなた"><img id="chat-neighbor" alt="隣のおじさん" hidden></div><div class="speech"><p id="chat-speaker" class="speaker"></p><p id="chat-words" class="words"></p></div></div><div class="dialogue-footer"><small id="chat-page"></small><button type="button" class="small-btn gold" id="dialogue-next">つづきを聞く</button></div>',()=>{if(page===lines.length-1||id==='clear')finish();});
 mandatoryDialogue=mandatory;$('close-modal').hidden=mandatory;
 $('chat-player').src=sprites.player;$('chat-neighbor').src=sprites.neighbor;
 function paint(){
  const [who,text]=lines[page];
  $('chat-neighbor').src=who==='船長'?sprites.captain:who==='チヌ神'?sprites.black_bream:who==='警官'?sprites.police:(s.location==='sea'?sprites.uncleJacket:sprites.neighbor);$('chat-neighbor').alt=who;
  $('chat-player').hidden=who!=='あなた';$('chat-neighbor').hidden=who==='あなた';
  $('chat-speaker').textContent=who;$('chat-words').textContent=text;
  $('chat-page').textContent=(page+1)+' / '+lines.length;
   $('dialogue-next').textContent=page===lines.length-1?(id==='clear'?'港へ帰る · エンディングへ':'会話を終える'):'つづきを聞く';
 }
 paint();
 $('dialogue-next').onclick=()=>{
  if(advancing||finished||closing)return;
  advancing=true;const button=$('dialogue-next');button.disabled=true;effect('page');
  if(page===lines.length-1){mandatoryDialogue=false;closeModal(true);return;}
  page++;paint();
  setTimeout(()=>{advancing=false;if($('dialogue-next')===button)button.disabled=false;},180);
 };
}
$('start').onclick=()=>{active=true;$('title-screen').hidden=true;soundInit();if(s.deityPending){voyage.trial();return;}if(s.endingPending){showEndingIntro(true);return;}if(s.pendingBlack){setPhase('black');showBlackDialogue(s.pendingBlack);return;}if(s.pendingCast){setPhase('waiting');waitTime=2.5;log('さっきの一投から再開します。');return;}if(s.actOnePending){showActOne();return;}if(s.goldBridgePending){showGoldBridge();return;}render();if(s.location==='harbor'&&!s.readDialogueIds.includes('intro'))dialogue('intro',()=>log('「釣り糸を投げる」から始めよう。最初の3投は練習です。'));};
$('home').onclick=e=>{e.preventDefault();if(phase!=='idle'){toast('この一投が終わってから戻ろう。');return;}active=false;$('title-screen').hidden=false;$('start').textContent='つづきから釣る';render();};
$('sound').onclick=soundToggle;$('title-sound').onclick=()=>{if(s.settings.sound&&!audio){soundInit();render();}else soundToggle();};
$('bait').onchange=()=>{s.settings.bait=$('bait').value;save();};
$('fish').onclick=()=>{
 if(!active||$('modal').open||saveBlocked)return;soundInit();
 if(phase==='idle'){if(s.actOnePending){showActOne();return;}if(s.goldBridgePending){showGoldBridge();return;}if(s.endingPending){showEndingIntro();return;}try{beginCast(s);if(previewNext){s.pendingCast={id:previewNext,safe:true,eligible:false,preview:true};previewNext=null;}waitTime=2+Math.random()*2;setPhase('waiting');effect('cast');}catch(error){toast(error.message);}}
 else if(phase==='bite'){effect('hook');needle=0;setPhase(s.pendingCast?.id==='aori_squid'?'squid_wait':s.pendingCast?.id==='octopus'?'octopus_hold':'reeling');}
 else if(phase==='reeling'){const width=successWidth(s);finishCast(s.pendingCast?.safe||Math.abs(needle-.5)<=width/2,Math.abs(needle-.5)<=criticalWidth(s)/2);}
};
function finishCast(success,critical=false){
 const result=completeCast(s,success,success&&critical);if(!result)return;save();
 if(result.kind==='black'){setPhase('black');$('black-event').hidden=false;$('player').src=sprites.playerSurprise;$('neighbor').src=sprites.neighborSurprise;effect('black');currentBlack=result;return;}
 if(result.id==='gold'&&s.actOnePending){setPhase('idle');showActOne();return;}
 showResult(result);
}
let currentBlack=null;
function showBlackDialogue(encounter){
 $('black-event').hidden=true;let question=0;
 const finish=choice=>{if(!s.pendingBlack)return;modalCloseAction=null;if($('modal').open)$('modal').close();const result=resolveBlackBream(s,choice);save();showResult(result);};
 const questions=[{line:'この海で、いちばん偉いのは誰だ。',answers:[['海です',true],['私です',false]]},{line:'釣ったものは、どう受け取る。',answers:[['海から、いただいたものです',true],['全部、私のものです',false]]}];
 function paint(){const q=questions[question];openModal('黒鯛との会話',`<div class="result black-talk">${image(sprites.black_bream,'黒鯛')}<h3>黒鯛「${q.line}」</h3><p>${encounter.protected?'初めての会話。今回は竿も釣果も失いません。':'普通の会話で怒らせると竿の強化が一段階下がります。手元の釣果・生き餌・所持金は減りません。'}</p><div class="choice-list">${q.answers.map(([label],i)=>`<button class="small-btn" data-answer="${i}">${label}</button>`).join('')}<button id="release-now" class="small-btn">話さずリリース（ほかの釣果は残す）</button>${s.rodBreakCount>=10?'<button id="black-repel" class="small-btn gold">10本の借りを返す！ 黒鯛をシバいて追い返す</button>':''}${encounter.protected?'':'<button id="black-risk" class="small-btn danger">強気に交渉する（失敗すると竿が一段階下がる）</button>'}</div></div>`,()=>finish('release'));
 document.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>{if(q.answers[Number(btn.dataset.answer)][1]){if(++question===questions.length)finish('peace');else paint();}else finish(encounter.protected?'release':'anger');});
 $('release-now').onclick=()=>finish('release');if($('black-repel'))$('black-repel').onclick=()=>finish('repel');
 if($('black-risk'))$('black-risk').onclick=()=>{openModal('危険を承知で交渉しますか？',`<p class="modal-desc">成功すれば黒鯛が仲間を呼び、2匹を持ち帰れます。<br>失敗の確率は半分。竿の強化が一段階下がります。釣果・生き餌・所持金・家の保管品は減りません。予備の竿はすぐ借りられます。</p><div class="row-buttons"><button id="risk-no" class="small-btn">やめて会話へ</button><button id="risk-yes" class="small-btn danger">承知して交渉する</button></div>`,()=>finish('release'));$('risk-no').onclick=paint;$('risk-yes').onclick=()=>finish('gamble');};
 }paint();
}
function showResult(result){
 $('black-event').hidden=true;$('player').src=sprites.player;$('neighbor').src=sprites.neighbor;setPhase('result');
 const helper=s.location==='berth'?'船長':'おじさん';
 let html,title;
 if(result.kind==='escape'){effect('escape');title='逃げられた……';html='<div class="result"><h3>また、次の一投。</h3><p>ウキが沈んだら合わせて、目印が緑の帯に入ったら引き上げよう。<br>設定の「ゆっくり釣り」でも遊べます。</p><button id="result-ok" class="fish-btn">もう一度、海へ</button></div>';log('逃げられた。そんな時もある。');}
 else if(result.kind==='black'){
  const copy={repel:['10本の借り、返した！',`黒鯛はびっくりして海へ帰った。竿も釣果も無事。${helper}「神様の方にはやるなよ」`],peace:['会話が通じた。','黒鯛を1匹持ち帰れる。ほかの釣果もそのまま。'],anger:['黒鯛を怒らせた！',`竿が折れた。${helper}の予備の竿ですぐ続けられる。強化は一段階下がったが、釣果は無事。`],release:['黒鯛を海へ戻した。','ほかの釣果と竿はそのまま。黒鯛は静かに帰っていった。'],'gamble-win':['強気の交渉が通じた！',`黒鯛2匹を持ち帰れる。${helper}「今日は、海の機嫌がよかったね」`]}[result.resolution];
  title=copy[0];html=`<div class="result ${result.resolution==='repel'?'repel-result':''}">${image(sprites.black_bream,'黒鯛')}<h3>${copy[0]}</h3><p>${copy[1]}</p><p>折られた竿：${s.rodBreakCount}本${s.rodBreakCount>=10?' · 次の黒鯛ではシバいて追い返せる！':` · あと${10-s.rodBreakCount}本で反撃のコツ`}</p>${result.gold?`<p>金塊の次の当たりは、${helper}も見てくれる。</p>`:''}<button id="result-ok" class="fish-btn">釣り場へ</button></div>`;log(copy[0]);
 }
 else {const it=BY_ID[result.id];title=result.critical?'クリティカル！':'釣れた！';html=`<div class="result">${result.first?'<span class="new-mark">はじめての釣果</span>':''}${result.critical?'<span class="new-mark">センタービタ賞 +5 G</span>':''}${image(sprites[it.id],it.name)}<h3>${it.name}</h3><p>${s.location==='berth'&&it.id==='gold'&&!s.berthGoldReady?'船長が待っていた重い釣果。まず見せよう。':it.desc}</p><p class="price">${it.price?it.price.toLocaleString('ja-JP')+' Gで売れる':'査定額：0 G'}</p>${it.id==='gold'&&s.location==='harbor'?'<button id="gold-sell-now" class="fish-btn">金塊を売りに行く</button><button id="result-ok" class="text-button">釣りを続ける</button>':'<button id="result-ok" class="fish-btn">釣り場へ</button>'}${it.id==='horse_mackerel'?'<button id="keep-aji" class="small-btn gold">このアジを生き餌用に残す</button>':''}${it.id==='starfish'?'<div class="row-buttons"><button id="release-starfish" class="small-btn">海へぽいっと戻す</button><button id="dry-starfish" class="small-btn">家で干す</button></div>':''}</div>`;log(`${it.name}を釣った。${it.price?it.price+'Gで売れる。':'……まあ、そんな日もある。'}`);effect(it.id==='gold'?'gold':'catch');}
 const done=()=>{setPhase('idle');if(s.location==='berth'&&result.id==='gold'&&!s.berthGoldReady)dialogue('berthGold',()=>{toast('おじさんと船長の船に同乗できるようになった！');});else if(s.location==='harbor'&&s.castCount<=3&&result.kind==='catch')dialogue(result.id);else if(s.location==='harbor'&&['friend1','shoreClue','friend2','goldRumor'].includes(availableStory(s)))dialogue(availableStory(s),()=>{if(availableStory(s)==='goldRumor')dialogue('goldRumor');});else if(s.location==='sea'&&result.id==='kue'&&!s.seaEnding&&!s.readDialogueIds.includes('kueArrival')){readStory(s,'kueArrival');readStory(s,'kue');save();dialogue([['船長','見事だ。昔、金を沈めた岩礁はクエが付く場所だと聞いている。その潮筋をたどれば、噂の場所が分かる。'],['隣のおじさん','最初のヒトデから、ずいぶん遠くへ来たね。'],['船長','準備ができたら「岩礁を調べる」を選びな。魚は売っても家へ持ち帰っても構わん。道は覚えた。']]);};};openModal(title,html,done);$('result-ok').onclick=closeModal;
 if($('release-starfish'))$('release-starfish').onclick=()=>{s.inventory.starfish=Math.max(0,(s.inventory.starfish||0)-1);save();toast(`ヒトデは海に帰った。${helper}「干されなくてよかったな」`);closeModal();};
 if($('keep-aji'))$('keep-aji').onclick=()=>{try{setPhase('idle');keepAji(s);s.settings.bait='live_aji';save();toast('アジ1匹を生き餌用に確保。次の一投で使えます。');closeModal();}catch(e){toast(e.message);}};
 if($('dry-starfish'))$('dry-starfish').onclick=()=>{try{setPhase('idle');dryStarfish(s);save();toast('ヒトデを家の保管箱で干した。');closeModal();}catch(e){toast(e.message);}};
 if($('gold-sell-now'))$('gold-sell-now').onclick=()=>{modalCloseAction=null;$('modal').close();setPhase('idle');shopTab='sell';showShop();};
}
$('black-event').onclick=()=>{if(currentBlack){const result=currentBlack;currentBlack=null;showBlackDialogue(result);}};
function frame(time){if(!document.hidden){try{music?.tick();}catch{}}const dt=lastFrame?Math.min((time-lastFrame)/1000,.1):0;lastFrame=time;
 if(!document.hidden&&active&&!$('modal').open){elapsed+=dt;
 if(phase==='waiting'&&elapsed>=waitTime){setPhase('bite');effect('bite');}
 else if(phase==='bite'&&elapsed>=(s.settings.slow?4:2)){if(s.pendingCast?.safe){needle=0;setPhase('reeling');}else finishCast(false);}
 else if(phase==='octopus_hold'&&elapsed>=1.6){needle=0;setPhase('reeling');effect('hook');log('タコが底から離れた！ 緑の帯で引き上げよう。');}
 else if(phase==='squid_wait'&&elapsed>=1.3){needle=0;setPhase('reeling');effect('hook');}
 else if(phase==='reeling'){needle=(Math.sin(elapsed*Math.PI*(s.settings.slow?.65:1.1)-Math.PI/2)+1)/2;$('needle').style.left=`calc(${needle*100}% - 2px)`;if(elapsed>=6)finishCast(!!s.pendingCast?.safe);}
 else if(phase==='black'&&elapsed>=2&&currentBlack){const result=currentBlack;currentBlack=null;showBlackDialogue(result);}
 }requestAnimationFrame(frame);}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden){save();audio?.suspend().catch(()=>{});}else if(s.settings.sound&&document.documentElement.classList.contains('game-ready'))audio?.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{save();audio?.suspend().catch(()=>{});});
$('talk').onclick=talkNow;
function shopAction(fn,message){try{const result=fn();save();render();effect('coin');showShop();toast(typeof message==='function'?message(result):message);}catch(error){toast(error.message);}}
function chosen(id,count){return Math.min(count,Math.max(1,quantities.get(id)||1));}
function quantityRows(items,source='inventory',action='sell'){
 return items.map(it=>{const count=s[source][it.id],qty=chosen(it.id,count);return `<div class="item-row">${image(sprites[it.id],it.name)}<div class="item-info"><strong>${it.name} ×${count}</strong><small>${it.price} G / 個</small></div><div class="item-quantity"><input type="number" inputmode="numeric" min="1" max="${count}" step="1" value="${qty}" id="qty-${it.id}" aria-label="${it.name}の数量"><button class="small-btn" data-one="${it.id}">1個</button><button class="small-btn" data-all="${it.id}">全部</button><button class="small-btn ${it.price?'gold':''}" data-${action}="${it.id}">${action==='sell'?(it.price?'売る':'処分'):action==='deposit'?'家へ保管':'手元へ戻す'}</button><small class="item-total" id="total-${it.id}">${action==='sell'?`${qty}個 → ${(it.price*qty).toLocaleString()} G`:`${qty}個を移動`}</small>${action==='sell'&&it.id==='horse_mackerel'?'<button class="small-btn" id="reserve-aji">指定数を生き餌用に確保</button>':''}</div></div>`;}).join('');
}
function bindQuantities(source='inventory',action='sell'){
 for(const it of ITEMS){const input=$('qty-'+it.id);if(!input)continue;const update=()=>{const n=Number(input.value),valid=Number.isSafeInteger(n)&&n>=1&&n<=s[source][it.id];if(valid)quantities.set(it.id,n);$('total-'+it.id).textContent=valid?(action==='sell'?`${n}個 → ${(it.price*n).toLocaleString()} G`:`${n}個を移動`):'所持数の範囲で整数を指定してください';document.querySelector(`[data-${action}="${it.id}"]`).disabled=!valid;if(it.id==='horse_mackerel'&&$('reserve-aji'))$('reserve-aji').disabled=!valid;};input.oninput=update;document.querySelector(`[data-one="${it.id}"]`).onclick=()=>{input.value=1;update();};document.querySelector(`[data-all="${it.id}"]`).onclick=()=>{input.value=s[source][it.id];update();};}
}
function showShop(){
 if(phase!=='idle')return;if(s.location!=='harbor'){toast('波止場へ戻ってから、売買しよう。');return;}
 let html=`<p class="modal-desc">桟橋の買取箱。売る数を選ぶと、受取額も変わります。<br>所持金 <strong>${s.money.toLocaleString()} G</strong> · 生き餌のアジ ${s.liveBaitCount}匹</p><div class="tabbar"><button id="sell-tab" class="${shopTab==='sell'?'active':''}">売る・処分</button><button id="buy-tab" class="${shopTab==='buy'?'active':''}">買う</button></div>`;
 if(shopTab==='sell'){
  const owned=ITEMS.filter(it=>s.inventory[it.id]>0);const total=owned.filter(it=>it.price>0&&it.id!=='gold').reduce((n,it)=>n+it.price*s.inventory[it.id],0);if(total)html+=`<button id="sell-bulk-top" class="small-btn gold bulk-top">まとめて売る · ${total.toLocaleString()} G</button><p class="modal-desc">金塊・家の保管品・生き餌用のアジは対象外。</p>`;html+=owned.length?quantityRows(owned):'<p class="empty">手元に釣果がありません。家の保管箱から戻すこともできます。</p>';

 }else{
  html+=`<div class="item-row"><div class="item-info"><strong>${['扱いやすい竿','なじんだ竿','大物用の竿','最高ランク'][s.rodLevel]}</strong><small>現在ランク ${s.rodLevel+1}/4。成功帯が広くなる。黒鯛で折れると一段階戻る</small></div><button data-buy="rod" class="small-btn gold" ${s.rodLevel>=3||s.money<ROD_PRICES[s.rodLevel]?'disabled':''}>${s.rodLevel>=3?'最高ランク':ROD_PRICES[s.rodLevel]+' G'}</button></div><h3 class="section-label">珍味の餌</h3><p class="modal-desc">基本の餌は無料。珍味の餌はおじさんと常連同士になると買えます。</p><div class="row-buttons"><button data-buy="bait1" class="small-btn" ${s.friendStage<2||s.money<8?'disabled':''}>1個 · 8 G</button><button data-buy="bait5" class="small-btn" ${s.friendStage<2||s.money<40?'disabled':''}>5個 · 40 G</button></div><h3 class="section-label">沖釣りの餌</h3><div class="row-buttons"><button data-buy="krill" class="small-btn" ${!canSail(s)||s.money<15?'disabled':''}>オキアミ3個 · 15 G</button><button data-buy="pork_fat" class="small-btn" ${!canSail(s)||s.money<25?'disabled':''}>豚の脂身3個 · 25 G</button></div><p>オキアミは沖でアジを狙いやすい。豚の脂身は沖のタコ用。</p><h3 class="section-label">アオリイカの生き餌</h3><p class="modal-desc">自分で釣ったアジを、売却画面で生き餌用に確保します。1投につき1匹使います。釣り場の餌メニューで選んでください。</p>`;
 }
 openModal('売る・買う',html);$('sell-tab').onclick=()=>{shopTab='sell';showShop();};$('buy-tab').onclick=()=>{shopTab='buy';showShop();};bindQuantities();
 document.querySelectorAll('[data-sell]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.sell,qty=Number($('qty-'+id).value);shopAction(()=>sell(s,id,qty),gain=>`${BY_ID[id].name} ${qty}個${gain?`を売って ${gain.toLocaleString()} G受け取った。`:'を処分した。'}`);});
 if($('reserve-aji'))$('reserve-aji').onclick=()=>{const qty=Number($('qty-horse_mackerel').value);shopAction(()=>keepAji(s,qty),n=>`アジ${n}匹を生き餌用に確保した。`);};
 document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>{const kind=btn.dataset.buy;shopAction(()=>buy(s,kind),price=>({rod:'竿を強化しました',bait1:'珍味の餌を1個購入',bait5:'珍味の餌を5個購入',krill:'オキアミを3個購入',pork_fat:'豚の脂身を3個購入'}[kind])+` · −${price} G／残金 ${s.money.toLocaleString()} G`);});
 for(const id of ['sell-all','sell-bulk-top'])if($(id))$(id).onclick=confirmBulkSale;
}
function showStock(){
 if(phase!=='idle')return;if(s.location!=='harbor'){toast('波止場へ戻ると家の保管箱を使えます。');return;}
 const source=stockTab==='deposit'?'inventory':'homeInventory',action=stockTab==='deposit'?'deposit':'withdraw',owned=ITEMS.filter(it=>s[source][it.id]>0);
 const foodHtml='<h3>家で食事</h3>'+EDIBLE.filter(id=>s.homeInventory[id]>0).map(id=>`<button class="small-btn" data-eat="${id}" ${s.mealCasts?'disabled':''}>${BY_ID[id].name}を1個食べる</button>`).join('');
 openModal('家の保管箱',`<p class="modal-desc">売らずに残したい釣果を保管できます。保管した魚や海ぶどうを1個食べると、次の3投は成功帯が少し広くなります。効果の重ねがけはできません。</p><div class="home-tabs"><button id="stock-deposit" class="small-btn ${stockTab==='deposit'?'gold':''}">手元 → 家</button><button id="stock-withdraw" class="small-btn ${stockTab==='withdraw'?'gold':''}">家 → 手元</button></div>${owned.length?quantityRows(owned,source,action):'<p class="empty">この場所には釣果がありません。</p>'}${foodHtml}`);
 document.querySelectorAll('[data-eat]').forEach(btn=>btn.onclick=()=>{try{eatCatch(s,btn.dataset.eat);save();render();showStock();toast('食事でひと息。次の3投は成功帯が少し広がります。');}catch(e){toast(e.message);}});
 $('stock-deposit').onclick=()=>{stockTab='deposit';showStock();};$('stock-withdraw').onclick=()=>{stockTab='withdraw';showStock();};bindQuantities(source,action);
 document.querySelectorAll(`[data-${action}]`).forEach(btn=>btn.onclick=()=>{const id=btn.dataset[action];try{const qty=Number($('qty-'+id).value);storeCatch(s,id,qty,action==='withdraw');save();render();showStock();toast(`${BY_ID[id].name} ${qty}個を${action==='withdraw'?'手元へ戻した。':'家へ保管した。'}`);}catch(e){toast(e.message);}});
}
$('home-stock').onclick=showStock;
$('buy-shop').onclick=()=>{shopTab='buy';showShop();};
function confirmBulkSale(){const items=ITEMS.filter(it=>it.id!=='gold'&&it.price>0&&s.inventory[it.id]>0),amount=items.reduce((n,it)=>n+it.price*s.inventory[it.id],0);openModal('まとめて売る',`<p>${items.map(it=>it.name+' ×'+s.inventory[it.id]).join('、')}</p><p class="price">合計 ${amount.toLocaleString()} G</p><p>残したい魚は先に家へ保管できます。</p><button id="bulk-confirm" class="small-btn gold">この釣果を売る</button><button id="bulk-cancel" class="small-btn">戻る</button>`);$('bulk-confirm').onclick=()=>shopAction(()=>sellAll(s),gain=>`${gain.toLocaleString()} Gを受け取った。`);$('bulk-cancel').onclick=showShop;}
function showPocketItem(id){if(phase!=='idle')return;const it=BY_ID[id];openModal('手元の釣果',`<div class="result">${image(sprites[id],it.name)}<h3>${it.name} ×${s.inventory[id]||0}</h3><p>${it.desc}</p></div>${s.location==='harbor'?'<button id="pocket-sell" class="small-btn gold">売却画面へ</button><button id="pocket-store" class="small-btn">家に保管する</button>':'<p>帰港すると売却・保管ができます。</p>'}`);if($('pocket-sell'))$('pocket-sell').onclick=()=>{shopTab='sell';showShop();};if($('pocket-store'))$('pocket-store').onclick=()=>{stockTab='deposit';showStock();};}
$('shop').onclick=()=>{if(s.location!=='harbor'){toast('波止場へ戻って、売買しよう。');return;}shopTab='sell';showShop();};
function showBook(){if(phase!=='idle')return;openModal('釣果図鑑',`<p class="modal-desc">${s.discovered.filter(id=>BY_ID[id]&&!BY_ID[id].secret).length} / ${ITEMS.filter(it=>!it.secret).length} 種発見。${s.discovered.includes('sealed_book')?' ＋秘密の釣果1種。':''}売っても、リリースしても記録は残る。<br>折られた竿：${s.rodBreakCount}本${s.rodBreakCount>=10?' · 黒鯛への反撃を習得':''}<br>ヒトデの連続記録：${s.maxStarStreak}匹　センタービタ：${s.criticalCount}回</p><div class="book-grid">${ITEMS.filter(it=>!it.secret||s.discovered.includes(it.id)).map(it=>{const seen=s.discovered.includes(it.id);return `<article class="book-card ${seen?'':'locked'}">${image(sprites[it.id],seen?it.name:'未発見の釣果')}<h3>${seen?it.name:'？？？'}</h3><p>${seen?it.desc:'まだ出会っていない。'}</p><small>${seen?'釣った数：'+(s.catchCounts[it.id]||0)+'　'+it.price+' G':''}</small></article>`;}).join('')}</div>`);}
$('book').onclick=showBook;
function queueForPort(){if(!s.pendingDialogueIds.includes('voyageInvite')&&!s.readDialogueIds.includes('voyageInvite'))s.pendingDialogueIds.push('voyageInvite');}
let portPractice=false;
const portAction=setupPortAction({
 onWin:()=>{
  const message=portVictory(s,portPractice);save();render();effect('coin');return message;
 },
 onClose:()=>setPhase('idle'),
 onExitWin:()=>{setPhase('idle');if(!portPractice){try{const first=voyageAction(s,'berth');save();render();dialogue('voyageInvite');}catch(error){toast(error.message);}}},
 onPunch:()=>effect('hook')
});
function startPort(practice){
 if(phase!=='idle')return;
 if(!practice&&s.portCleared){toast('港の騒動は解決しました。船着場へ進もう。');return;}
 if(practice&&!canPractice(s)){toast('沖で3投ほど釣って帰ると、港の顔ぶれにも変化がありそう。');return;}
 if(!practice&&!knowsRumor(s)){toast('まず波止場でおじさんと親しくなり、金塊の噂を聞こう。');return;}
 modalCloseAction=null;$('modal').close();portPractice=practice;
 setPhase('action');portAction.open({practice,returnLabel:s.location==='sea'?'船上へ戻る':'釣り場へ戻る'});
}
function openPort(){
 if(phase!=='idle'){toast('今の釣りを終えると、アクションで遊べます。');return;}
 const first=knowsRumor(s)&&!s.portCleared&&s.location!=='sea';
 openModal('港の裏通り',`<p class="modal-desc">${canPractice(s)?'一度抜けた道。もう通行は自由です。再挑戦では会話と操作説明を飛ばします。勝てばオキアミ、たまに賢者の餌も。':s.portCleared?'道をあけてくれた。船長が桟橋で待っている。':first?'金塊の噂が一人歩きしている。船長のいる船着場へ向かおう。短いアクションはこの物語で一度だけ。':'まずは波止場でおじさんと釣り、金塊の噂を聞こう。'}</p><div class="choice-list">${first?'<button id="port-story-start" class="small-btn gold">物語を進める：船長を探す</button>':canPractice(s)?'<button id="port-free-start" class="small-btn gold">裏通りに再挑戦して餌をもらう</button>':''}<button id="port-reception" class="small-btn">船の受付を確認</button></div><p class="modal-desc">負けても釣果・所持金は減りません。</p>`);
 if(first)$('port-story-start').onclick=()=>startPort(false);
 if($('port-free-start'))$('port-free-start').onclick=()=>startPort(true);
 $('port-reception').onclick=()=>voyage.menu();
}
$('port').onclick=openPort;
const voyage=setupVoyage({getState:()=>s,modal:openModal,dialogue,commit:()=>{save();render();},close:()=>{modalCloseAction=null;$('modal').close();updateStoryNotice();},ending:showEndingIntro,toast,effect:name=>{soundInit();effect(name);}});
$('reef-entry').onclick=()=>voyage.trial();
$('voyage').onclick=()=>{if(phase!=='idle'){toast('今の釣りを終えてから受付へ進もう。');return;}try{voyage.menu();}catch(error){console.error('Voyage menu failed',error);toast('受付を開けませんでした。ページを再読み込みしてください。');}};
window.addEventListener('game-maintenance',()=>{save();portAction.close();modalCloseAction=null;if($('modal').open)$('modal').close();phase='idle';elapsed=0;endingPreview=false;currentBlack=null;$('black-event').hidden=true;$('ending').hidden=true;$('true-ending').hidden=true;active=false;$('title-screen').hidden=false;music?.mute();audio?.suspend().catch(()=>{});});
function showSettings(){if(phase!=='idle')return;openModal('釣り場の設定',`<div class="setting-row"><label for="set-sound">音を鳴らす<small>場面に合わせたBGM・波の音・効果音。</small></label><input id="set-sound" type="checkbox" ${s.settings.sound?'checked':''}></div><div class="setting-row"><label for="set-slow">ゆっくり釣り<small>合わせる時間を長く、目印をゆっくりに。釣果の確率は変わりません。</small></label><input id="set-slow" type="checkbox" ${s.settings.slow?'checked':''}></div><div class="setting-row"><label for="set-motion">水面の動き<small>ウキの揺れなどを表示します。</small></label><input id="set-motion" type="checkbox" ${s.settings.motion?'checked':''}></div><p class="modal-desc">「釣る」→ ウキが沈んだら「今！」→ 緑の帯で「引き上げる」。最初の3投は練習で、失敗しません。中央の金色で引くとクリティカルです。魚ごとに緑と金色の幅が変わります。<br><br>記録はこのブラウザに保存されます。別の端末とは共有されません。</p><div class="row-buttons"><button id="settings-backup" class="small-btn">バックアップ</button><button id="settings-restore" class="small-btn">セーブを復元</button></div><details class="test-tools"><summary>動作確認用（テスト版限定）</summary><p class="modal-desc">次の1投の獲物を指定できます。公開版の記録には入りません。海ぶどう・アジ・黒鯛・絵を待たずに確認できます。</p><div class="choice-list">${['sea_grapes','horse_mackerel','aori_squid','black_bream','gold','sandal','ballpen','octopus','kue'].map(id=>`<button class="small-btn" data-preview-catch="${id}">次の1投：${BY_ID[id].name}</button>`).join('')}<button id="test-sea" class="small-btn">船上の配置・会話を確認</button><button id="test-street" class="small-btn">港の場面をもう一度試す</button><button id="test-news" class="small-btn">おじさんの新しい話を確認</button><button id="test-rod-nine" class="small-btn">竿9本折れた状態を確認する</button><button id="test-ending" class="small-btn">真のエンディング演出を試す（記録は変えない）</button></div></details>${s.trueEndingSeen?'<button id="replay-true-ending" class="small-btn gold">真のエンディングをもう一度見る</button>':''}<button id="reset-ask" class="small-btn danger">記録を消して、はじめから</button>`);
 $('set-sound').onchange=soundToggle;$('set-slow').onchange=e=>{s.settings.slow=e.target.checked;save();render();};$('set-motion').onchange=e=>{s.settings.motion=e.target.checked;save();render();};
 $('settings-backup').onclick=showBackup;$('settings-restore').onclick=showRestore;document.querySelectorAll('[data-preview-catch]').forEach(btn=>btn.onclick=()=>{previewNext=btn.dataset.previewCatch;toast('次の一投は'+BY_ID[previewNext].name+'。餌は基本に戻します。');s.settings.bait='base';closeModal();render();});
 $('test-sea').onclick=()=>{if(!canSail(s)){toast('配置の確認も、金塊の噂と裏通りクリア後に行えます。');return;}s.location='sea';s.seaIntroRead=true;save();closeModal();render();};
 $('test-street').onclick=()=>startPort(true);
 $('test-news').onclick=()=>{s.location='harbor';s.castCount=Math.max(6,s.castCount);s.readDialogueIds=s.readDialogueIds.filter(id=>id!=='friend1');s.friendStage=0;lastNotice='';save();closeModal();render();};
 $('test-ending').onclick=()=>{modalCloseAction=null;$('modal').close();showTrueEnding(true);};
 if($('replay-true-ending'))$('replay-true-ending').onclick=$('test-ending').onclick;
 $('test-rod-nine').onclick=()=>{s.rodBreakCount=9;s.catchCounts.black_bream=Math.max(1,s.catchCounts.black_bream||0);previewNext='black_bream';s.settings.bait='base';save();render();toast('テスト記録を竿9本にしました。次の黒鯛で通常会話を怒らせると10本になります。');closeModal();};
 $('reset-ask').onclick=()=>{openModal('記録を消しますか？','<p class="modal-desc">所持金・図鑑・会話の記録がすべて消えます。この操作は元に戻せません。</p><div class="row-buttons"><button id="reset-no" class="small-btn">やめる</button><button id="reset-yes" class="small-btn danger">消してはじめから</button></div>');$('reset-no').onclick=showSettings;$('reset-yes').onclick=()=>{s=fresh();lastNotice='';saveBlocked=false;unreadableSave='';save();music?.mute();audio?.suspend().catch(()=>{});closeModal();active=false;phase='idle';$('title-screen').hidden=false;$('start').textContent='釣り場へ';render();};};
}
function showBackup(){
 const code=unreadableSave||encodeBackup(s);
 openModal('セーブのバックアップ',`<p class="modal-desc">下のコードをコピーして、メモなどに保存してください。タイトルの「セーブを復元」で戻せます。${unreadableSave?'<br>読み込めなかった元データを、そのまま救出します。':''}</p><textarea id="backup-code" class="backup-code" readonly aria-label="バックアップコード"></textarea><div class="row-buttons"><button id="copy-backup" class="small-btn gold">コードをコピー</button><button id="download-backup" class="small-btn">ファイルに保存</button></div><p id="backup-status" class="backup-status" role="status"></p>`);
 $('backup-code').value=code;
 $('copy-backup').onclick=async()=>{const area=$('backup-code');area.focus();area.select();area.setSelectionRange(0,area.value.length);try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(code);else if(!document.execCommand('copy'))throw Error();$('backup-status').textContent='コピーしました。メモなどへ貼り付けて保存してください。';}catch{$('backup-status').textContent='コードを選択しました。長押ししてコピーしてください。';}};
 $('download-backup').onclick=()=>{const url=URL.createObjectURL(new Blob([code],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='fishing-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);$('backup-status').textContent='保存したファイルは「セーブを復元」から選べます。';};
}
function applyRestored(restored){s=restored;saveBlocked=false;storageOk=true;unreadableSave='';previewNext=null;currentBlack=null;phase='idle';active=false;lastNotice='';endingPreview=false;portAction.close();$('title-screen').hidden=false;$('black-event').hidden=true;$('ending').hidden=true;$('true-ending').hidden=true;save();render();$('start').disabled=false;$('start').textContent='つづきから釣る';$('startup-error').hidden=true;modalCloseAction=null;closeModal();toast('テスト用の記録を復元しました。公開版の記録はそのままです。');}
function confirmRestore(code){let restored;try{restored=decodeBackup(code);}catch(e){$('restore-status').textContent=e.message;return;}
 openModal('テスト用の記録を上書きしますか？',`<p class="modal-desc">復元する記録：${restored.castCount}投 · ${restored.money.toLocaleString()} G<br>現在のテスト記録は上書きされます。必要なら先にバックアップしてください。公開版の記録は変更しません。</p><div class="row-buttons"><button id="restore-no" class="small-btn">やめる</button><button id="restore-yes" class="small-btn gold">この記録を復元</button></div>`);$('restore-no').onclick=showRestore;$('restore-yes').onclick=()=>applyRestored(restored);
}
function showRestore(){
 openModal('セーブを復元',`<p class="modal-desc">バックアップコードを貼り付けるか、保存したJSONファイルを選んでください。公開版の記録をテストへコピーすることもできます。</p><textarea id="restore-code" class="backup-code" placeholder="ここへコードを貼り付け" aria-label="復元コード"></textarea><input id="restore-file" type="file" accept=".json,application/json,text/plain" aria-label="バックアップファイルを選ぶ"><div class="row-buttons"><button id="restore-check" class="small-btn gold">内容を確認</button><button id="copy-live-save" class="small-btn">公開版の記録をコピー</button></div><p id="restore-status" class="backup-status" role="status"></p>`);
 $('restore-check').onclick=()=>confirmRestore($('restore-code').value.trim());$('restore-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024)throw Error('ファイルが大きすぎます。');$('restore-code').value=await file.text();$('restore-status').textContent='ファイルを読み込みました。「内容を確認」を押してください。';}catch(error){$('restore-status').textContent=error.message;}};
 $('copy-live-save').onclick=()=>{try{const raw=localStorage.getItem(LIVE_STORAGE_KEY);if(!raw)throw Error('このブラウザには公開版の記録がありません。');confirmRestore(raw);}catch(e){$('restore-status').textContent=e.message;}};
}
$('title-backup').onclick=showBackup;$('title-restore').onclick=showRestore;$('save-menu').onclick=showBackup;
$('settings').onclick=showSettings;
function showEndingIntro(resume=false){setPhase('idle');showTrueEnding(false,resume);}
function showTrueEnding(preview=false,resume=false){
 if(!preview&&!s.seaEnding)return;
 endingPreview=preview;
 if(!preview){s.endingPending=true;save();}
 $('ending').hidden=true;$('true-ending-art').src=s.boatLevel===2?'test-v06-true_ending_upgrade.png':'test-v06-true_ending.png';$('true-ending').hidden=false;syncMusic();effect('gold');
 const credits=resume&&s.creditsStarted;$('ending-story').hidden=credits;$('credits-window').hidden=!credits;$('credits-controls').hidden=!credits;if(credits)restartCredits();
}
function restartCredits(){$('true-continue').hidden=true;$('true-title').hidden=true;$('credits-skip').hidden=false;const track=$('true-credits-track');track.style.animation='none';requestAnimationFrame(()=>{track.style.animation='';});}
function finishCredits(){$('true-continue').hidden=false;$('true-title').hidden=false;$('credits-skip').hidden=true;}
$('ending-to-credits').onclick=()=>{$('ending-story').hidden=true;$('credits-window').hidden=false;$('credits-controls').hidden=false;if(!endingPreview){s.creditsStarted=true;save();}restartCredits();};
$('credits-skip').onclick=finishCredits;$('true-credits-track').addEventListener('animationend',finishCredits);
function finishTrueEnding(toTitle){
 if(!endingPreview){s.endingPending=false;s.creditsStarted=false;s.trueEndingSeen=true;s.location='harbor';save();}
 const wasPreview=endingPreview;endingPreview=false;$('true-ending').hidden=true;
 if(toTitle){active=false;$('title-screen').hidden=false;$('start').textContent='つづきから釣る';}
 render();syncMusic();if(!toTitle&&!wasPreview)dialogue('after');
}
function showActOne(){
 setPhase('idle');$('ending').hidden=false;$('end-title').hidden=true;syncMusic();effect('gold');
}
function showGoldBridge(){
 const held=(s.inventory.gold||0)+(s.homeInventory.gold||0)>0;
 const lines=[['隣のおじさん',held?'……で？ 一獲千金したのに、まだ釣るんかい。':'一獲千金しても、また釣りに来るんだね。あの金塊のことなんだが。'],['隣のおじさん',held?'ちょっと見せてみな。小さな歯形が付いとる。黒鯛の歯じゃ。':'あの金塊には小さな歯形が付いていた。船長も気づいていたよ。黒鯛の歯じゃ。'],['隣のおじさん',(s.catchCounts.black_bream||0)>0?'あんた、もう黒鯛に絡まれたじゃろ。あれは、沖の供え物の見回りなんだと。':'この海の黒鯛はな、沖に沈んだ供え物を見回っているという話がある。']];
 if(s.rodBreakCount>0)lines.push(['隣のおじさん','竿を'+s.rodBreakCount+'本も折られたなら、歯形にも見覚えがありそうだね。']);
 lines.push(['隣のおじさん','その上に、チヌさまと呼ばれる親分がいる。金の噂も、あの魚たちも、沖でつながっているのかもしれん。'],['あなた','一獲千金の、その先も釣ってみたい。'],['隣のおじさん',s.berthGoldReady?'船長に頼んで、今度はその噂の先を探してみよう。わしも一緒に行くよ。':'船長に見せよう。沖へ行くなら、わしも一緒だ。']);
 dialogue(lines,()=>{readStory(s,'blackOrigin');readStory(s,'gold');save();const finish=()=>{s.goldBridgePending=false;save();render();toast('おじさんと船長の船に同乗できるようになった！');};if(!s.berthGoldReady)dialogue('berthGold',finish,true);else{ s.goldBridgePending=false;save();render();}},true);
}
function finishActOne(){
 if(!s.actOnePending)return;s.actOnePending=false;s.actOneSeen=true;s.goldBridgePending=true;save();$('ending').hidden=true;render();syncMusic();effect('cast');showGoldBridge();
}
$('end-back').onclick=finishActOne;$('end-title').onclick=finishActOne;
$('true-replay').onclick=restartCredits;
$('true-continue').onclick=()=>finishTrueEnding(false);
$('true-title').onclick=()=>finishTrueEnding(true);
function status(){return {phase,money:s.money,castCount:s.castCount,friendship:FRIENDS[s.friendStage],inventory:{...s.inventory},discovered:[...s.discovered],cleared:s.cleared};}
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'get_fishing_status',title:'釣りの記録を見る',description:'現在の所持金、釣果、交流段階、クリア状況を読み取ります。釣りや売却は実行しません。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('入力は空のオブジェクトにしてください。');return status();}})).catch(()=>{});}catch{}}
try{assets();}catch(error){
 console.error('Fishing startup failed',startupStep,error);
 const detail='v0.7.3-test1 / '+startupStep+' / '+(error?.name||'Error')+': '+(error?.message||String(error));
 $('startup-error').textContent=detail;$('startup-error').hidden=false;
 $('start').disabled=false;$('start').textContent='読み込みをやり直す';$('start').onclick=()=>location.reload();
 log(detail);
}
