import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePlan,holidaysForWeek,mondayOf,kinshasaDate,plusDays,validMonday,CONTACT,normalizeCaption,captionBody,timePreview,dayHasPassed} from '../public/planner.mjs';
test('Kinshasa changes date at 23:00 UTC and weeks start Monday',()=>{
  assert.equal(kinshasaDate(new Date('2026-10-11T23:01:00Z')),'2026-10-12');
  assert.equal(mondayOf('2026-10-11'),'2026-10-05');
  assert.equal(mondayOf('2026-10-12'),'2026-10-12');
  assert.equal(validMonday('2026-02-30'),false);
});
test('every supported week contains five bilingual feed items and seven daily stories',()=>{
  for(let week='2025-01-06';week<='2035-12-31';week=plusDays(week,7)){
    const plan=generatePlan(week);
    assert.equal(plan.items.length,12);
    assert.equal(plan.items.filter(i=>i.type==='story').length,7);
    assert.equal(plan.items.filter(i=>i.type==='reel'||i.type==='post').length,5);
    assert.equal(new Set(plan.items.map(i=>i.id)).size,12);
    for(const holiday of plan.holidays.filter(h=>!h.observed))assert.ok(plan.items.some(i=>i.type==='post'&&i.date===holiday.date&&i.title.en===holiday.en));
    for(const item of plan.items){
      assert.ok(item.date>=week && item.date<=plusDays(week,6));
      for(const language of ['en','fr']){assert.ok(item.caption[language].length>20);assert.ok(item.caption[language].length<=2200);assert.ok(item.title[language]);assert.ok(item.caption[language].endsWith(CONTACT));assert.equal(item.caption[language].split('📞').length,2);}
    }
  }
});
test('WIB previews include midnight and next-day dates',()=>{
  assert.deepEqual(timePreview('2026-10-08','09:00'),{kinshasa:'09:00',wib:'15:00',wibDate:'2026-10-08'});
  assert.deepEqual(timePreview('2026-10-08','18:00'),{kinshasa:'18:00',wib:'00:00',wibDate:'2026-10-09'});
  assert.deepEqual(timePreview('2026-12-31','23:30'),{kinshasa:'23:30',wib:'05:30',wibDate:'2027-01-01'});
});
test('contact footer is unique, formatted exactly and follows any hashtags',()=>{
  const old='Our caption\n\n📞 +243 834 230 727\n✉️ Contact@willfitgym.com\n🌐 www.willfitgym.com\n\n#WillFit';
  const caption=normalizeCaption(old);assert.equal(caption,'Our caption\n\n#WillFit'+CONTACT);
  assert.equal(normalizeCaption(caption),caption);assert.equal(captionBody(caption),'Our caption\n\n#WillFit');
});
test('podcast teasers describe future goals, while national days have matching stories',()=>{
  for(const week of ['2026-10-05','2026-10-12','2026-10-19','2026-10-26']){
    const plan=generatePlan(week),teaser=plan.items.find(i=>i.pillar==='podcast');assert.ok(teaser);assert.match(teaser.brief.en,/future goal/);assert.ok(plan.items.some(i=>i.sourceKind==='science'&&i.type==='story'));
  }
  const holidayPlan=generatePlan('2026-06-29');assert.ok(holidayPlan.items.some(i=>i.type==='story'&&i.sourceKind==='holiday'&&i.date==='2026-06-30'));
});
test('plans change formats and topics from week to week',()=>{
  const a=generatePlan('2026-10-05'),b=generatePlan('2026-10-12');
  assert.notDeepEqual(a.items.filter(i=>i.type!=='story').map(i=>i.type),b.items.filter(i=>i.type!=='story').map(i=>i.type));
  assert.notDeepEqual(a.items.map(i=>i.title),b.items.map(i=>i.title));
});
test('Sunday holiday leave is observed on Saturday, including across week boundaries',()=>{
  const holidays=holidaysForWeek('2026-05-11');
  assert.ok(holidays.some(h=>h.date==='2026-05-17'&&!h.observed));
  assert.ok(holidays.some(h=>h.date==='2026-05-16'&&h.observed));
  const january=holidaysForWeek('2025-12-29');
  assert.ok(january.some(h=>h.date==='2026-01-01'));
  assert.ok(january.some(h=>h.date==='2026-01-03'&&h.observed));
});
test('national-day feed content is scheduled on the actual day and preserves the total',()=>{
  const plan=generatePlan('2026-06-29');
  assert.ok(plan.items.some(i=>i.type==='post'&&i.date==='2026-06-30'&&i.title.en==='Independence Day'));
  assert.equal(plan.items.length,12);
});

test('automatic ticks follow the end of the Kinshasa day, not WIB or the posting hour',()=>{
  assert.equal(dayHasPassed('2026-10-08',new Date('2026-10-08T18:00:00Z')),false);
  assert.equal(dayHasPassed('2026-10-08',new Date('2026-10-08T22:59:59Z')),false);
  assert.equal(dayHasPassed('2026-10-08',new Date('2026-10-08T23:00:00Z')),true);
  assert.equal(dayHasPassed('2026-10-09',new Date('2026-10-08T23:00:00Z')),false);
});
test('each educational story has a concrete fact, practical example, engagement CTA and primary source',()=>{
  const titles=new Set();
  for(const week of ['2026-10-05','2026-10-12','2026-10-19']){
    for(const story of generatePlan(week).items.filter(item=>item.type==='story')){
      assert.equal(story.sourceKind,'science');
      assert.ok(['ods.od.nih.gov','www.who.int','www.cdc.gov'].includes(new URL(story.source).hostname));
      for(const language of ['en','fr']){
        assert.match(story.storyText[language],/🧠/);assert.match(story.storyText[language],/🍽️/);
        assert.match(story.storyText[language],/💬|📊/);
        assert.ok(story.storyText[language].length<=1100);
        assert.ok(story.caption[language].endsWith(CONTACT));
      }
      titles.add(story.title.en);
    }
    for(const item of generatePlan(week).items)for(const language of ['en','fr'])assert.match(item.caption[language],/💬|📊/);
  }
  assert.equal(titles.size,15);
});
