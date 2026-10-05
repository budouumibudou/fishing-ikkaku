import {voyageAction,BOAT_PRICES,canVisitBerth,canSail,knowsRumor,canMeetDeity} from './test-v06-core.mjs?v=0.7.5-test1';
export const SEA_SPRITES={horse_mackerel:'test-v06-horse_mackerel.png',mackerel:'test-v06-mackerel.png',red_seabream:'test-v06-red_seabream.png',kue:'test-v06-kue.png'};
export function setupVoyage({getState,modal,dialogue,commit,close,ending,toast,effect=()=>{}}){
 const $=id=>document.getElementById(id);
 const act=kind=>{try{voyageAction(getState(),kind);commit();return true;}catch(e){toast(e.message);return false;}};
 const button=(id,label,disabled=false)=>`<button id="${id}" class="small-btn" ${disabled?'disabled':''}>${label}</button>`;
 let returnToMenu=null,bossFrame=0;
 const back=()=>{close();returnToMenu?.();};
 function menu(onBack=undefined){
  if(onBack!==undefined)returnToMenu=typeof onBack==='function'?onBack:null;
  const s=getState();
  if(!canSail(s)){
   const message=!knowsRumor(s)?'船長はまだ戻っていないよ。波止場のおじさんなら、港のことをよく知っている。':!s.portCleared?'船長なら裏通りの先だよ。今日は金塊の噂で、妙に騒がしいね。':'あの辺りで、ずしりと重いものが沈んだんだ。桟橋から釣れたら、見せてくれ。';
   modal('船着場',`<p class="modal-desc">${s.portCleared?'船長':'受付'}「${message}」</p><div class="choice-list">${canVisitBerth(s)&&s.location!=='berth'?button('reception-berth','桟橋で釣ってみる'):''}${s.location==='berth'?button('reception-shore','波止場へ戻る'):''}${button('reception-back',returnToMenu?'メニューへ戻る':'戻る')}</div>`,returnToMenu);
   $('reception-back').onclick=back;if($('reception-berth'))$('reception-berth').onclick=()=>{if(act('berth'))close();};if($('reception-shore'))$('reception-shore').onclick=()=>{if(act('harbor'))close();};return;
  }
  let html=`<p class="modal-desc">船長「${s.location==='sea'?'いい潮だ。岩礁が気になるかい？　帰りたくなったら声をかけな。':'救命胴衣は用意した。おじさんも一緒だ。沖へ行こうか。'}」</p><p>所持金 ${s.money.toLocaleString()} G</p><p class="modal-desc">免許：${s.license?'取得済み':'未取得'} · 船：${s.boatLevel===2?'一獲丸・豪華改装済み':s.boatLevel===1?'自船・一獲丸':'船長の船に同乗'}</p><div class="choice-list">`;
  html+=button('voyage-travel',s.location==='sea'?'波止場へ帰港する':s.boat?'一獲丸で出航する':'船長の船に同乗する · 無料');
  if(s.boatLevel===2)html+=button('voyage-bluewater',s.fishingGround==='bluewater'&&s.location==='sea'?'沖の潮目で釣り中':'改装船だけの漁場 · 沖の潮目へ',s.fishingGround==='bluewater'&&s.location==='sea');
  if(s.location==='sea'&&s.fishingGround==='bluewater')html+=button('voyage-reef','いつもの岩礁へ戻る');
  if(canMeetDeity(s))html+=button('voyage-god','岩礁を調べる · 金塊の噂の先へ');
  if(s.location!=='berth')html+=button('voyage-berth','船着場に寄る');
  if(s.location==='berth')html+=button('voyage-shore','波止場へ戻る');
  if(!s.license)html+=button('voyage-license',s.seaCasts<5?'操船免許 · 同乗であと'+(5-s.seaCasts)+'投':'操船免許を取る · 合格時1,000 G',s.seaCasts<5||s.money<1000);
  if(!s.boat)html+=button('voyage-buy',!s.license?'自分の船 · 免許取得後に購入（18,000 G）':s.location!=='harbor'?'自分の船 · 帰港して購入（18,000 G）':'自分の船を買う · 18,000 G',!s.license||s.location!=='harbor'||s.money<BOAT_PRICES[0]);
  if(s.boatLevel<2)html+=button('voyage-upgrade',s.boatLevel===0?'豪華な船へ改装 · 購入後（28,000 G）':s.location!=='harbor'?'一獲丸を改装 · 帰港して相談（28,000 G）':'一獲丸を豪華に改装する · 28,000 G',s.boatLevel!==1||s.location!=='harbor'||s.money<BOAT_PRICES[1]);
  html+='</div><p class="modal-desc">船長「免許と自分の船は、もっと釣りを楽しむためのものだ。同乗のままでも、最後の岩礁まで案内するよ。自分の船なら大物を狙いやすくなる。改装船なら沖の潮目へ出て、そこでしか釣れないブリを狙える」</p><div class="choice-list">'+button('voyage-back',returnToMenu?'メニューへ戻る':'釣り場へ戻る');
  modal('船長と話す',html+'</div>',returnToMenu);
  $('voyage-back').onclick=back;
  if($('voyage-bluewater'))$('voyage-bluewater').onclick=()=>{if(act('bluewater')){close();if(!s.readDialogueIds.includes('bluewaterIntro'))dialogue('bluewaterIntro');else toast('一獲丸で、沖の潮目へ。');}};
  if($('voyage-reef'))$('voyage-reef').onclick=()=>{if(act('reef')){close();toast('金塊の噂が始まった岩礁へ戻った。');}};
  $('voyage-travel').onclick=()=>{const target=s.location==='sea'?'harbor':'sea';if(act(target)){close();toast(target==='sea'?'おじさんと一緒に、沖へ出航！':'港に戻った。おつかれさま。');}};
  if($('voyage-berth'))$('voyage-berth').onclick=()=>{if(act('berth'))close();};
  if($('voyage-shore'))$('voyage-shore').onclick=()=>{if(act('harbor'))close();};
  if($('voyage-license'))$('voyage-license').onclick=exam;
  if($('voyage-buy'))$('voyage-buy').onclick=()=>{if(act('boat')){effect('boat');menu();toast('あなたの船「一獲丸」を手に入れた！');}};
  if($('voyage-upgrade'))$('voyage-upgrade').onclick=()=>{if(act('boatUpgrade')){effect('boat');menu();toast('一獲丸を改装した！ 専用漁場「沖の潮目」でブリを狙えるようになった。');}};
  if($('voyage-god'))$('voyage-god').onclick=trial;
 }
 function exam(){
  let i=0;const questions=[['出航前、必ず身につけるものは？',['救命胴衣','勝負のサングラス']],['天候が急に悪化したら？',['釣りをやめ、安全を優先して戻る','クエが釣れるまで粘る']],['見張りと周囲の確認は？',['操縦中も継続する','出航時だけでよい']]];
  function paint(){const [q,answers]=questions[i];modal('船長の講習 · '+(i+1)+'/3',`<p class="modal-desc">船長「急がなくていい。合格したら講習費は1,000 Gだ」</p><h3>${q}</h3><div class="choice-list">${answers.map((a,n)=>button('exam-'+n,a)).join('')}</div>`);$('exam-1').onclick=()=>toast('船長「安全を優先しよう。もう一度、選んでごらん」');$('exam-0').onclick=()=>{if(++i<questions.length)paint();else if(act('license')){menu();toast('免許取得！ 船長「焦らない。それがいちばん大事」');}};}paint();
 }
 function trial(){
  const s=getState();if(!canMeetDeity(s)){toast('沖で大物クエを釣ると、船長が岩礁へ案内してくれます。');return;}
  if(s.deityPending){resumeBoss();return;}
  modal('金塊の噂が始まった岩礁',`<p class="modal-desc">船長「この潮筋だ。あのクエを上げたなら、ここでも竿を出せる」<br>おじさん「海の底に、誰かいるようだね」</p><button id="god-cast" class="fish-btn">岩礁に釣り糸を投げる</button><p class="modal-desc">最後の大物勝負。失敗しても竿・釣果・餌・所持金は減りません。船長の船と初心者の竿でも挑めます。</p>`);
  $('god-cast').onclick=()=>{s.deityPending=true;s.deityStage='waiting';s.deityPulls=0;commit();bossWait();};
 }
 function resumeBoss(){
  const stage=getState().deityStage;
  if(stage==='history'){history();return;}
  if(stage==='question'){askHistory();return;}
  if(stage==='landed'){landed();return;}
  if(stage==='reveal'){reveal();return;}
  if(stage==='fight'){bossPull();return;}
  bossWait();
 }
 function bossWait(){
  cancelAnimationFrame(bossFrame);
  modal('岩礁の大物 · ウキを見守る',`<div class="result"><p id="god-wait-text">波が止まった。ウキが、静かに沈んでいく……。</p><button id="god-hook" class="fish-btn" disabled>ウキを見守る…</button></div>`);
  let start=null;
  const frame=now=>{if(!$('modal').open||!$('god-hook'))return;if(start===null)start=now;if(now-start>=1800){$('god-wait-text').textContent='ウキが沈んだ！ 船長「今だ。落ち着いて合わせろ！」';$('god-hook').disabled=false;$('god-hook').textContent='今！ 合わせる';effect('hook');return;}bossFrame=requestAnimationFrame(frame);};bossFrame=requestAnimationFrame(frame);
  $('god-hook').onclick=()=>{if($('god-hook').disabled)return;getState().deityStage='fight';commit();bossPull();};
 }
 function bossPull(){
  cancelAnimationFrame(bossFrame);const s=getState();if(s.deityPulls>=3){s.deityStage='landed';commit();landed();return;}
  const round=s.deityPulls+1;
  modal('岩礁の大物 · '+round+'/3',`<div class="result"><h3>${['底から、動かない。','黒い影が、水面を走る。','船の下で、低い笑い声がする。'][round-1]}</h3><p>緑の帯でタップ。3回、落ち着いて引き上げよう。</p><div class="challenge-meter"><div class="boss-safe"></div><div class="boss-critical"></div><div id="god-needle"></div></div><button id="god-pull" class="fish-btn">竿を引く！</button><p>成功 ${s.deityPulls}/3 · 外しても成功した分は残ります。</p></div>`);
  let start=null,position=0,finished=false;const speed=s.settings.slow?.6:.85;
  const frame=now=>{if(finished||!$('modal').open||!$('god-needle'))return;if(start===null)start=now;position=(Math.sin((now-start)/1000*Math.PI*speed-Math.PI/2)+1)/2;$('god-needle').style.left=position*100+'%';bossFrame=requestAnimationFrame(frame);};bossFrame=requestAnimationFrame(frame);
  $('god-pull').onclick=()=>{if(finished)return;finished=true;cancelAnimationFrame(bossFrame);
   if(Math.abs(position-.5)<=.19){s.deityPulls++;commit();effect('catch');bossPull();}
   else{effect('escape');modal('まだ、糸は切れていない',`<p class="modal-desc">船長「力任せに引かなくていい。息を合わせよう」<br>おじさん「大丈夫。さっき上げた分は戻っとらんよ」</p><button id="god-retry" class="fish-btn">もう一度、竿を構える</button><p>成功 ${s.deityPulls}/3。竿・釣果・餌・所持金は無事です。</p>`);$('god-retry').onclick=bossPull;}
  };
 }
 function landed(){
  cancelAnimationFrame(bossFrame);
  modal('釣り上げた！ · チヌ神',`<div class="result"><img src="test-v06-black-bream-fixed.png" alt="釣り上げたチヌ神"><h3>岩礁の主が、船べりに姿を現した！</h3><p>船長「竿はそのまま。引き寄せすぎるな」<br>あなた「釣れた……のか？」<br>黒い魚が、こちらを見て笑った。</p><button id="god-speak" class="fish-btn">釣った魚に、話しかける</button></div>`);
  $('god-speak').onclick=()=>{getState().deityStage='reveal';commit();reveal();};
 }
 function reveal(){
  dialogue([['あなた','釣り上げました！'],['チヌ神','おう。わしも、ようやく釣り上げた。'],['あなた','……誰を？'],['チヌ神','お前さんたちを。この岩礁までな。金塊は、よく効く餌じゃ。'],['隣のおじさん','釣り人の方が、食いついとったのか。'],['船長','だが、この魚を上げた腕は本物だ。'],['チヌ神','わしはチヌさま。この海の黒鯛たちの親分じゃ。聞きたいことがある顔をしておるな。']],()=>{getState().deityStage='question';commit();askHistory();},true);
 }
 function askHistory(){
  modal('釣り人を釣った、チヌ神',`<div class="result"><img src="test-v06-black-bream-fixed.png" alt="チヌ神"><h3>あなた「金塊も、変な釣果も、あなたの仕業ですか？」</h3><button id="god-history" class="fish-btn">金塊と、変な釣果のわけを尋ねる</button><p>物語の結末とスタッフロールへ進みます。その後も同じ記録で釣りを続けられます。釣果と所持金は残ります。</p></div>`);
  $('god-history').onclick=()=>{getState().deityStage='history';commit();history();};
 }
 function history(){
  const s=getState();
  const lines=[['チヌ神','うちの若いもんが、世話になったようじゃな。黒鯛たちは、ここに沈んだ供え物を見回っておる。']];
  if(s.rodBreakCount>0)lines.push(['チヌ神','竿を'+s.rodBreakCount+'本も折ったそうで。若いもんは、加減を知らん。']);
  if(s.breamRepelCount>0)lines.push(['チヌ神','……その若いもんをシバいたのは、お前さんじゃな。互いにほどほどにせい。']);
  lines.push(['チヌ神','昔、この港の者たちは豊漁を願って金を沈めた。供え物はな……正直、嬉しかった。'],['あなた','それが、あの金塊……。では、サンダルやボールペンも？'],['チヌ神','あれは落とし物だ。神なら何でも説明できると思うでない。'],['隣のおじさん',s.discovered.includes('grapes')?'ぶどうまで流れてくるからねえ。海は広いよ。':'妙な落とし物がまだまだありそうだねえ。海は広いよ。'],['船長','金の噂で裏通りは大騒ぎだった。クエの潮筋をたどって、ようやくここへ来られたな。'],['チヌ神','金を釣りに来たお前は、ほかに何を手にした？'],['あなた','釣り方を教えてくれる人。釣れない日も、一緒に笑ってくれる人。'],['チヌ神','供えた者はもうおらん。金は持っていけ。お前の暮らしに使うがよい。'],['あなた','一獲千金できたのに、明日も釣りに来たいんです。'],['隣のおじさん','なら、明日も隣を空けておこう。'],['船長','さあ、みんなで港へ帰ろう。']);
  dialogue(lines,()=>{if(act('offering')){close();ending();}},true);

 }
 return {menu,trial};
}
