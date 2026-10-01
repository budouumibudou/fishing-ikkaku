import {voyageAction,BOAT_PRICES} from './test-v06-core.mjs?v=0.7.0-test1';
import {canSail} from './test-v06-core.mjs?v=0.6.4-test1';
export const SEA_SPRITES={horse_mackerel:'test-v06-horse_mackerel.png',mackerel:'test-v06-mackerel.png',red_seabream:'test-v06-red_seabream.png',kue:'test-v06-kue.png'};
export function setupVoyage({getState,modal,dialogue,commit,close,ending,toast}){
 const $=id=>document.getElementById(id);
 const act=kind=>{try{voyageAction(getState(),kind);commit();return true;}catch(e){toast(e.message);return false;}};
 function menu(){
  const s=getState();
  if(!canSail(s)){modal('船の受付',`<p class="modal-desc">船長は、おじさんの紹介を待っています。<br>① 波止場で6投して、おじさんと「釣り仲間」の会話をする<br>または<br>② 港の街の短い騒動を抜けて船長を探す<br><br>金塊、免許、自分の船は同乗に不要です。<br>現在：${s.castCount}投 · ${s.portCleared?'街は突破済み':'街はまだ'}</p><button id="reception-back" class="small-btn gold">釣り場へ戻る</button>`);$('reception-back').onclick=close;return;}
  modal('船の受付',`<p class="modal-desc">船長「救命胴衣、よし。最初は私が操縦するよ」<br>同乗は無料。帰港して売買できます。自分の船でも救命胴衣は常時着用。<br>所持金 ${s.money.toLocaleString()} G · 沖で ${s.seaCasts} 投</p><div class="voyage-progress">${s.license?'✓ 免許取得':'任意：同乗で沖を5投 → 免許講習'}<br>${s.boatLevel===2?'✓ 改装した自分の船（クエは6投ごとに確定）':s.boat?'✓ 自分の船（クエは8投ごとに確定）':'任意：免許取得後、2,500 Gで自分の船を購入（クエは8投ごとに確定）'}<br>${s.seaEnding?'✓ チヌ神の試練達成':'同乗でも沖の魚が釣れる。クエを釣ったら海の試練へ'}</div><div class="choice-list"><button id="voyage-travel" class="small-btn gold">${s.location==='sea'?'帰港する':s.boat?'自分の船で出航':'船長の船に同乗する（無料）'}</button><button id="voyage-license" class="small-btn" ${s.license||s.seaCasts<5||s.money<1000?'disabled':''}>${s.license?'免許取得済み':'免許講習に挑戦 · 1,000 G（合格時）'}</button><button id="voyage-buy" class="small-btn" ${s.location==='sea'||!s.license||s.boat||s.money<BOAT_PRICES[0]?'disabled':''}>${s.boat?'自分の船は購入済み':'自分の船を買う · 2,500 G'}</button><button id="voyage-upgrade" class="small-btn" ${s.location==='sea'||!s.license||s.boatLevel!==1||s.money<BOAT_PRICES[1]?'disabled':''}>${s.boatLevel===2?'船は改装済み':'船を改装 · 3,500 G（クエは6投ごと）'}</button><button id="voyage-god" class="small-btn" ${s.seaEnding||!(s.inventory.kue>0)||s.location!=='sea'?'disabled':''}>海の試練（沖でクエ1匹）</button></div>`);
  $('voyage-travel').onclick=()=>{const target=s.location==='sea'?'harbor':'sea';if(act(target)){close();toast(target==='sea'?'救命胴衣を着用して出航！':'波止場に戻った。釣果を売ろう。');}};
  $('voyage-license').onclick=exam;
  $('voyage-buy').onclick=()=>{if(act('boat')){toast('あなたの船「一獲丸」を手に入れた！');menu();}};
  $('voyage-upgrade').onclick=()=>{if(act('boatUpgrade')){toast('一獲丸を改装した。クエの狙い場へ行きやすくなった！');menu();}};
  $('voyage-god').onclick=trial;
 }
 function exam(){
  let i=0;const questions=[['出航前、必ず身につけるものは？',['救命胴衣','勝負のサングラス']],['天候が急に悪化したら？',['釣りをやめ、安全を優先して戻る','クエが釣れるまで粘る']],['見張りと周囲の確認は？',['操縦中も継続する','出航時だけでよい']]];
  function paint(){const [q,answers]=questions[i];modal('船長の講習 · '+(i+1)+'/3',`<p class="modal-desc">ゲーム内の免許イベントです。合格したときだけ1,000 Gを支払います。</p><h3>${q}</h3><div class="choice-list">${answers.map((a,n)=>`<button id="exam-${n}" class="small-btn">${a}</button>`).join('')}</div>`);$('exam-1').onclick=()=>{toast('船長「安全を優先して、もう一度考えよう」');};$('exam-0').onclick=()=>{if(++i<questions.length)paint();else if(act('license')){toast('免許取得！ 船長「焦らない。それがいちばん大事」');menu();}};}
  paint();
 }
 function trial(){modal('沖の岩礁 · チヌ神',`<div class="result"><img src="test-v06-black-bream-fixed.png" alt="チヌ神"><h3>チヌ神「一獲千金の先で、何を得た？」</h3><p>大きなクエが、手元で静かに揺れている。</p><div class="choice-list"><button id="god-return" class="small-btn gold">海からいただいたものです。クエを海に返す</button><button id="god-keep" class="small-btn">今日は持ち帰る。また会いに来る</button></div></div>`);$('god-keep').onclick=()=>{close();toast('チヌ神「答えは急がぬ。釣りを続けよ」');};$('god-return').onclick=()=>{if(act('offering')){close();ending();}};}
 return {menu};
}
