export const DRIVE = 'https://drive.google.com/drive/folders/1TR7OV5HCtVFq6k1grZCa3V56-02-E3-m?usp=sharing';
export const SOURCES = {
  classes: 'https://willfitgym.com/pricing-page/',
  holidays: 'https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/118102/COD-118102.pdf',
  activity: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  nutrition: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
  inspiration: 'https://www.drjamesdinic.com/',
  instagram: 'https://www.instagram.com/drjamesdinic/'
};
export const CONTACT = '\n\n📞 +243 834 230 727\n✉️ 𝗖𝗼𝗻𝘁𝗮𝗰𝘁@𝘄𝗶𝗹𝗹𝗳𝗶𝘁𝗴𝘆𝗺.𝗰𝗼𝗺\n🌐 www.willfitgym.com';
export const ENGINE = 'editorial-library-v2';
export function normalizeCaption(value) {
  const body=String(value??'').replace(/\n*📞[^\n]*\n✉[^\n]*\n🌐[^\n]*/gu,'').trim();
  return body+CONTACT;
}
export function captionBody(value) { return normalizeCaption(value).slice(0,-CONTACT.length); }
export function timePreview(date,time) {
  const moment=new Date(`${date}T${time}:00+01:00`);
  return {kinshasa:time,wib:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(moment),wibDate:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(moment)};
}
export function nextHoliday(iso=kinshasaDate()) {
  return [Number(iso.slice(0,4)),Number(iso.slice(0,4))+1].flatMap(year=>HOLIDAYS.map(([md,fr,en])=>({date:`${year}-${md}`,fr,en}))).filter(h=>h.date>=iso).sort((a,b)=>a.date.localeCompare(b.date))[0];
}
const spacious=body=>body.replace(/([.!?])\s+(?=[A-ZÀ-Ÿ])/gu,'$1\n\n');
function willfitCaption(emoji,title,body,lang) {
  return normalizeCaption(`${emoji} ${title.toLocaleUpperCase(lang)} — WILLFIT 🇨🇩🔥\n\n${spacious(body)}\n\n${lang==='fr'?'🇨🇩 Chez WillFit, on apprend, on bouge et on avance ensemble ! 💪🏾':'🇨🇩 At WillFit, we learn, move and grow together! 💪🏾'}\n\n${lang==='fr'?'#WillFit #Kinshasa #CommunauteWillFit':'#WillFit #Kinshasa #WillFitCommunity'}`);
}
export function dateISO(date) { return date.toISOString().slice(0, 10); }
export function kinshasaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Kinshasa', year:'numeric', month:'2-digit', day:'2-digit'}).format(now);
}
export function plusDays(iso, days) { const d = new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return dateISO(d); }
export function mondayOf(iso = kinshasaDate()) { const day = new Date(iso+'T12:00:00Z').getUTCDay(); return plusDays(iso, -(day+6)%7); }
export function validMonday(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(new Date(iso+'T12:00:00Z').getTime()) && dateISO(new Date(iso+'T12:00:00Z'))===iso && mondayOf(iso)===iso && iso>='2025-01-01' && iso<='2035-12-31'; }
export const HOLIDAYS = [
  ['01-01','Nouvel An','New Year’s Day'],
  ['01-04','Journée des Martyrs de l’indépendance','Independence Martyrs’ Day'],
  ['01-16','Journée du héros national Laurent-Désiré Kabila','Laurent-Désiré Kabila Day'],
  ['01-17','Journée du héros national Patrice Emery Lumumba','Patrice Emery Lumumba Day'],
  ['04-06','Combat de Simon Kimbangu et conscience africaine','Simon Kimbangu and African Consciousness Day'],
  ['05-01','Fête du travail','Labour Day'],
  ['05-17','Journée des Forces armées','Armed Forces Day'],
  ['06-30','Journée de l’indépendance','Independence Day'],
  ['08-01','Fête des parents','Parents’ Day'],
  ['12-25','Noël','Christmas Day']
];
export function holidaysForWeek(week) {
  const out=[];
  for(const year of new Set([week.slice(0,4),plusDays(week,6).slice(0,4)])) for(const [md,fr,en] of HOLIDAYS) {
    const date=`${year}-${md}`;
    if(date>=week && date<=plusDays(week,6)) out.push({date,fr,en,observed:false});
    if(new Date(date+'T12:00:00Z').getUTCDay()===0) {
      const observed=plusDays(date,-1);
      if(observed>=week && observed<=plusDays(week,6))out.push({date:observed,fr:fr+' · congé observé',en:en+' · observed holiday',observed:true});
    }
  }
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
// Each entry is original WillFit copy. These are not quotations or endorsements.
// Themes are broad wellness education; no supplements, disease claims or dosing advice.
const feed = [
  ['workout','💪🏾','Votre premier squat','Your first squat',
   'Placez les pieds à une largeur confortable. Reculez les hanches, pliez les genoux et remontez doucement. Une chaise peut vous servir de repère. Commencez avec quelques répétitions confortables. Le mouvement se construit, étape par étape. 🏋🏾‍♀️',
   'Stand with your feet comfortably apart. Move your hips back, bend your knees and stand up slowly. Use a chair as a guide. Start with a few comfortable repetitions. Build your movement, one step at a time. 🏋🏾‍♀️',
   'Filmer de face puis de profil : position, descente, remontée. Ajouter les trois repères en texte. Demander au coach de valider la technique.',
   'Film front and side views: setup, lowering, standing. Add the three cues as text. Have the coach check the technique.'],
  ['education','🧠','Bouger fait du bien','Movement helps you feel good',
   'Bouger régulièrement soutient votre santé physique et mentale. Une marche, une danse ou une séance adaptée : chaque mouvement compte. Pas besoin de tout changer aujourd’hui. Choisissez une petite action et commencez. 🌱',
   'Regular movement supports physical and mental health. A walk, a dance or a session that suits you: every movement counts. You don’t need to change everything today. Choose one small action and start. 🌱',
   'Créer 4 slides : chaque mouvement compte, santé physique, bien-être mental, votre petite action du jour. Éviter les promesses de résultats.',
   'Create 4 slides: every movement counts, physical health, mental wellbeing, your small action today. Avoid guaranteed results.'],
  ['habit','🚶🏾','Une pause qui bouge','Make your break a moving one',
   'Vous passez beaucoup de temps assis(e) ? Faites une courte pause pour marcher ou vous étirer confortablement. Quelques minutes peuvent être un bon point de départ pour réduire le temps assis. Votre prochaine pause, on la fait en mouvement ? 👀',
   'Spend a lot of time sitting? Take a short break to walk or stretch comfortably. A few minutes can be a useful starting point for reducing sitting time. Shall we make your next break a moving one? 👀',
   'Montrer une personne qui se lève, marche puis mobilise doucement les épaules. Texte : votre prochaine pause.',
   'Show someone standing up, walking and gently moving their shoulders. Overlay: your next break.'],
  ['community','🤝🏾','Votre petite victoire','Your small win',
   'Une première séance. Une répétition de plus. Le courage de revenir. Vos petites victoires ont leur place ici. Chez WillFit, on avance ensemble, à notre rythme. Quelle est votre victoire de la semaine ? 💛',
   'A first session. One more repetition. The courage to come back. Your small wins belong here. At WillFit, we move forward together, at our own pace. What is your win this week? 💛',
   'Photographier un moment d’équipe avec le consentement des membres. Inviter à raconter une petite victoire, sans données personnelles.',
   'Photograph a team moment with members’ consent. Invite small wins without sharing personal details.'],
  ['classes','💃🏾','Zumba : bougez en rythme','Zumba: move to the rhythm',
   'De la musique, du mouvement et une énergie collective : découvrez la Zumba chez WillFit. Pas besoin de connaître tous les pas pour commencer. Venez apprendre, bouger et partager un bon moment. Qui vient avec vous ? 🔥',
   'Music, movement and shared energy: discover Zumba at WillFit. You don’t need to know every step to start. Come learn, move and enjoy the moment. Who is joining you? 🔥',
   'Filmer 3 moments de Zumba : accueil, mouvement simple, énergie du groupe. Confirmer le prochain horaire avec l’équipe avant de publier.',
   'Film 3 Zumba moments: welcome, a simple movement, group energy. Confirm the next class time with the team before publishing.'],
  ['workout','🏋🏾','Pompes au mur, premier pas','Wall push-ups, first step',
   'Placez les mains sur un mur à hauteur confortable. Gardez le corps aligné, pliez les coudes puis repoussez doucement. Adaptez la distance au mur à votre niveau. Commencez avec quelques répétitions sans douleur et demandez conseil à un coach. 💪🏾',
   'Place your hands on a wall at a comfortable height. Keep your body aligned, bend your elbows and push back gently. Adjust your distance from the wall to your level. Start with a few pain-free repetitions and ask a coach for guidance. 💪🏾',
   'Plan de profil, démonstration lente, 3 repères à l’écran. Faire valider par le coach.',
   'Side view, slow demonstration, 3 on-screen cues. Get a coach’s technique check.'],
  ['education','🥬','La variété dans votre assiette','Variety on your plate',
   'Fruits, légumes, légumineuses et céréales complètes : une alimentation variée aide à couvrir vos besoins. Commencez par ajouter de la variété à un repas que vous aimez déjà. Quelle couleur ajoutez-vous dans votre assiette aujourd’hui ? 🍽️',
   'Fruit, vegetables, pulses and whole grains: a varied diet helps meet your needs. Start by adding variety to a meal you already enjoy. What colour are you adding to your plate today? 🍽️',
   'Carrousel de 4 slides : variété, légumes, légumineuses, petite action. Utiliser des exemples accessibles localement.',
   '4-slide carousel: variety, vegetables, pulses, a small action. Use locally accessible examples.'],
  ['habit','📅','Un rendez-vous avec vous-même','Make time for yourself',
   'Une habitude commence souvent par un rendez-vous simple. Choisissez un moment réaliste pour bouger et notez-le. Une séance courte adaptée à votre niveau peut être votre point de départ. À quel moment allez-vous prendre soin de vous cette semaine ? 💛',
   'A habit often starts with one simple appointment. Choose a realistic time to move and write it down. A short session suited to your level can be your starting point. When will you make time for yourself this week? 💛',
   'Filmer un calendrier, la préparation du sac puis l’entrée à la salle. Terminer par une question.',
   'Film a calendar, packing a gym bag and arriving at the gym. End with a question.'],
  ['community','🇨🇩','Kinshasa, on avance ensemble','Kinshasa, we move together',
   'Notre communauté se construit à chaque séance : un encouragement, un sourire, une nouvelle rencontre. Que vous débutiez ou que vous reveniez, vous avez votre place chez WillFit. Identifiez la personne qui vous motive à bouger ! 🤝🏾',
   'Our community grows with every session: encouragement, a smile, a new connection. Whether you’re starting or coming back, you belong at WillFit. Tag the person who motivates you to move! 🤝🏾',
   'Montage de moments authentiques à la salle, avec consentement. Ne pas identifier un membre sans son accord.',
   'Edit authentic gym moments with consent. Don’t tag members without their agreement.'],
  ['classes','🥊','Découvrez la boxe','Discover boxing',
   'Coordination, technique et concentration : découvrez la boxe avec l’accompagnement de nos coachs. Commencez par les bases et progressez à votre rythme. Envie d’essayer ? Contactez l’équipe pour connaître les séances disponibles. 🔥',
   'Coordination, technique and focus: discover boxing with guidance from our coaches. Start with the basics and progress at your own pace. Want to try? Contact the team for available sessions. 🔥',
   'Filmer garde, déplacement et travail technique encadré. Faire confirmer les disponibilités, sans inventer d’horaire.',
   'Film stance, footwork and supervised technique. Confirm availability; do not invent a timetable.'],
  ['workout','🧘🏾','Réveillez vos épaules','Wake up your shoulders',
   'Avant une séance, prenez le temps de mettre votre corps en mouvement. Faites de petits cercles d’épaules, puis des mouvements de bras lents et confortables. Restez dans une amplitude sans douleur. Votre coach peut vous aider à adapter votre échauffement. 🌱',
   'Before a session, take time to get your body moving. Try small shoulder circles, then slow, comfortable arm movements. Stay within a pain-free range. Your coach can help adapt your warm-up. 🌱',
   'Démonstration lente de 2 mouvements validés par un coach. Montrer une amplitude confortable.',
   'Slow demonstration of 2 coach-checked movements. Show a comfortable range.'],
  ['education','🌱','Chaque mouvement compte','Every movement counts',
   'Marcher pour un trajet, danser à la maison, prendre les escaliers si cela vous convient : l’activité physique ne se limite pas à la salle. Construisez une journée un peu plus active, à votre rythme. Quel mouvement choisirez-vous aujourd’hui ? 🚶🏾',
   'Walking for a trip, dancing at home, taking the stairs if they suit you: physical activity goes beyond the gym. Build a slightly more active day at your own pace. What movement will you choose today? 🚶🏾',
   '3 scènes du quotidien avec un message final : votre mouvement du jour. Adapter à différents niveaux.',
   '3 everyday scenes with a closing message: your movement today. Adapt for different abilities.'],
  ['habit','💧','Préparez votre séance','Prepare for your session',
   'Une tenue confortable, une bouteille d’eau et un objectif réaliste : préparez les essentiels avant de venir. Pour une séance adaptée, parlez de votre niveau et de vos besoins à votre coach. Quel est votre indispensable dans votre sac de sport ? 🎒',
   'Comfortable clothes, a water bottle and a realistic goal: prepare your essentials before coming in. For a session that suits you, tell your coach about your level and needs. What is your gym-bag essential? 🎒',
   'Flat lay des essentiels ou courte vidéo de préparation. Pas de recommandation de supplément.',
   'Flat lay of essentials or a short packing video. No supplement recommendations.'],
  ['community','👏🏾','Encouragez quelqu’un aujourd’hui','Encourage someone today',
   'Un petit encouragement peut changer une séance. Soutenez la personne à côté de vous, célébrez un effort, partagez votre énergie. Chez WillFit, la force se construit aussi ensemble. Qui mérite un encouragement aujourd’hui ? 💛',
   'A little encouragement can change a session. Support the person next to you, celebrate an effort, share your energy. At WillFit, strength grows together too. Who deserves encouragement today? 💛',
   'Capturer un encouragement entre membres consentants. Miser sur l’effort, sans comparaison de corps.',
   'Capture encouragement between consenting members. Focus on effort without comparing bodies.'],
  ['classes','🔥','Fat Burning : l’énergie du groupe','Fat Burning: group energy',
   'Découvrez notre cours Fat Burning : du mouvement et une équipe pour vous accompagner. Adaptez l’intensité avec le coach et progressez à votre rythme. Prêt(e) à découvrir l’ambiance ? Contactez-nous pour le prochain cours. 💪🏾',
   'Discover our Fat Burning class: movement and a team to guide you. Adapt the intensity with your coach and progress at your own pace. Ready to experience the atmosphere? Contact us for the next class. 💪🏾',
   'Filmer un mouvement avec son adaptation, puis l’ambiance collective. Ne promettre ni perte de poids ni dépense calorique.',
   'Film a movement and its adapted option, then the group atmosphere. No weight-loss or calorie promises.'],
  ['workout','🚶🏾','Commencez par une marche','Start with a walk',
   'Une marche à une allure confortable peut être une façon simple de bouger. Choisissez un trajet adapté et augmentez progressivement selon votre niveau. Pas besoin de comparer votre rythme : votre départ vous appartient. Qui vous accompagne ? 🌍',
   'A walk at a comfortable pace can be a simple way to move. Choose a suitable route and progress gradually for your level. There’s no need to compare your pace: your start belongs to you. Who is joining you? 🌍',
   'Filmer une marche courte dans un lieu sûr. Texte : choisissez votre rythme. Ne pas utiliser de distance imposée.',
   'Film a short walk in a safe place. Overlay: choose your pace. Do not prescribe a fixed distance.'],
  ['education','🏋🏾‍♀️','La force au quotidien','Strength for everyday life',
   'Porter, se lever, monter : nos muscles participent à nos gestes quotidiens. Le renforcement adapté fait partie d’une vie active. Commencez avec l’aide d’un coach et choisissez des mouvements qui vous conviennent. Quel geste voulez-vous rendre plus facile ? 💪🏾',
   'Carrying, standing up, climbing: our muscles support everyday movement. Suitable strength training is part of an active life. Start with a coach’s guidance and choose movements that suit you. Which everyday action would you like to make easier? 💪🏾',
   'Carrousel : gestes quotidiens, mouvements adaptés, accompagnement, question. Éviter toute promesse médicale.',
   'Carousel: everyday actions, adapted movements, guidance, question. Avoid medical promises.'],
  ['habit','🔄','Revenir, c’est déjà avancer','Coming back is progress',
   'Vous avez manqué une séance ? Reprenez avec une étape réaliste, sans chercher à tout rattraper. La régularité se construit sur la durée. Préparez votre prochain petit rendez-vous avec le mouvement. On vous retrouve chez WillFit ? 💛',
   'Missed a session? Restart with a realistic step without trying to catch up all at once. Consistency grows over time. Plan your next small appointment with movement. See you at WillFit? 💛',
   'Visuel simple : recommencer, adapter, continuer. Ne pas culpabiliser les membres.',
   'Simple visual: restart, adapt, continue. Avoid making members feel guilty.'],
  ['community','🙌🏾','Votre première séance ensemble','Your first session together',
   'Un nouveau départ est plus doux quand on se sent accueilli(e). Nos coachs et notre communauté sont là pour vous accompagner. Posez vos questions, découvrez les espaces et avancez à votre rythme. Quelle question poseriez-vous avant votre première séance ? 👀',
   'A new start feels easier when you feel welcome. Our coaches and community are here to guide you. Ask questions, explore the gym and go at your own pace. What would you ask before your first session? 👀',
   'Mini visite guidée avec un coach. Répondre à une question fréquente validée par l’équipe.',
   'Mini gym tour with a coach. Answer one common question verified by the team.'],
  ['classes','🍑','Glutecamp : découvrez le cours','Glutecamp: discover the class',
   'Découvrez Glutecamp chez WillFit et laissez nos coachs vous guider. Technique, mouvements adaptés et énergie du groupe : votre progression commence avec les bases. Contactez l’équipe pour les informations du prochain cours. 🔥',
   'Discover Glutecamp at WillFit and let our coaches guide you. Technique, adapted movements and group energy: your progress starts with the basics. Contact the team for the next class details. 🔥',
   'Présentation du coach puis un mouvement et son adaptation. Confirmer le cours avant publication.',
   'Introduce the coach, then a movement and its adaptation. Confirm the class before publishing.']
];
const storyIdeas=[
  ['Une petite action répétée construit une habitude.','A small action repeated builds a habit.','Quel petit pas aujourd’hui ?','What small step today?'],
  ['Bougez pour prendre soin de vous, à votre rythme.','Move to care for yourself, at your own pace.','Marche ou danse ?','Walk or dance?'],
  ['Ajoutez de la variété à votre assiette.','Add variety to your plate.','Votre légume préféré ?','Your favourite vegetable?'],
  ['La récupération a sa place dans votre routine.','Recovery belongs in your routine.','Comment prenez-vous une pause ?','How do you take a break?'],
  ['Votre progression n’a pas besoin de ressembler à celle des autres.','Your progress doesn’t have to look like anyone else’s.','Votre petite victoire ?','Your small win?'],
  ['Préparez vos essentiels, puis faites le premier pas.','Prepare your essentials, then take the first step.','Votre sac est prêt ?','Is your bag ready?'],
  ['Une journée active commence parfois par une courte marche.','An active day sometimes starts with a short walk.','Votre moment pour marcher ?','When will you walk?'],
  ['Faites de votre bien-être un rendez-vous régulier.','Make your wellbeing a regular appointment.','Votre prochain rendez-vous ?','Your next appointment?'],
  ['Votre corps mérite du mouvement et du repos.','Your body deserves movement and rest.','Votre pause du jour ?','Your break today?'],
  ['Ensemble, une séance devient un moment de communauté.','Together, a session becomes a community moment.','Qui vient avec vous ?','Who is joining you?'],
  ['Commencez simplement. Adaptez. Continuez.','Start simply. Adapt. Continue.','Prêt(e) pour un petit départ ?','Ready for a small start?'],
  ['Chaque repas est une occasion d’ajouter de la variété.','Every meal is a chance to add variety.','Une couleur dans votre assiette ?','A colour on your plate?'],
  ['Le meilleur point de départ est celui qui vous convient.','A good starting point is one that suits you.','Votre premier mouvement ?','Your first movement?'],
  ['Encourager les autres fait aussi grandir notre communauté.','Encouraging others helps our community grow.','Identifiez votre partenaire.','Tag your training partner.'],
  ['Une séance manquée ne définit pas votre parcours.','One missed session does not define your journey.','On recommence ensemble ?','Shall we restart together?']
];
const pillars=['workout','education','habit','community','classes'];
export function generatePlan(week, now = new Date()) {
  if(!validMonday(week))throw new Error('Invalid week');
  const n=Math.floor((Date.parse(week+'T12:00:00Z')-Date.parse('2025-01-06T12:00:00Z'))/604800000);
  const cycle=((n%4)+4)%4;
  const patterns=[[0,1,2,4,5],[0,2,3,4,6],[1,2,3,5,6],[0,1,3,4,5]];
  const days=[...patterns[cycle]];
  const holidays=holidaysForWeek(week);
  const nationalOffsets=holidays.filter(h=>!h.observed).map(h=>Math.round((Date.parse(h.date)-Date.parse(week))/86400000));
  for(const holiday of holidays.filter(h=>!h.observed)) {
    const offset=Math.round((Date.parse(holiday.date)-Date.parse(week))/86400000);
    if(!days.includes(offset)) { const eligible=days.map((day,i)=>({day,i})).filter(({day})=>!nationalOffsets.includes(day)).sort((a,b)=>Math.abs(a.day-offset)-Math.abs(b.day-offset)); days[eligible[0].i]=offset; }
  }
  days.sort((a,b)=>a-b);
  const items=days.map((day,i)=>{
    const pillar=pillars[(i+cycle)%5];
    const entry=feed.filter(f=>f[0]===pillar)[Math.floor(n/4)%4];
    const [_,emoji,titleFr,titleEn,bodyFr,bodyEn,briefFr,briefEn]=entry;
    const type=(i+cycle)%2===0?'reel':'post';
    const prefixFr=type==='reel'?'Reel vertical 9:16, 20–35 secondes. Accroche, séquence, question finale. Adapter les slides en séquences à l’écran. ':'Publication 4:5, photo ou carrousel. Utiliser des images fixes des démonstrations et des repères lisibles. ';
    const prefixEn=type==='reel'?'Vertical 9:16 reel, 20–35 seconds. Hook, sequence, closing question. Adapt slides into on-screen sequences. ':'4:5 post, photo or carousel. Use still frames of demonstrations with readable cues. ';
    return {id:`${week}-feed-${i}`,week,date:plusDays(week,day),time:i%2?'18:00':'12:30',type,pillar,title:{fr:titleFr,en:titleEn},caption:{fr:willfitCaption(emoji,titleFr,bodyFr,'fr'),en:willfitCaption(emoji,titleEn,bodyEn,'en')},brief:{fr:prefixFr+briefFr,en:prefixEn+briefEn},posted:false,mediaUrl:'',note:'',version:0,source:pillar==='education'?(titleEn==='Variety on your plate'?SOURCES.nutrition:SOURCES.activity):pillar==='classes'?SOURCES.classes:SOURCES.activity};
  });
  // National days replace a normal feed item, keeping the weekly total at five.
  for(const holiday of holidays.filter(h=>!h.observed)){
    const item=items.find(it=>it.date===holiday.date); if(!item)continue;
    item.type='post';item.pillar='community';item.title={fr:holiday.fr,en:holiday.en};item.source=SOURCES.holidays;item.sourceKind='holiday';
    const memorial=['01-04','01-16','01-17','04-06','05-17'].includes(holiday.date.slice(5));
    item.caption=memorial?{
      fr:`🇨🇩 ${holiday.fr.toLocaleUpperCase('fr')}\n\nAujourd’hui, nous prenons un moment de mémoire et de respect. La communauté WillFit s’associe à cette journée nationale.\n\nEnsemble, avec dignité et solidarité.`+CONTACT,
      en:`🇨🇩 ${holiday.en.toUpperCase()}\n\nToday, we take a moment for remembrance and respect. The WillFit community joins in observing this national day.\n\nTogether, with dignity and solidarity.`+CONTACT
    }:{fr:`🇨🇩 ${holiday.fr.toLocaleUpperCase('fr')} — ENSEMBLE AVEC WILLFIT 💛\n\nEn cette journée, célébrons ce qui nous rassemble : notre communauté, nos proches et l’envie d’avancer ensemble.\n\nLa communauté WillFit vous souhaite une belle journée à Kinshasa ! 💪🏾`+CONTACT,en:`🇨🇩 ${holiday.en.toUpperCase()} — TOGETHER WITH WILLFIT 💛\n\nToday, let’s celebrate what brings us together: our community, our loved ones and the wish to move forward together.\n\nThe WillFit community wishes you a lovely day in Kinshasa! 💪🏾`+CONTACT};
    item.brief={fr:'Visuel sobre aux couleurs de WillFit. Valider le message avec l’équipe. Ne pas annoncer de fermeture sans confirmation.',en:'Use a considered WillFit brand graphic. Review the message with the team. Do not announce a closure without confirmation.'};
  }
  const podcast=items.find(it=>it.pillar==='community'&&it.sourceKind!=='holiday')||items.find(it=>it.pillar==='habit'&&it.sourceKind!=='holiday')||items.find(it=>it.sourceKind!=='holiday');
  const podcastTopics=[
    ['Un futur podcast, avec vous','A future podcast, with you','Un podcast WillFit fait partie de nos projets pour la suite. Nous aimerions y donner une place à vos questions, vos expériences et votre énergie. 🎙️\n\n💬 Entraînement, habitudes, communauté : quel sujet voudriez-vous entendre ?','A WillFit podcast is one of our future goals. We’d love to make room for your questions, experiences and energy. 🎙️\n\n💬 Training, habits, community: what would you want to hear about?'],
    ['Vos questions aux coachs','Your questions for our coaches','Et si vos questions devenaient le point de départ d’un futur podcast WillFit ? 👀\n\nC’est un projet que nous aimerions construire avec notre communauté. Pas d’épisode annoncé pour le moment : on commence par vous écouter. 💛\n\n💬 Quelle question aimeriez-vous poser à nos coachs ?','What if your questions became the starting point for a future WillFit podcast? 👀\n\nIt’s a goal we’d love to build with our community. No episode has been announced yet: first, we’re listening to you. 💛\n\n💬 What would you like to ask our coaches?'],
    ['Votre histoire mérite d’être entendue','Your story deserves to be heard','Une première séance, une habitude qui change, un encouragement qui compte… notre communauté a des histoires à partager. 🤝🏾\n\nUn futur podcast fait partie des idées WillFit. Nous réfléchissons à la place que pourraient y prendre vos parcours. 🎙️\n\n💬 Quel type d’histoire aimeriez-vous écouter ?','A first session, a new habit, encouragement that matters… our community has stories to share. 🤝🏾\n\nA future podcast is among WillFit’s ideas. We’re thinking about how your journeys could be part of it. 🎙️\n\n💬 What kind of story would you like to hear?'],
    ['Des idées pour notre futur podcast','Ideas for our future podcast','Apprendre, bouger, échanger : voilà l’esprit WillFit. 💪🏾\n\nPour notre projet de futur podcast, nous commençons par une question toute simple. 🎙️\n\n💬 Vous préféreriez des discussions avec les coachs, des témoignages de membres ou des idées pratiques ? Dites-nous en commentaire !','Learn, move, connect: that’s the WillFit spirit. 💪🏾\n\nFor our future podcast goal, we’re starting with one simple question. 🎙️\n\n💬 Would you prefer coach conversations, member stories or practical ideas? Tell us in the comments!']
  ][cycle];
  if(podcast){
    const [fr,en,bodyFr,bodyEn]=podcastTopics;
    Object.assign(podcast,{pillar:'podcast',sourceKind:'podcast',title:{fr,en},caption:{fr:willfitCaption('🎙️',fr,bodyFr,'fr'),en:willfitCaption('🎙️',en,bodyEn,'en')},source:'https://www.instagram.com/willfit__gym/',brief:{fr:'Teaser de projet futur. Aucun épisode ni date de lancement annoncé. '+(podcast.type==='reel'?'Vidéo verticale : coach posant la question, sous-titres, invitation à commenter.':'Visuel noir et jaune avec la question du jour, ou carrousel de sujets proposés.')+' Recueillir les idées de la communauté.',en:'Teaser for a future goal. No episode or launch date has been announced. '+(podcast.type==='reel'?'Vertical video: coach asking the question, subtitles, invitation to comment.':'Black-and-yellow graphic with the question, or carousel of suggested topics.')+' Gather community ideas.'}});
  }
  const storyDays=[0,1,2,3,4];
  for(const offset of nationalOffsets)if(!storyDays.includes(offset)){const eligible=storyDays.map((day,i)=>({day,i})).filter(({day})=>!nationalOffsets.includes(day)).sort((a,b)=>Math.abs(a.day-offset)-Math.abs(b.day-offset));storyDays[eligible[0].i]=offset;}
  storyDays.sort((a,b)=>a-b);
  for(let i=0;i<5;i++){
    const s=storyIdeas[((n*5+i)%storyIdeas.length+storyIdeas.length)%storyIdeas.length];
    const date=plusDays(week,storyDays[i]);
    const holiday=holidays.find(h=>h.date===date&&!h.observed);
    const holidayFeed=holiday&&items.find(it=>it.sourceKind==='holiday'&&it.date===date);
    items.push({id:`${week}-story-${i}`,week,date,time:'09:00',type:'story',pillar:holiday?'community':'education',sourceKind:holiday?'holiday':'drjames',title:holiday?{fr:holiday.fr,en:holiday.en}:{fr:s[0],en:s[1]},caption:holidayFeed?{...holidayFeed.caption}:{fr:willfitCaption('💛',s[0],s[2],'fr'),en:willfitCaption('💛',s[1],s[3],'en')},brief:{fr:holiday?'Story 9:16 pour cette journée nationale. Visuel sobre, respectueux ; ne pas annoncer de fermeture.':'Story 9:16. Mettre le message principal sur un fond noir avec accent jaune, ajouter un sticker question. La légende complète est prête à copier. Inspiration : thèmes de bien-être du site de Dr James ; texte original WillFit, pas une citation.',en:holiday?'9:16 story for this national day. Use a respectful graphic; do not announce a closure.':'9:16 story. Put the main message on black with a yellow accent and add a question sticker. The full caption is ready to copy. Inspiration: wellness themes on Dr James’s website; original WillFit writing, not a quotation.'},source:holiday?SOURCES.holidays:SOURCES.inspiration,posted:false,mediaUrl:'',note:'',version:0});
  }
  return {week,generatedAt:now.toISOString(),engine:ENGINE,holidays,items:items.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))};
}
