const {chromium}=require('/srv/lunex-cartoon-studio-poc/upstream/node_modules/playwright');
const fs=require('node:fs');
const password=fs.readFileSync('/root/.lunex-cartoon-studio-credentials','utf8').match(/^password=(.*)$/m)[1];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/root/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({httpCredentials:{username:'lunex',password},viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://rikagro.ru/cartoon-studio/',{waitUntil:'domcontentloaded'});
  const title=await page.locator('h1').innerText();
  await page.getByText('Создать мультфильм').click();
  await page.getByText('Новый мультфильм').waitFor({timeout:15000});
  const count=await page.getByText('Мои мультфильмы').count();
  await page.screenshot({path:'/tmp/lunex-mobile-ru-projects.png'});
  console.log('MOBILE_RU_E2E',JSON.stringify({title,projectsHeading:count,errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
  if(!count||errors.length)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error('MOBILE_RU_E2E_FAIL',e.message);process.exitCode=1});