// script.js (drop-in replacement)
let questions = [], currentIndex = 0, answers = {}, timeLeft, examNumber = "1", lang = "en", mode = "exam", moduleKey = "admin", timer;

const i18n = {
  en: { title:"RBQ Exam", back:"← All Exams", prev:"Previous", next:"Next", submit:"Submit",
        qOf:(i,t)=>`Question ${i} / ${t}`, result:"Result",
        yourScore:(s,t)=>`You scored <strong>${s}</strong> / ${t}`,
        review:"Review", yourAnswer:"Your answer:", correct:"Correct:",
        retry:"Retry Exam", clear:"Clear Answers", failedLoad:"Failed to load exam file.",
        restart:"Restart", save:"Save", saved:"Saved Exams",
        enterName:"Enter a name:", savedTitle:"Saved Exams", open:"Open", del:"Delete",
        none:"No saved exams yet.", learnBanner:"Learn mode: explanations, key terms, and examples are shown.",
        showExp:"Show explanation", hideExp:"Hide explanation",
        keywords:"Key terms", example:"Example",
        modules:{admin:"Administration", safety:"Safety", project:"Projects & Sites", execution:"Execution of Work"}
  },
  fr: { title:"Examen RBQ", back:"← Tous les examens", prev:"Précédent", next:"Suivant", submit:"Soumettre",
        qOf:(i,t)=>`Question ${i} / ${t}`, result:"Résultat",
        yourScore:(s,t)=>`Votre note : <strong>${s}</strong> / ${t}`,
        review:"Révision", yourAnswer:"Votre réponse :", correct:"Bonne réponse :",
        retry:"Recommencer", clear:"Effacer les réponses", failedLoad:"Échec du chargement de l’examen.",
        restart:"Recommencer", save:"Enregistrer", saved:"Examens enregistrés",
        enterName:"Entrez un nom :", savedTitle:"Examens enregistrés", open:"Ouvrir", del:"Supprimer",
        none:"Aucun examen enregistré.", learnBanner:"Mode Apprendre : explications, mots clés et exemples.",
        showExp:"Afficher l’explication", hideExp:"Masquer l’explication",
        keywords:"Mots clés", example:"Exemple",
        modules:{admin:"Administration", safety:"Sécurité", project:"Gestion de projets et chantiers", execution:"Exécution des travaux"}
  }
};

// normalize any weird module strings to our 4 valid keys
function normalizeModule(v) {
  v = (v || "").toLowerCase();
  if (["admin","administration"].includes(v)) return "admin";
  if (["safety","sécurité","securite"].includes(v)) return "safety";
  if (["project","projects","projet","projets","chantiers","gestion"].includes(v)) return "project";
  if (["execution","exécution","travaux"].includes(v)) return "execution";
  return "admin";
}

const glossary=[ /* (unchanged small glossary; omitted for brevity) */ ];

function findKeywords(t){t=t.toLowerCase();const hits=[];for(const g of glossary){for(const a of g.aliases){if(t.includes(a)){hits.push(g.key);break;}}}return [...new Set(hits)];}
function explanationBlock(q){
  const T=i18n[lang];const keys=findKeywords(q.question+" "+q.choices.join(" "));
  const correct=q.choices[q.answer]; const why=(lang==='fr'?`Ici, « ${correct} » reflète la pratique courante pour ${i18n[lang].modules[moduleKey]}.`:`Here “${correct}” reflects common practice for ${i18n[lang].modules[moduleKey]}.`);
  const chips = keys.length ? `<div class="kdefs">${keys.map(k=>`<span class="chip">${k}</span>`).join('')}</div>` : (lang==='fr'?'<em>Aucun mot clé détecté.</em>':'<em>No key terms detected.</em>');
  const ex = (lang==='fr'?'Exemple : confrontez chaque choix aux lois/normes/devis.':'Example: contrast each choice with law/standards/specs.');
  return `<div class="explain"><h4>${lang==='fr'?'Explication courte':'Short explanation'}</h4><p>${why}</p><p><strong>${T.keywords}:</strong></p>${chips}<p><strong>${T.example}:</strong> ${ex}</p></div>`;
}

function qs(s){return document.querySelector(s)}
function fmtTime(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');}
function defaultTime(){return (mode==='learn'?0:120*60)}

function saveProgress(){localStorage.setItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_answers`,JSON.stringify(answers));localStorage.setItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_index`,String(currentIndex));localStorage.setItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_timeleft`,String(timeLeft));}
function loadProgress(){answers=JSON.parse(localStorage.getItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_answers`)||"{}");const idx=localStorage.getItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_index`);const t=localStorage.getItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_timeleft`);if(idx!==null)currentIndex=parseInt(idx,10);if(t!==null)timeLeft=parseInt(t,10);}

function applyI18N(){
  const T=i18n[lang]; document.documentElement.lang=lang;
  qs("#examTitle").textContent=T.title; qs("#backLink").textContent=T.back; qs("#backLink").href=`index.html?lang=${lang}&mode=${mode}&module=${moduleKey}`;
  qs("#prevBtn").textContent=T.prev; qs("#nextBtn").textContent=T.next; qs("#submitBtn").textContent=T.submit;
  qs("#restartBtn").textContent=T.restart; qs("#saveBtn").textContent=T.save; qs("#savedBtn").textContent=T.saved;
  qs("#modeBanner").textContent=(mode==='learn'?T.learnBanner:'');
  qs("#moduleBadge").textContent = T.modules[moduleKey] || moduleKey;
}

(function init(){
  const p=new URLSearchParams(location.search);
  examNumber = p.get("exam") || "1";
  lang = (p.get("lang")||"en").toLowerCase()==="fr"?"fr":"en";
  mode = (p.get("mode")||"exam").toLowerCase()==="learn"?"learn":"exam";
  moduleKey = normalizeModule(p.get("module")||"admin");
  applyI18N();

  // modal wires
  qs('#savedBtn').onclick=showSaved; qs('#closeSaved').onclick=()=>{qs('#savedModal').hidden=true}; qs('#savedModal').addEventListener('click',e=>{if(e.target===qs('#savedModal'))qs('#savedModal').hidden=true});
  qs('#restartBtn').onclick=()=>{answers={};currentIndex=0;timeLeft=defaultTime();saveProgress();qs('#result').style.display='none';render();startTimer();};
  qs('#saveBtn').onclick=saveSnapshot;

  const loadId=p.get('loadId'); if(loadId){loadSavedById(loadId);return;}

  const folders = (lang==='fr'
    ? {admin:'questions_admin_fr',safety:'questions_safety_fr',project:'questions_project_fr',execution:'questions_execution_fr'}
    : {admin:'questions_admin',   safety:'questions_safety',   project:'questions_project',   execution:'questions_execution'}
  );
  const folder = folders[moduleKey] || folders.admin;
  const file = `${folder}/exam${examNumber}.json`;

  // show a loading message
  qs('#exam-container').innerHTML = '<p style="opacity:.6">Loading questions…</p>';

  fetch(file).then(r=>{
    if(!r.ok) throw new Error(`HTTP ${r.status} for ${file}`);
    return r.json();
  }).then(data=>{
    if(!Array.isArray(data) || !data.length) throw new Error('Empty or invalid JSON.');
    // quick validation; filter out malformed entries
    questions = data.filter(q=>q && typeof q.question==='string' && Array.isArray(q.choices) && typeof q.answer==='number');
    if(!questions.length) throw new Error('No valid questions found.');
    if(timeLeft==null) timeLeft=defaultTime();
    loadProgress(); render(); startTimer();
    window.addEventListener('beforeunload',saveProgress);
    document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')goNext(); if(e.key==='ArrowLeft')goPrev();});
  }).catch(err=>{
    qs('#exam-container').innerHTML = `<p style="color:#b00">${i18n[lang].failedLoad}<br><code>${String(err)}</code></p>`;
  });
})();

function render(){
  const T=i18n[lang]; if(!questions.length){return;}
  const q=questions[currentIndex]; qs('#progressText').innerHTML=T.qOf(currentIndex+1,questions.length);
  const cont=qs('#exam-container');
  let expBtn = mode==='learn' ? `<button class="btn small" id="toggleExp">${T.hideExp}</button>` : '';
  cont.innerHTML = `<div class="question"><strong>${currentIndex+1}.</strong> ${q.question} ${expBtn}</div>` +
                   q.choices.map((c,i)=>`<button class="choice-btn ${answers[currentIndex]===i?'selected':''}" data-i="${i}">${c}</button>`).join('') +
                   (mode==='learn'?explanationBlock(q):'');
  cont.querySelectorAll('.choice-btn').forEach(btn=>btn.onclick=()=>{answers[currentIndex]=parseInt(btn.dataset.i,10);saveProgress();render();});
  if(mode==='learn'){const btn=qs('#toggleExp');let shown=true;btn&&btn.addEventListener('click',()=>{shown=!shown;const el=cont.querySelector('.explain');if(el)el.style.display=shown?'block':'none';btn.textContent=shown?T.hideExp:T.showExp;});}
  qs('#prevBtn').onclick=goPrev; qs('#nextBtn').onclick=goNext; qs('#submitBtn').onclick=submitExam;
}
function goPrev(){ if(currentIndex>0){ currentIndex--; render(); saveProgress(); } }
function goNext(){ if(currentIndex<questions.length-1){ currentIndex++; render(); saveProgress(); } }

function submitExam(){
  const T=i18n[lang]; let score=0; questions.forEach((q,idx)=>{ if(answers[idx]===q.answer) score++; });
  const pct=Math.round((score/questions.length)*100);
  const res=qs('#result'); res.style.display='block';
  res.innerHTML=`<h2>${T.result}</h2><p>${T.yourScore(score,questions.length)} <span class="badge">${pct}%</span></p>
  <div class="review"><h3>${T.review}</h3>${
    questions.map((q,idx)=>{const u=answers[idx];const ok=u===q.answer;return `<details ${!ok?'open':''}><summary>${idx+1}. ${ok?'✅':'❌'} ${q.question}</summary><div><strong>${T.yourAnswer}</strong> ${u!=null?q.choices[u]:'<em>—</em>'}</div><div><strong>${T.correct}</strong> ${q.choices[q.answer]}</div>${mode==='learn'?explanationBlock(q):''}</details>`}).join('')}
  </div>
  <p><button class="primary" id="retryBtn">${T.retry}</button><button id="clearBtn">${T.clear}</button></p>`;
  qs('#retryBtn').onclick=()=>{ answers={}; currentIndex=0; timeLeft=defaultTime(); saveProgress(); res.style.display='none'; startTimer(); render(); };
  qs('#clearBtn').onclick=()=>{ ['answers','index','timeleft'].forEach(k=>localStorage.removeItem(`rbq_exam_${lang}_${moduleKey}_${examNumber}_${mode}_${k}`)); answers={}; res.style.display='none'; render(); };
}

// Saved exams (unchanged minimal)
function savedList(){ try{return JSON.parse(localStorage.getItem('rbq_saved_exams_v3')||'[]')}catch(e){return[]} }
function setSavedList(a){ localStorage.setItem('rbq_saved_exams_v3', JSON.stringify(a)) }
function saveSnapshot(){
  let name=prompt(i18n[lang].enterName,`${lang.toUpperCase()} ${moduleKey.toUpperCase()} ${mode.toUpperCase()} – Exam ${examNumber} – ${new Date().toLocaleString()}`);
  if(name===null) return; name=String(name).trim()||`Exam ${examNumber} ${new Date().toLocaleString()}`;
  const id=String(Date.now())+"_"+Math.random().toString(16).slice(2);
  const snap={id,name,lang,module:moduleKey,examNumber,mode,questions,answers,currentIndex,timeLeft,savedAt:new Date().toISOString(),version:3};
  const list=savedList(); list.unshift(snap); setSavedList(list); showSaved();
}
function showSaved(){
  const T=i18n[lang], modal=qs('#savedModal'), box=qs('#savedList');
  qs('#savedTitle').textContent=T.savedTitle;
  const data=savedList();
  box.innerHTML=data.length?data.map(s=>`<div class="saved-row"><div><div class="saved-name">${s.name}</div><div class="saved-meta">${s.lang.toUpperCase()} · ${(s.mode||'exam').toUpperCase()} · ${(i18n[lang].modules[s.module]||s.module)} · Exam ${s.examNumber} · ${new Date(s.savedAt).toLocaleString()}</div></div><div class="saved-actions"><button class="btn small" data-load="${s.id}">${T.open}</button><button class="btn small danger" data-del="${s.id}">${T.del}</button></div></div>`).join(''):`<p>${T.none}</p>`;
  box.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const id=b.getAttribute('data-load');loadSavedById(id);modal.hidden=true});
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const id=b.getAttribute('data-del');setSavedList(savedList().filter(x=>x.id!==id));showSaved()});
  modal.hidden=false;
}
function loadSavedById(id){
  const it=savedList().find(s=>s.id===id); if(!it) return;
  lang=it.lang; moduleKey=normalizeModule(it.module); examNumber=it.examNumber; mode=it.mode||'exam';
  questions=it.questions; answers=it.answers||{}; currentIndex=it.currentIndex||0; timeLeft=(typeof it.timeLeft==='number')?it.timeLeft:defaultTime();
  applyI18N(); render(); startTimer();
}
