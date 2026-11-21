import { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Circle } from 'react-konva';
import { useEditorStore } from '@/lib/store';
import type { Scene } from '@/lib/types';

// Stored in Scene so existing IndexedDB autosave, JSON backup and undo can retain it.
export type HybridSprite = { id: string; x: number; y: number; color: string; keyframes: { time: number; x: number }[] };
type HybridScene = Scene & { lunex2d?: HybridSprite[] };
const sample = (): HybridSprite => ({id: 'sprite-'+Math.random().toString(36).slice(2,9),x:160,y:100,color:'#f59e0b',keyframes:[{time:0,x:160},{time:3,x:600}]});
export function sampleAtTime(sprite: HybridSprite,time: number): number {
  const frames=[...sprite.keyframes].sort((a,b)=>a.time-b.time);if(!frames.length)return sprite.x;
  if(time<=frames[0].time)return frames[0].x;
  for(let i=1;i<frames.length;i++){if(time<=frames[i].time){const a=frames[i-1],b=frames[i];const ratio=(time-a.time)/(b.time-a.time||1);return a.x+(b.x-a.x)*ratio;}}
  return frames[frames.length-1].x;
}
export function HybridOverlay2D(){
  const project=useEditorStore(s=>s.project);const sceneId=useEditorStore(s=>s.currentSceneId);const time=useEditorStore(s=>s.currentTime);const updateScene=useEditorStore(s=>s.updateScene);
  const [size,setSize]=useState({w:960,h:540});const [enabled,setEnabled]=useState(true);
  useEffect(()=>{const update=()=>{const el=document.getElementById('lunex-hybrid-overlay');if(el)setSize({w:Math.max(1,el.clientWidth),h:Math.max(1,el.clientHeight)});};update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
  const scene=project?.scenes.find(s=>s.id===sceneId) as HybridScene|undefined;
  if(!scene||!sceneId)return null;
  const sprites=scene.lunex2d??[];
  return <div id="lunex-hybrid-overlay" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:4}}>
    {enabled&&<Stage width={size.w} height={size.h} style={{pointerEvents:'none'}}><Layer>
      {sprites.map(s=><Circle key={s.id} x={sampleAtTime(s,time)/960*size.w} y={s.y/540*size.h} radius={24} fill={s.color} shadowBlur={12} shadowOpacity={0.4}/>)}
      <Text text="Lunex 2D overlay + 3D viewport" x={14} y={12} fontSize={13} fill="#e5e7eb" shadowColor="#000" shadowBlur={4}/>
    </Layer></Stage>}
    <div style={{position:'absolute',top:8,right:8,pointerEvents:'auto',display:'flex',gap:5}}>
      <button style={{background:'#4338ca',color:'#fff',padding:'5px 8px',borderRadius:5}} onClick={()=>{updateScene(sceneId,{lunex2d:[...sprites,sample()]} as Partial<Scene>);}}>+ 2D слой</button>
      <button style={{background:'#374151',color:'#fff',padding:'5px 8px',borderRadius:5}} onClick={()=>setEnabled(!enabled)}>{enabled?'Скрыть 2D':'Показать 2D'}</button>
    </div>
  </div>;
}
