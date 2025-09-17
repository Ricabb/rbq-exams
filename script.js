// Bilingual exam runner
let questions = [];
let currentIndex = 0;
let answers = {};
let timeLeft;
let examNumber = "1";
let lang = "en";
let timer;

const i18n = {
  en: {
    title: "RBQ Exam",
    back: "← All Exams",
    prev: "Previous",
    next: "Next",
    submit: "Submit",
    qOf: (i,total)=>`Question ${i} / ${total}`,
    result: "Result",
    yourScore: (score,total)=>`You scored <strong>${score}</strong> / ${total}`,
    review: "Review",
    yourAnswer: "Your answer:",
    correct: "Correct:",
    retry: "Retry Exam",
    clear: "Clear Answers",
    failedLoad: "Failed to load exam file."
  },
  fr: {
    title: "Examen RBQ",
    back: "← Tous les examens",
    prev: "Précédent",
    next: "Suivant",
    submit: "Soumettre",
    qOf: (i,total)=>`Question ${i} / ${total}`,
    result: "Résultat",
    yourScore: (score,total)=>`Votre note : <strong>${score}</strong> / ${total}`,
    review: "Révision",
    yourAnswer: "Votre réponse :",
    correct: "Bonne réponse :",
    retry: "Recommencer",
    clear: "Effacer les réponses",
    failedLoad: "Échec du chargement de l’examen."
  }
};

function qs(s){return document.querySelector(s)}
function fmtTime(sec){
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');
}
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

(function init(){
  const params=new URLSearchParams(location.search);
  examNumber = params.get("exam") || "1";
  lang = (params.get("lang")||"en").toLowerCase()==="fr" ? "fr" : "en";
  const T=i18n[lang];
  document.documentElement.lang=lang;
  qs("#examTitle").textContent=T.title;
  qs("#backLink").textContent=T.back;
  qs("#backLink").href=`index.html?lang=${lang}`;
  qs("#prevBtn").textContent=T.prev;
  qs("#nextBtn").textContent=T.next;
  qs("#submitBtn").textContent=T.submit;

  const file = lang==='fr' ? `questions_fr/exam${examNumber}.json` : `questions/exam${examNumber}.json`;
  fetch(file).then(r=>r.json()).then(data=>{
    questions = data.slice();
    if(timeLeft==null) timeLeft = 120*60;
    loadProgress();
    render();
    startTimer();
    window.addEventListener('beforeunload', saveProgress);
    document.addEventListener('keydown', handleKeys);
  }).catch(err=>{
    qs('#exam-container').innerHTML = `<p style="color:#b00">${T.failedLoad} ${err}</p>`;
  });
})();

function handleKeys(e){ if(e.key==='ArrowRight') goNext(); if(e.key==='ArrowLeft') goPrev(); }

function startTimer(){
  clearInterval(timer);
  timer = setInterval(()=>{
    qs('#timer').textContent = fmtTime(timeLeft);
    if(timeLeft<=0){ clearInterval(timer); submitExam(); return; }
    timeLeft--;
    if(timeLeft%5===0) saveProgress();
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
  `;
  cont.querySelectorAll('.choice-btn').forEach(btn=>btn.addEventListener('click', ()=>selectAnswer(parseInt(btn.dataset.i,10))));
  qs('#prevBtn').onclick=goPrev;
  qs('#nextBtn').onclick=goNext;
  qs('#submitBtn').onclick=submitExam;
  qs('#timer').textContent = fmtTime(timeLeft);
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
        </details>`;
      }).join('')}
    </div>
    <p><button class="primary" id="retryBtn">${T.retry}</button>
       <button id="clearBtn">${T.clear}</button></p>
  `;
  qs('#retryBtn').onclick = ()=>{ answers={}; currentIndex=0; timeLeft=120*60; saveProgress(); res.style.display='none'; startTimer(); render(); };
  qs('#clearBtn').onclick = ()=>{
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_answers`);
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_index`);
    localStorage.removeItem(`rbq_exam_${lang}_${examNumber}_timeleft`);
    answers={}; res.style.display='none'; render();
  };
}
