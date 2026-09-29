import {Soundtrack,musicScene} from './music.mjs';
import {SPRITES} from './sprites.mjs';
import {ITEMS,BY_ID,FRIENDS,DIALOGUES,SMALLTALK} from './data.mjs';
import {STORAGE_KEY,fresh,hydrate,availableStory,readStory,successWidth,beginCast,completeCast,sell,sellAll,buy} from './core.mjs';
const $=id=>document.getElementById(id);
let s=fresh(),storageOk=true;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)s=hydrate(JSON.parse(raw));}catch{storageOk=false;}
let phase='idle',elapsed=0,waitTime=3,needle=0,lastFrame=0,active=false,toastTimer,lastChat=-1,shopTab='sell',audio=null,waves=null,music=null;
const sprites={...SPRITES};
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{storageOk=false;}$('save-note').textContent=storageOk?'この端末に自動保存':'この環境では保存できません';}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function log(text){$('log').textContent=text;}
function image(src,alt,cls=''){return `<img src="${src||''}" alt="${alt}" class="${cls}">`;}
let startupStep='素材を配置';
function assets(){
 // Sprite PNGs are already embedded. Let actual DOM images render them directly.
 // Do not depend on Image(), URL bases, canvas, or a preloading gate.
 for(const id of ['player','neighbor','bobber']){$(id).src=sprites[id];$(id).hidden=false;}
 $('black-fish').src=sprites.black_bream;$('ending-fish').src=sprites.ending;
 startupStep='釣り場の画面を準備';
 render();
 startupStep='開始ボタンを準備';
 $('start').disabled=false;$('start').textContent=s.castCount||s.readDialogueIds.length?'つづきから釣る':'釣り場へ';
 $('startup-error').hidden=true;
}
function soundInit(){if(!s.settings.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});music??=new Soundtrack(audio);music.enabled=true;syncMusic();if(!waves){const b=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);let previous=0;const data=b.getChannelData(0);for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.08-.04)*.985;data[i]=previous;}const source=audio.createBufferSource();source.buffer=b;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;const gain=audio.createGain();gain.gain.value=.055;source.connect(filter).connect(gain).connect(audio.destination);source.start();waves={source,gain};}}catch{toast('この環境では音を再生できません。');}}
function syncMusic(){if(!music)return;music.setScene(musicScene(active,phase,!$('ending').hidden||(active&&s.endingPending)));}
function effect(name){try{music?.effect(name);}catch{}}
function soundToggle(){s.settings.sound=!s.settings.sound;if(s.settings.sound)soundInit();else{music?.mute();audio?.suspend().catch(()=>{});}save();render();}
function render(){
 syncMusic();
 $('title-sound').textContent=s.settings.sound&&audio?'♪ 音あり · タップでオフ':'♪ 音楽をオンにする';
 $('money').innerHTML=s.money.toLocaleString('ja-JP')+' <small>G</small>';$('casts').textContent=s.castCount+' 投目';
 $('sound').setAttribute('aria-pressed',String(s.settings.sound));$('sound').setAttribute('aria-label',s.settings.sound?'音をオフにする':'音をオンにする');$('sound').style.opacity=s.settings.sound?'1':'.65';
 document.body.classList.toggle('reduce-motion',!s.settings.motion);
 $('book-count').textContent=s.discovered.length+'/8';$('friend-label').textContent=FRIENDS[s.friendStage];
 const story=availableStory(s);$('talk-dot').hidden=!story;$('gold-dot').hidden=!(s.inventory.gold>0);
 const next=[6,15,25][s.friendStage];$('friend-fill').style.width=(s.friendStage===3?100:Math.min(100,s.castCount/next*100))+'%';
 $('friend-hint').textContent=story?(story.startsWith('friend')?'新しい話があるみたい。声をかけてみよう。':'まだ聞いていない話がある。'):s.friendStage===3?'気負わずに、今日も隣で釣ろう。':`あと${Math.max(0,next-s.castCount)}投で、次の話を聞けそう。`;
 $('rod-label').textContent=['初心者の竿','扱いやすい竿','なじんだ竿'][s.rodLevel];
 $('rare-bait-option').textContent=`珍味の餌 · ${s.baitCount}個`;$('rare-bait-option').disabled=s.baitCount===0;
 if(!s.baitCount&&s.settings.bait==='rare')s.settings.bait='base';$('bait').value=s.settings.bait;
 const entries=ITEMS.filter(it=>(s.inventory[it.id]||0)>0);const value=entries.reduce((n,it)=>n+it.price*s.inventory[it.id],0);
 $('pocket-value').textContent=value.toLocaleString('ja-JP')+' G';$('pocket-list').textContent=entries.length?entries.map(it=>`${it.name} ×${s.inventory[it.id]}`).join('　'):'まだ空っぽ。次の一投を。';
 $('goal-title').textContent=s.endingPending?'一獲千金、達成！':s.cleared?'今日も、海でひと休み。':s.inventory.gold>0?'金塊を売りに行こう。':s.friendStage>=3?'金塊の噂を、確かめよう。':'いつか、謎の金塊。';
 $('goal-eyebrow').textContent=s.cleared?'釣りは、まだつづく':'今日のねらい';
 $('tutorial-badge').hidden=s.castCount>=3;$('tutorial-badge').textContent=`練習 ${Math.min(3,s.castCount+1)} / 3`;
 const busy=phase!=='idle';for(const id of ['talk','shop','book','bait','settings'])$(id).disabled=busy;
 $('fish').disabled=!active||['result','black'].includes(phase);$('meter').hidden=phase!=='reeling';
 $('fish').classList.toggle('bite',phase==='bite');$('scene').classList.toggle('bite-scene',phase==='bite');
 if(phase==='idle'){$('fish').textContent='釣り糸を投げる';$('phase-label').textContent='のんびり、糸を垂らそう。';$('caption').textContent='今日も、何かが釣れる。';}
 else if(phase==='waiting'){$('fish').textContent='ウキを見守る…';$('phase-label').textContent='沈んだら、タップ。';$('caption').textContent=s.pendingCast?.safe&&s.pendingCast.id==='gold'?'おじさん「その重さだ。ゆっくり。」':'しばらく、海を見ていよう。';}
 else if(phase==='bite'){$('fish').textContent='今！ 合わせる';$('phase-label').textContent='ウキが沈んだ！';$('caption').textContent='今！';}
 else if(phase==='reeling'){$('fish').textContent='引き上げる！';$('phase-label').textContent=s.pendingCast?.safe?'練習中は、いつ押しても大丈夫。':'目印が緑の帯に入ったら、タップ。';$('caption').textContent='何か、かかった。';const width=successWidth(s);$('safe-zone').style.width=width*100+'%';$('safe-zone').style.left=(1-width)*50+'%';}
 save();
}
function setPhase(value){phase=value;elapsed=0;render();}
function openModal(title,html,onClose=null){$('modal-title').textContent=title;$('modal-body').innerHTML=html;modalCloseAction=onClose;if(!$('modal').open)$('modal').showModal();}
let modalCloseAction=null,closing=false;
function closeModal(){if(closing)return;closing=true;const cb=modalCloseAction;modalCloseAction=null;$('modal').close();$('modal-body').innerHTML='';setTimeout(()=>{closing=false;cb?.();},40);}
$('close-modal').onclick=closeModal;$('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
function dialogue(idOrLines,onEnd){
 const id=typeof idOrLines==='string'?idOrLines:null;
 const lines=id?DIALOGUES[id]:idOrLines;
 if(!Array.isArray(lines)||!lines.length){onEnd?.();return;}
 let page=0,advancing=false,finished=false;
 const finish=()=>{
  if(finished)return;finished=true;
  if(id){readStory(s,id);if(id.startsWith('friend')){
   const text={friend1:'釣りのコツを覚えた。引き上げが少し楽になった。',friend2:'珍味の餌が買えるようになった。',friend3:'金塊が釣れるようになった。'}[id];
   toast(text);log(text);
  }}
  render();onEnd?.();
 };
 // Keep the same dialog, portrait nodes and next button for the whole conversation.
 // Never replace a tapped button or recreate the dialog between lines.
 openModal('波止場の会話','<div class="dialogue"><div class="dialogue-portraits"><img id="chat-player" alt="あなた"><img id="chat-neighbor" alt="隣のおじさん" hidden></div><div class="speech"><p id="chat-speaker" class="speaker"></p><p id="chat-words" class="words"></p></div></div><div class="dialogue-footer"><small id="chat-page"></small><button type="button" class="small-btn gold" id="dialogue-next">つづきを聞く</button></div>',()=>{if(page===lines.length-1||id==='clear')finish();});
 $('chat-player').src=sprites.player;$('chat-neighbor').src=sprites.neighbor;
 function paint(){
  const [who,text]=lines[page];
  $('chat-player').hidden=who!=='あなた';$('chat-neighbor').hidden=who==='あなた';
  $('chat-speaker').textContent=who;$('chat-words').textContent=text;
  $('chat-page').textContent=(page+1)+' / '+lines.length;
  $('dialogue-next').textContent=page===lines.length-1?'釣り場へ':'つづきを聞く';
 }
 paint();
 $('dialogue-next').onclick=()=>{
  if(advancing||finished||closing)return;
  advancing=true;const button=$('dialogue-next');button.disabled=true;effect('page');
  if(page===lines.length-1){closeModal();return;}
  page++;paint();
  setTimeout(()=>{advancing=false;if($('dialogue-next')===button)button.disabled=false;},180);
 };
}
$('start').onclick=()=>{active=true;$('title-screen').hidden=true;soundInit();if(s.endingPending){showEndingIntro();return;}if(s.pendingCast){setPhase('waiting');waitTime=2.5;log('さっきの一投から再開します。');return;}render();if(!s.readDialogueIds.includes('intro'))dialogue('intro',()=>log('「釣り糸を投げる」から始めよう。最初の3投は練習です。'));};
$('home').onclick=e=>{e.preventDefault();if(phase!=='idle'){toast('この一投が終わってから戻ろう。');return;}active=false;$('title-screen').hidden=false;$('start').textContent='つづきから釣る';render();};
$('sound').onclick=soundToggle;$('title-sound').onclick=()=>{if(s.settings.sound&&!audio){soundInit();render();}else soundToggle();};
$('bait').onchange=()=>{s.settings.bait=$('bait').value;save();};
$('fish').onclick=()=>{
 if(!active||$('modal').open)return;soundInit();
 if(phase==='idle'){if(s.endingPending){showEndingIntro();return;}beginCast(s);waitTime=2+Math.random()*2;setPhase('waiting');effect('cast');}
 else if(phase==='bite'){effect('hook');needle=0;setPhase('reeling');}
 else if(phase==='reeling'){const width=successWidth(s);finishCast(s.pendingCast?.safe||Math.abs(needle-.5)<=width/2);}
};
function finishCast(success){
 const result=completeCast(s,success);if(!result)return;save();
 if(result.kind==='black'){setPhase('black');$('black-event').hidden=false;$('player').src=sprites.playerSurprise;$('neighbor').src=sprites.neighborSurprise;effect('black');currentBlack=result;return;}
 showResult(result);
}
let currentBlack=null;
function showResult(result){
 $('black-event').hidden=true;$('player').src=sprites.player;$('neighbor').src=sprites.neighbor;setPhase('result');
 let html,title;
 if(result.kind==='escape'){effect('escape');title='逃げられた……';html='<div class="result"><h3>また、次の一投。</h3><p>ウキが沈んだら合わせて、目印が緑の帯に入ったら引き上げよう。<br>設定の「ゆっくり釣り」でも遊べます。</p><button id="result-ok" class="fish-btn">もう一度、海へ</button></div>';log('逃げられた。そんな時もある。');}
 else if(result.kind==='black'){title='すべて、リリース。';const lost=result.lost.map(([id,n])=>BY_ID[id].name+' ×'+n).join('、');html=`<div class="result">${image(sprites.black_bream,'黒鯛')}<h3>黒鯛には、逆らえない。</h3><p>${lost||'何も持っていなくても、謝ってしまった。'}</p><p>お金・道具・図鑑は残っています。${result.gold?'金塊の次の当たりは、おじさんも見てくれる。':''}</p><button id="result-ok" class="fish-btn">気を取り直す</button></div>`;log('黒鯛に威圧され、手元の釣果を全部返してしまった。');}
 else {const it=BY_ID[result.id];title='釣れた！';html=`<div class="result">${result.first?'<span class="new-mark">はじめての釣果</span>':''}${image(sprites[it.id],it.name)}<h3>${it.name}</h3><p>${it.desc}</p><p class="price">${it.price?it.price.toLocaleString('ja-JP')+' Gで売れる':'査定額：0 G'}</p>${it.id==='gold'?'<button id="gold-sell-now" class="fish-btn">金塊を売りに行く</button><button id="result-ok" class="text-button">釣りを続ける（黒鯛には注意）</button>':'<button id="result-ok" class="fish-btn">釣り場へ</button>'}</div>`;log(`${it.name}を釣った。${it.price?it.price+'Gで売れる。':'……まあ、そんな日もある。'}`);effect(it.id==='gold'?'gold':'catch');}
 const done=()=>{setPhase('idle');if(s.castCount<=3&&result.kind==='catch')dialogue(result.id);};openModal(title,html,done);$('result-ok').onclick=closeModal;
 if($('gold-sell-now'))$('gold-sell-now').onclick=()=>{modalCloseAction=null;$('modal').close();setPhase('idle');shopTab='sell';showShop();};
}
$('black-event').onclick=()=>{if(currentBlack){const result=currentBlack;currentBlack=null;showResult(result);}};
function frame(time){if(!document.hidden){try{music?.tick();}catch{}}const dt=lastFrame?Math.min((time-lastFrame)/1000,.1):0;lastFrame=time;
 if(!document.hidden&&active&&!$('modal').open){elapsed+=dt;
 if(phase==='waiting'&&elapsed>=waitTime){setPhase('bite');effect('bite');}
 else if(phase==='bite'&&elapsed>=(s.settings.slow?4:2)){if(s.pendingCast?.safe){needle=0;setPhase('reeling');}else finishCast(false);}
 else if(phase==='reeling'){needle=(Math.sin(elapsed*Math.PI*(s.settings.slow?.65:1.1)-Math.PI/2)+1)/2;$('needle').style.left=`calc(${needle*100}% - 2px)`;if(elapsed>=6)finishCast(!!s.pendingCast?.safe);}
 else if(phase==='black'&&elapsed>=3.5&&currentBlack){const result=currentBlack;currentBlack=null;showResult(result);}
 }requestAnimationFrame(frame);}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden){save();audio?.suspend().catch(()=>{});}else if(s.settings.sound)audio?.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{save();audio?.suspend().catch(()=>{});});
$('talk').onclick=()=>{if(phase!=='idle')return;const id=availableStory(s);if(id)dialogue(id);else{lastChat=(lastChat+1)%SMALLTALK.length;dialogue(SMALLTALK[lastChat]);}};
function shopAction(fn,message){try{const result=fn();save();render();effect('coin');toast(typeof message==='function'?message(result):message);showShop();}catch(error){toast(error.message);}}
function showShop(){
 if(phase!=='idle')return;
 let html=`<p class="modal-desc">桟橋の無人買取箱。釣果を入れると、なぜか代金が出てくる。<br>所持金 <strong>${s.money.toLocaleString('ja-JP')} G</strong></p><div class="tabbar"><button id="sell-tab" class="${shopTab==='sell'?'active':''}">売る</button><button id="buy-tab" class="${shopTab==='buy'?'active':''}">買う</button></div>`;
 if(shopTab==='sell'){
 const owned=ITEMS.filter(it=>s.inventory[it.id]>0);
 html+=owned.length?owned.map(it=>`<div class="item-row">${image(sprites[it.id],it.name)}<div class="item-info"><strong>${it.name} ×${s.inventory[it.id]}</strong><small>${it.price} G / 個</small></div><select aria-label="${it.name}の数量" id="qty-${it.id}">${Array.from({length:Math.min(99,s.inventory[it.id])},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select><button class="small-btn ${it.id==='gold'?'gold':''}" data-sell="${it.id}">${it.price?'売る':'処分'}</button></div>`).join(''):'<p class="empty">今は手元に釣果がない。<br>まずは、一投してみよう。</p>';
 if(owned.some(it=>it.price>0&&it.id!=='gold'))html+='<div class="row-buttons"><button id="sell-all" class="small-btn gold">換金できるものをまとめて売る</button></div><p class="modal-desc" style="margin-top:10px;margin-bottom:0">金塊と査定額0Gのものは残します。</p>';
 }else{
 html+=`<div class="item-row"><div class="item-info"><strong>${s.rodLevel===0?'扱いやすい竿':s.rodLevel===1?'なじんだ竿':'竿は十分になじんでいる'}</strong><small>引き上げの成功帯が広くなる</small></div><button data-buy="rod" class="small-btn gold" ${s.rodLevel>=2||s.money<(s.rodLevel===0?120:280)?'disabled':''}>${s.rodLevel>=2?'購入済み':(s.rodLevel===0?120:280)+' G'}</button></div><h3 class="section-label">珍味の餌</h3><p class="modal-desc">珍しい釣果が出やすい餌。基本の餌はいつでも無料。${s.friendStage<2?'<br>おじさんと「常連同士」になると買えます。':''}</p><div class="row-buttons"><button data-buy="bait1" class="small-btn" ${s.friendStage<2||s.money<8?'disabled':''}>1個 · 8 G</button><button data-buy="bait5" class="small-btn" ${s.friendStage<2||s.money<40?'disabled':''}>5個 · 40 G</button></div><p class="modal-desc" style="margin-top:14px">手持ち：${s.baitCount}個。購入後、釣り場の餌メニューで選べます。</p>`;
 }
 openModal('売る・買う',html);$('sell-tab').onclick=()=>{shopTab='sell';showShop();};$('buy-tab').onclick=()=>{shopTab='buy';showShop();};
 document.querySelectorAll('[data-sell]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.sell,qty=Number($('qty-'+id).value);if(id==='gold'){try{sell(s,id,qty);save();render();modalCloseAction=null;$('modal').close();if(s.endingPending)showEndingIntro();else{toast('金塊を売った！');showShop();}}catch(e){toast(e.message);}}else shopAction(()=>sell(s,id,qty),gain=>gain?`${gain} Gを受け取った。`:'ごみ入れへ。海が少しきれいになった。');});
 document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>shopAction(()=>buy(s,btn.dataset.buy),'買い物をした。'));
 if($('sell-all'))$('sell-all').onclick=()=>shopAction(()=>sellAll(s),gain=>`${gain} Gを受け取った。`);
}
$('shop').onclick=()=>{shopTab='sell';showShop();};
function showBook(){if(phase!=='idle')return;openModal('釣果図鑑',`<p class="modal-desc">${s.discovered.length} / 8 種発見。売っても、リリースしても記録は残る。<br>ヒトデの連続記録：${s.maxStarStreak}匹</p><div class="book-grid">${ITEMS.map(it=>{const seen=s.discovered.includes(it.id);return `<article class="book-card ${seen?'':'locked'}">${image(sprites[it.id],seen?it.name:'未発見の釣果')}<h3>${seen?it.name:'？？？'}</h3><p>${seen?it.desc:'まだ出会っていない。'}</p><small>${seen?'釣った数：'+s.catchCounts[it.id]+'　'+(it.id==='black_bream'?'売却不可':it.price+' G'):''}</small></article>`;}).join('')}</div>`);}
$('book').onclick=showBook;
function showSettings(){if(phase!=='idle')return;openModal('釣り場の設定',`<div class="setting-row"><label for="set-sound">音を鳴らす<small>場面に合わせたBGM・波の音・効果音。</small></label><input id="set-sound" type="checkbox" ${s.settings.sound?'checked':''}></div><div class="setting-row"><label for="set-slow">ゆっくり釣り<small>合わせる時間を長く、目印をゆっくりに。釣果の確率は変わりません。</small></label><input id="set-slow" type="checkbox" ${s.settings.slow?'checked':''}></div><div class="setting-row"><label for="set-motion">水面の動き<small>ウキの揺れなどを表示します。</small></label><input id="set-motion" type="checkbox" ${s.settings.motion?'checked':''}></div><p class="modal-desc">「釣る」→ ウキが沈んだら「今！」→ 緑の帯で「引き上げる」。最初の3投は練習で、失敗しません。<br><br>記録はこのブラウザに保存されます。別の端末とは共有されません。</p><button id="reset-ask" class="small-btn danger">記録を消して、はじめから</button>`);
 $('set-sound').onchange=soundToggle;$('set-slow').onchange=e=>{s.settings.slow=e.target.checked;save();render();};$('set-motion').onchange=e=>{s.settings.motion=e.target.checked;save();render();};
 $('reset-ask').onclick=()=>{openModal('記録を消しますか？','<p class="modal-desc">所持金・図鑑・会話の記録がすべて消えます。この操作は元に戻せません。</p><div class="row-buttons"><button id="reset-no" class="small-btn">やめる</button><button id="reset-yes" class="small-btn danger">消してはじめから</button></div>');$('reset-no').onclick=showSettings;$('reset-yes').onclick=()=>{s=fresh();save();music?.mute();audio?.suspend().catch(()=>{});closeModal();active=false;phase='idle';$('title-screen').hidden=false;$('start').textContent='釣り場へ';render();};};
}
$('settings').onclick=showSettings;
function showEndingIntro(){setPhase('idle');dialogue('clear',()=>{s.endingPending=true;save();$('ending').hidden=false;syncMusic();effect('gold');});}
function finishEnding(toTitle){s.endingPending=false;save();$('ending').hidden=true;if(toTitle){active=false;$('title-screen').hidden=false;$('start').textContent='つづきから釣る';render();}else{render();dialogue('after');}}
$('end-back').onclick=()=>finishEnding(false);$('end-title').onclick=()=>finishEnding(true);
function status(){return {phase,money:s.money,castCount:s.castCount,friendship:FRIENDS[s.friendStage],inventory:{...s.inventory},discovered:[...s.discovered],cleared:s.cleared};}
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'get_fishing_status',title:'釣りの記録を見る',description:'現在の所持金、釣果、交流段階、クリア状況を読み取ります。釣りや売却は実行しません。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('入力は空のオブジェクトにしてください。');return status();}})).catch(()=>{});}catch{}}
try{assets();}catch(error){
 console.error('Fishing startup failed',startupStep,error);
 const detail='v0.1.7 / '+startupStep+' / '+(error?.name||'Error')+': '+(error?.message||String(error));
 $('startup-error').textContent=detail;$('startup-error').hidden=false;
 $('start').disabled=false;$('start').textContent='読み込みをやり直す';$('start').onclick=()=>location.reload();
 log(detail);
}
