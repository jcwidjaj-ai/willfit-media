import {mkdir,writeFile,access} from 'node:fs/promises';
import {encode64} from '../server/web-push.mjs';
const directory=new URL('../.local/',import.meta.url);
await mkdir(directory,{recursive:true});
try{await access(new URL('vapid-private.json',directory));console.log('Existing push keys kept in .local.');}
catch{
  const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const privateKey=await crypto.subtle.exportKey('jwk',pair.privateKey);
  const publicKey=encode64(await crypto.subtle.exportKey('raw',pair.publicKey));
  await writeFile(new URL('vapid-private.json',directory),JSON.stringify(privateKey)+'\n',{mode:0o600});
  await writeFile(new URL('vapid-public.txt',directory),publicKey+'\n',{mode:0o600});
  console.log('Push keys saved privately in .local. No keys were printed.');
}
