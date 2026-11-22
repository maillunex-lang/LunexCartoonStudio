const {chromium}=require('/srv/lunex-cartoon-studio-poc/upstream/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const raw=fs.readFileSync('/root/.lunex-cartoon-studio-credentials','utf8');
 const parts=raw.trim().split(/\r?\n/);const user=parts.find(x=>/user(name)?=/i.test(x))?.split('=').slice(1).join('=').trim()||'lunex';
 const password=parts.find(x=>/pass(word)?=/i.test(x))?.split('=').slice(1).join('=').trim();
 if(!password)throw Error('Missing E2E basic auth credentials');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({httpCredentials:{username:user,password},viewport:{width:1600,height:900},serviceWorkers:'block'});
 const page=await context.newPage();await page.goto('https://rikagro.ru/cartoon-studio/projects');
 const projects=await page.locator('a[href*="/editor/"]').count();console.log('PROJECT_LINKS',projects);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
