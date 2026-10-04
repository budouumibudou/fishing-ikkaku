import {voyageAction,BOAT_PRICES,canVisitBerth,canSail,knowsRumor,canMeetDeity} from './test-v06-core.mjs?v=0.7.2-test1';
export const SEA_SPRITES={horse_mackerel:'test-v06-horse_mackerel.png',mackerel:'test-v06-mackerel.png',red_seabream:'test-v06-red_seabream.png',kue:'test-v06-kue.png'};
export function setupVoyage({getState,modal,dialogue,commit,close,ending,toast,effect=()=>{}}){
 const $=id=>document.getElementById(id);
 const act=kind=>{try{voyageAction(getState(),kind);commit();return true;}catch(e){toast(e.message);return false;}};
 const button=(id,label,disabled=false)=>`<button id="${id}" class="small-btn" ${disabled?'disabled':''}>${label}</button>`;
 function menu(){
  const s=getState();
  if(!canSail(s)){
   const message=!knowsRumor(s)?'船長はまだ戻っていないよ。波止場のおじさんなら、港のことをよく知っている。':!s.portCleared?'船長なら裏通りの先だよ。今日は金塊の噂で、妙に騒がしいね。':'あの辺りで、ずしりと重いものが沈んだんだ。桟橋から釣れたら、見せてくれ。';
   modal('船着場',`<p class="modal-desc">${s.portCleared?'船長':'受付'}「${message}」</p><div class="choice-list">${canVisitBerth(s)&&s.location!=='berth'?button('reception-berth','桟橋で釣ってみる'):''}${s.location==='berth'?button('reception-shore','波止場へ戻る'):''}${button('reception-back','戻る')}</div>`);
   $('reception-back').onclick=close;if($('reception-berth'))$('reception-berth').onclick=()=>{if(act('berth'))close();};if($('reception-shore'))$('reception-shore').onclick=()=>{if(act('harbor'))close();};return;
  }
  let html=`<p class="modal-desc">船長「${s.location==='sea'?'いい潮だ。岩礁が気になるかい？　帰りたくなったら声をかけな。':'救命胴衣は用意した。おじさんも一緒だ。沖へ行こうか。'}」</p><p>所持金 ${s.money.toLocaleString()} G</p><div class="choice-list">`;
  html+=button('voyage-travel',s.location==='sea'?'波止場へ帰港する':s.boat?'一獲丸で出航する':'船長の船に同乗する · 無料');
  if(canMeetDeity(s))html+=button('voyage-god','岩礁を調べる · 金塊の噂の先へ');
  if(s.location!=='berth')html+=button('voyage-berth','船着場に寄る');
  if(s.location==='berth')html+=button('voyage-shore','波止場へ戻る');
  if(!s.license&&s.seaCasts>=5)html+=button('voyage-license','船長の操船講習 · 合格時1,000 G',s.money<1000);
  if(s.license&&s.location==='harbor'&&!s.boat)html+=button('voyage-buy','自分の船を買う · 2,500 G',s.money<BOAT_PRICES[0]);
  if(s.license&&s.location==='harbor'&&s.boatLevel===1)html+=button('voyage-upgrade','一獲丸を豪華に改装する · 3,500 G',s.money<BOAT_PRICES[1]);
  modal('船長と話す',html+'</div>');
  $('voyage-travel').onclick=()=>{const target=s.location==='sea'?'harbor':'sea';if(act(target)){close();toast(target==='sea'?'おじさんと一緒に、沖へ出航！':'港に戻った。おつかれさま。');}};
  if($('voyage-berth'))$('voyage-berth').onclick=()=>{if(act('berth'))close();};
  if($('voyage-shore'))$('voyage-shore').onclick=()=>{if(act('harbor'))close();};
  if($('voyage-license'))$('voyage-license').onclick=exam;
  if($('voyage-buy'))$('voyage-buy').onclick=()=>{if(act('boat')){effect('boat');menu();toast('あなたの船「一獲丸」を手に入れた！');}};
  if($('voyage-upgrade'))$('voyage-upgrade').onclick=()=>{if(act('boatUpgrade')){effect('boat');menu();toast('一獲丸を改装した！ 大物の狙い場へ行きやすくなった。');}};
  if($('voyage-god'))$('voyage-god').onclick=trial;
 }
 function exam(){
  let i=0;const questions=[['出航前、必ず身につけるものは？',['救命胴衣','勝負のサングラス']],['天候が急に悪化したら？',['釣りをやめ、安全を優先して戻る','クエが釣れるまで粘る']],['見張りと周囲の確認は？',['操縦中も継続する','出航時だけでよい']]];
  function paint(){const [q,answers]=questions[i];modal('船長の講習 · '+(i+1)+'/3',`<p class="modal-desc">船長「急がなくていい。合格したら講習費は1,000 Gだ」</p><h3>${q}</h3><div class="choice-list">${answers.map((a,n)=>button('exam-'+n,a)).join('')}</div>`);$('exam-1').onclick=()=>toast('船長「安全を優先しよう。もう一度、選んでごらん」');$('exam-0').onclick=()=>{if(++i<questions.length)paint();else if(act('license')){menu();toast('免許取得！ 船長「焦らない。それがいちばん大事」');}};}paint();
 }
 function trial(){
  const s=getState();if(!canMeetDeity(s)){toast('沖で大物クエを釣ると、船長が岩礁へ案内してくれます。');return;}
  if(s.deityPending){history();return;}
  modal('沖の岩礁 · チヌ神',`<div class="result"><img src="test-v06-black-bream-fixed.png" alt="チヌ神"><h3>チヌ神「お前も、金の噂を追って来たか」</h3><p>クエを釣った潮筋の先。岩礁の陰から、低い声がした。</p><button id="god-history" class="small-btn gold">金塊と、変な釣果のわけを尋ねる</button><p class="modal-desc">話を聞くと物語の結末へ進みます。スタッフロールの後も、この記録で釣りを続けられます。</p></div>`);
  $('god-history').onclick=()=>{s.deityPending=true;commit();history();};
 }
 function history(){
  dialogue([['チヌ神','昔、この港の者たちは金を海に沈めた。大漁も幸運も、金で買えると思っていた。'],['あなた','それが、あの金塊……。では、サンダルやボールペンも？'],['チヌ神','あれは落とし物だ。神なら何でも説明できると思うでない。'],['隣のおじさん','ぶどうまで流れてくるからねえ。海は広いよ。'],['船長','金の噂が人づてにふくらんで、裏通りは大騒ぎだった。だが、お前が来て顔の見える付き合いに戻った。'],['チヌ神','金を釣りに来たお前は、ほかに何を手にした？'],['あなた','釣り方を教えてくれる人。釣れない日も、一緒に笑ってくれる人。'],['隣のおじさん','なら、明日も隣を空けておこう。'],['あなた','もっと欲しい、ばかりだった気持ちは、ここに置いて帰ります。'],['チヌ神','よかろう。持ち帰った魚も金も、お前の暮らしに使え。海には、また会いに来ればいい。'],['船長','さあ、みんなで港へ帰ろう。']],()=>{if(act('offering')){close();ending();}},true);
 }
 return {menu,trial};
}
