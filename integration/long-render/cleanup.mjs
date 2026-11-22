#!/usr/bin/env node
// Dry-run by default. Only completed/failed/cancelled jobs older than retention are eligible.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.env.LUNEX_API_JOBS||'/tmp/lunex-render-api-jobs');
const days=Number(process.env.LUNEX_RETENTION_DAYS||7);
if(!Number.isFinite(days)||days<1)throw Error('Retention must be >=1 day');
const apply=process.argv.includes('--apply'),now=Date.now(),eligible=[];
for(const e of fs.readdirSync(root,{withFileTypes:true})){
 if(!e.isDirectory()||!/^[0-9a-f-]{36}$/.test(e.name))continue;
 const dir=path.join(root,e.name),file=path.join(dir,'api-status.json');
 try{
  const s=JSON.parse(fs.readFileSync(file,'utf8'));
  if(s.id!==e.name||!['completed','failed','cancelled'].includes(s.status))continue;
  const age=now-(s.createdAt||fs.statSync(file).mtimeMs);
  if(age<days*86400000)continue;
  eligible.push({id:e.name,status:s.status,ageDays:Math.floor(age/86400000)});
  if(apply)fs.rmSync(dir,{recursive:true,force:false});
 }catch(err){console.error('SKIP',e.name,err.message)}
}
console.log(JSON.stringify({mode:apply?'delete':'dry-run',retentionDays:days,eligible},null,2));
