import {BY_ID} from './test-v06-data.mjs?v=0.7.5-test1';
const RANK_KEY='fishing-ikkaku-preview-v06-challenge-records';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupExtras({getState,modal,commit,toast}){
 const $=id=>document.getElementById(id);
 function people(){const s=getState();if(s.location!=='harbor'){toast('釣り仲間は波止場で待っています。');return;}if(!s.berthGoldReady){modal('まだ知らない釣り人',`<p class="modal-desc">今はおじさんと釣り、船着場の噂を追おう。沖へ行けるようになった頃、波止場のほかの釣り人にも声をかけてみよう。</p>`);return;}
 modal('波止場の釣り仲間',`<p>釣果を見せて、話してみよう。会話だけなら釣果は減りません。</p><div class="choice-list"><button id="young-talk" class="small-btn">若い釣り人・悠太（${s.youngStage===2?'釣り仲間':s.youngStage?'顔見知り':'はじめまして'}）</button><button id="neighbor-talk" class="small-btn">青いエプロンの釣り人・澄子（${s.neighborStage===2?'釣り仲間':s.neighborStage?'顔見知り':'はじめまして'}）</button></div><p>澄子さんは波止場の常連。裏通りのおばちゃんとは別人です。</p>`);
 $('young-talk').onclick=()=>{
 let line;if(!s.youngStage){s.youngStage=1;line='悠太「沖でアジが釣れたら、生き餌に残してみて。アオリイカが抱きつくよ。釣れたら見せてね」';}
 else if(s.discovered.includes('buri')&&!s.readDialogueIds.includes('yutaBlue')){s.readDialogueIds.push('yutaBlue');s.krillCount+=3;line='悠太「潮目でブリが釣れたんですね！ あの海図、みんなで書いたんです。次は一緒に狙いたいな」 オキアミを3個もらった。';}
 else if(s.discovered.includes('aori_squid')&&s.youngStage<2){s.youngStage=2;s.krillCount+=3;line='悠太「本当に釣れた！ 今度は一緒に大物を狙おう。これはお祝い」 オキアミを3個もらった。';}
 else line=s.youngStage===2?'悠太「次は何を狙う？ 売る分と、餌に残す分。考える時間も釣りだね」':'悠太「アジを釣った画面か、売却画面で生き餌に確保できるよ。イカを見せてくれるのを待ってる」';
 commit();say(line);
 };
 $('neighbor-talk').onclick=()=>{
 let line;if(!s.neighborStage){s.neighborStage=1;line='澄子「売るばかりじゃもったいない。家へ保管して食べると、次の3投は落ち着いて合わせられるよ。海ぶどうも見つけたら見せてね」';}
 else if(s.discovered.includes('message_bottle')&&!s.readDialogueIds.includes('sumikoBlue')){s.readDialogueIds.push('sumikoBlue');s.fatCount+=3;line='澄子「小瓶の手紙、読んでくれたんだね。海図が戻ってよかったよ。釣れた日も釣れなかった日も、帰って話しておくれ」 豚の脂身を3個もらった。';}
 else if(s.discovered.includes('sea_grapes')&&s.neighborStage<2){s.neighborStage=2;s.fatCount+=3;line='澄子「海ぶどう、ちゃんと釣れたね！ この豚の脂身はおすそ分け。沖のタコに使ってごらん」 豚の脂身を3個もらった。';}
 else line=s.neighborStage===2?'澄子「タコは岩に張りつくから、少し待って離れたところを引くんだよ。帰ったら、また釣果を見せておくれ」':'澄子「家の保管箱は黒鯛にも荒らされない。大切な釣果は置いていきな」';
 commit();say(line);
 };
 }
 function say(line){modal('釣り仲間との会話',`<p class="modal-desc">${escape(line)}</p><button id="people-back" class="small-btn gold">仲間のところへ</button>`);$('people-back').onclick=people;}
 function records(){try{const a=JSON.parse(localStorage.getItem(RANK_KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&Number.isSafeInteger(x.score)&&x.score>=0&&x.score<=10000).slice(0,10):[];}catch{return [];}}
 function competition(){modal('10投チャレンジ · この端末だけ',`<p>全員同じ10匹・同じ竿・同じ判定速度。中央の金色を狙おう。通常の釣果・餌・所持金は使いません。途中で閉じると終了します。</p><p>順位はこの端末の記録だけ。結果は自動保存されず、名前も外へ送りません。</p><button id="challenge-start" class="small-btn gold">10投を始める</button><h3>この端末の記録</h3>${records().map((r,i)=>`<p>${i+1}. ${escape(r.name||'名無し')} · ${r.score}点 · ビタ${r.criticals||0}回</p>`).join('')||'<p>まだ記録がありません。</p>'}<button id="challenge-delete" class="small-btn">この端末のチャレンジ記録を消す</button>`);
 $('challenge-start').onclick=run;
 $('challenge-delete').onclick=()=>{modal('記録を消しますか？','<p>10投チャレンジの記録だけを消します。ゲームの進行は残ります。</p><button id="delete-confirm" class="small-btn">記録を消す</button><button id="delete-cancel" class="small-btn">やめる</button>');$('delete-cancel').onclick=competition;$('delete-confirm').onclick=()=>{try{localStorage.removeItem(RANK_KEY);competition();}catch{toast('記録を消せませんでした。');}};};
 }
 function run(){
 const schedule=['starfish','puffer','sea_grapes','horse_mackerel','mackerel','horse_mackerel','aori_squid','octopus','red_seabream','kue'];
 let index=0,score=0,criticals=0,frame=0,elapsed=0,previous=0,position=0,live=true;
 const stop=()=>{live=false;cancelAnimationFrame(frame);};
 function turn(){elapsed=0;previous=0;position=0;live=true;const it=BY_ID[schedule[index]];
 modal('10投チャレンジ · '+(index+1)+'/10',`<h3>${it.name}</h3><p>緑で成功。金色なら得点が1.25倍。現在 ${score}点</p><div class="challenge-meter"><span class="challenge-safe"></span><span class="challenge-critical"></span><i id="challenge-needle"></i></div><button id="challenge-hit" class="fish-btn">引き上げる</button><p>練習用の共通条件です。食事や竿の強化は影響しません。</p>`,stop);
 const button=$('challenge-hit');const tick=time=>{if(!live)return;if(document.hidden){previous=0;frame=requestAnimationFrame(tick);return;}elapsed+=previous?Math.min(.1,(time-previous)/1000):0;previous=time;position=(Math.sin(elapsed*Math.PI*1.1-Math.PI/2)+1)/2;const needle=$('challenge-needle');if(!needle)return;needle.style.left=(position*100)+'%';if(elapsed>=6){settle(false,false);return;}frame=requestAnimationFrame(tick);};
 function settle(success,critical){if(!live)return;stop();button.disabled=true;const points=success?Math.round(it.price*(critical?1.25:1)):0;score+=points;if(critical)criticals++;index++;
 modal('第'+index+'投 · '+(success?'釣れた！':'逃げられた'),`<p>${it.name} · ${points}点${critical?' · センタービタ！':''}</p><p>合計 ${score}点</p><button id="challenge-next" class="small-btn gold">${index===10?'結果を見る':'次の一投'}</button>`);$('challenge-next').onclick=index===10?result:turn;}
 button.onclick=()=>settle(Math.abs(position-.5)<=.22,Math.abs(position-.5)<=.05);frame=requestAnimationFrame(tick);
 }
 function result(){modal('10投の結果',`<h3>${score}点</h3><p>センタービタ ${criticals}回。記録はまだ保存していません。</p><label>この端末で使う名前（任意）<input id="record-name" maxlength="12" placeholder="名無し"></label><div class="choice-list"><button id="record-save" class="small-btn">この端末に残す</button><button id="record-skip" class="small-btn gold">登録せずに戻る</button></div>`);
 $('record-skip').onclick=competition;$('record-save').onclick=()=>{try{const a=records();a.push({name:$('record-name').value.trim().slice(0,12)||'名無し',score,criticals,date:new Date().toISOString()});a.sort((x,y)=>y.score-x.score||y.criticals-x.criticals);localStorage.setItem(RANK_KEY,JSON.stringify(a.slice(0,10)));toast('この端末に記録しました。');competition();}catch{toast('保存できませんでした。記録は残っていません。');}};
 }
 turn();
 }
 return {people,competition};
}
