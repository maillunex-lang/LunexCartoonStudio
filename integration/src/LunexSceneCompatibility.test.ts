import { describe, expect, it } from 'vitest';
import { getCompatibleSceneObjects, isCompatibleProject } from './LunexSceneCompatibility';
import type { Project, Scene } from '@/lib/types';

const shape = {id:'old-shape',name:'Old shape',type:'shape' as const,visible:true,locked:false,keyframes:[{id:'k1',time:1,property:'x',value:42,easing:'linear' as const}],parentId:null,shape:'rectangle' as const,x:20,y:40,width:100,height:100,rotation:0,opacity:1,fill:'#fff',stroke:'#000',strokeWidth:0,cornerRadius:0,sides:4};
const mesh = {id:'old-mesh',name:'Old mesh',type:'mesh' as const,visible:true,locked:false,keyframes:[],parentId:null,mesh:'box' as const,position:{x:1,y:2,z:3},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1},color:'#fff',metalness:0,roughness:1,opacity:1,castShadow:true};
const scene: Scene = {id:'scene1',name:'Scene',duration:3,order:0,layers:[shape,mesh],transitionToNext:null};
describe('Lunex hybrid compatibility stage 1',()=>{
 it('reads legacy 2D and 3D layers without mutating scene or keyframes',()=>{
  const before=JSON.stringify(scene);
  const objects=getCompatibleSceneObjects(scene);
  expect(objects.map(o=>[o.kind,o.x,o.y,o.z,o.order])).toEqual([['2d',20,40,0,0],['3d',1,2,3,1]]);
  expect(objects[0].source.keyframes).toEqual(shape.keyframes);
  expect(JSON.stringify(scene)).toBe(before);
 });
 it('honors additive manual depth while preserving existing fields',()=>{
  const enriched={...scene,layers:[{...shape,lunex:{schemaVersion:1 as const,depthMode:'manual' as const,depth:-5,order:8}},mesh]};
  const before=JSON.stringify(enriched);
  const objects=getCompatibleSceneObjects(enriched);
  expect([objects[0].z,objects[0].order,objects[0].depthMode]).toEqual([-5,8,'manual']);
  expect(JSON.stringify(enriched)).toBe(before);
 });
 it('accepts old projects and rejects malformed scene payloads',()=>{
  const old={id:'old-project',scenes:[scene]} as Project;
  expect(isCompatibleProject(old)).toBe(true);
  expect(isCompatibleProject({id:'bad',scenes:[{layers:[null]}]})).toBe(false);
 });
});
