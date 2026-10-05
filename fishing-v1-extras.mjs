import {keepAji} from './fishing-v1-core.mjs?v=1.0.0';
import {BY_ID} from './fishing-v1-data.mjs?v=1.0.0';
const RANK_KEY='fishing-ikkaku-challenge-records';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupExtras({getState,modal,commit,toast}){
 const $=id=>document.getElementById(id);
 function people(){const s=getState();if(s.location!=='harbor'){toast('釣り仲間は波止場で待っています。');return;}if(!s.berthGoldReady){modal('まだ知らない釣り人',`<p class="modal-desc">今はおじさんと釣り、船着場の噂を追おう。沖へ行けるようになった頃、波止場のほかの釣り人にも声をかけてみよう。</p>`);return;}
 modal('波止場の釣り仲間',`<p>悠太はイカ釣りの相棒、澄子は釣果を囲む食卓の仲間。ふたりの話にも、続きがあります。</p><div class="choice-list"><button id="young-talk" class="small-btn">悠太 · ${s.youngStage===2?'沖の釣り仲間':s.youngStage?'イカ釣りの約束':'桟橋でほどけた糸'}</button><button id="neighbor-talk" class="small-btn">澄子 · ${s.neighborStage===2?'桟橋の食卓':s.neighborStage?'海ぶどうを見せる約束':'帰りを待つおすそ分け'}</button></div>`);
 $('young-talk').onclick=young;
 $('neighbor-talk').onclick=neighbor;
 }
 function event(title,art,lines,onDone){let n=0;function paint(){modal(title,`<div class="friend-event"><img src="${art}" alt="${escape(title)}"><small>波止場 · ${n+1}/${lines.length}</small><h3>${escape(lines[n][0])}</h3><p>${escape(lines[n][1])}</p></div><button id="friend-next" class="small-btn gold">${n+1===lines.length?'それから……':'話を聞く'}</button>`);$('friend-next').onclick=()=>{if(++n<lines.length)paint();else onDone();};}paint();}
 function young(){const s=getState();
 if(!s.youngStage){event('悠太 · 桟橋でほどけた糸','fishing-v1-horse_mackerel.png',[
 ['桟橋の端で','若い釣り人が絡んだ糸と格闘している。こちらを見て、困ったように笑った。'],['悠太','魚より先に、自分を釣っちゃいました。……ちょっと押さえてもらえますか。'],['あなた','大物ですね。逃がしておきましょう。'],['悠太','助かった！ 僕は悠太。お返しにイカ釣りを一緒に考えませんか。アジを泳がせると、イカが抱きつくんです。'],['悠太','餌メニューでアジを選べば、そのまま使えます。最初の一投は僕が食い込むタイミングを教えます。釣れたら、ここで見せ合いましょう。']
 ],()=>{modal('悠太とイカ釣りの約束',`<p>手元のアジ：${s.inventory.horse_mackerel||0}匹。悠太の助言がある最初の生き餌釣りは、イカが確実に抱きつき、引き上げても逃しません。最初の1匹で感覚をつかもう。</p><button id="friend-accept" class="small-btn gold">${s.inventory.horse_mackerel>0?'アジ1匹を確保して、イカを狙う':'まず沖でアジを釣ってくる'}</button>`);$('friend-accept').onclick=()=>{if(s.inventory.horse_mackerel>0){keepAji(s);s.settings.bait='live_aji';}s.youngStage=1;s.squidAttempts=Math.max(s.squidAttempts,2);commit();people();};});return;}
 if(s.discovered.includes('aori_squid')&&s.youngStage<2){event('悠太 · はじめてのイカを見せに','fishing-v1-aori_squid.png',[
 ['悠太','あの約束、覚えてたんですね。うわ、きれいなイカだ！'],['あなた','待つところで、少し焦りました。魚とは違いますね。'],['悠太','僕も最初はすぐ引いちゃって。今度は僕が釣れたものも見せます。上手い人と比べてばかりじゃ、楽しくないですもんね。'],['ふたりで','桟橋に並んで、手振りでイカの大きさを競う。少しずつ大きくなり、最後には船ほどになった。'],['悠太','次は大物です。潮の筋を一緒に調べておきます。これはアジを集めるオキアミ。僕の分まで釣ってこなくていいから、また話しましょう。']
 ],()=>{s.youngStage=2;s.krillCount+=3;commit();say('悠太と釣り仲間になった。オキアミ3個を受け取った。');});return;}
 if(s.discovered.includes('buri')&&!s.readDialogueIds.includes('yutaBlue')){event('悠太 · 同じ潮を追いかけて','fishing-v1-buri.png',[
 ['悠太','潮目のブリ、本当に走ってたんですね！ あの海図の矢印、僕が書いたんです。'],['あなた','どうして、あの場所が分かったんですか。'],['悠太','澄子さんが海鳥の集まる場所を覚えていて。僕が潮の向きを書き足して、船長が帰れる道を直してくれました。'],['悠太','最初に糸をほどいてくれた日から、ひとりで上手くなるより、釣れた話を持ち寄る方が楽しいんです。'],['悠太','次は僕も釣ってみせます。小瓶の海図を見つけたら、澄子さんにも知らせてくださいね。']
 ],()=>{s.readDialogueIds.push('yutaBlue');s.krillCount+=3;commit();say('悠太と潮目の釣果を分け合った。オキアミ3個を受け取った。');});return;}
 say(s.youngStage===2?'悠太「イカの次は、沖の潮目のブリ。僕らの海図は船長に渡しておきます。釣れた話だけじゃなく、逃がした話も聞かせてください」':'悠太「約束のイカ、待ってます。餌メニューでアジを選んで、抱きついてから少し待つ。一緒に糸をほどいた時みたいに、焦らずに」');
 }
 function neighbor(){const s=getState();
 if(!s.neighborStage){event('澄子 · 帰りを待つおすそ分け','fishing-v1-sea_grapes.png',[
 ['波止場へ帰ると','青いエプロンの釣り人が、空の皿をひとつ増やした。'],['澄子','おかえり。売る魚と、晩ごはんになる魚。どちらもいい釣果だね。'],['あなた','今日は妙なものばかり釣れました。'],['澄子','釣れなくても、帰って話す人がいればいいんだよ。私は澄子。裏通りの大声のおばちゃんとは別人だからね。'],['澄子','海ぶどうを見つけたら持っておいで。桟橋で味見しよう。売ってしまった時は、話だけでも聞かせておくれ。']
 ],()=>{s.neighborStage=1;commit();people();});return;}
 if(s.discovered.includes('sea_grapes')&&s.neighborStage<2){event('澄子 · 桟橋の小さな食卓','fishing-v1-sea_grapes.png',[
 ['澄子','海ぶどうを見つけたんだね。こんな小さな粒が、海の流れに乗ってくるんだ。'],['あなた','高い魚を釣るのとは、違う楽しさがあります。'],['澄子','そうそう。悠太もいつも大物の話だけど、帰るとこの皿を空にするよ。'],['桟橋の食卓','潮風の中で、皿と湯飲みが並ぶ。金塊の噂で騒いだ港が、少しだけ静かになる。']
 ],()=>mealChoice());return;}
 if(s.discovered.includes('message_bottle')&&!s.readDialogueIds.includes('sumikoBlue')){event('澄子 · 戻ってきた海図','fishing-v1-message_bottle.png',[
 ['澄子','小瓶、見つけてくれたんだね。船長が落とした時は、悠太とずいぶん探したよ。'],['あなた','手紙まで入っていました。僕に宛てて？'],['澄子','あの桟橋で、今度は誰を待とうかって話したんだ。おじさんが、あなたの席は空けておくって。'],['澄子','金を手にしたら、もう来ないかもと思ってた。でも戻ってきたね。釣りは、帰る場所があると長く続くんだよ。'],['あなた','次は釣れなくても、また来ます。'],['澄子','もちろん。皿を減らさずに待ってるよ。']
 ],()=>{s.readDialogueIds.push('sumikoBlue');s.fatCount+=3;commit();say('澄子と、次の食卓を約束した。豚の脂身3個を受け取った。');});return;}
 if(s.neighborStage===2){mealChoice();return;}
 say('澄子「海ぶどうが見つかったら、売ったあとでも話を聞かせておくれ。持って帰れたら、次の釣りの前に一緒に食べよう」');
 }
 function mealChoice(){const s=getState(),stock=s.inventory.sea_grapes>0?'inventory':s.homeInventory.sea_grapes>0?'homeInventory':null;
 modal('澄子と、桟橋でひと休み',`<div class="friend-event"><img src="fishing-v1-sea_grapes.png" alt="桟橋の食卓"><h3>澄子「ひと皿、どうだい？」</h3><p>${stock?'海ぶどうを1個使って一緒に食べると、次の3投の成功帯が広がります。':'海ぶどうはもう手元になくても、釣れた話だけで十分です。次に持ち帰ったら一緒に食べられます。'}</p></div>${stock?'<button id="friend-meal" class="small-btn gold">海ぶどう1個で一緒に食べる</button>':''}<button id="friend-no-meal" class="small-btn">食べずに、釣りの話をする</button>`);
 const finish=ate=>{if(ate){s[stock].sea_grapes--;s.mealCasts=3;}if(s.neighborStage<2){s.neighborStage=2;s.fatCount+=3;}commit();say(ate?'海ぶどうの粒がぱちんと弾ける。澄子「落ち着いて行っておいで。また帰りを待ってるよ」 次の3投の成功帯が広がった。':'澄子「魚がなくても話はあるね。またおいで」 桟橋の食卓に、あなたの席ができた。');};
 if($('friend-meal'))$('friend-meal').onclick=()=>finish(true);$('friend-no-meal').onclick=()=>finish(false);
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
