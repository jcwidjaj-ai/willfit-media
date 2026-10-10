import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePlan} from '../public/planner.mjs';
import {drawStory,storySections} from '../public/story-design.mjs';
const context=()=>({font:'',measureText(text){const size=Number(this.font.match(/(\d+)px/)?.[1]||24);return {width:text.length*size*.6}},fillRect(){},fillText(text,x,y){assert.ok(x>=0&&x<=1080&&y>=0&&y<=1920)}});
test('daily Story artwork uses French text and fits every library topic plus holidays',()=>{
  for(const week of ['2026-10-05','2026-10-12','2026-10-19','2026-06-29'])for(const item of generatePlan(week).items.filter(i=>i.type==='story')){const sections=storySections(item);assert.equal(sections.headline,item.storyText.fr.split('\n')[0]);drawStory(context(),item);assert.equal(item.time,'09:00');}
});
test('overlong custom copy is rejected instead of clipping the graphic',()=>{
  assert.throws(()=>drawStory(context(),{title:{fr:'Titre'},storyText:{fr:'Titre\n\n'+('mot '.repeat(5000))},source:'https://www.who.int/'}),/trop long/);
});
