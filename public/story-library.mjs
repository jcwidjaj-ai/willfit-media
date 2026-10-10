// Original bilingual educational copy. Each factual claim links to its primary source.
const nih=topic=>`https://ods.od.nih.gov/factsheets/${topic}-Consumer/`;
const who='https://www.who.int/news-room/fact-sheets/detail/healthy-diet';
const cdc='https://www.cdc.gov/physical-activity-basics/benefits/index.html';
const story=(source,fr,en)=>({source,title:{fr:fr[0],en:en[0]},fact:{fr:fr[1],en:en[1]},tip:{fr:fr[2],en:en[2]},cta:{fr:fr[3],en:en[3]}});
export const storyIdeas=[
  story(nih('Iron'),
    ['Le fer transporte l’oxygène','Le fer aide l’hémoglobine à transporter l’oxygène des poumons vers le corps.','Dans l’assiette : haricots, lentilles, viande ou poisson.','💬 Répondez à cette story : haricots ou lentilles, lequel cuisinez-vous ?'],
    ['Iron carries oxygen','Iron helps haemoglobin carry oxygen from your lungs around your body.','On your plate: beans, lentils, meat or fish.','💬 Reply to this story: beans or lentils—which do you cook?']),
  story(who,
    ['Les glucides sont un carburant','Les glucides sont une source principale d’énergie pour le corps.','Variez leurs sources : céréales complètes, fruits, légumes et légumineuses.','💬 Répondez : fruit ou céréales complètes au petit-déjeuner ?'],
    ['Carbohydrates are fuel','Carbohydrates are a main source of energy for your body.','Vary your sources: whole grains, fruit, vegetables and pulses.','💬 Reply: fruit or whole grains at breakfast?']),
  story(nih('Calcium'),
    ['Le calcium aide aussi vos muscles','Le calcium contribue à la structure des os et permet aux muscles de bouger.','Sources alimentaires : lait, yaourt ou sardines en conserve avec leurs arêtes.','💬 Répondez : quelle source de calcium avez-vous dans votre cuisine ?'],
    ['Calcium helps your muscles too','Calcium supports bone structure and helps muscles move.','Food sources: milk, yoghurt or canned sardines with their bones.','💬 Reply: which calcium source is in your kitchen?']),
  story(nih('Magnesium'),
    ['Magnésium : muscles et nerfs','Le magnésium participe au fonctionnement des muscles et des nerfs.','Ajoutez des haricots, des arachides ou des légumes verts à un repas.','💬 Répondez : arachides ou haricots aujourd’hui ?'],
    ['Magnesium: muscles and nerves','Magnesium helps muscles and nerves function.','Add beans, peanuts or leafy greens to a meal.','💬 Reply: peanuts or beans today?']),
  story(cdc,
    ['Bouger peut aider à mieux dormir','Une activité physique régulière peut améliorer le sommeil.','Choisissez un moment réaliste pour une marche ou une séance adaptée.','💬 Répondez : vous préférez bouger le matin ou en fin de journée ?'],
    ['Movement can support better sleep','Regular physical activity can improve sleep.','Choose a realistic time for a walk or a session that suits you.','💬 Reply: do you prefer moving in the morning or later in the day?']),
  story(nih('Iron'),
    ['Haricots + tomate : un duo utile','La vitamine C aide le corps à absorber le fer des aliments végétaux.','Associez haricots ou lentilles à de la tomate, du poivron ou un agrume.','💬 Répondez : quelle association allez-vous essayer à votre prochain repas ?'],
    ['Beans + tomato: a useful pairing','Vitamin C helps your body absorb iron from plant foods.','Pair beans or lentils with tomato, sweet pepper or citrus fruit.','💬 Reply: which pairing will you try at your next meal?']),
  story(who,
    ['Sans sucre ajouté ≠ sans sucres libres','Même sans sucre ajouté, les jus de fruits contiennent souvent beaucoup de sucres libres.','Pour votre prochaine collation, choisissez un fruit entier plutôt qu’un jus.','💬 Répondez : connaissiez-vous la différence ? Oui / Je découvre'],
    ['No added sugar ≠ no free sugars','Even without added sugar, fruit juice often contains substantial free sugars.','For your next snack, choose whole fruit instead of juice.','💬 Reply: did you know the difference? Yes / New to me']),
  story(nih('VitaminD'),
    ['Vitamine D : partenaire du calcium','La vitamine D aide le corps à absorber le calcium.','Le poisson gras et certains aliments enrichis en apportent. Vérifiez l’étiquette.','💬 Répondez : avez-vous déjà repéré « vitamine D » sur une étiquette ?'],
    ['Vitamin D: calcium’s partner','Vitamin D helps your body absorb calcium.','Oily fish and some fortified foods provide it. Check the label.','💬 Reply: have you spotted “vitamin D” on a food label?']),
  story(nih('VitaminB12'),
    ['B12 : utile au sang et aux nerfs','La vitamine B12 aide à maintenir les cellules du sang et les cellules nerveuses en bonne santé.','Poisson, œufs et produits laitiers en contiennent naturellement.','💬 Répondez : poisson ou œufs dans votre prochain repas ?'],
    ['B12: supporting blood and nerves','Vitamin B12 helps keep blood cells and nerve cells healthy.','Fish, eggs and dairy foods naturally contain it.','💬 Reply: fish or eggs in your next meal?']),
  story(cdc,
    ['Vos muscles répondent au renforcement','Les exercices de renforcement aident à maintenir ou augmenter la masse et la force musculaires.','Demandez au coach un mouvement adapté, puis progressez graduellement.','💬 Répondez : quel mouvement voulez-vous apprendre avec un coach ?'],
    ['Your muscles respond to strength training','Strength exercises help maintain or increase muscle mass and strength.','Ask a coach for a suitable movement, then progress gradually.','💬 Reply: which movement would you like to learn with a coach?']),
  story(who,
    ['Les protéines font plus que les muscles','Les protéines servent à construire des structures comme les muscles, ainsi que des hormones et des enzymes.','Variez les sources : légumineuses, poisson, œufs ou viande.','💬 Répondez : quelle source de protéines préférez-vous préparer ?'],
    ['Protein does more than build muscle','Protein builds structures such as muscles, as well as hormones and enzymes.','Vary your sources: pulses, fish, eggs or meat.','💬 Reply: which protein source do you most enjoy preparing?']),
  story(nih('Calcium'),
    ['Boisson végétale : regardez l’étiquette','Certaines boissons végétales sont enrichies en calcium ; vérifiez l’étiquette du produit.','Au magasin, cherchez la mention « calcium » avant de choisir.','💬 Répondez : avez-vous déjà comparé deux étiquettes ?'],
    ['Plant drinks: check the label','Some plant drinks are fortified with calcium; check the product label.','At the shop, look for calcium on the label before choosing.','💬 Reply: have you ever compared two food labels?']),
  story(nih('VitaminD'),
    ['Vitamine D : aussi pour les nerfs','La vitamine D participe au fonctionnement des muscles et des nerfs.','Pour les sources alimentaires, pensez au poisson gras ou aux aliments enrichis.','💬 Répondez : saviez-vous qu’elle avait aussi ce rôle ? Oui / Non'],
    ['Vitamin D supports nerves too','Vitamin D supports muscle and nerve function.','For food sources, consider oily fish or fortified foods.','💬 Reply: did you know it had this role too? Yes / No']),
  story(nih('VitaminB12'),
    ['Végétal : où trouver la B12 ?','Les aliments végétaux ne contiennent pas de vitamine B12, sauf s’ils sont enrichis.','Vérifiez la mention B12 sur les céréales ou autres produits enrichis.','💬 Répondez : quelle question avez-vous sur les aliments enrichis ?'],
    ['Plant foods: where is the B12?','Plant foods have no vitamin B12 unless they are fortified.','Check cereals or other fortified products for B12 on the label.','💬 Reply: what would you like to know about fortified foods?']),
  story(nih('Magnesium'),
    ['Le magnésium participe à la construction','Le corps utilise le magnésium pour fabriquer des protéines et du tissu osseux.','Les légumineuses, graines et céréales complètes sont des sources alimentaires.','💬 Répondez : légumineuses ou graines à ajouter à votre repas ?'],
    ['Magnesium helps your body build','Your body uses magnesium to make protein and bone tissue.','Pulses, seeds and whole grains are food sources.','💬 Reply: pulses or seeds to add to your meal?'])
];
export function storyText(story,lang){
  return `${story.title[lang].toLocaleUpperCase(lang)}\n\n🧠 ${story.fact[lang]}\n\n🍽️ ${story.tip[lang]}\n\n${story.cta[lang]}`;
}
