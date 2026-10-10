import {createStaticApi} from './static-store.mjs';
import {createOpenReminders} from './open-reminders.mjs';
import {DRIVE,SOURCES,normalizeCaption,dayHasPassed,kinshasaDate,mondayOf,plusDays,timePreview,nextHoliday,validMonday} from './planner.mjs';
import {dictionary} from './translations.mjs';
import {renderStoryCanvas,downloadStory} from './story-design.mjs';

const $=id=>document.getElementById(id);
let lang=localStorage.getItem('wf-language')==='fr'?'fr':'en';
let week=mondayOf(),plan=null,view='calendar',captionLang=lang,editDraft=null;
let displayedDate=kinshasaDate();
let pendingReminder=null;
let loading=false,mutating=false,toastTimer;
const t=key=>dictionary[lang][key]||key;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate=(date,options)=>new Intl.DateTimeFormat(lang==='fr'?'fr-FR':'en-GB',{timeZone:'Africa/Kinshasa',...options}).format(new Date(date+'T12:00:00Z'));
const external=(url,label)=>`<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a>`;

function toast(message){
  $('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('toast').style.display='none',3500);
}
class ApiError extends Error{constructor(message,status){super(message);this.status=status;}}
const staticApi=createStaticApi(localStorage);
async function api(path,options={}){return staticApi(path,options);}
function updateClocks(){
  const now=new Date();
  const clock=zone=>new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  $('live-times').innerHTML=`<span>Kinshasa <strong>${clock('Africa/Kinshasa')}</strong></span><span>WIB <strong>${clock('Asia/Jakarta')}</strong></span>`;
}
function translate(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t);});
  for(const choice of ['en','fr']){$('lang-'+choice).classList.toggle('selected',lang===choice);$('lang-'+choice).setAttribute('aria-pressed',String(lang===choice));}
  $('prev-week').ariaLabel=t('previous');$('next-week').ariaLabel=t('next');$('close-editor').ariaLabel=t('close');$('calendar').ariaLabel=t('calendarLabel');
  updateClocks();
}
function sourceLabel(item){
  return item.sourceKind==='holiday'?t('sourceHoliday'):item.sourceKind==='podcast'?t('sourcePodcast'):item.sourceKind==='science'?t('sourceScience'):item.sourceKind==='drjames'?t('sourceDr'):'';
}
function timeLabel(item){
  const clock=timePreview(item.date,item.time);
  return `<span>${escape(item.time)} Kinshasa</span><span>${escape(clock.wib)} WIB${clock.wibDate!==item.date?` · ${escape(t('nextDay'))}`:''}</span>`;
}
function dateStatus(date){return dayHasPassed(date)?'dayPassed':date===kinshasaDate()?'todayStatus':'upcoming';}
function card(item){
  const passed=dayHasPassed(item.date);
  return `<button class="content-card ${item.type}" data-edit="${escape(item.id)}" aria-label="${escape(t('edit')+': '+item.title[lang])}">
    <span class="card-meta"><span>${t(item.type)}</span><span>${passed?`<span class="past-tick" aria-label="${escape(t('dayPassed'))}">✓</span>`:''}</span></span>
    <span class="card-title">${escape(item.title[lang])}</span>
    <span class="card-pillar">${escape(t(item.pillar))}</span>
    ${sourceLabel(item)?`<span class="card-source">${escape(sourceLabel(item))}</span>`:''}
    <span class="card-times">${timeLabel(item)}</span>
    <span class="card-bottom"><span class="${passed?'done-label':''}">${t(dateStatus(item.date))}</span><span>EN / FR</span></span>
  </button>`;
}
function renderCalendar(){
  const dates=Array.from({length:7},(_,i)=>plusDays(week,i));
  const times=[...new Set(['09:00','12:30','18:00',...plan.items.map(item=>item.time)])].sort();
  const header=`<div class="calendar-corner">${t('timeColumn')}<small>Kinshasa / WIB</small></div>`+dates.map(date=>{
    const holidays=plan.holidays.filter(h=>h.date===date);
    return `<div class="calendar-day ${date===kinshasaDate()?'is-today':''}"><span>${dayHasPassed(date)?`<i class="past-tick" title="${escape(t('dayPassed'))}">✓</i> `:''}${escape(formatDate(date,{weekday:'long'}))}</span><strong>${escape(formatDate(date,{day:'numeric',month:'short'}))}</strong>${holidays.map(h=>`<span class="holiday-head">🇨🇩 ${escape(h[lang])}</span>`).join('')}</div>`;
  }).join('');
  const rows=times.map(time=>{
    const preview=timePreview(week,time);
    const slot=`<div class="calendar-time"><strong>${escape(time)}</strong><span>Kinshasa</span><small>${escape(preview.wib)} WIB${preview.wibDate!==week?`<br>${t('nextDay')}`:''}</small></div>`;
    return slot+dates.map(date=>{
      const items=plan.items.filter(item=>item.date===date&&item.time===time);
      return `<div class="calendar-cell ${date===kinshasaDate()?'is-today':''}">${items.length?items.map(card).join(''):`<span class="empty-cell" aria-label="${escape(t('emptyCell'))}">—</span>`}</div>`;
    }).join('');
  }).join('');
  $('calendar').innerHTML=`<div class="calendar-grid">${header}${rows}</div>`;
  const actual=plan.holidays.filter(h=>!h.observed);
  const next=nextHoliday(plusDays(week,7));
  $('schedule-notes').innerHTML=`<div><strong>🇨🇩 ${t('holidayWeek')}</strong><p>${actual.length?actual.map(h=>`${escape(h[lang])} · ${escape(formatDate(h.date,{day:'numeric',month:'short'}))}`).join('<br>'):t('noHoliday')}</p>${!actual.length&&next?`<small>${t('nextHoliday')}: ${escape(next[lang])} · ${escape(formatDate(next.date,{day:'numeric',month:'short'}))}</small>`:''}</div><div><strong>💛 ${t('sourcesTitle')}</strong><p>${t('storyExplain')}</p></div>`;
}
function renderList(){
  $('list-view').innerHTML=`<table class="list-table"><thead><tr><th>${t('day')}</th><th>${t('format')}</th><th>${t('topic')}</th><th>${t('status')}</th></tr></thead><tbody>${plan.items.map(item=>`<tr><td>${escape(formatDate(item.date,{weekday:'short',day:'numeric',month:'short'}))}<span class="list-times">${timeLabel(item)}</span></td><td>${t(item.type)}</td><td><button data-edit="${escape(item.id)}">${escape(item.title[lang])}</button><small class="list-source">${escape(sourceLabel(item))}</small></td><td>${t(dateStatus(item.date))}</td></tr>`).join('')}</tbody></table>`;
}
function renderResources(){
  const resource=(title,desc,more)=>`<article class="resource-card"><h3>${t(title)}</h3><p>${t(desc)}</p>${more}</article>`;
  $('resources-view').innerHTML=`<div class="resources-grid">${resource('media','mediaDesc',external(DRIVE,t('mediaBtn')))}${resource('classesTitle','classesDesc',`<p>${t('classesList')}</p>${external(SOURCES.classes,t('classLink'))}`)}${resource('sourcesTitle','sourcesDesc',`${external(SOURCES.inspiration,t('sourceBtn'))}<p>${external(SOURCES.activity,t('healthLink'))}<br>${external(SOURCES.nutrition,t('dietLink'))}</p>`)}${resource('holidayTitle','holidayDesc',external(SOURCES.holidays,t('holidayBtn')))}${resource('freeTitle','freeDesc','')}${resource('instagramTitle','instagramDesc',external('https://www.instagram.com/willfit__gym/',t('instagramBtn')))}</div>`;
}
let currentReminderPlan=null,reminderPlanLoadedAt=0;
const pushClient=createOpenReminders({getLanguage:()=>lang,onChange:renderReminders,open:openReminderLink,onDue:showPostingAlert,getPlan:async()=>{
  const currentWeek=mondayOf();
  if(currentReminderPlan?.week===currentWeek&&Date.now()-reminderPlanLoadedAt<30000)return currentReminderPlan;
  currentReminderPlan=await api(`/api/plan?week=${currentWeek}`);reminderPlanLoadedAt=Date.now();return currentReminderPlan;
}});
function showPostingAlert(payload){
  const alert=document.createElement('div');alert.className='posting-alert';alert.setAttribute('role','alert');
  const text=document.createElement('div');const title=document.createElement('strong');title.textContent=payload.title;const body=document.createElement('p');body.textContent=payload.body;text.append(title,body);
  const button=document.createElement('button');button.className='button primary';button.textContent=t('reminderOpenCard');button.onclick=()=>{openReminderLink(payload.url);alert.remove();};
  const dismiss=document.createElement('button');dismiss.className='button subtle';dismiss.textContent=t('reminderDismiss');dismiss.onclick=()=>alert.remove();
  alert.append(text);if(payload.url.includes('content='))alert.append(button);alert.append(dismiss);$('posting-alerts').append(alert);
}

function renderReminders(){
  const state=pushClient.state();
  const label=state.enabled?(state.desktop?'reminderEnabled':'reminderOnScreenEnabled'):'reminderOff';
  $('posting-reminders').innerHTML=`<div><h2>${t('reminderTitle')}</h2><p>${t('reminderDesc')}</p><small>${t(label)}</small><p class="reminder-hint">${t('reminderDeviceHint')}</p>${state.error?`<p class="reminder-error" role="alert">${escape(t(state.error))}</p>`:''}</div><div class="reminder-actions"><button id="enable-reminders" class="button ${state.enabled?'':'primary'}" ${!state.configured||!state.supported||state.busy?'disabled':''}>${t(state.enabled?'reminderDisable':'reminderEnable')}</button>${state.enabled?`<button id="test-reminders" class="button subtle" ${state.busy?'disabled':''}>${t('reminderTest')}</button>`:''}</div>`;
}
async function openReminderLink(value){
  let target;try{target=new URL(value,location.origin);}catch{return;}
  if(target.origin!==location.origin)return;
  const params=new URLSearchParams(target.hash.slice(1)),targetWeek=params.get('week'),id=params.get('content');
  if(!validMonday(targetWeek||'')||!id)return;
  if($('editor').open||loading||mutating){pendingReminder=target.href;toast(t('reminderDraftOpen'));return;}
  pendingReminder=null;
  week=targetWeek;await loadWeek();
  if(plan?.items.some(item=>item.id===id)){setView('calendar');openEditor(id);}
  else pendingReminder=target.href;
}
function renderBottom(){
  $('instagram-stats').innerHTML=`<div class="section-title"><div><h2>${t('statsTitle')} <small>@willfit__gym</small></h2><p>${t('statsSubtitle')}</p></div><span class="pending-label">${t('statsPending')}</span></div><div class="stats-grid">${['followers','reach','views','interactions'].map(metric=>`<div class="stat-box"><span>${t(metric)}</span><strong aria-label="${escape(t('noData'))}">—</strong><small>${metric==='followers'?t('noData'):t('last30')}</small></div>`).join('')}</div><button id="about-stats" class="text-button">${t('howStats')}</button>`;
  $('future-projects').innerHTML=`<div class="section-title"><div><h2>${t('projectsTitle')}</h2><p>${t('projectsSubtitle')}</p></div></div><div class="projects-grid">${[['book','▤'],['podcast','🎙'],['store','▣']].map(([key,icon])=>`<article class="project-card"><span class="project-icon" aria-hidden="true">${icon}</span><span class="project-status">${t('futureGoal')}</span><h3>${t(key+'Title')}</h3><p>${t(key+'Desc')}</p></article>`).join('')}</div>`;
}
function setView(next){
  view=next;$('calendar').hidden=next!=='calendar';$('list-view').hidden=next!=='list';$('resources-view').hidden=next!=='resources';$('schedule-notes').hidden=next!=='calendar';
  document.querySelector('.legend').hidden=next==='resources';document.querySelector('.quick-guide').hidden=next==='resources';document.querySelector('.scroll-hint').hidden=next!=='calendar';
  document.querySelectorAll('[data-view]').forEach(el=>{el.classList.toggle('active',el.dataset.view===next);el.setAttribute('aria-current',el.dataset.view===next?'page':'false');});
  document.querySelectorAll('[data-mode]').forEach(el=>{el.classList.toggle('selected',el.dataset.mode===next);el.setAttribute('aria-pressed',String(el.dataset.mode===next));});
}
function render(){
  translate();renderResources();renderBottom();renderReminders();
  $('week-title').textContent=`${formatDate(week,{day:'numeric',month:'short'})} – ${formatDate(plusDays(week,6),{day:'numeric',month:'short',year:'numeric'})}`;
  if(!plan){setView(view);return;}
  const done=Array.from({length:7},(_,i)=>plusDays(week,i)).filter(date=>dayHasPassed(date)).length;
  $('feed-count').innerHTML=`${plan.items.filter(item=>item.type!=='story').length} <small>${t('perWeek')}</small>`;
  $('elapsed-count').innerHTML=`${done} <small>/ 7</small>`;
  $('connection').textContent=t('staticMode');
  renderCalendar();renderList();setView(view);
}
async function loadWeek({quiet=false}={}){
  if(loading||mutating)return;
  loading=true;
  if(!quiet){$('calendar').innerHTML=`<div class="loading">${t('loading')}</div>`;plan=null;$('list-view').innerHTML='';$('schedule-notes').innerHTML='';}
  $('prev-week').disabled=$('next-week').disabled=true;
  try{plan=await api(`/api/plan?week=${week}`);render();}
  catch(error){if(!quiet){$('calendar').hidden=false;$('list-view').hidden=true;$('calendar').innerHTML=`<div class="error-box">${escape(error.status===401?t('accessDesc'):t('loadError'))}<br><button id="retry-load" class="button">${t('retry')}</button></div>`;$('connection').textContent='';}}
  finally{loading=false;$('prev-week').disabled=$('next-week').disabled=false;if(plan?.week===week&&pendingReminder&&!$('editor').open&&!$('access').open)queueMicrotask(()=>{if(pendingReminder)openReminderLink(pendingReminder);});}
}
async function updateItem(id,patch){
  const item=plan?.items.find(item=>item.id===id);if(!item)throw new Error('Content not found');
  mutating=true;
  try{const saved=await api(`/api/items/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({...patch,version:item.version})});
    reminderPlanLoadedAt=0;plan.items=plan.items.map(item=>item.id===id?saved:item).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));render();return saved;
  }finally{mutating=false;}
}
function collectDraft(){
  if(!editDraft)return;
  editDraft.title[captionLang]=$('edit-title').value;
  editDraft.caption[captionLang]=normalizeCaption($('edit-caption').value);
  editDraft.brief[captionLang]=$('edit-brief').value;
  if(editDraft.type==='story')editDraft.storyText[captionLang]=$('edit-storyText').value;
  for(const key of ['date','time','mediaUrl','note'])editDraft[key]=$('edit-'+key).value;
}
function openEditor(id){
  const item=plan?.items.find(item=>item.id===id);if(!item)return;
  editDraft=structuredClone(item);if(item.type==='story')editDraft.storyText??={fr:item.title.fr,en:item.title.en};captionLang=lang;renderEditor();$('editor').showModal();
}
function editorTimePreview(){
  const date=$('edit-date').value,time=$('edit-time').value;
  if(!date||!time)return;
  if(Number.isNaN(new Date(date+'T'+time+':00+01:00').getTime()))return;
  const clock=timePreview(date,time);
  $('edit-time-preview').innerHTML=`<span>${escape(time)} Kinshasa · ${escape(formatDate(date,{weekday:'short',day:'numeric',month:'short'}))}</span><span>${escape(clock.wib)} WIB · ${escape(formatDate(clock.wibDate,{weekday:'short',day:'numeric',month:'short'}))}</span>`;
}
function renderEditor(){
  const draft=editDraft;$('editor-type').textContent=`${t(draft.type)} · ${t(draft.pillar)}`;$('editor-error').textContent='';
  const field=(key,label,type='textarea',attrs='')=>{
    const value=['caption','title','brief','storyText'].includes(key)?draft[key][captionLang]:draft[key];
    return `<div class="field"><label for="edit-${key}">${t(label)}</label>${type==='textarea'?`<textarea id="edit-${key}" ${attrs}>${escape(value)}</textarea>`:`<input id="edit-${key}" type="${type}" value="${escape(value)}" ${attrs}>`}</div>`;
  };
  $('editor-fields').innerHTML=`<div class="editor-tabs"><label for="caption-language">${t('languageCaption')}</label><select id="caption-language"><option value="en" ${captionLang==='en'?'selected':''}>${t('languageEN')}</option><option value="fr" ${captionLang==='fr'?'selected':''}>${t('languageFR')}</option></select></div>
    ${field('title','titleField','text','maxlength="300" required')}
    <h3 class="editor-section"><span>1</span>${t('stepDate')}</h3>
    <div class="field-row">${field('date','date','date',`min="${week}" max="${plusDays(week,6)}" required`)}${field('time','time','time','required')}</div><div id="edit-time-preview" class="editor-time-preview"></div>
    <h3 class="editor-section"><span>2</span>${t('stepBrief')}</h3>
    ${field('brief','brief','textarea','rows="3" maxlength="3000"')}
    ${draft.type==='story'?`${field('storyText','storyMessage','textarea','rows="7" maxlength="1100"')}<small class="editor-note">${t('storyMessageHint')}</small><div class="story-design-preview"><canvas id="story-preview" aria-label="Story française WillFit"></canvas><div><strong>${t('storyDesignTitle')}</strong><p>${t('storyDesignInfo')}</p><button class="button" id="download-story" type="button">${t('downloadStory')}</button><p class="editor-note" id="story-design-status"></p></div></div>`:''}
    <p class="editor-note">${sourceLabel(draft)?escape(sourceLabel(draft))+'. ':''}${external(draft.source,t('viewSource'))}</p>
    <h3 class="editor-section"><span>3</span>${t('stepCaption')}</h3>
    ${field('caption','caption','textarea','rows="9" maxlength="2200"')}
    <small id="caption-count" class="caption-count"></small><p class="editor-note">${t('captionHint')}</p>
    <h3 class="editor-section"><span>4</span>${t('stepMedia')}</h3>
    ${field('mediaUrl','media','url',`placeholder="${escape(t('mediaPlaceholder'))}" maxlength="2000"`)}
    ${draft.mediaUrl?external(draft.mediaUrl,t('openMedia')):''}
    ${field('note','notes','textarea',`rows="2" maxlength="3000" placeholder="${escape(t('notesPlaceholder'))}"`)}
    <p class="editor-note">${t('noAuto')}</p>`;
  $('caption-language').onchange=event=>{collectDraft();captionLang=event.target.value;renderEditor();};
  const count=()=>{$('caption-count').textContent=`${normalizeCaption($('edit-caption').value).length} / 2200 ${t('characters')}`;};
  $('edit-caption').oninput=count;count();
  $('edit-date').oninput=editorTimePreview;$('edit-time').oninput=editorTimePreview;editorTimePreview();
  $('copy-caption').textContent=t('copyFull');
  if(draft.type==='story'){
    const canvas=$('story-preview');
    const preview=()=>{collectDraft();renderStoryCanvas(canvas,editDraft).catch(error=>{$('story-design-status').textContent=error.message;});};
    $('edit-storyText').oninput=preview;preview();
    $('download-story').onclick=async()=>{collectDraft();try{await downloadStory(canvas,editDraft);}catch(error){$('story-design-status').textContent=error.message;}};
  }
}
async function saveEditor(event){
  event.preventDefault();collectDraft();const draft=editDraft;
  if(Object.values(draft.caption).some(value=>value.length>2200)){$('editor-error').textContent=t('tooLong');return;}
  if(draft.mediaUrl){try{if(new URL(draft.mediaUrl).protocol!=='https:')throw new Error();}catch{$('editor-error').textContent=t('invalidMedia');return;}}
  const button=event.submitter;button.disabled=true;
  try{await updateItem(draft.id,{title:draft.title,caption:draft.caption,brief:draft.brief,...(draft.type==='story'?{storyText:draft.storyText}:{}),date:draft.date,time:draft.time,mediaUrl:draft.mediaUrl,note:draft.note});$('editor').close();toast(t('saved'));}
  catch(error){$('editor-error').textContent=error.status===409?t('changesConflict'):t('saveError');}
  finally{button.disabled=false;}
}
async function copyCaption(){
  const full=normalizeCaption($('edit-caption').value);
  if(full.length>2200){$('editor-error').textContent=t('tooLong');return;}
  try{await navigator.clipboard.writeText(full);toast(t('copied'));}
  catch{const fallback=document.createElement('textarea');fallback.value=full;fallback.style.position='fixed';fallback.style.opacity='0';$('editor').append(fallback);fallback.select();try{if(!document.execCommand('copy'))throw new Error();toast(t('copied'));}catch{$('edit-caption').value=full;$('edit-caption').focus();$('edit-caption').select();toast(t('copyError'));}finally{fallback.remove();}}
}
function exportPlan(){
  if(!plan)return;
  const header=`WILLFIT — ${week}\nKinshasa (UTC+1) / WIB (UTC+7)\n${t('generated')}: ${plan.generatedAt}\n\n`;
  const body=plan.items.map(item=>{
    const clock=timePreview(item.date,item.time);
    return `${formatDate(item.date,{weekday:'long',day:'numeric',month:'long'})} · ${item.time} Kinshasa · ${clock.wib} WIB (${clock.wibDate})\n${t(item.type)} · ${item.title[lang]}\n${t(dateStatus(item.date))}\n\n${t('brief')}: ${item.brief[lang]}\n\n${item.type==='story'?t('storyMessage')+':\n'+(item.storyText?.[lang]||item.title[lang])+'\n\n':''}${normalizeCaption(item.caption[lang])}\n\n${t('media')}: ${item.mediaUrl||DRIVE}\n${t('notes')}: ${item.note}\n\n────────────────────────\n`;
  }).join('\n');
  const url=URL.createObjectURL(new Blob([header+body],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${t('exportName')}-${week}-${lang}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(t('downloaded'));
}
document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return;}
  const nav=event.target.closest('[data-view],[data-mode]');if(nav){setView(nav.dataset.view||nav.dataset.mode);return;}
  if(event.target.id==='retry-load')loadWeek();
  if(event.target.id==='enable-reminders'){if(pushClient.state().enabled)pushClient.disable();else pushClient.enable();}
  if(event.target.id==='test-reminders')pushClient.test().then(()=>{if(!pushClient.state().error)toast(t('reminderTestSent'));});
  if(event.target.id==='about-stats')$('stats-help').showModal();
});
for(const nextLang of ['en','fr'])$('lang-'+nextLang).onclick=()=>{
  if(editDraft&&$('editor').open)collectDraft();lang=nextLang;localStorage.setItem('wf-language',lang);render();if(editDraft&&$('editor').open)renderEditor();pushClient.syncLanguage();
};
function navigateWeek(delta){if(loading||mutating)return;const next=plusDays(week,delta);if(next<'2025-01-01'||next>'2035-12-31'){toast(t('weekLimit'));return;}week=next;loadWeek();}
$('prev-week').onclick=()=>navigateWeek(-7);$('next-week').onclick=()=>navigateWeek(7);$('today').onclick=()=>{if(!loading&&!mutating){week=mondayOf();loadWeek();}};
$('close-editor').onclick=()=>$('editor').close();$('editor').addEventListener('close',()=>{editDraft=null;if(pendingReminder)openReminderLink(pendingReminder);});
$('editor-form').onsubmit=saveEditor;$('copy-caption').onclick=copyCaption;$('export').onclick=exportPlan;$('close-stats-help').onclick=()=>$('stats-help').close();
$('access-form').onsubmit=async event=>{event.preventDefault();event.submitter.disabled=true;try{await api('/api/access',{method:'POST',body:JSON.stringify({code:$('team-code').value})});$('team-code').value='';$('access').close();await loadWeek();await pushClient.initialize();if(pendingReminder)await openReminderLink(pendingReminder);}catch{$('access-error').textContent=lang==='fr'?'Code incorrect ou accès indisponible. Réessayez.':'Incorrect code or access unavailable. Try again.';}finally{event.submitter.disabled=false;}};
async function init(){
  const initialLink=location.href;render();const params=new URLSearchParams(location.hash.slice(1));
  if(params.has('access')){const code=params.get('access');history.replaceState(null,'',location.pathname);try{await api('/api/access',{method:'POST',body:JSON.stringify({code})});}catch{}}
  await loadWeek();if(plan)await pushClient.initialize();await openReminderLink(initialLink);
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='willfit-open-reminder')openReminderLink(event.data.url);});
function refreshDay(){const current=kinshasaDate();if(current!==displayedDate){displayedDate=current;render();}}
window.addEventListener('pagehide',()=>pushClient.stop(),{once:true});
init();setInterval(()=>{updateClocks();refreshDay();},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshDay();});
setInterval(()=>{if(document.visibilityState==='visible'&&!$('editor').open&&!$('access').open&&!loading&&!mutating)loadWeek({quiet:true});},30000);
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [
    {name:'read_weekly_plan',description:'Read the loaded WillFit weekly plan.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async()=>({week:plan?.week,items:plan?.items||[]})}
  ]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
