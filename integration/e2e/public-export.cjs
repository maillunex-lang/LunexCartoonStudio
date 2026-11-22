const {chromium}=require(process.env.LUNEX_PLAYWRIGHT_PATH||'/srv/lunex-cartoon-studio-poc/upstream/node_modules/playwright');
const fs=require('node:fs');
const password=process.env.LUNEX_PASSWORD||fs.readFileSync('/root/.lunex-cartoon-studio-credentials','utf8').match(/^password=(.*)$/m)[1];
const base=process.env.LUNEX_PUBLIC_BASE||'https://rikagro.ru/cartoon-studio';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.LUNEX_CHROME_PATH||'/root/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const dev=await browser.newPage();
  await dev.goto('http://127.0.0.1:4183/cartoon-studio/projects');
  const project=await dev.evaluate(async()=>{
   const {createProject,createMeshLayer}=await import('/cartoon-studio/src/lib/factories.ts');
   const p=createProject('Production E2E render','3d','16:9');
   p.scenes[0].duration=1;p.settings.shadows=false;
   p.scenes[0].layers.push({...createMeshLayer('box'),color:'#00ff00',scale:{x:2,y:2,z:2}});
   p.scenes[0].lunex2d=[{id:'sprite',x:160,y:100,color:'#f59e0b',keyframes:[{time:0,x:160},{time:1,x:300}]}];
   return p;
  });
  const context=await browser.newContext({httpCredentials:{username:process.env.LUNEX_USER||'lunex',password},ignoreHTTPSErrors:true,viewport:{width:1440,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
  await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});
  await page.evaluate(async project=>{ const req=indexedDB.open('MotionStudioDB'); await new Promise((resolve,reject)=>{req.onupgradeneeded=()=>{const store=req.result.createObjectStore('projects',{keyPath:'id'});for(const field of ['name','mode','updatedAt','createdAt'])store.createIndex(field,field);};req.onsuccess=resolve;req.onerror=()=>reject(req.error);}); const db=req.result; await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(project);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close(); },project);
  await page.goto(base+'/editor/'+project.id);
  await page.locator('[data-lunex-hybrid] canvas').waitFor({timeout:30000});
  await page.locator('[data-lunex-mode="professional"]').waitFor({timeout:30000});
  await page.locator('[data-lunex-mode="simple"]').click();
  await page.locator('[data-lunex-simple-timeline]').waitFor({timeout:5000});
  if(await page.locator('[data-lunex-mode="simple"]').getAttribute('aria-pressed')!=='true')throw Error('Simple mode not active');
  await page.reload();
  await page.locator('[data-lunex-mode="simple"]').waitFor({timeout:30000});
  if(await page.locator('[data-lunex-mode="simple"]').getAttribute('aria-pressed')!=='true')throw Error('Simple preference lost after reload');
  await page.locator('[data-lunex-mode="professional"]').click();
  await page.locator('[data-lunex-simple-timeline]').waitFor({state:'detached'});
  if(await page.locator('[data-lunex-mode="professional"]').getAttribute('aria-pressed')!=='true')throw Error('Professional mode not active');
  console.log('EDITOR_MODE_E2E_PASS',JSON.stringify({simple:true,persisted:true,professional:true}));
  await page.getByText('Экспорт',{exact:true}).first().click();
  await page.getByText('Рендерить MP4 на сервере').click();
  await page.waitForTimeout(8000);console.log('EXPORT_PANEL_STATE',await page.locator('[data-lunex-server-export]').innerText());await page.getByText('Скачать готовый MP4').waitFor({timeout:30000});
  const href=await page.getByText('Скачать готовый MP4').getAttribute('href');
  const response=await context.request.get(new URL(href,base+'/').href);
  const bytes=(await response.body()).length;
  console.log('PRODUCTION_E2E',JSON.stringify({http:response.status(),bytes,href}));
  await page.screenshot({path:'/tmp/lunex-prod-browser-e2e.png'});
  if(response.status()!==200||bytes<1000)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error('PRODUCTION_E2E_FAIL',e.message);process.exitCode=1});
