// Apply a small, reproducible overlay integration to the pinned MyMotionStudio upstream.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const root=resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: node integration/apply.mjs /path/to/my-motion-studio');
const target=resolve(root,'src/pages/EditorPage.tsx');let page=readFileSync(target,'utf8');
const imp="import { HybridOverlay2D } from '@/components/editor/HybridOverlay2D';";
if(!page.includes(imp)){
  const anchor="import { Canvas3D } from '@/components/editor/Canvas3D';";
  if(!page.includes(anchor))throw Error('Upstream changed: Canvas3D import missing');
  page=page.replace(anchor,anchor+'\n'+imp);
  const viewport='{is3D ? <Canvas3D /> : <Canvas2D />}';
  if(!page.includes(viewport))throw Error('Upstream changed: canvas selector missing');
  page=page.replace(viewport,viewport+'\n            {is3D && <HybridOverlay2D />}');
  writeFileSync(target,page);
}
const dst=resolve(root,'src/components/editor/HybridOverlay2D.tsx');mkdirSync(dirname(dst),{recursive:true});copyFileSync(new URL('./src/HybridOverlay2D.tsx',import.meta.url),dst);
console.log('Lunex hybrid overlay integrated into EditorPage');
