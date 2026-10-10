import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://127.0.0.1:4173/';
async function ready(){
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(1000)});
    return response.ok&&(await response.text()).includes('WillFit · Media Studio');
  }catch{return false;}
}
if(await ready()){
  console.log('WillFit preview is already running: '+url);
}else{
  mkdirSync(path.join(root,'.local'),{recursive:true});
  const log=openSync(path.join(root,'.local','preview.log'),'a');
  const child=spawn(process.execPath,['scripts/dev.mjs'],{cwd:root,detached:true,stdio:['ignore',log,log]});
  closeSync(log);
  writeFileSync(path.join(root,'.local','preview.pid'),String(child.pid)+'\n');
  child.unref();
  let started=false;
  for(let attempt=0;attempt<20;attempt++){
    if(await ready()){started=true;break;}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!started)throw new Error('The preview did not start. Check .local/preview.log.');
  console.log('WillFit preview is running: '+url);
}
