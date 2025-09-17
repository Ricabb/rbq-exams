// Bilingual + Restart + Save + Saved + Learn Mode
let questions = [];
let currentIndex = 0;
let answers = {};
let timeLeft;
let examNumber = "1";
let lang = "en";
let timer;
let learnMode = false;

const i18n = {
  en: { title:"RBQ Exam", back:"← All Exams", prev:"Previous", next:"Next", submit:"Submit",
        qOf:(i,t)=>`Question ${i} / ${t}`, result:"Result",
        yourScore:(s,t)=>`You scored <strong>${s}</strong> / ${t}`, review:"Review",
        yourAnswer:"Your answer:", correct:"Correct:", retry:"Retry Exam", clear:"Clear Answers",
        failedLoad:"Failed to load exam file.", restart:"Restart", save:"Save", saved:"Saved Exams",
        enterName:"Enter a name for this saved exam:", savedTitle:"Saved Exams", open:"Open", del:"Delete",
        none:"No saved exams yet.", learnOn:"Learn: On", learnOff:"Learn: Off",
        summary:"Summary", keywords:"Keywords", example:"Example",
        genericSummary:"Key idea: understand the core definition and its practical consequence.",
        genericExample:"Ex: apply the rule on a small GC + subcontractor job." },
  fr: { title:"Examen RBQ", back:"← Tous les examens", prev:"Précédent", next:"Suivant", submit:"Soumettre",
        qOf:(i,t)=>`Question ${i} / ${t}`, result:"Résultat",
        yourScore:(s,t)=>`Votre note : <strong>${s}</strong> / ${t}`, review:"Révision",
        yourAnswer:"Votre réponse :", correct:"Bonne réponse :", retry:"Recommencer", clear:"Effacer les réponses",
        failedLoad:"Échec du chargement de l’examen.", restart:"Recommencer", save:"Enregistrer", saved:"Examens enregistrés",
        enterName:"Entrez un nom pour cet examen enregistré :", savedTitle:"Examens enregistrés", open:"Ouvrir", del:"Supprimer",
        none:"Aucun examen enregistré.", learnOn:"Apprendre : Activé", learnOff:"Apprendre : Désactivé",
        summary:"Résumé", keywords:"Mots‑clés", example:"Exemple",
        genericSummary:"Idée clé : connaître la définition et la conséquence pratique.",
        genericExample:"Ex. : appliquez la règle à un petit chantier (EG + sous‑traitant)." }
};

function qs(s){return document.querySelector(s)}
function fmtTime(sec){ const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':'); }
function defaultTime(){ return 120*60; }

function saveProgress(){
  localStorage.setItem(`rbq_exam_${lang}_${examNumber}_answers`, JSON.stringify(answers));
  localStorage.setItem(`rbq_exam_${lang}_${examNumber}_index`, String(currentIndex));
  localStorage.setItem(`rbq_exam_${lang}_${examNumber}_timeleft`, String(timeLeft));
}
function loadProgress(){
  answers = JSON.parse(localStorage.getItem(`rbq_exam_${lang}_${examNumber}_answers`)||"{}");
  const idx = localStorage.getItem(`rbq_exam_${lang}_${examNumber}_index`);
  const t = localStorage.getItem(`rbq_exam_${lang}_${examNumber}_timeleft`);
  if(idx!==null) currentIndex=parseInt(idx,10);
  if(t!==null) timeLeft=parseInt(t,10);
}
function savedList(){ try{ return JSON.parse(localStorage.getItem('rbq_saved_exams_v1')||'[]'); }catch(e){ return []; } }
function setSavedList(a){ localStorage.setItem('rbq_saved_exams_v1', JSON.stringify(a)); }
function saveSnapshot(){
  const T=i18n[lang];
  let name = prompt(T.enterName, `${lang.toUpperCase()} Exam ${examNumber} – ${new Date().toLocaleString()}`);
  if(name===null) return;
  name=String(name).trim(); if(!name) name=`${lang.toUpperCase()} Exam ${examNumber} – ${new Date().toLocaleString()}`;
  const id = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
  const snap = { id, name, lang, examNumber, questions, answers, currentIndex, timeLeft, savedAt: new Date().toISOString(), version: 1 };
  const list = savedList(); list.unshift(snap); setSavedList(list); showSaved();
}
function showSaved(){
  const T=i18n[lang];
  const modal=qs('#savedModal'); const box=qs('#savedList'); qs('#savedTitle').textContent=T.savedTitle;
  const data=savedList();
  if(data.length===0){ box.innerHTML=`<p>${T.none}</p>`; }
  else {
    box.innerHTML = data.map(s=>`
      <div class="saved-row">
        <div>
          <div class="saved-name">${s.name}</div>
          <div class="saved-meta">${s.lang.toUpperCase()} · Exam ${s.examNumber} · ${new Date(s.savedAt).toLocaleString()}</div>
        </div>
        <div class="saved-actions">
          <button class="btn small" data-load="${s.id}">${T.open}</button>
          <button class="btn small danger" data-del="${s.id}">${T.del}</button>
        </div>
      </div>`).join('');
    box.querySelectorAll('[data-load]').forEach(b=>b.addEventListener('click',()=>{ const id=b.getAttribute('data-load'); loadSavedById(id); modal.hidden=true; }));
    box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ const id=b.getAttribute('data-del'); setSavedList(savedList().filter(x=>x.id!==id)); showSaved(); }));
  }
  modal.hidden=false;
}
function loadSavedById(id){
  const item = savedList().find(s=>s.id===id);
  if(!item) return;
  if(item.lang!==lang){ lang=item.lang; }
  examNumber=item.examNumber; questions=item.questions; answers=item.answers||{}; currentIndex=item.currentIndex||0;
  timeLeft=(typeof item.timeLeft==='number')? item.timeLeft: defaultTime();
  applyI18N(); render(); startTimer();
}

function applyI18N(){
  const T=i18n[lang];
  document.documentElement.lang=lang;
  qs("#examTitle").textContent=T.title; qs("#backLink").textContent=T.back; qs("#backLink").href=`index.html?lang=${lang}`;
  qs("#prevBtn").textContent=T.prev; qs("#nextBtn").textContent=T.next; qs("#submitBtn").textContent=T.submit;
  qs("#restartBtn").textContent=T.restart; qs("#saveBtn").textContent=T.save; qs("#savedBtn").textContent=T.saved;
  qs("#learnBtn").textContent = learnMode ? T.learnOn : T.learnOff;
}

// Learn mode explanations
function explain(question, lang){
  const L = (lang==='fr'); const q = question.toLowerCase();
  const T = i18n[lang];
  const P = (en,fr)=> L? fr: en;
  const pack = (summary, kws, example)=>({summary, keywords:kws, example});

  const has=(...arr)=>arr.some(s=>q.includes(s));

  if(has('rbq') && has('role','rôle')){
    return pack(P("RBQ is the provincial building regulator: licensing and safety oversight.",
                   "La RBQ est le régulateur provincial du bâtiment : licences et sécurité."),
      [{term:P("RBQ","RBQ"), def:P("Provincial building regulator","Régie du bâtiment du Québec")},
       {term:P("licence","licence"), def:P("Authorization to perform work","Autorisation d’exécuter des travaux")}],
      P("Example: checking a contractor holds the proper subclass.","Ex. : vérifier la bonne sous‑catégorie d’un entrepreneur."));
  }
  if(has('guarantor','garant')){
    return pack(P("The guarantor proves competencies and ensures compliance for the licence.",
                   "Le garant atteste les compétences et veille à la conformité de la licence."),
      [{term:P("guarantor","garant"), def:P("Designated responsible person","Personne désignée responsable")},
       {term:P("subclass","sous‑catégorie"), def:P("Specific scope on licence","Portée précise de la licence")}],
      P("Example: guarantor leaves → must be replaced within RBQ delay.",
        "Ex. : le garant quitte → remplacement dans le délai RBQ."));
  }
  if(has('bid bond','performance bond','labour and material','labor and material','payment bond','cautionnement')){
    return pack(P("Bonds allocate risk: bid (commit), performance (complete), payment (pay subs).",
                   "Les cautionnements répartissent le risque : soumission (engagement), exécution (achèvement), paiement (payer les sous‑traitants)."),
      [{term:P("bid bond","cautionnement de soumission"), def:P("Guarantee to enter contract","Garantie d’entrer en contrat")},
       {term:P("performance bond","cautionnement d’exécution"), def:P("Guarantee to finish the work","Garantie d’achèvement")},
       {term:P("payment bond","cautionnement de paiement"), def:P("Protects subs/suppliers","Protège sous‑traitants/fournisseurs")}],
      P("Example: low bidder refuses to sign → claim on bid bond.",
        "Ex. : plus bas soumissionnaire refuse de signer → réclamation sur le cautionnement de soumission."));
  }
  if(has('addendum','addenda')){
    return pack(P("Addendum modifies tender documents before closing; it is binding.",
                   "Un addenda modifie les documents d’appel d’offres avant la fermeture; il est contraignant."),
      [{term:P("addendum","addenda"), def:P("Change to tender documents","Modification aux documents d’appel d’offres")}],
      P("Example: clarifying spec section via Addendum 02.","Ex. : clarifier une section de devis via Addenda 02."));
  }
  if(has('holdback','retenue')){
    return pack(P("Typical statutory holdback: 10% retained until lien period expiry.",
                   "Retenue statutaire typique : 10 % jusqu’à l’expiration des délais d’hypothèque légale."),
      [{term:P("holdback","retenue"), def:P("Retention to protect lien claims","Somme retenue pour protéger les réclamations d’hypothèque")}],
      P("Example: owner holds 10% on each progress draw.","Ex. : maintien de 10 % sur chaque demande d’avancement."));
  }
  if(has('change order','ordre de changement')){
    return pack(P("Change order: formal, mutually agreed price/time/scope change.",
                   "Ordre de changement : modification formelle convenue (prix/délai/portée)."),
      [{term:P("change order","ordre de changement"), def:P("Formal contract modification","Modification contractuelle formelle")}],
      P("Example: add extra duct run priced as CO-03.","Ex. : ajout d’une gaine, OC‑03."));
  }
  if(has('change directive','directive de changement')){
    return pack(P("Change directive: unilateral instruction to proceed before price agreement; later valuation.",
                   "Directive de changement : instruction unilatérale d’exécuter avant entente de prix; évaluation ultérieure."),
      [{term:P("change directive","directive de changement"), def:P("Proceed now, price later","Procéder maintenant, prix ultérieur")}],
      P("Example: urgent work issued as CCD then priced.","Ex. : travaux urgents en DC puis évalués."));
  }
  if(has('rfi','demande d’information')){
    return pack(P("RFI clarifies discrepancies or requests missing info; it does not change price by itself.",
                   "La RFI sert à clarifier des écarts ou demander de l’information; elle ne change pas le prix d’elle‑même."),
      [{term:"RFI", def:P("Request for Information","Demande d’information")}],
      P("Example: ask if note on A-201 conflicts with spec 07 52 00.","Ex. : demander si la note A‑201 contredit le devis 07 52 00."));
  }
  if(has('o&m','manuels')){
    return pack(P("O&M manuals delivered at closeout; they aid operation and maintenance.",
                   "Les manuels O&M sont remis à la fermeture; ils servent à l’exploitation et l’entretien."),
      [{term:"O&M", def:P("Operation & Maintenance","Opération et Maintenance")}],
      P("Example: include equipment data sheets and maintenance schedules.","Ex. : inclure fiches d’équipement et calendriers d’entretien."));
  }
  if(has('gst','qst','tps','tvq')){
    return pack(P("Quebec construction invoices: GST 5% + QST 9.975%.",
                   "Factures de construction au Québec : TPS 5 % + TVQ 9,975 %."),
      [{term:P("GST/QST","TPS/TVQ"), def:P("Federal + Quebec sales taxes","Taxes de vente fédérale + québécoise")}],
      P("Example: $1000 before tax → $1,099.75 with GST/QST.","Ex. : 1 000 $ avant taxes → 1 099,75 $ avec TPS/TVQ."));
  }
  if(has('input tax credit','crédit de taxe')){
    return pack(P("ITC recovers eligible GST/QST on business inputs.",
                   "Le CTI permet de récupérer la TPS/TVQ admissible sur les intrants d’affaires."),
      [{term:P("ITC","CTI"), def:P("Recover sales tax paid on inputs","Récupérer la taxe payée sur intrants")}],
      P("Example: claim GST/QST on subcontract invoices used in taxable work.","Ex. : réclamer la TPS/TVQ sur les sous‑contrats liés à des ventes taxables."));
  }
  if(has('current ratio','ratio de liquidité')){
    return pack(P("Current ratio = current assets / current liabilities; liquidity measure.",
                   "Ratio de liquidité générale = actifs à court terme / passifs à court terme; mesure de liquidité."),
      [{term:P("current assets","actifs à CT"), def:P("Cash, receivables, inventory","Trésorerie, clients, inventaires")}],
      P("Example: 2.0 means $2 assets for each $1 liability.","Ex. : 2,0 signifie 2 $ d’actifs pour 1 $ de passif."));
  }
  if(has('ccq')){
    return pack(P("CCQ administers construction collective agreements and labour matters.",
                   "La CCQ administre les conventions collectives et les relations de travail en construction."),
      [{term:"CCQ", def:P("Quebec Construction Commission","Commission de la construction du Québec")}],
      P("Example: hour rates and mobility per collective agreements.","Ex. : taux horaires et mobilité selon conventions."));
  }
  if(has('cnesst','accident')){
    return pack(P("First duty in a serious accident: secure the site, assist, notify emergency services.",
                   "Devoir premier lors d’un accident grave : sécuriser le site, assister, aviser les urgences."),
      [{term:"CNESST", def:P("Work health & safety board","Santé et sécurité du travail")}],
      P("Example: stop work, call 911, preserve scene for investigation.","Ex. : arrêt des travaux, 911, préserver la scène pour enquête."));
  }
  if(has('height','hauteur')){
    return pack(P("Working at heights requires training and proper fall protection.",
                   "Le travail en hauteur exige une formation et une protection contre les chutes."),
      [{term:P("fall protection","protection contre les chutes"), def:P("Harnesses, anchors, guardrails","Harnais, ancrages, garde‑corps")}],
      P("Example: tie‑off on roof edge; inspect harness before use.","Ex. : amarrage en rive de toit; inspection du harnais."));
  }
  if(has('whmis','simdut')){
    return pack(P("WHMIS (SIMDUT) covers classification, labels, and Safety Data Sheets.",
                   "Le SIMDUT couvre la classification, l’étiquetage et les fiches de données de sécurité."),
      [{term:P("WHMIS/SDS","SIMDUT/FDS"), def:P("Hazard system & data sheets","Système de dangers & fiches de données")}],
      P("Example: use proper pictograms and consult SDS before handling.","Ex. : pictogrammes appropriés et FDS avant de manipuler."));
  }
  if(has('lockout','cadenassage')){
    return pack(P("Lockout/Tagout prevents energy startup during maintenance.",
                   "Le cadenassage empêche la mise en marche/énergie durant l’entretien."),
      [{term:P("isolation","isolement"), def:P("Disconnect energy sources","Déconnexion des sources d’énergie")}],
      P("Example: lock main breaker with personal lock before servicing.","Ex. : verrouiller le disjoncteur principal avant entretien."));
  }
  if(has('dangerous work','travail dangereux','refuse','refuser')){
    return pack(P("Any worker may refuse dangerous work with reasonable grounds.",
                   "Tout travailleur peut refuser un travail dangereux avec motifs raisonnables."),
      [{term:P("right to refuse","droit de refuser"), def:P("Protection against reprisals","Protection contre les représailles")}],
      P("Example: refuse unguarded roof edge work until controls in place.","Ex. : refuser un travail en rive non protégée jusqu’aux mesures en place."));
  }
  if(has('critical path','chemin critique')){
    return pack(P("Critical path = longest dependent path that sets project duration.",
                   "Chemin critique = chaîne la plus longue qui fixe la durée du projet."),
      [{term:P("float","marge"), def:P("Schedule slack","Marges d’ordonnancement")}],
      P("Example: delay on critical task delays project finish.","Ex. : un retard sur une tâche critique retarde la fin du projet."));
  }
  if(has('baseline')){
    return pack(P("Baselines are updated only via formal change control.",
                   "Les bases de référence se modifient via le contrôle formel des changements."),
      [{term:P("baseline","référence de base"), def:P("Approved plan for scope/time/cost","Plan approuvé de portée/temps/coût")}],
      P("Example: CO that changes time updates schedule baseline.","Ex. : un OC qui change l’échéancier met à jour la baseline."));
  }
  if(has('earned value','valeur acquise')){
    return pack(P("EVM compares planned value, earned value, and actual cost to track performance.",
                   "La valeur acquise compare VP, VA et CR pour suivre la performance."),
      [{term:"EV/VP/AC", def:P("Earned/Planned/Actual cost metrics","Valeur acquise/planifiée/coût réel")}],
      P("Example: CPI < 1 means cost overrun.","Ex. : IPC < 1 indique un dépassement de coûts."));
  }
  if(has('quality assurance','assurance qualité')){
    return pack(P("QA plan describes controls to meet requirements.",
                   "Le PAQ décrit les contrôles pour satisfaire les exigences."),
      [{term:P("QA/QC","AQ/CQ"), def:P("Assurance vs control","Assurance vs contrôle")}],
      P("Example: inspection/test plan for concrete pours.","Ex. : plan d’inspection/essai pour coulées de béton."));
  }
  if(has('concrete','béton') && has('compressive','compression')){
    return pack(P("Concrete strength is verified by lab cylinder breaks at specified ages.",
                   "La résistance du béton est vérifiée par rupture d’éprouvettes en labo aux âges prescrits."),
      [{term:P("cylinder test","éprouvette"), def:P("Lab compression test","Essai de compression en labo")}],
      P("Example: 25 MPa at 28 days per spec.","Ex. : 25 MPa à 28 jours selon le devis."));
  }
  if(has('iso 14001','aspect environnemental','environmental aspect')){
    return pack(P("An environmental aspect is an element of activities that can interact with the environment.",
                   "Un aspect environnemental est un élément des activités susceptible d’interagir avec l’environnement."),
      [{term:P("aspect/impact","aspect/impact"), def:P("Cause vs effect on environment","Cause vs effet sur l’environnement")}],
      P("Example: dust generation from demolition.","Ex. : poussières générées par la démolition."));
  }
  if(has('fairness','équité') || has('transparency','transparence')){
    return pack(P("Public procurement must ensure fairness and transparency.",
                   "L’approvisionnement public doit assurer l’équité et la transparence."),
      [{term:P("fairness","équité"), def:P("Equal treatment of bidders","Traitement égal des soumissionnaires")}],
      P("Example: use published evaluation criteria consistently.","Ex. : appliquer les critères publiés de façon uniforme."));
  }
  if(has('conflict of interest','conflit d’intérêts')){
    return pack(P("Undisclosed personal interest compromises impartiality; disclose and recuse.",
                   "Un intérêt personnel non divulgué compromet l’impartialité; divulguer et se retirer."),
      [{term:P("conflict of interest","conflit d’intérêts"), def:P("Personal interest vs duty","Intérêt personnel vs devoir")}],
      P("Example: not evaluating your relative’s bid.","Ex. : ne pas évaluer la soumission d’un proche."));
  }
  if(has('amp','autorité des marchés publics')){
    return pack(P("AMP oversees Quebec public procurement compliance and integrity.",
                   "L’AMP surveille l’intégrité et la conformité des contrats publics au Québec."),
      [{term:"AMP", def:P("Quebec procurement authority","Autorité des marchés publics")}],
      P("Example: complaint to AMP about irregular tender process.","Ex. : plainte à l’AMP pour un processus irrégulier."));
  }
  if(has('hypothec','lien','hypothèque légale')){
    return pack(P("Construction lien (legal hypothec) protects those unpaid for work or materials.",
                   "L’hypothèque légale protège les personnes impayées pour travaux ou matériaux."),
      [{term:P("lien/hypothec","hypothèque légale"), def:P("Security on the immovable","Sûreté sur l’immeuble")}],
      P("Example: file within prescribed delays to preserve rights.","Ex. : publier/aviser dans les délais prescrits."));
  }
  if(has('site instruction','instruction de chantier')){
    return pack(P("Site instruction gives minor direction; pricing needs a change order if impact.",
                   "L’instruction de chantier donne une directive mineure; la tarification exige un ordre de changement si impact."),
      [{term:P("site instruction","instruction de chantier"), def:P("Minor directive","Directive mineure")}],
      P("Example: move door 150mm—no price unless extra work.","Ex. : déplacer une porte de 150 mm—pas de prix sauf extra."));
  }
  if(has('shop drawings','dessins d’atelier')){
    return pack(P("Shop drawings show how the work will be fabricated/installed; they are submittals.",
                   "Les dessins d’atelier montrent la fabrication/installation; ce sont des documents de soumission."),
      [{term:P("shop drawing","dessin d’atelier"), def:P("Fabrication/install details","Détails de fabrication/installation")}],
      P("Example: duct shop drawing with hangers and clearances.","Ex. : dessin d’atelier de conduits avec suspentes et dégagements."));
  }
  if(has('method statement','mode opératoire','procédure de travail')){
    return pack(P("Method statement lays out steps and controls for quality and safety.",
                   "Le mode opératoire définit les étapes et contrôles qualité/sécurité."),
      [{term:P("method statement","mode opératoire"), def:P("Procedure for execution","Procédure d’exécution")}],
      P("Example: trenching procedure with shoring and spotter.","Ex. : tranchée avec étaiement et signaleur."));
  }
  if(has('closeout','fermeture','o&m','as-builts','tels que construits')){
    return pack(P("Closeout collects as-builts, O&M manuals, warranties, and training records.",
                   "La fermeture regroupe plans tels que construits, manuels O&M, garanties et formations."),
      [{term:P("as-builts","tels que construits"), def:P("Record drawings of final work","Plans finaux exécutés")}],
      P("Example: deliver training for building operators at handover.","Ex. : former les opérateurs à la remise."));
  }
  if(has('builder’s risk','tous risques chantier','course of construction')){
    return pack(P("Builder’s Risk covers damage to the work under construction.",
                   "L’assurance Tous Risques Chantier couvre les dommages à l’ouvrage en construction."),
      [{term:P("builder’s risk","tous risques chantier"), def:P("Property insurance for the project","Assurance de biens du chantier")}],
      P("Example: wind damages installed cladding—covered per policy.","Ex. : le vent endommage un revêtement—couvert selon la police."));
  }
  if(has('commercial general liability','responsabilité civile des entreprises','cgl','rce')){
    return pack(P("CGL covers third‑party bodily injury and property damage.",
                   "La RCE couvre les dommages corporels/matériels causés à des tiers."),
      [{term:P("CGL","RCE"), def:P("Liability to third parties","Responsabilité envers des tiers")}],
      P("Example: visitor trips over unprotected hose and is injured.","Ex. : un visiteur trébuche sur un boyau non protégé et se blesse."));
  }
  if(has('professional liability','responsabilité professionnelle','errors & omissions','erreurs')){
    return pack(P("Professional liability covers design/service errors causing economic loss.",
                   "La responsabilité professionnelle couvre les erreurs de conception/services causant une perte économique."),
      [{term:P("E&O","E&O"), def:P("Errors & Omissions","Erreurs et omissions")}],
      P("Example: design error requires rework not covered by CGL.","Ex. : une erreur de conception exige une reprise non couverte par la RCE."));
  }
  if(has('contingency','contingence')){
    return pack(P("Cost contingency covers identified risks/uncertainties within scope.",
                   "La contingence couvre les risques/incertitudes identifiés dans la portée."),
      [{term:P("contingency","contingence"), def:P("Budget for risk within scope","Budget de risque dans la portée")}],
      P("Example: 5% design contingency on early estimates.","Ex. : 5 % de contingence de conception aux premières estimations."));
  }
  if(has('float','marge de manœuvre')){
    return pack(P("Float provides schedule buffer for uncertainties.",
                   "La marge (float) offre un tampon d’échéancier face aux incertitudes."),
      [{term:P("float","marge"), def:P("Available slack time","Temps de marge disponible")}],
      P("Example: non‑critical path can slip without delaying finish.","Ex. : une tâche non critique peut glisser sans retarder la fin."));
  }
  return {summary:T.genericSummary, keywords:[], example:T.genericExample};
}

function handleKeys(e){ if(e.key==='ArrowRight') goNext(); if(e.key==='ArrowLeft') goPrev(); }

function startTimer(){
  clearInterval(timer);
  timer = setInterval(()=>{
    qs('#timer').textContent = fmtTime(timeLeft);
    if(timeLeft<=0){ clearInterval(timer); submitExam(); return; }
    timeLeft--; if(timeLeft%5===0) saveProgress();
  },1000);
}

function render(){
  const T=i18n[lang];
  const q=questions[currentIndex]; if(!q) return;
  qs('#progressText').innerHTML=T.qOf(currentIndex+1, questions.length);
  const cont=qs('#exam-container');
  cont.innerHTML = `
    <div class="question"><strong>${currentIndex+1}.</strong> ${q.question}</div>
    ${q.choices.map((c,i)=>`<button class="choice-btn ${answers[currentIndex]===i?'selected':''}" data-i="${i}">${c}</button>`).join('')}
    ${learnMode ? renderLearn(q.question) : ''}
  `;
  cont.querySelectorAll('.choice-btn').forEach(btn=>btn.addEventListener('click', ()=>selectAnswer(parseInt(btn.dataset.i,10))));
  qs('#prevBtn').onclick=goPrev; qs('#nextBtn').onclick=goNext; qs('#submitBtn').onclick=submitExam;
  qs('#timer').textContent = fmtTime(timeLeft);
}
function renderLearn(question){
  const T=i18n[lang]; const ex = explain(question, lang);
  const kw = (ex.keywords||[]).map(k=>`<span class="kitem"><strong>${k.term}</strong>: ${k.def}</span>`).join(' ');
  return `<div class="learn">
    <h4>${T.summary}</h4><div>${ex.summary}</div>
    <h4>${T.keywords}</h4><div class="klist">${kw || '—'}</div>
    <h4>${T.example}</h4><div>${ex.example}</div>
  </div>`;
}

function selectAnswer(i){ answers[currentIndex]=i; saveProgress(); render(); }
function goPrev(){ if(currentIndex>0){ currentIndex--; render(); saveProgress(); } }
function goNext(){ if(currentIndex<questions.length-1){ currentIndex++; render(); saveProgress(); } }

function submitExam(){
  clearInterval(timer);
  const T=i18n[lang];
  let score=0; questions.forEach((q,idx)=>{ if(answers[idx]===q.answer) score++; });
  const pct=Math.round((score/questions.length)*100);
  const res=qs('#result');
  res.className=(pct>=60?'result-good':'result-bad');
  res.style.display='block';
  res.innerHTML = `
    <h2>${T.result}</h2>
    <p>${T.yourScore(score,questions.length)} <span class="badge">${pct}%</span></p>
    <div class="review">
      <h3>${T.review}</h3>
      ${questions.map((q,idx)=>{
        const user=answers[idx], correct=q.answer, ok=user===correct;
        const uTxt = (user!=null ? q.choices[user] : '<em>—</em>');
        return `<details ${!ok?'open':''}><summary>${idx+1}. ${ok?'✅':'❌'} ${q.question}</summary>
          <div><strong>${T.yourAnswer}</strong> ${uTxt}</div>
          <div><strong>${T.correct}</strong> ${q.choices[correct]}</div>
          ${learnMode ? renderLearn(q.question) : ''}
        </details>`;
      }).join('')}
    </div>
    <p><button class="primary" id="retryBtn">${T.retry}</button>
       <button id="clearBtn">${T.clear}</button></p>
  `;
  qs('#retryBtn').onclick = ()=>{ answers={}; currentIndex=0; timeLeft=defaultTime(); saveProgress(); res.style.display='none'; startTimer(); render(); };
  qs('#clearBtn').onclick = ()=>{
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_answers`);
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_index`);
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_timeleft`);
    answers={}; res.style.display='none'; render();
  };
}

(function init(){
  const params=new URLSearchParams(location.search);
  examNumber = params.get("exam") || "1";
  lang = (params.get("lang")||"en").toLowerCase()==="fr" ? "fr" : "en";
  learnMode = localStorage.getItem('rbq_learn_mode') === '1';
  applyI18N();
  // Saved modal wiring
  qs('#savedBtn').onclick = showSaved;
  qs('#closeSaved').onclick = ()=>{ qs('#savedModal').hidden=true; };
  qs('#savedModal').addEventListener('click', e=>{ if(e.target===qs('#savedModal')) qs('#savedModal').hidden=true; });
  // Restart / Save
  qs('#restartBtn').onclick = ()=>{ answers={}; currentIndex=0; timeLeft=defaultTime(); saveProgress(); qs('#result').style.display='none'; render(); startTimer(); };
  qs('#saveBtn').onclick = saveSnapshot;
  // Learn toggle
  qs('#learnBtn').onclick = ()=>{ learnMode=!learnMode; localStorage.setItem('rbq_learn_mode', learnMode? '1':'0'); applyI18N(); render(); };

  // Load by saved id?
  const loadId = params.get('loadId');
  if(loadId){ loadSavedById(loadId); return; }

  const file = lang==='fr' ? `questions_fr/exam${examNumber}.json` : `questions/exam${examNumber}.json`;
  fetch(file).then(r=>r.json()).then(data=>{
    questions = data.slice();
    if(timeLeft==null) timeLeft = defaultTime();
    loadProgress();
    render();
    startTimer();
    window.addEventListener('beforeunload', saveProgress);
    document.addEventListener('keydown', handleKeys);
  }).catch(err=>{
    qs('#exam-container').innerHTML = `<p style="color:#b00">${i18n[lang].failedLoad} ${err}</p>`;
  });
})();
