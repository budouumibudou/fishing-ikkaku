import {voyageAction} from './core.mjs?v=0.4.1';
// Original SVG illustrations: kept as code so each fish is an independent asset.
function fishArt(body,mark,big=false){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><path d="M203 98 L276 50 L265 100 L278 147 Z" fill="${mark}" stroke="#133743" stroke-width="6"/><path d="M95 65 L123 30 L134 49 L155 28 L165 51 L189 39 L210 78" fill="${mark}" stroke="#133743" stroke-width="5"/><ellipse cx="139" cy="102" rx="${big?108:99}" ry="58" fill="${body}" stroke="#133743" stroke-width="6"/><path d="M123 143 L151 171 L176 145 M153 98 L181 115 L144 128" fill="${mark}" stroke="#133743" stroke-width="5"/><path d="M101 69 Q124 107 103 137" fill="none" stroke="${mark}" stroke-width="7"/><path d="M39 117 Q62 107 81 119" fill="none" stroke="#133743" stroke-width="6"/><circle cx="70" cy="87" r="11" fill="#fff5cd"/><circle cx="67" cy="86" r="6" fill="#172832"/>${big?'<path d="M144 62 L154 90 M177 64 L187 95 M145 113 L153 137 M197 105 L203 122" stroke="#584c41" stroke-width="11"/>':''}</svg>`);}
export const SEA_SPRITES={horse_mackerel:fishArt('#bbd4c4','#508482'),mackerel:fishArt('#89b9cb','#345b85'),red_seabream:fishArt('#e9a6a0','#b85569'),kue:fishArt('#a8987d','#6c665a',true)};
export function setupVoyage({getState,modal,dialogue,commit,close,ending,toast}){
 const $=id=>document.getElementById(id);
 const act=kind=>{try{voyageAction(getState(),kind);commit();return true;}catch(e){toast(e.message);return false;}};
 function menu(){
  const s=getState();
  if(!s.cleared){dialogue([['隣のおじさん','沖へ行きたい？ まずは金塊の噂を確かめよう。'],['あなた','船も釣れませんか。'],['隣のおじさん','それは乗るもの。']]);return;}
  modal('船の受付',`<p class="modal-desc">船長「救命胴衣、よし。最初は私が操縦するよ」<br>同乗は無料。帰港して売買できます。自分の船でも救命胴衣は常時着用。<br>所持金 ${s.money.toLocaleString()} G · 沖で ${s.seaCasts} 投</p><div class="voyage-progress">${s.license?'✓ 免許取得':'① 沖で5投 → 免許講習'}<br>${s.boat?'✓ 自分の船':'② 12,000 Gで船を購入'}<br>${s.seaEnding?'✓ チヌ神の試練達成':'③ クエを一匹残して、チヌ神のもとへ'}</div><div class="choice-list"><button id="voyage-travel" class="small-btn gold">${s.location==='sea'?'帰港する':s.boat?'自分の船で出航':'船長の船に同乗する（無料）'}</button><button id="voyage-license" class="small-btn" ${s.license||s.seaCasts<5||s.money<1000?'disabled':''}>${s.license?'免許取得済み':'免許講習に挑戦 · 1,000 G（合格時）'}</button><button id="voyage-buy" class="small-btn" ${!s.license||s.boat||s.money<12000?'disabled':''}>${s.boat?'船は購入済み':'自分の船を買う · 12,000 G'}</button><button id="voyage-god" class="small-btn" ${!s.boat||s.seaEnding||!(s.inventory.kue>0)||s.location!=='sea'?'disabled':''}>チヌ神の試練（自分の船で沖へ・クエ1匹）</button></div>`);
  $('voyage-travel').onclick=()=>{const target=s.location==='sea'?'harbor':'sea';if(act(target)){close();toast(target==='sea'?'救命胴衣を着用して出航！':'波止場に戻った。釣果を売ろう。');}};
  $('voyage-license').onclick=exam;
  $('voyage-buy').onclick=()=>{if(act('boat')){toast('あなたの船「一獲丸」を手に入れた！');menu();}};
  $('voyage-god').onclick=trial;
 }
 function exam(){
  let i=0;const questions=[['出航前、必ず身につけるものは？',['救命胴衣','勝負のサングラス']],['天候が急に悪化したら？',['釣りをやめ、安全を優先して戻る','クエが釣れるまで粘る']],['見張りと周囲の確認は？',['操縦中も継続する','出航時だけでよい']]];
  function paint(){const [q,answers]=questions[i];modal('船長の講習 · '+(i+1)+'/3',`<p class="modal-desc">ゲーム内の免許イベントです。合格したときだけ1,000 Gを支払います。</p><h3>${q}</h3><div class="choice-list">${answers.map((a,n)=>`<button id="exam-${n}" class="small-btn">${a}</button>`).join('')}</div>`);$('exam-1').onclick=()=>{toast('船長「安全を優先して、もう一度考えよう」');};$('exam-0').onclick=()=>{if(++i<questions.length)paint();else if(act('license')){toast('免許取得！ 船長「焦らない。それがいちばん大事」');menu();}};}
  paint();
 }
 function trial(){modal('沖の岩礁 · チヌ神',`<div class="result"><img src="black-bream-fixed.png" alt="チヌ神"><h3>チヌ神「一獲千金の先で、何を得た？」</h3><p>大きなクエが、手元で静かに揺れている。</p><div class="choice-list"><button id="god-return" class="small-btn gold">海からいただいたものです。クエを海に返す</button><button id="god-keep" class="small-btn">今日は持ち帰る。また会いに来る</button></div></div>`);$('god-keep').onclick=()=>{close();toast('チヌ神「答えは急がぬ。釣りを続けよ」');};$('god-return').onclick=()=>{if(act('offering')){close();ending();}};}
 return {menu};
}
