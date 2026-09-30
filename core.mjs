import {ITEMS,BY_ID} from './data.mjs';
export const STORAGE_KEY='fishing-ikkaku-v1';
export function fresh(){return {schemaVersion:1,money:50,baitCount:0,rodLevel:0,inventory:{},discovered:[],catchCounts:{},castCount:0,friendStage:0,readDialogueIds:[],pendingDialogueIds:[],goldPityCount:0,goldRecoveryMode:false,blackBreamCooldown:0,criticalCount:0,pendingCast:null,pendingBlack:null,portCleared:false,cleared:false,endingPending:false,settings:{sound:false,slow:false,motion:true,bait:'base'},starStreak:0,maxStarStreak:0};}
export function hydrate(raw){
 const s=fresh();if(!raw||raw.schemaVersion!==1)return s;
 for(const key of ['money','baitCount','rodLevel','castCount','friendStage','goldPityCount','blackBreamCooldown','criticalCount','starStreak','maxStarStreak'])if(Number.isSafeInteger(raw[key])&&raw[key]>=0)s[key]=raw[key];
 s.rodLevel=Math.min(2,s.rodLevel);s.friendStage=Math.min(3,s.friendStage);
 for(const key of ['inventory','catchCounts'])for(const item of ITEMS)if(Number.isSafeInteger(raw[key]?.[item.id])&&raw[key][item.id]>=0)s[key][item.id]=raw[key][item.id];
 s.inventory.black_bream=0;
 for(const key of ['discovered','readDialogueIds','pendingDialogueIds'])if(Array.isArray(raw[key]))s[key]=[...new Set(raw[key].filter(x=>typeof x==='string'))];
 for(const key of ['cleared','endingPending','goldRecoveryMode','portCleared'])s[key]=raw[key]===true;
 for(const key of ['sound','slow','motion'])if(typeof raw.settings?.[key]==='boolean')s.settings[key]=raw.settings[key];
 s.settings.bait=raw.settings?.bait==='rare'?'rare':'base';
 if(raw.pendingCast&&BY_ID[raw.pendingCast.id])s.pendingCast={id:raw.pendingCast.id,safe:raw.pendingCast.safe===true,eligible:raw.pendingCast.eligible===true};
 if(raw.pendingBlack&&typeof raw.pendingBlack==='object')s.pendingBlack={kind:'black',critical:raw.pendingBlack.critical===true};
 return s;
}
export function queue(s,id){if(!s.readDialogueIds.includes(id)&&!s.pendingDialogueIds.includes(id))s.pendingDialogueIds.push(id);}
export function availableStory(s){if(!s.readDialogueIds.includes('intro'))return 'intro';let next=s.friendStage+1;if(next<=3&&s.castCount>=[0,6,15,25][next])return 'friend'+next;return s.pendingDialogueIds[0]||null;}
export function readStory(s,id){if(!s.readDialogueIds.includes(id))s.readDialogueIds.push(id);s.pendingDialogueIds=s.pendingDialogueIds.filter(x=>x!==id);if(/^friend[123]$/.test(id))s.friendStage=Math.max(s.friendStage,Number(id.at(-1)));}
export function successWidth(s){return Math.min(.6,.4+s.rodLevel*.08+(s.friendStage>=1?.04:0));}
export function beginCast(s,rng=Math.random){
 if(s.pendingCast)return s.pendingCast;
 if(s.endingPending)throw Error('エンディングを先に見よう。');
 const eligible=s.friendStage>=3&&!s.cleared&&!(s.inventory.gold>0);
 const pity=eligible&&s.goldPityCount>=(s.goldRecoveryMode?5:20);
 let id,safe=false;
 if(s.castCount<3){id=['starfish','puffer','mushroom'][s.castCount];safe=true;}
 else if(pity){id='gold';safe=true;}
 else {
  const rare=s.settings.bait==='rare'&&s.baitCount>0;
  let roll=rng()*100;
  for(const it of ITEMS){roll-=rare?it.rare:it.base;if(roll<0){id=it.id;break;}}
  id??='starfish';
  if(id==='gold'&&s.friendStage<3)id='starfish';
  if(id==='black_bream'&&(s.castCount<5||s.blackBreamCooldown>0))id='starfish';
 }
 if(s.settings.bait==='rare'&&s.baitCount>0)s.baitCount--;
 s.pendingCast={id,safe,eligible};return s.pendingCast;
}
export function completeCast(s,success,critical=false){
 const cast=s.pendingCast;if(!cast)return null;
 s.pendingCast=null;s.castCount++;s.blackBreamCooldown=Math.max(0,s.blackBreamCooldown-1);
 if(cast.eligible)s.goldPityCount++;
 if(!success&&!cast.safe){s.starStreak=0;return {kind:'escape'};}
 const id=cast.id;const first=!s.discovered.includes(id);
 if(first){s.discovered.push(id);queue(s,id);}
 s.catchCounts[id]=(s.catchCounts[id]||0)+1;
 if(critical)s.criticalCount++;
 s.starStreak=id==='starfish'?s.starStreak+1:0;s.maxStarStreak=Math.max(s.maxStarStreak,s.starStreak);
 if(id==='black_bream'){
  s.blackBreamCooldown=3;
  s.pendingBlack={kind:'black',critical};
  return {...s.pendingBlack,first};
 }
 s.inventory[id]=(s.inventory[id]||0)+1;
 if(id==='gold'){s.goldPityCount=0;s.goldRecoveryMode=false;}
 const bonus=critical?5:0;
 s.money+=bonus;
 return {kind:'catch',id,first,critical,bonus};
}
export function resolveBlackBream(s,choice){
 if(!['release','peace','anger'].includes(choice))throw Error('選択肢がありません。');
 if(!s.pendingBlack)throw Error('黒鯛はもう海へ戻りました。');
 s.pendingBlack=null;
 const lost=choice==='release'?Object.entries(s.inventory).filter(([,n])=>n>0):[];
 const gold=lost.some(([id])=>id==='gold');
 if(choice==='release'){
  s.inventory={};
  if(gold&&!s.cleared){s.goldRecoveryMode=true;s.goldPityCount=0;s.readDialogueIds=s.readDialogueIds.filter(x=>x!=='recovery');queue(s,'recovery');}
 }
 if(choice==='anger')s.rodLevel=Math.max(0,s.rodLevel-1);
 return {kind:'black',resolution:choice,lost,gold};
}
export function sell(s,id,qty=1){
 if(s.pendingCast)throw Error('釣りが終わってから売ろう。');
 const it=BY_ID[id];if(!it||id==='black_bream'||!Number.isInteger(qty)||qty<=0||(s.inventory[id]||0)<qty)throw Error('売れる釣果がありません。');
 s.inventory[id]-=qty;const gain=it.price*qty;s.money+=gain;
 if(id==='gold'&&!s.cleared){s.cleared=true;s.endingPending=true;}
 return gain;
}
export function sellAll(s){let total=0;for(const it of ITEMS)if(it.id!=='gold'&&it.price>0&&(s.inventory[it.id]||0)>0)total+=sell(s,it.id,s.inventory[it.id]);return total;}
export function buy(s,kind){
 if(s.pendingCast)throw Error('釣りが終わってから買おう。');
 let price;if(kind==='rod'){if(s.rodLevel>=2)throw Error('竿は十分になじんでいる。');price=s.rodLevel===0?120:280;}
 else if(kind==='bait1'||kind==='bait5'){if(s.friendStage<2)throw Error('もう少し隣人と話してみよう。');price=kind==='bait1'?8:40;}
 else throw Error('その品物はありません。');
 if(s.money<price)throw Error('お金が足りません。');s.money-=price;if(kind==='rod')s.rodLevel++;else s.baitCount+=kind==='bait1'?1:5;
 return price;
}
