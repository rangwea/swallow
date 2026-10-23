const assert=require('node:assert/strict');
// Use the development test browser; never access a user's browser profile.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('app-language','zh-CN');window.drafts={};window.articles={};window.failDraft=false;window.failFormal=false;window.delay=50;window.draftDelay=20;window.events={};window.closeReady=false;window.maxWrites=0;window.activeWrites=0;window.formalCount=0;
  window.runtime={EventsOnMultiple:(name,fn)=>{window.events[name]=fn;return()=>{delete window.events[name];}}};
  const good=data=>({code:1,data});
  window.go={backend:{App:new Proxy({
   ConfGet:async()=>good({language:'zh-CN',appTheme:'white',articlesPerPage:10}),
   ArticleGet:async id=>window.articles[id]?good(structuredClone(window.articles[id])):{code:0,msg:'missing article'},
   DraftList:async()=>good(Object.values(structuredClone(window.drafts))),
   DraftSave:async d=>{window.activeWrites++;window.maxWrites=Math.max(window.maxWrites,window.activeWrites);const snapshot=structuredClone(d);await new Promise(r=>setTimeout(r,window.draftDelay));window.activeWrites--;if(window.failDraft)return {code:0,msg:'draft failed'};window.drafts[d.id]={...snapshot,updatedAt:new Date().toISOString()};return good(snapshot);},
   DraftRemove:async id=>{delete window.drafts[id];return good(null);},
   ArticleSaveWithDraft:async(id,key,meta,content)=>{window.formalCount++;await new Promise(r=>setTimeout(r,window.delay));if(window.failFormal)return {code:0,msg:'formal failed'};id=id||String(window.formalCount);window.articles[id]={meta,content,hash:'hash-'+window.formalCount};if(window.drafts[key]){window.drafts[key].articleId=id;window.drafts[key].baseHash='hash-'+window.formalCount;}return good(id);},
   ArticleList:async()=>good({total:Object.keys(window.articles).length,list:[],page:0,pageSize:10}),
   WritingGuard:async()=>{},WritingCloseReady:async()=>{window.closeReady=true;},TrashList:async()=>good([]),
  },{get:(o,k)=>o[k]||(async()=>good(null))})}};
 });
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:5174/#/editor');const body=page.locator('textarea.markdown-source');await body.waitFor();await page.waitForFunction(()=>!document.querySelector('textarea').disabled);
 const title=page.locator('.editor-title-input');await title.fill('Protected');await body.fill('Draft only');await page.getByText('草稿已保存',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>Object.keys(window.articles).length),0);assert.equal(await page.evaluate(()=>Object.values(window.drafts)[0].content),'Draft only');
 // IME composition must not persist an unfinished composition snapshot.
 await body.dispatchEvent('compositionstart');await body.fill('Composing draft');await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>Object.values(window.drafts)[0].content),'Draft only');
 await body.dispatchEvent('compositionend');await page.waitForFunction(()=>Object.values(window.drafts)[0].content==='Composing draft');await body.fill('Draft only');await page.waitForFunction(()=>Object.values(window.drafts)[0].content==='Draft only');
 // Rapid editing and a slow formal save must preserve newer input as an associated draft.
 await page.evaluate(()=>window.delay=600);await body.press('Control+s');await page.waitForFunction(()=>window.formalCount===1);await body.fill('Newer during save');await page.waitForFunction(()=>Object.values(window.drafts).some(d=>d.content==='Newer during save'&&d.articleId==='1'));
 assert.equal(await page.evaluate(()=>window.articles['1'].content),'Draft only');assert.equal(await body.inputValue(),'Newer during save');assert.equal(await page.evaluate(()=>window.maxWrites),1);
 await body.press('Control+s');await page.waitForFunction(()=>Object.keys(window.drafts).length===0&&window.articles['1'].content==='Newer during save');
 // A failed formal save preserves an independent recovery snapshot.
 await page.evaluate(()=>window.failFormal=true);await body.fill('Recover after failure');await body.press('Control+s');await page.getByText('formal failed',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>Object.values(window.drafts)[0].content),'Recover after failure');assert.equal(await page.evaluate(()=>window.articles['1'].content),'Newer during save');
 await page.evaluate(()=>window.failFormal=false);
 // Navigation flush failure blocks departure and offers an explicit choice.
 await page.evaluate(()=>window.failDraft=true);await body.fill('Latest not on disk');await page.getByRole('button',{name:'返回文章列表',exact:true}).click();await page.getByRole('alertdialog').waitFor();assert.match(page.url(),/editor/);await page.getByRole('button',{name:'继续编辑',exact:true}).click();await page.getByRole('alertdialog').waitFor({state:'hidden'});
 await page.evaluate(()=>window.failDraft=false);await page.getByRole('button',{name:'返回文章列表',exact:true}).click();await page.waitForURL('**/#/');assert.equal(await page.evaluate(()=>Object.values(window.drafts)[0].content),'Latest not on disk');
 // Reopen through the library, recover, then flush on the Wails close handshake.
 await page.goto('http://127.0.0.1:5174/#/writing'); // a real reload intentionally resets mocks; seed a recovery case.
 await page.evaluate(()=>{window.articles['9']={meta:{title:'Official',tags:[]},content:'official',hash:'external-change'};window.drafts.recovery={id:'recovery',articleId:'9',meta:{title:'Recovered',tags:[]},content:'recovered content',baseHash:'old-hash',updatedAt:new Date().toISOString()};});
 await page.goto('http://127.0.0.1:5174/#/editor?id=9&draft=recovery'); // same document hash route preserves test state
 await page.getByRole('dialog',{name:'发现独立草稿'}).waitFor();await page.getByText(/正式文章已发生变化/).waitFor();await page.getByRole('button',{name:'恢复草稿',exact:true}).click();assert.equal(await title.inputValue(),'Recovered');assert.equal(await body.inputValue(),'recovered content');
 await body.fill('Close flush');await page.evaluate(()=>window.events['writing:close']());await page.waitForFunction(()=>window.closeReady);assert.equal(await page.evaluate(()=>window.drafts.recovery.content),'Close flush');assert.equal(await page.evaluate(()=>window.articles['9'].content),'official');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: independent autosave, serial writes, newer edits, formal failure recovery, blocked navigation/retry, recovery conflict, close flush');
})().catch(e=>{console.error(e);process.exit(1)});
