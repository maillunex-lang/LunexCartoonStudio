// Browser E2E: save/reopen and actual mixed 3D+2D WebM export.
// Run against a patched MyMotionStudio Vite dev server, with playwright installed.
// Usage: LUNEX_BASE_URL=http://127.0.0.1:4183 node integration/e2e/mixed-export.cjs
const { chromium } = require(process.env.LUNEX_PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({
  headless:true,
  ...(process.env.LUNEX_CHROME_PATH ? {executablePath:process.env.LUNEX_CHROME_PATH}:{}),
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']
 });
 try {
  const base=process.env.LUNEX_BASE_URL||'http://127.0.0.1:4183';
  const output=process.env.LUNEX_VIDEO_OUTPUT||'/tmp/lunex-mixed-e2e.webm';
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/projects',{waitUntil:'domcontentloaded'});
  // Use the app's Dexie instance, not indexedDB.open() with a mismatched version.
  const created=await page.evaluate(async()=>{
   const {db}=await import('/src/lib/db.ts');
   const {createProject,createMeshLayer}=await import('/src/lib/factories.ts');
   const project=createProject('Lunex Mixed E2E','3d','16:9');
   project.id='lunex-e2e-'+Math.random().toString(36).slice(2);
   project.settings.shadows=false;
   project.scenes[0].duration=1.5;
   project.scenes[0].layers.push({...createMeshLayer('box'),color:'#00ff00',scale:{x:2,y:2,z:2}});
   await db.projects.put(project);
   return project.id;
  });
  await page.goto(base+'/editor/'+created,{waitUntil:'domcontentloaded'});
  await page.locator('#lunex-hybrid-overlay').waitFor({timeout:25000});
  assert.equal(await page.locator('[data-lunex-hybrid]').count(),1);
  await page.getByRole('button',{name:'+ 2D слой'}).first().click();
  await page.waitForTimeout(2700);
  const saved=await page.evaluate(async id=>{
   const {db}=await import('/src/lib/db.ts');
   return (await db.projects.get(id)).scenes[0].lunex2d?.length;
  },created);
  assert.equal(saved,1,'2D sprite must persist in IndexedDB');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#lunex-hybrid-overlay canvas').waitFor({timeout:25000});
  const reopened=await page.evaluate(async id=>{
   const {db}=await import('/src/lib/db.ts');
   return (await db.projects.get(id)).scenes[0].lunex2d?.length;
  },created);
  assert.equal(reopened,1,'2D sprite must survive reload');
  await page.getByRole('button',{name:'Export',exact:true}).first().click();
  await page.getByRole('button',{name:/WebM/i}).first().click();
  await page.getByRole('button',{name:/480p/i}).first().click();
  const downloadPromise=page.waitForEvent('download',{timeout:60000});
  await page.locator('.fixed.inset-0 .btn-primary').last().click();
  const download=await downloadPromise;
  fs.mkdirSync(path.dirname(output),{recursive:true});
  await download.saveAs(output);
  assert.ok(fs.statSync(output).size>10000,'WebM should be nonempty');
  assert.deepEqual(errors,[],'No JavaScript page errors');
  console.log(JSON.stringify({pass:true,project:created,saved,reopened,bytes:fs.statSync(output).size,video:output}));
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
