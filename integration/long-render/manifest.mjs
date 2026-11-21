// First building block for reliable long-form server rendering: deterministic segment plan.
// Rendering, encoding, queue, storage, and joining are separate future adapters.
export function planSegments({durationSeconds,fps=30,segmentSeconds=30,jobId='job'}) {
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0)throw Error('durationSeconds must be positive');
 if(!Number.isInteger(fps)||fps<1||fps>120)throw Error('fps must be integer 1..120');
 if(!Number.isFinite(segmentSeconds)||segmentSeconds<=0)throw Error('segmentSeconds must be positive');
 if(!/^[a-zA-Z0-9_-]+$/.test(jobId))throw Error('invalid jobId');
 const totalFrames=Math.ceil(durationSeconds*fps);
 const segmentFrames=Math.max(1,Math.round(segmentSeconds*fps));
 const segments=[];
 for(let start=0,index=0;start<totalFrames;start+=segmentFrames,index++){
  const end=Math.min(start+segmentFrames,totalFrames);
  segments.push({id:jobId+'-'+String(index).padStart(5,'0'),index,startFrame:start,endFrameExclusive:end,frameCount:end-start,startSeconds:start/fps,endSeconds:end/fps,status:'pending',attempts:0});
 }
 return {jobId,fps,durationSeconds,totalFrames,segmentFrames,segments};
}
export function updateSegment(manifest,id,status,{checksum=null}={}){
 if(!['pending','rendering','complete','failed'].includes(status))throw Error('invalid status');
 const index=manifest.segments.findIndex(s=>s.id===id);if(index<0)throw Error('unknown segment');
 const segment=manifest.segments[index];
 if(status==='complete'&&!checksum)throw Error('complete segment needs checksum');
 if(status==='rendering'&&segment.status==='complete')throw Error('cannot rerender complete segment');
 const next={...segment,status,attempts:segment.attempts+(status==='rendering'?1:0),...(checksum?{checksum}:{})};
 return {...manifest,segments:manifest.segments.map((s,i)=>i===index?next:s)};
}
export function canAssemble(manifest){
 return manifest.segments.length>0&&manifest.segments.every(s=>s.status==='complete'&&s.checksum);
}
