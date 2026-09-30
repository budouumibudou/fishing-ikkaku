import {ITEMS,BY_ID} from './test-v05-data.mjs?v=0.5.0-test1';
export const STORAGE_KEY='fishing-ikkaku-v1';
export function fresh(){return {schemaVersion:2,voyageVersion:1,location:'harbor',seaCasts:0,seaIntroRead:false,license:false,boat:false,seaEnding:false,money:50,baitCount:0,liveBaitCount:0,squidAttempts:0,rodLevel:0,inventory:{},homeInventory:{},discovered:[],catchCounts:{},castCount:0,friendStage:0,readDialogueIds:[],pendingDialogueIds:[],goldPityCount:0,goldRecoveryMode:false,blackBreamCooldown:0,criticalCount:0,rodBreakCount:0,pendingCast:null,pendingBlack:null,portCleared:false,cleared:false,endingPending:false,settings:{sound:false,slow:false,motion:true,bait:'base'},starStreak:0,maxStarStreak:0};}
const counts=['money','baitCount','liveBaitCount','squidAttempts','rodLevel','castCount','friendStage','goldPityCount','blackBreamCooldown','criticalCount','rodBreakCount','starStreak','maxStarStreak','seaCasts'];
export function hydrate(raw){
 if(!raw||typeof raw!=='object'||![1,2].includes(raw.schemaVersion))throw Error('このセーブ形式は読み込めません。元のデータは残しています。');
 const s=fresh();
 for(const key of counts){if(raw[key]!==undefined&&(!Number.isSafeInteger(raw[key])||raw[key]<0))throw Error('セーブの数値が正しくありません：'+key);if(raw[key]!==undefined)s[key]=raw[key];}
 s.rodLevel=Math.min(2,s.rodLevel);s.friendStage=Math.min(3,s.friendStage);
 for(const key of ['inventory','homeInventory','catchCounts']){
  if(raw[key]!==undefined&&(typeof raw[key]!=='object'||!raw[key]||Array.isArray(raw[key])))throw Error('所持品の形式が正しくありません。');
  for(const [id,n] of Object.entries(raw[key]||{})){if(!BY_ID[id])throw Error('この版にない釣果を含んでいます：'+id);if(!Number.isSafeInteger(n)||n<0)throw Error('所持数が正しくありません。');s[key][id]=n;}
 }
 for(const key of ['discovered','readDialogueIds','pendingDialogueIds'])if(Array.isArray(raw[key]))s[key]=[...new Set(raw[key].filter(x=>typeof x==='string'))];
 for(const key of ['cleared','endingPending','goldRecoveryMode','portCleared','seaIntroRead','license','boat','seaEnding'])s[key]=raw[key]===true;
 for(const key of ['sound','slow','motion'])if(typeof raw.settings?.[key]==='boolean')s.settings[key]=raw.settings[key];
 s.settings.bait=['rare','live_aji'].includes(raw.settings?.bait)?raw.settings.bait:'base';
 if(raw.pendingCast&&BY_ID[raw.pendingCast.id])s.pendingCast={id:raw.pendingCast.id,safe:raw.pendingCast.safe===true,eligible:raw.pendingCast.eligible===true,live:raw.pendingCast.live===true,preview:raw.pendingCast.preview===true};
 if(raw.pendingBlack&&typeof raw.pendingBlack==='object')s.pendingBlack={kind:'black',critical:raw.pendingBlack.critical===true,protected:raw.pendingBlack.protected===true||(s.catchCounts.black_bream||0)<=1};
 if(!raw.voyageVersion)s.endingPending=false;
 s.location=raw.location==='sea'&&(s.cleared||s.seaIntroRead||s.friendStage>=1||s.portCleared)?'sea':'harbor';return s;
}
export function encodeBackup(s){return JSON.stringify({game:'fishing-ikkaku',formatVersion:2,savedAt:new Date().toISOString(),state:s});}
export function decodeBackup(text){let raw;try{raw=JSON.parse(text);}catch{throw Error('コードが途中で切れているか、形式が違います。');}if(raw.game&&raw.game!=='fishing-ikkaku')throw Error('別のゲームのバックアップです。');return hydrate(raw.state??raw);}
export function queue(s,id){if(!s.readDialogueIds.includes(id)&&!s.pendingDialogueIds.includes(id))s.pendingDialogueIds.push(id);}
export function availableStory(s){if(!s.readDialogueIds.includes('intro'))return 'intro';const next=s.friendStage+1;if(next<=3&&s.castCount>=[0,6,15,25][next])return 'friend'+next;return s.pendingDialogueIds[0]||null;}
export function readStory(s,id){if(!s.readDialogueIds.includes(id))s.readDialogueIds.push(id);s.pendingDialogueIds=s.pendingDialogueIds.filter(x=>x!==id);if(/^friend[123]$/.test(id))s.friendStage=Math.max(s.friendStage,Number(id.at(-1)));}
const widths={starfish:[.60,.16],puffer:[.50,.12],mushroom:[.60,.16],sea_grapes:[.52,.13],horse_mackerel:[.48,.12],cigarette:[.60,.14],sandal:[.60,.14],ballpen:[.60,.14],grapes:[.46,.10],cordyceps:[.38,.09],mackerel:[.40,.10],red_seabream:[.32,.08],black_bream:[.28,.07],kue:[.24,.06],aori_squid:[.34,.08],gold:[.44,.10]};
export function successWidth(s){return Math.min(.78,(widths[s.pendingCast?.id]?.[0]??.44)+s.rodLevel*.07+(s.friendStage>=1?.04:0));}
export function criticalWidth(s){return widths[s.pendingCast?.id]?.[1]??.10;}
function weighted(pool,rng){const total=pool.reduce((sum,[,w])=>sum+w,0);let roll=rng()*total;for(const [id,w] of pool){roll-=w;if(roll<0)return id;}return pool.at(-1)[0];}
export function beginCast(s,rng=Math.random){
 if(s.pendingCast)return s.pendingCast;if(s.pendingBlack)throw Error('黒鯛との会話を終えよう。');if(s.endingPending)throw Error('エンディングを先に見よう。');
 const eligible=s.friendStage>=3&&!s.cleared&&!(s.inventory.gold>0);
 let id,safe=false,live=false;
 if(s.settings.bait==='live_aji'){
  if(s.liveBaitCount<1)throw Error('生き餌用のアジがありません。釣ったアジを餌に確保しよう。');
  s.liveBaitCount--;s.squidAttempts++;live=true;
  id=rng()<.65||s.squidAttempts>=3?'aori_squid':'horse_mackerel';safe=s.squidAttempts>=3;
 }else if(s.castCount<3){id=['starfish','puffer','mushroom'][s.castCount];safe=true;}
 else if(s.location==='harbor'&&s.castCount===3&&!s.discovered.includes('sea_grapes')){id='sea_grapes';safe=true;}
 else if(s.location==='harbor'&&s.castCount===4&&!s.discovered.includes('horse_mackerel')){id='horse_mackerel';safe=true;}
 else if(eligible&&s.goldPityCount>=(s.goldRecoveryMode?5:20)){id='gold';safe=true;}
 else if(s.location==='sea'){
  id=weighted([['horse_mackerel',30],['mackerel',24],['red_seabream',20],['kue',10],['sea_grapes',12],['black_bream',4]],rng);
  if(s.seaCasts%10===9){id='kue';safe=true;}
 }else{
  const rare=s.settings.bait==='rare'&&s.baitCount>0;
  id=weighted(ITEMS.filter(it=>(rare?it.rare:it.base)>0).map(it=>[it.id,rare?it.rare:it.base]),rng);
  if(id==='gold'&&s.friendStage<3)id='sea_grapes';
 }
 if(id==='black_bream'&&(s.castCount<5||s.blackBreamCooldown>0))id='horse_mackerel';
 if(s.settings.bait==='rare'&&s.baitCount>0)s.baitCount--;
 s.pendingCast={id,safe,eligible,live};return s.pendingCast;
}
export function completeCast(s,success,critical=false){
 const cast=s.pendingCast;if(!cast)return null;s.pendingCast=null;s.castCount++;s.blackBreamCooldown=Math.max(0,s.blackBreamCooldown-1);
 if(s.location==='sea')s.seaCasts++;if(cast.eligible&&s.location!=='sea')s.goldPityCount++;
 if(!success&&!cast.safe){s.starStreak=0;return {kind:'escape'};}
 const id=cast.id,first=!s.discovered.includes(id);if(first){s.discovered.push(id);queue(s,id);}s.catchCounts[id]=(s.catchCounts[id]||0)+1;
 if(critical)s.criticalCount++;s.starStreak=id==='starfish'?s.starStreak+1:0;s.maxStarStreak=Math.max(s.maxStarStreak,s.starStreak);
 if(id==='black_bream'){s.blackBreamCooldown=4;s.pendingBlack={kind:'black',critical,protected:s.catchCounts[id]===1};return {...s.pendingBlack,first};}
 s.inventory[id]=(s.inventory[id]||0)+1;if(id==='gold'){s.goldPityCount=0;s.goldRecoveryMode=false;}if(id==='aori_squid')s.squidAttempts=0;
 const bonus=critical?5:0;s.money+=bonus;return {kind:'catch',id,first,critical,bonus};
}
export function resolveBlackBream(s,choice,rng=Math.random){
 if(!['release','peace','anger','gamble','repel'].includes(choice)||!s.pendingBlack)throw Error('黒鯛との会話は終わっています。');
 if(choice==='anger'&&s.pendingBlack.protected)choice='release';
 if(choice==='gamble'&&s.pendingBlack.protected)throw Error('初めての会話では強気の交渉はできません。');
 if(choice==='repel'&&s.rodBreakCount<10)throw Error('まだ黒鯛をシバくコツはつかめていません。');
 const failed=choice==='gamble'&&rng()<.5;const lost=failed?Object.entries(s.inventory).filter(([,n])=>n>0):[];const gold=lost.some(([id])=>id==='gold');
 s.pendingBlack=null;
 if(failed){s.inventory={};s.liveBaitCount=0;if(gold&&!s.cleared){s.goldRecoveryMode=true;s.goldPityCount=0;queue(s,'recovery');}}
 if(choice==='anger'||failed){s.rodLevel=Math.max(0,s.rodLevel-1);s.rodBreakCount++;}if(choice==='repel')s.blackBreamCooldown=8;
 if(choice==='peace'||(choice==='gamble'&&!failed))s.inventory.black_bream=(s.inventory.black_bream||0)+(choice==='gamble'?2:1);
 return {kind:'black',resolution:choice==='gamble'?(failed?'alllost':'gamble-win'):choice,lost,gold};
}
function quantity(s,id,qty,source='inventory'){if(!BY_ID[id]||!Number.isSafeInteger(qty)||qty<1||(s[source][id]||0)<qty)throw Error('所持数の範囲で個数を指定してください。');}
function idle(s){if(s.pendingCast||s.pendingBlack)throw Error('今の釣りを終えてからにしよう。');}
export function sell(s,id,qty=1){idle(s);quantity(s,id,qty);const gain=BY_ID[id].price*qty;s.inventory[id]-=qty;s.money+=gain;if(id==='gold'&&!s.cleared){s.cleared=true;s.endingPending=false;queue(s,'voyageInvite');}return gain;}
export function sellAll(s){let total=0;for(const it of ITEMS)if(it.id!=='gold'&&it.price>0&&(s.inventory[it.id]||0)>0)total+=sell(s,it.id,s.inventory[it.id]);return total;}
export function keepAji(s,qty=1){idle(s);quantity(s,'horse_mackerel',qty);s.inventory.horse_mackerel-=qty;s.liveBaitCount+=qty;return qty;}
export function storeCatch(s,id,qty=1,withdraw=false){idle(s);const source=withdraw?'homeInventory':'inventory',dest=withdraw?'inventory':'homeInventory';quantity(s,id,qty,source);s[source][id]-=qty;s[dest][id]=(s[dest][id]||0)+qty;return qty;}
export function dryStarfish(s){idle(s);quantity(s,'starfish',1);s.inventory.starfish--;s.homeInventory.dried_starfish=(s.homeInventory.dried_starfish||0)+1;if(!s.discovered.includes('dried_starfish'))s.discovered.push('dried_starfish');return 1;}
export function buy(s,kind){idle(s);let price;if(kind==='rod'){if(s.rodLevel>=2)throw Error('竿は十分になじんでいる。');price=s.rodLevel===0?120:280;}else if(['bait1','bait5'].includes(kind)){if(s.friendStage<2)throw Error('おじさんと常連同士になると買える。');price=kind==='bait1'?8:40;}else throw Error('その品物はありません。');if(s.money<price)throw Error('お金が足りません。');s.money-=price;if(kind==='rod')s.rodLevel++;else s.baitCount+=kind==='bait1'?1:5;return price;}
export function canSail(s){return s.cleared||s.friendStage>=1||s.portCleared||s.seaIntroRead;}
export function voyageAction(s,kind){idle(s);if(!canSail(s))throw Error('おじさんと6投して釣り仲間になるか、港の街で船長を探そう。金塊は不要です。');if(kind==='sea'){s.location='sea';s.seaIntroRead=true;}else if(kind==='harbor')s.location='harbor';else if(kind==='license'){if(s.license)throw Error('免許は取得済み。');if(s.seaCasts<5)throw Error('まずは同乗で5投、経験を積もう。');if(s.money<1000)throw Error('講習費は1,000 G。');s.money-=1000;s.license=true;}else if(kind==='boat'){if(!s.license)throw Error('自分で操縦するには、先に免許を取ろう。');if(s.boat)throw Error('船は購入済み。');if(s.money<12000)throw Error('船代は12,000 G。');s.money-=12000;s.boat=true;}else if(kind==='offering'){if(s.seaEnding||s.location!=='sea')throw Error('沖へ出てからにしよう。');if(!(s.inventory.kue>0))throw Error('手元にクエを1匹残しておこう。');s.inventory.kue--;s.seaEnding=true;s.endingPending=true;}else throw Error('その行動はできません。');}
