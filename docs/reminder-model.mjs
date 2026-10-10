import {timePreview} from './planner.mjs';
export function scheduledAt(item){return Date.parse(`${item.date}T${item.time}:00+01:00`);}
export function reminderSlot(item){return `${item.id}/${item.date}/${item.time}`;}
export function dueItems(items,now=new Date(),grace=600000){const timestamp=now.getTime();return items.filter(item=>{const due=scheduledAt(item);return due<=timestamp&&timestamp-due<grace;});}
export function notificationFor(item,language='fr'){
  const clock=timePreview(item.date,item.time);
  const format={fr:{reel:'Reel',post:'Publication',story:'Story'},en:{reel:'Reel',post:'Post',story:'Story'}}[language];
  return {title:language==='fr'?'WillFit · Il est temps de publier':'WillFit · Time to post',body:`${format[item.type]} · ${item.title[language]}\n${item.time} Kinshasa · ${clock.wib} WIB${clock.wibDate!==item.date?(language==='fr'?' (lendemain)':' (next day)'):''}`,tag:reminderSlot(item),url:`/#week=${encodeURIComponent(item.week)}&content=${encodeURIComponent(item.id)}`};
}
