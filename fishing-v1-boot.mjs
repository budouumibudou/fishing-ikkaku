const BUILD='1.0.0';
const $=id=>document.getElementById(id);
let loaded=false,loading=false,checking=false,blocked=true;
function gate(title,message){
 document.documentElement.classList.remove('game-ready');
 $('maintenance-screen').hidden=false;
 $('maintenance-title').textContent=title;$('maintenance-message').textContent=message;
 for(const el of document.body.children)if(el.id!=='maintenance-screen'&&el.tagName!=='SCRIPT'&&el.tagName!=='STYLE')el.inert=true;
 if(!blocked&&loaded)window.dispatchEvent(new Event('game-maintenance'));
 blocked=true;
}
async function check(){
 if(checking)return;checking=true;
 try{
  const response=await fetch('./maintenance.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('公開設定を確認できませんでした。');
  const config=await response.json();
  if(typeof config.enabled!=='boolean')throw Error('公開設定の形式が正しくありません。');
  if(config.enabled){gate('メンテナンス中',config.message||'ただいまゲームを更新しています。公開再開までしばらくお待ちください。');return;}
  if(config.build&&config.build!==BUILD){gate('新しい版に更新されました','下の「再読み込み」を押してください。');return;}
  if(!loaded&&!loading){
   loading=true;
   try{await import('./fishing-v1-game.mjs?v=1.0.0');loaded=true;}
   catch(error){console.error('Game module failed',error);gate('ゲームを読み込めませんでした','更新の反映中の可能性があります。少し待って「再読み込み」を押してください。');return;}
   finally{loading=false;}
  }
  if(loaded){
   for(const el of document.body.children)el.inert=false;
   $('maintenance-screen').hidden=true;document.documentElement.classList.add('game-ready');blocked=false;
  }
 }catch(error){gate('公開状況を確認できません','通信を確認して再読み込みしてください。セーブデータは消えません。');console.warn(error);}
 finally{checking=false;}
}
$('maintenance-reload').onclick=()=>{const url=new URL(location.href);url.searchParams.set('update',Date.now().toString());location.replace(url);};
gate('公開状況を確認しています','少しお待ちください。');
check();setInterval(check,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
