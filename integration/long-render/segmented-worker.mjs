import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';import path from 'node:path';
import {planCartoonExport,updateSegment,canAssemble} from './manifest.mjs';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.LUNEX_PLAYWRIGHT_PATH||'/srv/lunex-cartoon-studio-poc/upstream/node_modules/playwright');
const base=process.env.LUNEX_BASE_URL||'http://127.0.0.1:4183/cartoon-studio';
const dir=path.resolve(process.env.LUNEX_JOB_DIR||'/tmp/lunex-job-v2');fs.mkdirSync(dir,{recursive:true});
const duration=Number(process.env.LUNEX_DURATION||'2'),width=Number(process.env.LUNEX_WIDTH||'640'),height=Number(process.env.LUNEX_HEIGHT||'360');
const segmentSeconds=Number(process.env.LUNEX_SEGMENT_SECONDS||'15');
const projectFile=process.env.LUNEX_PROJECT_FILE;
const project=projectFile?JSON.parse(fs.readFileSync(projectFile,'utf8')):null;
const projectFingerprint=createHash('sha256').update(project?JSON.stringify(project):'DEMO:'+duration).digest('hex');
if(project&&(!Array.isArray(project.scenes)||!['3d','2d'].includes(project.mode)))throw Error('Invalid project JSON');
const actualDuration=project?project.scenes.reduce((a,s)=>a+s.duration,0):duration;
if(actualDuration>30&&process.env.LUNEX_ALLOW_LONG_TEST!=='1')throw Error('Safety limit: enable LUNEX_ALLOW_LONG_TEST');
const plan=planCartoonExport({durationSeconds:actualDuration,width,height,segmentSeconds,jobId:'episode'});
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const manifestPath=path.join(dir,'manifest.json');let manifest;
if(fs.existsSync(manifestPath)){manifest=JSON.parse(fs.readFileSync(manifestPath));if(manifest.totalFrames!==plan.totalFrames||manifest.width!==width||manifest.height!==height||manifest.projectFingerprint!==projectFingerprint)throw Error('Existing job settings differ');}
else manifest={...plan,projectFingerprint};
const save=()=>{const temp=manifestPath+'.tmp';fs.writeFileSync(temp,JSON.stringify(manifest,null,2));fs.renameSync(temp,manifestPath)};
const run=(cmd,args,options={})=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:['pipe','ignore','pipe'],...options});let err='';p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(cmd+' exited '+c+': '+err.slice(-1800))));if(!options.keepStdin)p.stdin.end();});
const probe=async(file,frames)=>{const p=spawn('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,nb_frames,width,height','-of','json',file]);let out='';for await(const c of p.stdout)out+=c;const code=await new Promise(r=>p.on('close',r));if(code!==0)throw Error('ffprobe failed');const s=JSON.parse(out).streams?.[0];if(s?.codec_name!=='h264'||Number(s.nb_frames)!==frames||s.width!==width||s.height!==height)throw Error('Bad segment metadata '+JSON.stringify(s));};
const browser=await chromium.launch({headless:true,...(process.env.LUNEX_CHROME_PATH?{executablePath:process.env.LUNEX_CHROME_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{
const renderContext=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const page=await renderContext.newPage();page.setDefaultTimeout(25000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});
const id=await page.evaluate(async ({project,duration})=>{const {db}=await import('/cartoon-studio/src/lib/db.ts');let p=project;if(!p){const {createProject,createMeshLayer}=await import('/cartoon-studio/src/lib/factories.ts');p=createProject('Lunex Worker E2E','3d','16:9');p.scenes[0].duration=duration;p.settings.shadows=false;p.scenes[0].layers.push({...createMeshLayer('box'),color:'#00ff00',scale:{x:2,y:2,z:2}});p.scenes[0].lunex2d=[{id:'orange',x:160,y:100,color:'#f59e0b',keyframes:[{time:0,x:160},{time:duration,x:400}]}];}p.id='render-'+Math.random().toString(36).slice(2);await db.projects.put(p);return {id:p.id,scenes:p.scenes.map(s=>({id:s.id,duration:s.duration}))};},{project,duration:actualDuration});
await page.goto(base+'/editor/'+id.id,{waitUntil:'domcontentloaded'});await page.locator('[data-lunex-hybrid] canvas').waitFor();await page.waitForTimeout(1100);
for(const s of manifest.segments){const file=path.join(dir,s.id+'.mp4');if(s.status==='complete'&&fs.existsSync(file)&&hash(file)===s.checksum){await probe(file,s.frameCount);console.log('SKIP',s.id);continue;}
manifest=updateSegment(manifest,s.id,'rendering');save();const temp=file+'.part.mp4';let stderr='';const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',temp],{stdio:['pipe','ignore','pipe']});encoder.stderr.on('data',d=>stderr+=d);
const exit=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',c=>c===0?resolve():reject(Error(stderr||'ffmpeg failed '+c)))});
try{for(let i=s.startFrame;i<s.endFrameExclusive;i++){const data=await page.evaluate(async ({i,width,height,offsets})=>{const {useEditorStore}=await import('/cartoon-studio/src/lib/store.ts');let active=offsets[0];for(const o of offsets){if(i/30>=o.start)active=o;else break;}useEditorStore.setState({isPlaying:false,isExporting:true,currentSceneId:active.id,currentTime:i/30-active.start});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const source=document.querySelector('canvas'),overlay=document.querySelector('[data-lunex-hybrid] canvas');if(!source||!overlay)throw Error('Canvas missing');const target=document.createElement('canvas');target.width=width;target.height=height;const ctx=target.getContext('2d',{alpha:false});ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);ctx.drawImage(source,0,0,source.width,source.height,0,0,width,height);ctx.drawImage(overlay,0,0,overlay.width,overlay.height,0,0,width,height);return target.toDataURL('image/png').split(',')[1];},{i,width,height,offsets:projectOffsets()});if(!encoder.stdin.write(Buffer.from(data,'base64')))await new Promise(r=>encoder.stdin.once('drain',r));}encoder.stdin.end();await exit;await probe(temp,s.frameCount);fs.renameSync(temp,file);manifest=updateSegment(manifest,s.id,'complete',{checksum:hash(file)});save();console.log('SEGMENT_OK',s.id,s.frameCount);}catch(e){encoder.kill('SIGTERM');manifest=updateSegment(manifest,s.id,'failed');save();throw e;}}
if(!canAssemble(manifest))throw Error('Segments incomplete');const list=path.join(dir,'concat.txt');fs.writeFileSync(list,manifest.segments.map(s=>"file '"+path.join(dir,s.id+'.mp4').replaceAll("'","'\\''")+"'").join('\n')+'\n');const output=path.join(dir,'final.mp4');await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);await probe(output,plan.totalFrames);if(errors.length)throw Error('Browser errors '+errors.join(';'));console.log('FINAL_OK',JSON.stringify({output,bytes:fs.statSync(output).size,frames:plan.totalFrames,segments:plan.segments.length}));
function projectOffsets(){let t=0;return id.scenes.map(s=>{const o={id:s.id,start:t};t+=s.duration;return o;});}
}finally{await browser.close()}
