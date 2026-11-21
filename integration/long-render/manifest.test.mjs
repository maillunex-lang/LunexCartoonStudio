import test from 'node:test';
import assert from 'node:assert/strict';
import {planSegments,planCartoonExport,updateSegment,canAssemble} from './manifest.mjs';
test('hour-long 30fps timeline is partitioned without gaps or overlaps',()=>{
 const p=planSegments({durationSeconds:3600,fps:30,segmentSeconds:30,jobId:'movie'});
 assert.equal(p.totalFrames,108000);assert.equal(p.segments.length,120);
 for(let i=0;i<p.segments.length;i++){
  const s=p.segments[i];assert.equal(s.frameCount,900);
  if(i)assert.equal(p.segments[i-1].endFrameExclusive,s.startFrame);
 }
 assert.equal(p.segments.at(-1).endFrameExclusive,p.totalFrames);
});
test('fractional duration rounds up final frame and segment',()=>{
 const p=planSegments({durationSeconds:61.03,fps:24,segmentSeconds:30});
 assert.equal(p.totalFrames,1465);assert.deepEqual(p.segments.map(s=>s.frameCount),[720,720,25]);
});
test('manifest requires complete checksummed segments',()=>{
 let p=planSegments({durationSeconds:2,fps:10,segmentSeconds:1});
 assert.equal(canAssemble(p),false);
 for(const s of p.segments){p=updateSegment(p,s.id,'rendering');p=updateSegment(p,s.id,'complete',{checksum:'sha256:'+s.id});}
 assert.equal(canAssemble(p),true);assert.deepEqual(p.segments.map(s=>s.attempts),[1,1]);
});
test('reject invalid parameters and incomplete output',()=>{
 assert.throws(()=>planSegments({durationSeconds:0}));
 assert.throws(()=>planSegments({durationSeconds:5,fps:0}));
 const p=planSegments({durationSeconds:2});
 assert.throws(()=>updateSegment(p,p.segments[0].id,'complete'));
});

test('approved 5-minute 1080p30 export has 9000 frames and ten segments',()=>{
 const p=planCartoonExport({durationSeconds:300,jobId:'episode-01'});
 assert.equal(p.totalFrames,9000);
 assert.equal(p.segments.length,10);
 assert.equal(p.codec,'h264');
 assert.equal(p.audio,false);
 assert.equal(p.segments.at(-1).endFrameExclusive,9000);
});
test('cartoon export rejects oversize duration, resolution and segments',()=>{
 assert.throws(()=>planCartoonExport({durationSeconds:301}));
 assert.throws(()=>planCartoonExport({durationSeconds:60,width:3840}));
 assert.throws(()=>planCartoonExport({durationSeconds:60,segmentSeconds:10}));
 assert.throws(()=>planCartoonExport({durationSeconds:60,fps:60}));
});
