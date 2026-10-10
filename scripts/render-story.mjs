import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {drawStory} from '../public/story-design.mjs';
import {generatePlan,mondayOf,kinshasaDate} from '../public/planner.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
let canvasModule;
try{canvasModule=createRequire(import.meta.url)('@napi-rs/canvas');}catch{
  canvasModule=createRequire(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'))('@napi-rs/canvas');
}
const {GlobalFonts,createCanvas}=canvasModule;
if(!GlobalFonts.registerFromPath(path.join(root,'public/fonts/Anton-Regular.ttf'),'Anton'))throw new Error('Anton font could not be loaded');
if(!GlobalFonts.registerFromPath(path.join(root,'public/fonts/Barlow-Bold.ttf'),'Barlow'))throw new Error('Body font could not be loaded');
// A supplied JSON file lets the daily automation render newly researched copy.
const supplied=process.argv[2]?.endsWith('.json');
const date=supplied?null:process.argv[2]||kinshasaDate();
const plan=supplied?null:generatePlan(mondayOf(date));
const item=supplied?JSON.parse(await readFile(process.argv[2],'utf8')):plan.items.find(i=>i.type==='story'&&i.date===date);
if(!item)throw new Error('No story for this date');
const destination=path.resolve(process.argv[3]||path.join(root,'stories',item.date));await mkdir(destination,{recursive:true});
const canvas=createCanvas(1080,1920);drawStory(canvas.getContext('2d'),item);
const imagePath=path.join(destination,`WillFit-story-${item.date}-FR.png`);
await writeFile(imagePath,canvas.toBuffer('image/png'));
await writeFile(path.join(destination,'story.json'),JSON.stringify({...item,publishing:{status:'not-connected',language:'fr',time:'09:00',timezone:'Africa/Kinshasa'}},null,2)+'\n');
console.log(imagePath);
