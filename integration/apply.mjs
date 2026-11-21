// Apply a small, reproducible overlay integration to the pinned MyMotionStudio upstream.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const root=resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: node integration/apply.mjs /path/to/my-motion-studio');
const target=resolve(root,'src/pages/EditorPage.tsx');let page=readFileSync(target,'utf8');
const imp="import { HybridOverlay2D, HybridLayersPanel } from '@/components/editor/HybridOverlay2D';";
if(!page.includes("import { HybridOverlay2D")){
  const anchor="import { Canvas3D } from '@/components/editor/Canvas3D';";
  if(!page.includes(anchor))throw Error('Upstream changed: Canvas3D import missing');
  page=page.replace(anchor,anchor+'\n'+imp);
  const viewport='{is3D ? <Canvas3D /> : <Canvas2D />}';
  if(!page.includes(viewport))throw Error('Upstream changed: canvas selector missing');
  page=page.replace(viewport,viewport+'\n            {is3D && <HybridOverlay2D />}');
  writeFileSync(target,page);
}
// Earlier versions could insert duplicate overlays; keep one per editor viewport.
const duplicate='            {is3D && <HybridOverlay2D />}\\n            {is3D && <HybridOverlay2D />}';
page=readFileSync(target,'utf8');
while(page.includes(duplicate.replace('\\n','\n')))page=page.replace(duplicate.replace('\\n','\n'),'            {is3D && <HybridOverlay2D />}');
writeFileSync(target,page);
const panels=resolve(root,'src/components/editor/RightPanels.tsx');let panelSource=readFileSync(panels,'utf8');if(!panelSource.includes('HybridLayersPanel')){
 panelSource="import { HybridLayersPanel } from './HybridOverlay2D';\\n".replace('\\n','\n')+panelSource;
 panelSource=panelSource.replace('<div className="p-2 space-y-0.5">','<div className="p-2 space-y-0.5"><HybridLayersPanel />');
 writeFileSync(panels,panelSource);
}
const exporter=resolve(root,'src/components/editor/ExportModal.tsx');let exportSource=readFileSync(exporter,'utf8');if(!exportSource.includes('data-lunex-hybrid')){
 const anchor='ctx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, res.width, res.height);';
 if(!exportSource.includes(anchor))throw Error('Upstream changed: export drawing anchor missing');
 exportSource=exportSource.replace(anchor,anchor+`\n          // Composite the Konva 2D overlay into each exported 3D frame.\n          const hybridCanvas = document.querySelector('[data-lunex-hybrid] canvas') as HTMLCanvasElement | null;\n          if (project.mode === '3d' && hybridCanvas) {\n            ctx.drawImage(hybridCanvas, 0, 0, hybridCanvas.width, hybridCanvas.height, 0, 0, res.width, res.height);\n          }`);
 writeFileSync(exporter,exportSource);
}
const dst=resolve(root,'src/components/editor/HybridOverlay2D.tsx');mkdirSync(dirname(dst),{recursive:true});copyFileSync(new URL('./src/HybridOverlay2D.tsx',import.meta.url),dst);
console.log('Lunex hybrid overlay integrated into EditorPage');
