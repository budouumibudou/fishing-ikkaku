import {ITEMS,BY_ID} from './fishing-v1-data.mjs?v=1.0.0';
export const STORAGE_KEY='fishing-ikkaku-v1';
export function fresh(){return {breamTalked:false,schemaVersion:2,storyVersion:3,voyageVersion:1,fishingGround:"reef",bluewaterCasts:0,actOneVersion:1,deityVersion:1,deityStage:"",deityPulls:0,actOneSeen:false,actOnePending:false,goldBridgePending:false,breamRepelCount:0,deityPending:false,creditsStarted:false,portWins:0,krillCount:0,sageCount:0,sagePity:0,fatCount:0,octopusAttempts:0,mealCasts:0,youngStage:0,neighborStage:0,location:'harbor',seaCasts:0,berthCasts:0,berthGoldReady:false,seaIntroRead:false,license:false,boat:false,boatLevel:0,seaEnding:false,trueEndingSeen:false,money:50,baitCount:0,liveBaitCount:0,squidAttempts:0,rodLevel:0,inventory:{},homeInventory:{},discovered:[],catchCounts:{},castCount:0,friendStage:0,readDialogueIds:[],pendingDialogueIds:[],goldPityCount:0,goldRecoveryMode:false,blackBreamCooldown:0,criticalCount:0,rodBreakCount:0,pendingCast:null,pendingBlack:null,portCleared:false,cleared:false,endingPending:false,settings:{sound:false,slow:false,motion:true,bait:'base'},starStreak:0,maxStarStreak:0};}
const counts=['bluewaterCasts','deityPulls','breamRepelCount','portWins','krillCount','sageCount','sagePity','fatCount','octopusAttempts','mealCasts','youngStage','neighborStage','money','baitCount','liveBaitCount','squidAttempts','rodLevel','boatLevel','castCount','friendStage','goldPityCount','blackBreamCooldown','criticalCount','rodBreakCount','starStreak','maxStarStreak','seaCasts','berthCasts'];
export function hydrate(raw){
 if(!raw||typeof raw!=='object'||![1,2].includes(raw.schemaVersion))throw Error('このセーブ形式は読み込めません。元のデータは残しています。');
 const s=fresh();
 for(const key of counts){if(raw[key]!==undefined&&(!Number.isSafeInteger(raw[key])||raw[key]<0))throw Error('セーブの数値が正しくありません：'+key);if(raw[key]!==undefined)s[key]=raw[key];}
 s.rodLevel=Math.min(3,s.rodLevel);s.friendStage=Math.min(3,s.friendStage);
 for(const key of ['inventory','homeInventory','catchCounts']){
  if(raw[key]!==undefined&&(typeof raw[key]!=='object'||!raw[key]||Array.isArray(raw[key])))throw Error('所持品の形式が正しくありません。');
  for(const [id,n] of Object.entries(raw[key]||{})){if(!BY_ID[id])throw Error('この版にない釣果を含んでいます：'+id);if(!Number.isSafeInteger(n)||n<0)throw Error('所持数が正しくありません。');s[key][id]=n;}
 }
 for(const key of ['discovered','readDialogueIds','pendingDialogueIds'])if(Array.isArray(raw[key]))s[key]=[...new Set(raw[key].filter(x=>typeof x==='string'))];
 for(const key of ['breamTalked','actOneSeen','actOnePending','goldBridgePending','cleared','endingPending','goldRecoveryMode','portCleared','berthGoldReady','seaIntroRead','license','boat','seaEnding','trueEndingSeen','deityPending','creditsStarted'])s[key]=raw[key]===true;
 // Older saves only had a yes/no boat flag. Keep the purchased boat and its cost.
 s.boatLevel=Math.min(2,s.boatLevel);if(s.boat&&s.boatLevel===0)s.boatLevel=1;
 s.boat=s.boatLevel>0;
 for(const key of ['sound','slow','motion'])if(typeof raw.settings?.[key]==='boolean')s.settings[key]=raw.settings[key];
 s.settings.bait=['rare','live_aji','krill','sage','pork_fat'].includes(raw.settings?.bait)?raw.settings.bait:'base';
 if(raw.pendingCast&&BY_ID[raw.pendingCast.id])s.pendingCast={id:raw.pendingCast.id,safe:raw.pendingCast.safe===true,eligible:raw.pendingCast.eligible===true,live:raw.pendingCast.live===true,preview:raw.pendingCast.preview===true,krill:raw.pendingCast.krill===true,bluewater:raw.pendingCast.bluewater===true};
 if(raw.pendingBlack&&typeof raw.pendingBlack==='object')s.pendingBlack={kind:'black',critical:raw.pendingBlack.critical===true,protected:raw.pendingBlack.protected===true||(s.catchCounts.black_bream||0)<=1};
 if(!raw.voyageVersion)s.endingPending=false;
 // Preserve genuine street completion; never infer it from an old voyage shortcut.
 if(raw.storyVersion!==3&&s.portCleared){
  for(const id of ['friend1','shoreClue','friend2','goldRumor'])if(!s.readDialogueIds.includes(id))s.readDialogueIds.push(id);
  s.friendStage=Math.max(2,s.friendStage);
  // Players who actually reached the old sea keep their unlocked voyage.
  if(raw.seaIntroRead||raw.location==='sea'||s.seaCasts>0||s.seaEnding)s.berthGoldReady=true;
 }
 if(!s.catchCounts.kue&&(s.inventory.kue>0||s.homeInventory.kue>0||s.discovered.includes('kue')))s.catchCounts.kue=1;
 // Old records keep their progress: no retroactive joke ending or item requirement.
 if(raw.actOneVersion!==1){
  const hadGold=s.discovered.includes('gold')||(s.catchCounts.gold||0)>0||s.inventory.gold>0||s.homeInventory.gold>0||s.cleared||s.berthGoldReady;
  s.actOneSeen=hadGold||s.seaEnding||s.trueEndingSeen;
  s.goldBridgePending=hadGold&&!s.seaEnding&&!s.trueEndingSeen;
  s.actOnePending=false;
 }
 if(s.seaEnding||s.trueEndingSeen){s.actOneSeen=true;s.actOnePending=false;s.goldBridgePending=false;}
 s.deityPulls=Math.min(3,s.deityPulls);s.deityStage=['waiting','fight','landed','reveal','question','history'].includes(raw.deityStage)?raw.deityStage:'';
 if(raw.deityPending&&!raw.deityVersion)s.deityStage='history';
 if(s.seaEnding||s.trueEndingSeen){s.deityPending=false;s.deityStage='';s.deityPulls=0;}
 s.pendingDialogueIds=s.pendingDialogueIds.filter(id=>id!=='recovery');
 s.portWins=Math.max(s.portWins,s.portCleared?1:0);s.mealCasts=Math.min(3,s.mealCasts);s.youngStage=Math.min(2,s.youngStage);s.neighborStage=Math.min(2,s.neighborStage);
 s.fishingGround=raw.fishingGround==='bluewater'&&s.boatLevel===2?'bluewater':'reef';
 if(raw.breamTalked===undefined)s.breamTalked=s.rodBreakCount>0||(s.inventory.black_bream||0)>0||(s.homeInventory.black_bream||0)>0||s.deityPending;
 s.location=raw.location==='sea'&&canSail(s)?'sea':raw.location==='berth'&&canVisitBerth(s)?'berth':'harbor';return s;
}
export function encodeBackup(s){return JSON.stringify({game:'fishing-ikkaku',formatVersion:2,savedAt:new Date().toISOString(),state:s});}
export function decodeBackup(text){let raw;try{raw=JSON.parse(text);}catch{throw Error('コードが途中で切れているか、形式が違います。');}if(raw.game&&raw.game!=='fishing-ikkaku')throw Error('別のゲームのバックアップです。');return hydrate(raw.state??raw);}
export function queue(s,id){if(!s.readDialogueIds.includes(id)&&!s.pendingDialogueIds.includes(id))s.pendingDialogueIds.push(id);}
export function availableStory(s){
 if(!s.readDialogueIds.includes('intro'))return 'intro';
 if(canPractice(s)&&!s.readDialogueIds.includes('portRewardHint'))return 'portRewardHint';
 if(s.portWins>=2&&!s.readDialogueIds.includes('portParcelHint'))return 'portParcelHint';
 if(s.trueEndingSeen&&!s.readDialogueIds.includes('afterSeaHint'))return 'afterSeaHint';
 if(s.castCount>=6&&s.friendStage<1)return 'friend1';
 if(s.castCount>=9&&!s.readDialogueIds.includes('shoreClue'))return 'shoreClue';
 if(s.castCount>=15&&s.friendStage<2)return 'friend2';
 if(s.friendStage>=2&&!knowsRumor(s))return 'goldRumor';
 if(s.berthGoldReady&&s.castCount>=25&&s.friendStage<3)return 'friend3';
 if(s.location==='berth'&&s.inventory.gold>0&&!s.berthGoldReady)return 'berthGold';
 return s.pendingDialogueIds.find(id=>id!=='voyageInvite'||s.portCleared)||null;
}
export function readStory(s,id){if(!s.readDialogueIds.includes(id))s.readDialogueIds.push(id);s.pendingDialogueIds=s.pendingDialogueIds.filter(x=>x!==id);if(/^friend[123]$/.test(id))s.friendStage=Math.max(s.friendStage,Number(id.at(-1)));if(id==='berthGold')s.berthGoldReady=true;}
const widths={starfish:[.60,.16],puffer:[.50,.12],mushroom:[.60,.16],sea_grapes:[.52,.13],horse_mackerel:[.48,.12],cigarette:[.60,.14],sandal:[.60,.14],ballpen:[.60,.14],grapes:[.46,.10],cordyceps:[.38,.09],mackerel:[.40,.10],red_seabream:[.32,.08],black_bream:[.28,.07],kue:[.24,.06],aori_squid:[.34,.08],buri:[.28,.07],message_bottle:[.58,.12],gold:[.44,.10]};
export function successWidth(s){return Math.min(.78,(widths[s.pendingCast?.id]?.[0]??.44)+s.rodLevel*.07+(s.friendStage>=1?.04:0)+(s.mealCasts>0?.05:0));}
export function criticalWidth(s){return widths[s.pendingCast?.id]?.[1]??.10;}
function weighted(pool,rng){const total=pool.reduce((sum,[,w])=>sum+w,0);let roll=rng()*total;for(const [id,w] of pool){roll-=w;if(roll<0)return id;}return pool.at(-1)[0];}
export function beginCast(s,rng=Math.random){
 if(s.pendingCast)return s.pendingCast;if(s.pendingBlack)throw Error('黒鯛との会話を終えよう。');if(s.endingPending)throw Error('エンディングを先に見よう。');
 const eligible=s.berthGoldReady&&!s.cleared&&!(s.inventory.gold>0);
 let id,safe=false,live=false;
 const baitStock={rare:'baitCount',live_aji:'liveBaitCount',krill:'krillCount',sage:'sageCount',pork_fat:'fatCount'};
 if(baitStock[s.settings.bait]&&s[baitStock[s.settings.bait]]<1&&!(s.settings.bait==='live_aji'&&(s.inventory.horse_mackerel||0)>0))throw Error('その餌はありません。基本の餌に戻してください。');
 if(s.location==='sea'&&s.fishingGround!=='bluewater'&&!s.breamTalked&&!s.trueEndingSeen&&!s.seaEnding&&s.seaCasts>=2&&s.blackBreamCooldown===0){id='black_bream';safe=true;}else if(s.settings.bait==='sage'){
 s.sageCount--;id='sealed_book';safe=true;
 }else if(s.settings.bait==='pork_fat'){
 if(s.location!=='sea')throw Error('豚の脂身でタコを狙うなら、船で沖の岩礁へ。');
 s.fatCount--;s.octopusAttempts++;id=rng()<.8||s.octopusAttempts>=3?'octopus':'starfish';safe=s.octopusAttempts>=3;
 }else if(s.settings.bait==='live_aji'){
  if(s.liveBaitCount>0)s.liveBaitCount--;else if((s.inventory.horse_mackerel||0)>0)s.inventory.horse_mackerel--;else throw Error('手元にも生き餌用にもアジがありません。');
  s.squidAttempts++;live=true;
  id=rng()<.65||s.squidAttempts>=3?'aori_squid':'horse_mackerel';safe=s.squidAttempts>=3;
 }else if(s.location==='berth'&&!s.berthGoldReady){
  id=s.berthCasts>=2?'gold':s.berthCasts===0?'sandal':'sea_grapes';safe=true;
 }else if(s.castCount<3){id=['starfish','puffer','mushroom'][s.castCount];safe=true;}
 else if(s.location==='harbor'&&s.castCount===3&&!s.discovered.includes('sea_grapes')){id='sea_grapes';safe=true;}
 else if(s.location==='harbor'&&s.castCount===4){id='ballpen';safe=true;}
 else if(s.location==='harbor'&&s.castCount>=11&&!s.discovered.includes('grapes')){id='grapes';safe=true;}
 else if(eligible&&s.goldPityCount>=(s.goldRecoveryMode?5:20)){id='gold';safe=true;}
 else if(s.location==='sea'){
  const boatLevel=s.boatLevel||0;
  if(s.fishingGround==='bluewater'&&boatLevel===2){
   id=weighted([['buri',24],['horse_mackerel',s.settings.bait==='krill'?48:18],['mackerel',24],['red_seabream',20],['sea_grapes',8],['message_bottle',s.trueEndingSeen&&s.discovered.includes('buri')&&!s.discovered.includes('message_bottle')?8:0]],rng);
   // Guarantee a first exclusive catch, then the epilogue clue, without long luck waits.
   if(!s.discovered.includes('buri')&&s.bluewaterCasts>=4){id='buri';safe=true;}
   else if(s.trueEndingSeen&&s.discovered.includes('buri')&&!s.discovered.includes('message_bottle')&&s.bluewaterCasts>=8){id='message_bottle';safe=true;}
  }else{
   id=weighted([['horse_mackerel',s.settings.bait==='krill'?60:30],['mackerel',24],['red_seabream',20],['kue',boatLevel===2?16:boatLevel===1?12:10],['sea_grapes',12],['black_bream',4]],rng);
   if(s.seaCasts%(boatLevel===2?6:boatLevel===1?8:10)===(boatLevel===2?5:boatLevel===1?7:9)){id='kue';safe=true;}
  }
 }else{
  const rare=s.settings.bait==='rare'&&s.baitCount>0;
  id=weighted(ITEMS.filter(it=>(rare?it.rare:it.base)>0).map(it=>[it.id,rare?it.rare:it.base]),rng);
  if(id==='gold'&&!s.berthGoldReady)id='sea_grapes';
 }
 if(id==='black_bream'&&(s.castCount<5||s.blackBreamCooldown>0))id='horse_mackerel';
 if(s.settings.bait==='rare'&&s.baitCount>0)s.baitCount--;if(s.settings.bait==='krill')s.krillCount--;
 s.pendingCast={id,safe,eligible,live,krill:s.settings.bait==='krill',bluewater:s.location==='sea'&&s.fishingGround==='bluewater'&&s.boatLevel===2};return s.pendingCast;
}
export function completeCast(s,success,critical=false){
 const cast=s.pendingCast;if(!cast)return null;s.pendingCast=null;s.castCount++;s.mealCasts=Math.max(0,s.mealCasts-1);s.blackBreamCooldown=Math.max(0,s.blackBreamCooldown-1);
 if(s.location==='sea')s.seaCasts++;if(cast.bluewater)s.bluewaterCasts++;if(s.location==='berth')s.berthCasts++;if(cast.eligible&&s.location==='harbor')s.goldPityCount++;
 if(!success&&!cast.safe){s.starStreak=0;return {kind:'escape'};}
 const id=cast.id,first=!s.discovered.includes(id);if(first){s.discovered.push(id);queue(s,id);}const amount=id==='horse_mackerel'&&cast.krill&&s.location==='sea'?2:1;s.catchCounts[id]=(s.catchCounts[id]||0)+amount;
 if(critical)s.criticalCount++;s.starStreak=id==='starfish'?s.starStreak+1:0;s.maxStarStreak=Math.max(s.maxStarStreak,s.starStreak);
 if(id==='black_bream'){s.blackBreamCooldown=4;s.pendingBlack={kind:'black',critical,protected:s.catchCounts[id]===1};return {...s.pendingBlack,first};}
 s.inventory[id]=(s.inventory[id]||0)+amount;if(id==='gold'){s.goldPityCount=0;s.goldRecoveryMode=false;if(!s.actOneSeen&&!s.seaEnding&&!s.trueEndingSeen)s.actOnePending=true;}if(id==='aori_squid')s.squidAttempts=0;if(id==='octopus')s.octopusAttempts=0;
 const bonus=critical?5:0;s.money+=bonus;return {kind:'catch',id,first,critical,bonus,amount};
}
export function resolveBlackBream(s,choice,rng=Math.random){
 if(!['release','peace','anger','gamble','repel'].includes(choice)||!s.pendingBlack)throw Error('黒鯛との会話は終わっています。');
 if(choice==='anger'&&s.pendingBlack.protected)choice='release';
 if(choice==='gamble'&&s.pendingBlack.protected)throw Error('初めての会話では強気の交渉はできません。');
 if(choice==='repel'&&s.rodBreakCount<10)throw Error('まだ黒鯛をシバくコツはつかめていません。');
 const failed=choice==='gamble'&&rng()<.5;const lost=[],gold=false;
 s.pendingBlack=null;if(choice!=='release')s.breamTalked=true;
 if(choice==='anger'||failed){s.rodLevel=Math.max(0,s.rodLevel-1);s.rodBreakCount++;}if(choice==='repel'){s.blackBreamCooldown=8;s.breamRepelCount++;}
 if(choice==='peace'||(choice==='gamble'&&!failed))s.inventory.black_bream=(s.inventory.black_bream||0)+(choice==='gamble'?2:1);
 return {kind:'black',resolution:choice==='gamble'?(failed?'anger':'gamble-win'):choice,lost,gold};
}
function quantity(s,id,qty,source='inventory'){if(!BY_ID[id]||!Number.isSafeInteger(qty)||qty<1||(s[source][id]||0)<qty)throw Error('所持数の範囲で個数を指定してください。');}
function idle(s){if(s.pendingCast||s.pendingBlack)throw Error('今の釣りを終えてからにしよう。');}
export function sell(s,id,qty=1){idle(s);quantity(s,id,qty);const gain=BY_ID[id].price*qty;s.inventory[id]-=qty;s.money+=gain;if(id==='gold'&&!s.cleared){s.cleared=true;queue(s,'gold');}return gain;}
export function sellAll(s){let total=0;for(const it of ITEMS)if(it.id!=='gold'&&it.price>0&&(s.inventory[it.id]||0)>0)total+=sell(s,it.id,s.inventory[it.id]);return total;}
export function keepAji(s,qty=1){idle(s);quantity(s,'horse_mackerel',qty);s.inventory.horse_mackerel-=qty;s.liveBaitCount+=qty;return qty;}
export function storeCatch(s,id,qty=1,withdraw=false){idle(s);const source=withdraw?'homeInventory':'inventory',dest=withdraw?'inventory':'homeInventory';quantity(s,id,qty,source);s[source][id]-=qty;s[dest][id]=(s[dest][id]||0)+qty;return qty;}
export function dryStarfish(s){idle(s);quantity(s,'starfish',1);s.inventory.starfish--;s.homeInventory.dried_starfish=(s.homeInventory.dried_starfish||0)+1;if(!s.discovered.includes('dried_starfish'))s.discovered.push('dried_starfish');return 1;}
export const ROD_PRICES=[120,280,650];
export const BOAT_PRICES=[18000,28000];
export function buy(s,kind){idle(s);let price;if(kind==='rod'){if(s.rodLevel>=3)throw Error('竿は最高ランクです。');price=ROD_PRICES[s.rodLevel];}else if(['bait1','bait5'].includes(kind)){if(s.friendStage<2)throw Error('おじさんと常連同士になると買える。');price=kind==='bait1'?8:40;}else if(['krill','pork_fat'].includes(kind)){if(!canSail(s))throw Error('裏通りを抜けてから買えます。');price=kind==='krill'?15:25;}else throw Error('その品物はありません。');if(s.money<price)throw Error('お金が足りません。');s.money-=price;if(kind==='rod')s.rodLevel++;else if(kind==='krill')s.krillCount+=3;else if(kind==='pork_fat')s.fatCount+=3;else s.baitCount+=kind==='bait1'?1:5;return price;}
export function knowsRumor(s){return s.readDialogueIds.includes('goldRumor');}
export function canVisitBerth(s){return s.friendStage>=2&&knowsRumor(s)&&s.portCleared;}
export function canSail(s){return canVisitBerth(s)&&s.berthGoldReady;}
export function canPractice(s){return s.portCleared&&s.seaCasts>=3;}
export function canMeetDeity(s){return canSail(s)&&s.location==='sea'&&s.fishingGround!=='bluewater'&&(s.catchCounts.kue||0)>0&&s.breamTalked&&!s.seaEnding;}
export function portVictory(s,practice=false,rng=Math.random){
 idle(s);
 if(!practice&&!knowsRumor(s))throw Error('まず波止場で金塊の噂を聞こう。');
 if(!practice&&s.portCleared)throw Error('物語の騒動は解決済みです。');
 if(practice&&!canPractice(s))throw Error('沖釣りを経験してから、港に戻ろう。');
 if(!practice&&!s.portCleared){s.portCleared=true;s.portWins++;s.money+=80;queue(s,'voyageInvite');return '港の騒動を突破！ 80 Gを獲得。警官「誤解だった。船長は桟橋の先だ。次からは顔パスでいい」';}
 if(!s.portCleared)return '3人を撃退！ 練習完了。物語は波止場から進めよう。';
 s.portWins++;s.krillCount+=3;s.sagePity++;
 const special=rng()<.2||s.sagePity>=5;
 if(special){s.sageCount++;s.sagePity=0;queue(s,'sageHint');}
 queue(s,'portRewardHint');
 return '3人を撃退！ おばちゃん「昨日は人違いですまなかったね。餌を持っていきな」 オキアミ ×3'+(special?'。袋の底に、見慣れない包みが1つ……（賢者の餌 ×1）':'。');
}
export const EDIBLE=['buri','horse_mackerel','mackerel','red_seabream','kue','aori_squid','octopus','sea_grapes'];
export function eatCatch(s,id){idle(s);if(s.location!=='harbor')throw Error('食事は帰港して家で。');if(!EDIBLE.includes(id))throw Error('これは食事にできません。');if(s.mealCasts>0)throw Error('食事の効果が残っています。あと'+s.mealCasts+'投。');quantity(s,id,1,'homeInventory');s.homeInventory[id]--;s.mealCasts=3;return 3;}
export function voyageAction(s,kind){idle(s);if(kind==='harbor'){s.location='harbor';return;}if(kind==='berth'){if(!canVisitBerth(s))throw Error('おじさんと常連同士になり、金塊の噂を聞いて裏通りを越えよう。');s.location='berth';return;}if(!canSail(s))throw Error(!knowsRumor(s)?'波止場でおじさんと親しくなり、金塊の噂を聞こう。':!s.portCleared?'裏通りで船長を探そう。':'船着場で金塊を釣り、船長に見せよう。');if(kind==='bluewater'){if(s.boatLevel!==2)throw Error('沖の潮目へ行くには、一獲丸の豪華改装が必要です。');s.location='sea';s.fishingGround='bluewater';s.seaIntroRead=true;queue(s,'bluewaterIntro');}else if(kind==='reef'){s.location='sea';s.fishingGround='reef';s.seaIntroRead=true;}else if(kind==='sea'){s.location='sea';s.fishingGround='reef';s.seaIntroRead=true;}else if(kind==='license'){if(s.license)throw Error('免許は取得済み。');if(s.seaCasts<5)throw Error('まずは同乗で5投、経験を積もう。');if(s.money<1000)throw Error('講習費は1,000 G。');s.money-=1000;s.license=true;}else if(kind==='boat'||kind==='boatUpgrade'){if(s.location!=='harbor')throw Error('船の購入と改装は、帰港してから受付で行えます。');if(!s.license)throw Error('自分で操縦するには、先に免許を取ろう。');const level=s.boatLevel||0;if(kind==='boat'&&level!==0)throw Error('船は購入済み。改装は受付で選べます。');if(kind==='boatUpgrade'&&level!==1)throw Error('改装には自分の船が必要です。');const price=BOAT_PRICES[level];if(s.money<price)throw Error('船の費用が足りません。');s.money-=price;s.boatLevel=level+1;s.boat=true;}else if(kind==='offering'){if(s.seaEnding||s.location!=='sea')throw Error('沖へ出てからにしよう。');if(!s.breamTalked)throw Error('まず黒鯛の話を聞いて、親分の居場所を確かめよう。');if(!(s.catchCounts.kue>0))throw Error('沖でクエを釣ると、岩礁への道が分かります。');s.deityPending=false;s.seaEnding=true;s.endingPending=true;s.creditsStarted=false;}else throw Error('その行動はできません。');}
