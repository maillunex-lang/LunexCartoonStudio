#!/usr/bin/env node
// Loopback-only PoC. Do not expose without authentication, quotas and isolation.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planCartoonExport} from './manifest.mjs';
const host='127.0.0.1',port=Number(process.env.LUNEX_API_PORT||4184);
const root=path.resolve(process.env.LUNEX_API_JOBS||'/tmp/lunex-render-api-jobs');
fs.mkdirSync(root,{recursive:true});
const worker=path.join(path.dirname(fileURLToPath(import.meta.url)),'segmented-worker.mjs');
const jobs=new Map(),queue=[];let active=null;
const persist=j=>fs.writeFileSync(path.join(j.dir,'api-status.json'),JSON.stringify({id:j.id,status:j.status,error:j.error||null}));
const status=j=>{let m;try{m=JSON.parse(fs.readFileSync(path.join(j.dir,'manifest.json')))}catch{}const done=m?.segments.filter(s=>s.status==='complete').length||0,total=m?.segments.length||0;return {id:j.id,status:j.status,percent:total?Math.round(done/total*100):0,completedSegments:done,totalSegments:total,error:j.error||null,download:j.status==='completed'?'/api/lunex-render/jobs/'+j.id+'/download':null}};
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
function next(){if(active||!queue.length)return;const j=queue.shift();active=j;j.status='rendering';persist(j);
const env={...process.env,LUNEX_JOB_DIR:j.dir,LUNEX_PROJECT_FILE:path.join(j.dir,'project.json'),LUNEX_WIDTH:String(j.width),LUNEX_HEIGHT:String(j.height),LUNEX_SEGMENT_SECONDS:'15',LUNEX_ALLOW_LONG_TEST:'1'};
const child=spawn(process.execPath,[worker],{env,stdio:['ignore','pipe','pipe']});let tail='';
for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{tail=(tail+d.toString()).slice(-2000)});
let settled=false;const finish=(code,error)=>{if(settled)return;settled=true;j.status=code===0?'completed':'failed';j.error=error||null;persist(j);active=null;next()};
child.on('error',e=>finish(1,e.message));child.on('close',code=>finish(code,code===0?null:tail));
}
http.createServer(async(req,res)=>{
const url=new URL(req.url||'/', 'http://'+host+':'+port),origin=req.headers.origin;
if(!url.pathname.startsWith('/api/lunex-render/'))return send(res,404,{error:'Not found'});
if(origin&&!['http://127.0.0.1:4183','http://localhost:4183'].includes(origin))return send(res,403,{error:'Origin denied'});
res.setHeader('Access-Control-Allow-Origin',origin||'http://127.0.0.1:4183');res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
if(req.method==='POST'&&url.pathname==='/api/lunex-render/jobs'){
let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2_000_000)return send(res,413,{error:'Project too large'})}
let body;try{body=JSON.parse(raw)}catch{return send(res,400,{error:'Invalid JSON'})}
const p=body.project,w=body.width??640,h=body.height??360;
if(!p||p.mode!=='3d'||!Array.isArray(p.scenes)||!p.scenes.length)return send(res,400,{error:'Only 3D/hybrid project supported in PoC'});
const duration=p.scenes.reduce((a,s)=>a+s.duration,0);
try{planCartoonExport({durationSeconds:duration,width:w,height:h,segmentSeconds:15})}catch(e){return send(res,400,{error:e.message})}
if(jobs.size>=30)return send(res,429,{error:'Prototype queue full'});
const id=randomUUID(),dir=path.join(root,id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));const j={id,dir,width:w,height:h,status:'queued'};jobs.set(id,j);persist(j);queue.push(j);next();return send(res,202,status(j));
}
const m=url.pathname.match(/^\/api\/lunex-render\/jobs\/([0-9a-f-]+)(\/download)?$/);if(!m)return send(res,404,{error:'Not found'});
const j=jobs.get(m[1]);if(!j)return send(res,404,{error:'Unknown job'});
if(m[2]){if(req.method!=='GET'||j.status!=='completed')return send(res,409,{error:'Not ready'});const file=path.join(j.dir,'final.mp4');if(!fs.existsSync(file))return send(res,404,{error:'File missing'});res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':fs.statSync(file).size,'Content-Disposition':'attachment; filename="lunex-'+j.id+'.mp4"'});return fs.createReadStream(file).pipe(res)}
if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});return send(res,200,status(j));
}).listen(port,host,()=>console.log('LUNEX_RENDER_API',host,port));
