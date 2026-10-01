import {voyageAction,BOAT_PRICES} from './test-v06-core.mjs?v=0.7.1-test1';
import {canVisitBerth,canSail,knowsRumor} from './test-v06-core.mjs?v=0.7.1-test1';
export const SEA_SPRITES={horse_mackerel:'test-v06-horse_mackerel.png',mackerel:'test-v06-mackerel.png',red_seabream:'test-v06-red_seabream.png',kue:'test-v06-kue.png'};
export function setupVoyage({getState,modal,dialogue,commit,close,ending,toast,effect=()=>{}}){
 const $=id=>document.getElementById(id);
 const act=kind=>{try{voyageAction(getState(),kind);commit();return true;}catch(e){toast(e.message);return false;}};
 function menu(){
  const s=getState();
  if(!canSail(s)){const message=!knowsRumor(s)?'まずは波止場で妙なものを釣り、おじさんと釣り仲間・常連になろう。金塊の噂はそれから。':!s.portCleared?'金塊の噂を聞いたね。裏通りの騒動を抜け、船長を探そう。':'船長は船着場にいる。そこで金塊を釣り、見せてから沖へ。';modal('船の受付',`<p class="modal-desc">受付「${message}」<br>波止場の釣果と友情 → 金塊の噂 → 裏通り → 船着場で金塊 → おじさんと同乗。<br>免許と自分の船は任意です。</p><div class="choice-list">${canVisitBerth(s)&&s.location!=='berth'?'<button id="reception-berth" class="small-btn gold">船着場へ行って釣る</button>':''}${s.location==='berth'?'<button id="reception-shore" class="small-btn">波止場に戻る</button>':''}<button id="reception-back" class="small-btn">戻る</button></div>`);$('reception-back').onclick=close;if($('reception-berth'))$('reception-berth').onclick=()=>{if(act('berth')){close();toast('船着場に着いた。船長が釣りを見ている。');}};if($('reception-shore'))$('reception-shore').onclick=()=>{if(act('harbor')){close();toast('波止場へ戻った。');}};return;}
  modal('船の受付',`<p class="modal-desc">船長「救命胴衣、よし。私が舵を取る。おじさんも一緒だ」<br>同乗は無料。あなたは安全な甲板から釣れます。帰港して売買できます。<br>所持金 ${s.money.toLocaleString()} G · 沖で ${s.seaCasts} 投</p><div class="voyage-progress">${s.license?'✓ 免許取得':'任意：同乗で沖を5投 → 免許講習'}<br>${s.boatLevel===2?'✓ 改装した自分の船':s.boat?'✓ 自分の船':'任意：免許取得後、2,500 Gで自分の船を購入'}<br>${s.seaEnding?'✓ チヌ神の試練達成':'同乗でも大物クエとチヌ神の物語へ進める'}</div><div class="choice-list"><button id="voyage-travel" class="small-btn gold">${s.location==='sea'?'波止場に帰港する':s.boat?'自分の船で出航（おじさんも同乗）':'船長とおじさんの船に同乗する（無料）'}</button><button id="voyage-berth" class="small-btn">${s.location==='berth'?'船着場にいる':'船着場に寄る'}</button>${s.location==='berth'?'<button id="voyage-shore" class="small-btn">波止場に戻る</button>':''}<button id="voyage-license" class="small-btn" ${s.license||s.seaCasts<5||s.money<1000?'disabled':''}>${s.license?'免許取得済み':'免許講習に挑戦 · 1,000 G（合格時）'}</button><button id="voyage-buy" class="small-btn" ${s.location!=='harbor'||!s.license||s.boat||s.money<BOAT_PRICES[0]?'disabled':''}>${s.boat?'自分の船は購入済み':'自分の船を買う · 2,500 G'}</button><button id="voyage-upgrade" class="small-btn" ${s.location!=='harbor'||!s.license||s.boatLevel!==1||s.money<BOAT_PRICES[1]?'disabled':''}>${s.boatLevel===2?'船は改装済み':'船を改装 · 3,500 G（クエは6投ごと）'}</button><button id="voyage-god" class="small-btn" ${s.seaEnding||!(s.inventory.kue>0)||s.location!=='sea'?'disabled':''}>岩礁の主に会う · 物語の結末へ（クエ1匹）</button></div>`);
  $('voyage-travel').onclick=()=>{const target=s.location==='sea'?'harbor':'sea';if(act(target)){close();toast(target==='sea'?'救命胴衣を着用して出航！':'波止場に戻った。釣果を売ろう。');}};
  $('voyage-berth').onclick=()=>{if(act('berth')){close();toast('船着場に寄った。');}};
  if($('voyage-shore'))$('voyage-shore').onclick=()=>{if(act('harbor')){close();toast('波止場へ戻った。');}};
  $('voyage-license').onclick=exam;
  $('voyage-buy').onclick=()=>{if(act('boat')){effect('boat');toast('あなたの船「一獲丸」を手に入れた！');menu();}};
  $('voyage-upgrade').onclick=()=>{if(act('boatUpgrade')){effect('boat');toast('一獲丸を改装した。クエの狙い場へ行きやすくなった！');menu();}};
  $('voyage-god').onclick=trial;
 }
 function exam(){
  let i=0;const questions=[['出航前、必ず身につけるものは？',['救命胴衣','勝負のサングラス']],['天候が急に悪化したら？',['釣りをやめ、安全を優先して戻る','クエが釣れるまで粘る']],['見張りと周囲の確認は？',['操縦中も継続する','出航時だけでよい']]];
  function paint(){const [q,answers]=questions[i];modal('船長の講習 · '+(i+1)+'/3',`<p class="modal-desc">ゲーム内の免許イベントです。合格したときだけ1,000 Gを支払います。</p><h3>${q}</h3><div class="choice-list">${answers.map((a,n)=>`<button id="exam-${n}" class="small-btn">${a}</button>`).join('')}</div>`);$('exam-1').onclick=()=>{toast('船長「安全を優先して、もう一度考えよう」');};$('exam-0').onclick=()=>{if(++i<questions.length)paint();else if(act('license')){toast('免許取得！ 船長「焦らない。それがいちばん大事」');menu();}};}
  paint();
 }
 function trial(){
  const s=getState();if(!canSail(s)||s.location!=='sea'||!(s.inventory.kue>0)||s.seaEnding){toast('沖でクエを1匹釣り、手元に残して船長に話しかけよう。');return;}
  modal('沖の岩礁 · チヌ神',`<div class="result"><img src="test-v06-black-bream-fixed.png" alt="チヌ神"><h3>チヌ神「一獲千金の先で、何を得た？」</h3><p>船長「ここが、金塊の噂が始まった岩礁だ」<br>港で集めた話が、ようやくつながる。</p><div class="choice-list"><button id="god-history" class="small-btn">金塊と、変な釣果のわけを尋ねる</button><button id="god-return" class="small-btn gold">クエを海へ返し、港へ帰る · 真のエンディングへ</button><button id="god-keep" class="small-btn">まだ釣りを続ける（クエは残る）</button></div><p>返すのはクエ1匹だけ。結末の後も、今の記録で遊べます。</p></div>`);
  $('god-history').onclick=()=>dialogue([['チヌ神','昔、この港の者は金を運び、豊漁を願った。金だけで海を買えると思ったのだ。'],['あなた','それが、波止場まで流れてきたんですか。'],['チヌ神','金も、落とした履物も、誰かの忘れ物。海は持ち主を選ばぬ。'],['船長','噂を追って騒いだ連中も、今じゃ釣り仲間だ。'],['チヌ神','お前は受け取るばかりか。それとも、何かを返して帰るか。']],trial);
  $('god-keep').onclick=()=>{close();toast('チヌ神「答えは急がぬ。釣りを続けよ」');};
  $('god-return').onclick=()=>{if(act('offering')){close();ending();}};
 }
 return {menu,trial};
}
