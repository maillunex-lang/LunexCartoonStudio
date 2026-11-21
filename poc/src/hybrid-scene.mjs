// Standalone contract PoC: scene schema for adapting MyMotionStudio's separate 2D/3D renderers.
export const SCHEMA_VERSION = 1;
export function createScene({id='scene-1',width=1920,height=1080}={}) {
  if (!Number.isInteger(width)||width<=0||!Number.isInteger(height)||height<=0) throw new Error('Invalid dimensions');
  return {schemaVersion:SCHEMA_VERSION,id,width,height,layers:[],durationFrames:300,fps:30};
}
export function addLayer(scene, layer) {
  if (!['2d','3d'].includes(layer.kind)) throw new Error('Unsupported layer kind');
  if (!layer.id || scene.layers.some(l=>l.id===layer.id)) throw new Error('Missing or duplicate layer ID');
  if (!Number.isFinite(layer.depth)) throw new Error('Invalid layer depth');
  const next={...scene,layers:[...scene.layers,{id:layer.id,kind:layer.kind,depth:layer.depth,visible:layer.visible!==false,asset:layer.asset??null,transform:layer.transform??{}}]};
  next.layers.sort((a,b)=>a.depth-b.depth);
  return next;
}
export function serializeScene(scene) {validateScene(scene);return JSON.stringify(scene);}
export function deserializeScene(json) {const scene=JSON.parse(json);validateScene(scene);return scene;}
export function validateScene(scene) {
  if (scene.schemaVersion!==SCHEMA_VERSION || !Array.isArray(scene.layers)) throw new Error('Unsupported schema');
  if (!Number.isInteger(scene.width)||scene.width<=0||!Number.isInteger(scene.height)||scene.height<=0) throw new Error('Invalid dimensions');
  const ids=new Set();for(const layer of scene.layers){if(!['2d','3d'].includes(layer.kind)||!layer.id||ids.has(layer.id)||!Number.isFinite(layer.depth))throw new Error('Invalid layer');ids.add(layer.id);}
  return true;
}
export function renderPasses(scene){validateScene(scene);return scene.layers.filter(l=>l.visible).map(l=>({renderer:l.kind==='2d'?'konva':'three',layerId:l.id,depth:l.depth}));}
