#!/usr/bin/env node
// Initial VPS render worker: renders a saved/seeded MyMotionStudio project frame-by-frame.
// No HTTP endpoint; CLI-only PoC. For production, add job queue, auth, persistence and cancellation.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { planCartoonExport } from './manifest.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.LUNEX_PLAYWRIGHT_PATH || 'playwright');
const base = process.env.LUNEX_BASE_URL || 'http://127.0.0.1:4183';
const output = path.resolve(process.env.LUNEX_OUTPUT || '/tmp/lunex-server-test.mp4');
const durationSeconds = Number(process.env.LUNEX_DURATION || '1');
const fps = 30;
const width = Number(process.env.LUNEX_WIDTH || '640');
const height = Number(process.env.LUNEX_HEIGHT || '360');
const job = planCartoonExport({durationSeconds,fps,width,height,jobId:'vps-poc'});
if(durationSeconds>5 && process.env.LUNEX_ALLOW_LONG_TEST!=='1')throw Error('PoC safety: enable long runs explicitly');
fs.mkdirSync(path.dirname(output),{recursive:true});
const browser = await playwright.chromium.launch({
 headless:true,
 ...(process.env.LUNEX_CHROME_PATH ? {executablePath:process.env.LUNEX_CHROME_PATH}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']
});
let ffmpeg;
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 page.setDefaultTimeout(30000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});
 const projectId=await page.evaluate(async duration=>{
  const {db}=await import('/src/lib/db.ts');
  const {createProject,createMeshLayer}=await import('/src/lib/factories.ts');
  const p=createProject('Lunex Server Worker PoC','3d','16:9');
  p.id='lunex-worker-'+Math.random().toString(36).slice(2);
  p.scenes[0].duration=duration;
  p.settings.shadows=false;
  p.scenes[0].layers.push({...createMeshLayer('box'),color:'#00ff00',scale:{x:2,y:2,z:2}});
  p.scenes[0].lunex2d=[{id:'sprite-worker',x:160,y:100,color:'#f59e0b',keyframes:[{time:0,x:160},{time:duration,x:400}]}];
  await db.projects.put(p);
  return p.id;
 },durationSeconds);
 await page.goto(base+'/editor/'+projectId,{waitUntil:'domcontentloaded'});
 await page.locator('[data-lunex-hybrid] canvas').waitFor();
 await page.waitForTimeout(1400);
 // Preflight checks before launching encoder.
 const canvases=await page.evaluate(()=>({base:document.querySelector('canvas')?.width,overlay:document.querySelector('[data-lunex-hybrid] canvas')?.width}));
 if(!canvases.base||!canvases.overlay)throw Error('Missing 3D or 2D canvas');
 ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
 let stderr='';ffmpeg.stderr.on('data',d=>stderr+=d.toString());
 const exitPromise=new Promise((resolve,reject)=>{ffmpeg.once('error',reject);ffmpeg.once('close',code=>code===0?resolve():reject(Error('ffmpeg exited '+code+': '+stderr)))});
 for(let i=0;i<job.totalFrames;i++){
  const data=await page.evaluate(async ({time,width,height})=>{
   const {useEditorStore}=await import('/src/lib/store.ts');
   useEditorStore.setState({isPlaying:false,isExporting:true,currentTime:time});
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const source=document.querySelector('canvas');
   const overlay=document.querySelector('[data-lunex-hybrid] canvas');
   if(!source||!overlay)throw Error('Canvas missing during frame');
   const target=document.createElement('canvas');target.width=width;target.height=height;
   const ctx=target.getContext('2d',{alpha:false});
   ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
   ctx.drawImage(source,0,0,source.width,source.height,0,0,width,height);
   ctx.drawImage(overlay,0,0,overlay.width,overlay.height,0,0,width,height);
   return target.toDataURL('image/png').split(',')[1];
  },{time:i/fps,width,height});
  const buffer=Buffer.from(data,'base64');
  if(!ffmpeg.stdin.write(buffer))await new Promise(resolve=>ffmpeg.stdin.once('drain',resolve));
  if(i%10===0||i===job.totalFrames-1)console.log('FRAME',i+1,'/',job.totalFrames);
 }
 ffmpeg.stdin.end();
 await exitPromise;
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
 console.log('RESULT',JSON.stringify({output,bytes:fs.statSync(output).size,frames:job.totalFrames,projectId}));
}finally{
 if(ffmpeg&&!ffmpeg.killed&&ffmpeg.exitCode===null){ffmpeg.stdin.destroy();ffmpeg.kill('SIGTERM');}
 await browser.close();
}
