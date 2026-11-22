#!/usr/bin/env node
// Persistent local render queue. Loopback only: not an internet-facing API.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planCartoonExport} from './manifest.mjs';
const host='127.0.0.1',port=Number(process.env.LUNEX_API_PORT||4184);
const root=path.resolve(process.env.LUNEX_API_JOBS||'/tmp/lunex-render-api-jobs');
const token=process.env.LUNEX_RENDER_TOKEN;
if(!token||token.length<32)throw Error('LUNEX_RENDER_TOKEN (at least 32 characters) required');
fs.mkdirSync(root,{recursive:true});
const worker=path.join(path.dirname(fileURLToPath(import.meta.url)),'segmented-worker.mjs');
const jobs=new Map(),queue=[];let active=null;
const save=j=>{const p=path.join(j.dir,'api-status.json'),tmp=p+'.tmp';fs.writeFileSync(tmp,JSON.stringify({id:j.id,status:j.status,error:j.error||null,width:j.width,height:j.height,createdAt:j.createdAt}));fs.renameSync(tmp,p)};
const view=j=>{let m;try{m=JSON.parse(fs.readFileSync(path.join(j.dir,'manifest.json')))}catch{}const done=m?.segments.filter(s=>s.status==='complete').length||0,total=m?.segments.length||0;return {id:j.id,status:j.status,percent:total?Math.round(done/total*100):0,completedSegments:done,totalSegments:total,error:j.error||null,download:j.status==='completed'?'/api/lunex-render/jobs/'+j.id+'/download':null}};
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
const matches=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y)};
for(const ent of fs.readdirSync(root,{withFileTypes:true})){if(!ent.isDirectory()||!/^[0-9a-f-]{36}$/.test(ent.name))continue;const dir=path.join(root,ent.name);try{const j=JSON.parse(fs.readFileSync(path.join(dir,'api-status.json')));if(j.id!==ent.name)continue;const item={...j,dir};if(['queued','rendering'].includes(item.status)){item.status='queued';save(item);queue.push(item)}jobs.set(item.id,item)}catch{}}
queue.sort((a,b)=>a.createdAt-b.createdAt);
function next(){if(active||!queue.length)return;const j=queue.shift();if(j.status!=='queued')return next();active=j;j.status='rendering';save(j);
const env={...process.env,LUNEX_JOB_DIR:j.dir,LUNEX_PROJECT_FILE:path.join(j.dir,'project.json'),LUNEX_WIDTH:String(j.width),LUNEX_HEIGHT:String(j.height),LUNEX_SEGMENT_SECONDS:'15',LUNEX_ALLOW_LONG_TEST:'1'};
const child=spawn(process.execPath,[worker],{env,stdio:['ignore','pipe','pipe'],detached:true});j.child=child;let tail='';
for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{tail=(tail+d.toString()).slice(-2000)});
let settled=false;const finish=(code,error)=>{if(settled)return;settled=true;j.child=null;if(j.status!=='cancelled'){j.status=code===0?'completed':'failed';j.error=error||null}save(j);active=null;next()};
child.on('error',e=>finish(1,e.message));child.on('close',code=>finish(code,code===0?null:tail));
}
const server=http.createServer(async(req,res)=>{
const url=new URL(req.url||'/', 'http://'+host+':'+port);
if(!url.pathname.startsWith('/api/lunex-render/'))return send(res,404,{error:'Not found'});
// This API intentionally has no CORS. A same-origin authenticated reverse proxy is required.
if(!matches(req.headers['x-lunex-render-token'],token))return send(res,401,{error:'Unauthorized'});
if(req.method==='POST'&&url.pathname==='/api/lunex-render/jobs'){
let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2_000_000)return send(res,413,{error:'Project too large'})}
let body;try{body=JSON.parse(raw)}catch{return send(res,400,{error:'Invalid JSON'})}
const p=body.project,w=body.width??640,h=body.height??360;
if(!p||p.mode!=='3d'||!Array.isArray(p.scenes)||!p.scenes.length||p.scenes.length>30)return send(res,400,{error:'Unsupported project'});
const duration=p.scenes.reduce((a,s)=>a+Number(s.duration),0);
try{planCartoonExport({durationSeconds:duration,width:w,height:h,segmentSeconds:15})}catch(e){return send(res,400,{error:e.message})}
if(queue.length>=3||jobs.size>=30)return send(res,429,{error:'Prototype queue full'});
const id=randomUUID(),dir=path.join(root,id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));const j={id,dir,width:w,height:h,status:'queued',createdAt:Date.now()};jobs.set(id,j);save(j);queue.push(j);next();return send(res,202,view(j));
}
const m=url.pathname.match(/^\/api\/lunex-render\/jobs\/([0-9a-f-]{36})(\/download)?$/);if(!m)return send(res,404,{error:'Not found'});
const j=jobs.get(m[1]);if(!j)return send(res,404,{error:'Unknown job'});
if(req.method==='DELETE'&&!m[2]){if(['completed','failed','cancelled'].includes(j.status))return send(res,409,{error:'Already finished'});j.status='cancelled';save(j);if(j.child){try{process.kill(-j.child.pid,'SIGTERM')}catch{j.child.kill('SIGTERM')}}return send(res,200,view(j))}
if(m[2]){if(req.method!=='GET'||j.status!=='completed')return send(res,409,{error:'Not ready'});const file=path.join(j.dir,'final.mp4');if(!fs.existsSync(file))return send(res,404,{error:'File missing'});res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':fs.statSync(file).size,'Content-Disposition':'attachment; filename="lunex-'+j.id+'.mp4"','X-Content-Type-Options':'nosniff'});return fs.createReadStream(file).pipe(res)}
if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});return send(res,200,view(j));
});
server.listen(port,host,()=>{console.log('LUNEX_RENDER_API_SECURE',host,port);next()});
