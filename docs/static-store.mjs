import {generatePlan,validMonday,normalizeCaption,ENGINE} from './planner.mjs';
export function createStaticApi(storage){
  const key=week=>`wf-pages-plan-${week}`;
  function read(week){
    if(!validMonday(week))throw new Error('Invalid week');
    const fresh=generatePlan(week);let saved;
    try{saved=JSON.parse(storage.getItem(key(week))||'null');}catch{}
    if(saved?.engine===ENGINE)return {...saved,mode:'static'};
    if(saved?.items)fresh.items=fresh.items.map(item=>saved.items.find(old=>old.id===item.id&&old.version>0)||item);
    return {...fresh,mode:'static'};
  }
  return async(path,options={})=>{
    const url=new URL(path,'https://willfit.local');
    if(url.pathname==='/api/plan')return read(url.searchParams.get('week'));
    if(url.pathname.startsWith('/api/items/')&&options.method==='PATCH'){
      const id=decodeURIComponent(url.pathname.slice('/api/items/'.length));const week=id.slice(0,10),plan=read(week),item=plan.items.find(i=>i.id===id);
      if(!item)throw new Error('Content not found');
      const patch=JSON.parse(options.body);if(patch.version!==item.version)throw new Error('This item changed in another tab. Refresh and try again.');
      const next={...item,...patch,version:item.version+1};
      for(const language of ['fr','en'])next.caption[language]=normalizeCaption(next.caption[language]);
      plan.items=plan.items.map(i=>i.id===id?next:i);storage.setItem(key(week),JSON.stringify(plan));return next;
    }
    if(url.pathname==='/api/access')return {ok:true};
    throw new Error('Unavailable on this static dashboard');
  };
}
