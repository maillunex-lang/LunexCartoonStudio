#!/usr/bin/env node
// Read-only status report for a local segmented render job.
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.argv[2]||process.env.LUNEX_JOB_DIR||'/tmp/lunex-job-v2');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const complete=manifest.segments.filter(s=>s.status==='complete');
const doneFrames=complete.reduce((sum,s)=>sum+s.frameCount,0);
const percent=Number((doneFrames/manifest.totalFrames*100).toFixed(2));
const result={jobId:manifest.jobId,status:fs.existsSync(path.join(dir,'final.mp4'))&&percent===100?'completed':manifest.segments.some(s=>s.status==='rendering')?'rendering':manifest.segments.some(s=>s.status==='failed')?'retry_needed':'pending',completeSegments:complete.length,totalSegments:manifest.segments.length,completeFrames:doneFrames,totalFrames:manifest.totalFrames,percent,output:fs.existsSync(path.join(dir,'final.mp4'))?path.join(dir,'final.mp4'):null};
console.log(JSON.stringify(result,null,2));
