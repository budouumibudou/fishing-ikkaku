// Original miniature scores. One context, bounded look-ahead and disposable voices.
export const scores={
 deityBattle:{bpm:128,chords:[[38,41,45],[34,38,41],[31,34,38],[33,37,40],[38,41,45],[41,45,48],[34,38,41],[33,37,40]],melody:[[74,0,77,81,77,74,72,69],[70,0,74,77,81,77,74,70],[67,70,74,0,77,74,70,67],[69,73,76,0,81,76,73,69],[74,77,81,86,84,81,77,74],[77,0,81,84,86,84,81,77],[82,81,77,74,70,74,77,70],[81,0,79,76,73,69,73,0]]},
 deityTalk:{bpm:54,chords:[[50,57,62],[46,53,60],[43,50,57],[45,52,61],[50,57,65],[48,55,62],[46,53,60],[45,52,57]],melody:[[74,0,0,77,0,0,81,0],[77,0,0,74,0,0,72,0],[74,0,0,69,0,0,67,0],[69,0,0,73,0,0,0,0],[74,0,0,77,0,0,79,0],[77,0,0,74,0,0,72,0],[70,0,0,74,0,0,77,0],[73,0,0,69,0,0,0,0]]},
 sea:{bpm:92,chords:[[53,57,60],[55,59,62],[57,60,64],[55,60,64]],melody:[[65,0,69,72,0,69,0,0],[67,0,71,74,0,71,0,0],[69,0,72,76,0,72,69,0],[67,0,72,0,64,0,0,0]]},
 opening:{bpm:100,chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],melody:[[72,0,76,79,0,76,74,0],[72,0,69,72,76,0,0,0],[77,0,76,72,0,69,72,0],[74,0,71,67,72,0,0,0]]},
 harbor:{bpm:78,chords:[[60,64,67],[60,64,69],[57,60,65],[55,59,62],[57,60,64],[53,57,60],[55,60,64],[55,59,62]],melody:[[76,0,0,74,72,0,67,0],[69,0,72,0,76,0,0,0],[77,0,76,0,72,0,69,0],[71,0,74,0,0,0,0,0],[72,0,76,0,79,0,76,0],[77,0,0,76,72,0,69,0],[67,0,72,0,76,0,74,0],[71,0,0,69,67,0,0,0]]},
 tension:{bpm:148,chords:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],melody:[[76,81,76,79,76,81,83,81],[77,81,77,79,77,81,84,81],[79,83,79,81,79,83,86,83],[80,83,80,83,86,83,80,76]]},
 street:{bpm:132,chords:[[57,60,64],[55,59,62],[53,57,60],[52,56,59]],melody:[[69,72,76,0,76,72,69,0],[67,71,74,0,74,71,67,0],[65,69,72,0,72,69,65,0],[64,68,71,74,76,74,71,68]]},
 ending:{bpm:88,chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60],[60,64,67],[53,57,60],[55,59,62],[60,64,67]],melody:[[72,0,76,0,79,0,84,0],[83,0,79,0,74,0,0,0],[81,0,79,76,72,0,76,0],[77,0,0,76,72,0,0,0],[76,0,79,0,84,0,83,0],[81,0,77,0,76,0,72,0],[74,0,76,0,74,0,71,0],[72,0,0,0,0,0,0,0]]},
 black:{bpm:90,chords:[[45,48,51],[44,47,50]],melody:[[57,0,0,56,0,0,51,0],[56,0,0,51,0,0,0,0]]}
};
export function musicScene(active,phase,ending,location='harbor',deityStage=''){
 if(ending)return 'ending';if(!active)return 'opening';
 if(['waiting','fight'].includes(deityStage))return 'deityBattle';
 if(['landed','reveal','question','history'].includes(deityStage))return 'deityTalk';
 return ['bite','reeling'].includes(phase)?'tension':phase==='black'?'black':phase==='action'?'street':location==='sea'?'sea':'harbor';
}
export class Soundtrack{
 constructor(context){this.ctx=context;this.enabled=false;this.scene='';this.step=0;this.next=0;this.bus=null;this.voices=new Set();}
 note(midi,time,length,volume,bus,type='sine'){
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=440*2**((midi-69)/12);
  g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.014);g.gain.exponentialRampToValueAtTime(.0001,time+length);
  o.connect(g);g.connect(bus);this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o);};o.start(time);o.stop(time+length+.02);
 }
 setScene(scene){if(this.scene===scene)return;const c=this.ctx;if(this.bus){const old=this.bus;old.gain.cancelScheduledValues(c.currentTime);old.gain.setTargetAtTime(0,c.currentTime,.055);setTimeout(()=>old.disconnect(),700);}
  this.scene=scene;this.bus=c.createGain();this.bus.gain.setValueAtTime(0,c.currentTime);this.bus.gain.linearRampToValueAtTime(.65,c.currentTime+.25);this.bus.connect(c.destination);this.step=0;this.next=c.currentTime+.03;
 }
 tick(){if(!this.enabled||this.ctx.state!=='running'||!this.bus)return;const c=this.ctx,score=scores[this.scene];if(this.next<c.currentTime-.2)this.next=c.currentTime+.03;
  while(this.next<c.currentTime+.12){const bar=Math.floor(this.step/8)%score.chords.length,i=this.step%8,ch=score.chords[bar],t=this.next,d=30/score.bpm,n=score.melody[bar][i];
   if(this.scene==='deityTalk'){if(i===0)ch.forEach((pitch,j)=>this.note(pitch,t+j*.045,d*7,.016,this.bus,'sine'));if(n)this.note(n,t,d*2.8,.036,this.bus,'sine');if(i===0||i===4)this.note(ch[0]-12,t,d*3,.025,this.bus,'sine');this.step++;this.next+=d;continue;}
   if(this.scene==='deityBattle'){if(n)this.note(n,t,d*.82,.035,this.bus,'square');this.note(ch[0]-12+(i%2?12:0),t,d*.8,.055,this.bus,'triangle');this.note(ch[[0,1,2,1][i%4]],t,d*.7,.023,this.bus,'triangle');if(i%2===0)this.note(31,t,.09,.065,this.bus,'sine');if(i===2||i===6)this.note(50,t,.055,.02,this.bus,'triangle');this.step++;this.next+=d;continue;}
   if(n){this.note(n,t,d*1.7,.044,this.bus,'triangle');this.note(n+12,t,d*.8,.008,this.bus);}
   this.note(ch[[0,1,2,1,0,1,2,1][i]],t,d*1.8,.022,this.bus);
   if(i===0||i===4)this.note(ch[0]-12,t,d*3,.042,this.bus);
   this.step++;this.next+=d;
  }
 }
 effect(name){if(!this.enabled||this.ctx.state!=='running')return;const phrases={deity:[36,43,48,55,60,67,72,79],boat:[60,64,67,72,67,72,76,79],cast:[76,69,60],hook:[79,86],bite:[88,88],catch:[72,76,79,84],gold:[72,76,79,84,88,91],escape:[74,70,65],black:[45,44,39],coin:[84,91,88],page:[76]};
  const ns=phrases[name]||phrases.page;ns.forEach((n,i)=>this.note(n,this.ctx.currentTime+i*.075,name==='page'?.055:.24,name==='page'?.018:.065,this.ctx.destination,'triangle'));
 }
 mute(){this.enabled=false;for(const o of this.voices){try{o.stop();}catch{}}this.next=this.ctx.currentTime+.03;}
}
