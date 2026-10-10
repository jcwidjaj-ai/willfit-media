// Shared by browser PNG export and the unattended local renderer.
export const STORY_SIZE={width:1080,height:1920};
export function storySections(item){
  const parts=(item.storyText?.fr||item.title.fr).split(/\n\s*\n/).map(s=>s.replace(/^[🧠🍽️💬📊🇨🇩]\s*/u,'').trim()).filter(Boolean);
  return {headline:parts[0]||item.title.fr,fact:parts[1]||'',tip:parts[2]||'',cta:parts.slice(3).join(' ')||'RÉPONDEZ À CETTE STORY : QU’EN PENSEZ-VOUS ?'};
}
export function wrapText(ctx,text,width){
  const lines=[];let line='';
  for(const word of text.split(/\s+/)){
    if(!word)continue;
    if(ctx.measureText(word).width>width){
      if(line){lines.push(line);line='';}
      let fragment='';for(const character of word){if(ctx.measureText(fragment+character).width>width&&fragment){lines.push(fragment);fragment='';}fragment+=character;}line=fragment;
    }else if(line&&ctx.measureText(line+' '+word).width>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;
  }
  if(line)lines.push(line);return lines;
}
function block(ctx,text,{top,height,width=900,maxSize=100,minSize=24,font='Anton',color='#ffe500',background=false}){
  text=text.toLocaleUpperCase('fr');let size=maxSize,lines;
  do{ctx.font=`${font==='Anton'?'':'700 '}${size}px ${font}`;lines=wrapText(ctx,text,width);if(lines.length*size*1.22<=height)break;size-=2;}while(size>=minSize);
  if(lines.length*size*1.22>height)throw new Error('Le texte est trop long pour cette image. Raccourcissez-le.');
  const leading=size*1.22,start=top+(height-lines.length*leading)/2;
  ctx.textAlign='center';ctx.textBaseline='middle';
  lines.forEach((line,index)=>{const y=start+index*leading+leading/2;if(background){const w=ctx.measureText(line).width+44;ctx.fillStyle='#fff';ctx.fillRect(540-w/2,y-leading/2,w,leading+1);}ctx.fillStyle=color;ctx.fillText(line,540,y);});
}
export function drawStory(ctx,item){
  const s=storySections(item);ctx.fillStyle='#050505';ctx.fillRect(0,0,1080,1920);
  ctx.font='700 24px Barlow';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText('WILLFIT  /  LE SAVIEZ-VOUS ?',540,200);
  block(ctx,s.headline,{top:270,height:340,maxSize:112});
  block(ctx,s.fact,{top:675,height:300,maxSize:52,font:'Barlow',color:'#050505',background:true,width:850});
  block(ctx,s.tip,{top:1050,height:290,maxSize:76});
  block(ctx,s.cta,{top:1420,height:160,maxSize:44,font:'Barlow',color:'#fff'});
  ctx.font='700 26px Barlow';ctx.fillStyle='#ffe500';ctx.fillText('@WILLFIT__GYM',540,1660);
  ctx.font='21px Barlow';ctx.fillStyle='#fff';ctx.fillText('+243 834 230 727  ·  www.willfitgym.com',540,1710);
  ctx.font='19px Barlow';ctx.fillStyle='#aaa';
  const source=item.sourceKind==='holiday'?'Journée nationale RDC':`Source : ${new URL(item.source||'https://www.drjamesdinic.com').hostname.replace(/^www\./,'')}`;
  ctx.fillText(source,540,1755);
  return s;
}
let storyFonts;
export async function renderStoryCanvas(canvas,item){
  storyFonts??=Promise.all([['Anton','Anton-Regular.ttf'],['Barlow','Barlow-Bold.ttf']].map(async([family,file])=>{const face=new FontFace(family,`url(/fonts/${file})`,{weight:family==='Barlow'?'700':'400'});await face.load();document.fonts.add(face);})).catch(error=>{storyFonts=null;throw error;});
  await storyFonts;
  await Promise.all([document.fonts.load('40px Anton'),document.fonts.load('700 40px Barlow')]);canvas.width=1080;canvas.height=1920;drawStory(canvas.getContext('2d'),item);
}
export async function downloadStory(canvas,item){
  await renderStoryCanvas(canvas,item);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG export failed');
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`WillFit-story-${item.date}-FR.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
