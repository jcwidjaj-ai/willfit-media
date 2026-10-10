import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import worker from '../server/worker.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(path.join(root,'.local'),{recursive:true});
const sqlite=new DatabaseSync(path.join(root,'.local','studio.sqlite'));
if(!sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='weeks'").get())sqlite.exec(await readFile(path.join(root,'migrations/0001.sql'),'utf8'));
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec(await readFile(path.join(root,'migrations/0002_reminders.sql'),'utf8'));
const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values)},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
const DB={prepare:wrap,async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const env={DB,LOCAL_PREVIEW:'true',ASSETS:{async fetch(request){const relative=new URL(request.url).pathname==='/'?'index.html':decodeURIComponent(new URL(request.url).pathname.slice(1));const file=path.resolve(root,'public',relative);if(!file.startsWith(path.join(root,'public')+path.sep))return new Response('Not found',{status:404});try{return new Response(await readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream'}})}catch{return new Response('Not found',{status:404})}}}};
const server=http.createServer(async(req,res)=>{
  try{const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>20000){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
    const url='http://127.0.0.1:4173'+req.url;
    const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await worker.fetch(request,env);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){console.error(e);res.writeHead(500);res.end('Preview error');}
});
server.listen(4173,'127.0.0.1',()=>console.log('WillFit preview: http://127.0.0.1:4173'));
