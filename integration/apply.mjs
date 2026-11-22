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

// Server render PoC: add a separate explicit button to the existing export modal.
const serverPanel=resolve(root,'src/components/editor/ServerExportPanel.tsx');
copyFileSync(new URL('./src/ServerExportPanel.tsx',import.meta.url),serverPanel);
let modal=readFileSync(exporter,'utf8');
if(!modal.includes("import { ServerExportPanel }")) {
  modal="import { ServerExportPanel } from './ServerExportPanel';\n"+modal;
  const anchor='<div className="p-5 space-y-4">';
  if(!modal.includes(anchor))throw Error('Upstream changed: export options wrapper missing');
  modal=modal.replace(anchor,anchor+'\n              <ServerExportPanel project={project} />');
  writeFileSync(exporter,modal);
}
// Dev-only proxy: API remains bound to loopback, not directly public.
const viteConfig=resolve(root,'vite.config.ts');
let vite=readFileSync(viteConfig,'utf8');
if(!vite.includes("'/api/lunex-render'")) {
  const anchor='  resolve: {';
  if(!vite.includes(anchor))throw Error('Upstream changed: Vite resolve anchor missing');
  vite=vite.replace(anchor,"  server: { proxy: { '/api/lunex-render': { target: 'http://127.0.0.1:4184', changeOrigin: false } } },\n"+anchor);
  writeFileSync(viteConfig,vite);
}

// Production subpath deployment. Idempotent and limited to this upstream checkout.
const appFile=resolve(root,'src/App.tsx');
let appSource=readFileSync(appFile,'utf8');
if(!appSource.includes('basename="/cartoon-studio"')){
  if(!appSource.includes('<BrowserRouter>'))throw Error('Upstream changed: BrowserRouter anchor missing');
  appSource=appSource.replace('<BrowserRouter>','<BrowserRouter basename="/cartoon-studio">');
  writeFileSync(appFile,appSource);
}
let prodVite=readFileSync(viteConfig,'utf8');
if(!prodVite.includes('base: "/cartoon-studio/"')){
  prodVite=prodVite.replace('export default defineConfig({','export default defineConfig({\n  base: "/cartoon-studio/",');
  writeFileSync(viteConfig,prodVite);
}

// Lunex-branded Russian home page and shared navigation.
copyFileSync(new URL('./src/LunexLanding.tsx',import.meta.url),resolve(root,'src/pages/LandingPage.tsx'));
const headerPath=resolve(root,'src/components/Header.tsx');
let header=readFileSync(headerPath,'utf8');
header=header.replaceAll('MyMotionStudio','Lunex Cartoon Studio').replaceAll('src="/icon-96.png"','src="/cartoon-studio/icon-96.png"').replace('>MM</Link>','>LX</Link>').replace(/>\s*MM\s*</g,'>LX<');
writeFileSync(headerPath,header);
const toolbarPath=resolve(root,'src/components/editor/EditorToolbar.tsx');
let toolbar=readFileSync(toolbarPath,'utf8').replaceAll('MyMotionStudio','Lunex Cartoon Studio').replaceAll('src="/icon-96.png"','src="/cartoon-studio/icon-96.png"');
writeFileSync(toolbarPath,toolbar);
const htmlPath=resolve(root,'index.html');
let html=readFileSync(htmlPath,'utf8');
html=html.replace('<html lang="en"','<html lang="ru"').replaceAll('MyMotionStudio','Lunex Cartoon Studio').replaceAll('href="/favicon.png"','href="/cartoon-studio/favicon.png"').replaceAll('href="/icon-192.png"','href="/cartoon-studio/icon-192.png"').replaceAll('content="/motion-logo.png"','content="/cartoon-studio/motion-logo.png"');
writeFileSync(htmlPath,html);

// Russian locale for project creation; other namespaces temporarily fall back to English.
const ruPath=resolve(root,'src/locales/ru/projects.ts');
mkdirSync(dirname(ruPath),{recursive:true});
copyFileSync(new URL('./src/ru-projects.ts',import.meta.url),ruPath);
const localesPath=resolve(root,'src/locales/index.ts');
let locales=readFileSync(localesPath,'utf8');
if(!locales.includes("import projects_ru from './ru/projects'")){
  locales="import projects_ru from './ru/projects';\n"+locales;
  locales=locales.replace('export const resources = {',"export const resources = {\n  ru: {common: {nav:{docs:'Документация',projects:'Мои проекты'},theme:{toggleAria:'Сменить тему'},language:{toggleAria:'Язык'},settingsLink:'Настройки',docsSearchPlaceholder:'Поиск...'},projects:projects_ru},");
  writeFileSync(localesPath,locales);
}
const i18nPath=resolve(root,'src/lib/i18n.ts');
let lang=readFileSync(i18nPath,'utf8');
lang=lang.replace("fallbackLng: 'fr'","fallbackLng: 'en'").replace("supportedLngs: ['fr', 'en']","supportedLngs: ['ru', 'fr', 'en']").replace("order: ['localStorage', 'navigator']","order: ['localStorage']").replace("lookupLocalStorage: LANGUAGE_STORAGE_KEY,","lookupLocalStorage: LANGUAGE_STORAGE_KEY,");
if(!lang.includes("lng: 'ru'"))lang=lang.replace("fallbackLng: 'en',","fallbackLng: 'en',\n    lng: 'ru',");
writeFileSync(i18nPath,lang);
let sharedHeader=readFileSync(headerPath,'utf8');
sharedHeader=sharedHeader.replaceAll("changeLanguage('fr')","changeLanguage('ru')").replaceAll("i18n.language === 'fr'","i18n.language === 'ru'").replaceAll('>FR<','>RU<');
writeFileSync(headerPath,sharedHeader);

const cssPath=resolve(root,'src/index.css');
if((await import('node:fs')).existsSync(cssPath)){
 let css=readFileSync(cssPath,'utf8');
 if(!css.includes('/* Lunex mobile viewport fix */')){
  css+='\n/* Lunex mobile viewport fix */\nhtml, body, #root { max-width: 100%; overflow-x: clip; }\n';
  writeFileSync(cssPath,css);
 }
}
html=readFileSync(htmlPath,'utf8').replace('2D & 3D Motion Design Editor','Студия мультфильмов').replace('Create stunning 2D & 3D motion design videos right in your browser. Offline-first, no install required.','Создавай мультфильмы в 2D и 3D прямо в браузере.');
writeFileSync(htmlPath,html);

// Russian editor and settings namespaces; keep overlay idempotent.
for(const section of ['editor','settings']){
 const target=resolve(root,'src/locales/ru/'+section+'.ts');
 copyFileSync(new URL('./src/ru-'+section+'.ts',import.meta.url),target);
 const importLine="import "+section+"_ru from './ru/"+section+"';";
 let l=readFileSync(localesPath,'utf8');
 if(!l.includes(importLine)){
  l=importLine+'\n'+l;
  l=l.replace('projects:projects_ru}', 'projects:projects_ru,editor:editor_ru,settings:settings_ru}');
  writeFileSync(localesPath,l);
 }
}
const settingsPagePath=resolve(root,'src/pages/SettingsPage.tsx');
let settingsPage=readFileSync(settingsPagePath,'utf8');
settingsPage=settingsPage.replaceAll("changeLanguage('fr')","changeLanguage('ru')").replaceAll("i18n.language === 'fr'","i18n.language === 'ru'").replace('>FR<','>RU<');
writeFileSync(settingsPagePath,settingsPage);
const projectsPagePath=resolve(root,'src/pages/ProjectsPage.tsx');
let projectsPage=readFileSync(projectsPagePath,'utf8');
projectsPage=projectsPage.replace('className="md:hidden min-h-[calc(100vh-56px)]','className="hidden min-h-[calc(100vh-56px)]').replace('className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 py-8"','className="block max-w-7xl mx-auto px-4 sm:px-6 py-8"');
projectsPage=projectsPage.replace("i18n.language === 'en' ? 'en-US' : 'fr-FR'","i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'fr-FR'");
writeFileSync(projectsPagePath,projectsPage);
