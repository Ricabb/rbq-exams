let questions = [];
let currentIndex = 0;
let answers = {};
let timeLeft;
let examNumber = "1";
let timer;

function qs(sel){ return document.querySelector(sel); }
function fmtTime(sec){
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');
}
function saveProgress(){
  localStorage.setItem(`rbq_exam_${examNumber}_answers`, JSON.stringify(answers));
  localStorage.setItem(`rbq_exam_${examNumber}_index`, String(currentIndex));
  localStorage.setItem(`rbq_exam_${examNumber}_timeleft`, String(timeLeft));
}
function loadProgress(){
  answers = JSON.parse(localStorage.getItem(`rbq_exam_${examNumber}_answers`)||"{}");
  const idx = localStorage.getItem(`rbq_exam_${examNumber}_index`);
  const t = localStorage.getItem(`rbq_exam_${examNumber}_timeleft`);
  if(idx!==null) currentIndex = parseInt(idx,10);
  if(t!==null) timeLeft = parseInt(t,10);
}

(function init(){
  const params = new URLSearchParams(window.location.search);
  examNumber = params.get("exam") || "1";
  fetch(`questions/exam${examNumber}.json`)
    .then(r=>r.json())
    .then(data=>{
      questions = data.slice();
      // Shuffle questions to reduce memorization
      for(let i=questions.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [questions[i],questions[j]]=[questions[j],questions[i]];
      }
      // Default: 120 minutes for 50 questions (adjust as needed)
      if(timeLeft==null) timeLeft = 120*60;
      loadProgress();
      render();
      startTimer();
      window.addEventListener('beforeunload', saveProgress);
      document.addEventListener('keydown', handleKeys);
    }).catch(err=>{
      qs('#exam-container').innerHTML = `<p style="color:#b00">Failed to load exam file. ${err}</p>`;
    });
})();

function handleKeys(e){
  if(e.key==='ArrowRight') goNext();
  if(e.key==='ArrowLeft') goPrev();
}

function startTimer(){
  clearInterval(timer);
  timer = setInterval(()=>{
    qs('#timer').textContent = fmtTime(timeLeft);
    if(timeLeft<=0){
      clearInterval(timer);
      submitExam();
      return;
    }
    timeLeft--;
    if(timeLeft % 5 === 0) saveProgress();
  }, 1000);
}

// ===== Rendering =====
function render(){
  const q = questions[currentIndex];
  if(!q) return;
  const total = questions.length;
  qs('#progressText').textContent = `Question ${currentIndex+1} / ${total}`;

  const container = qs('#exam-container');
  container.innerHTML = `
    <div class="question"><strong>${currentIndex+1}.</strong> ${q.question}</div>
    ${q.choices.map((c,i)=>`
      <button class="choice-btn ${answers[currentIndex]===i?'selected':''}" data-i="${i}">${c}</button>
    `).join('')}
  `;
  container.querySelectorAll('.choice-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>selectAnswer(parseInt(btn.dataset.i,10)));
  });
  qs('#timer').textContent = fmtTime(timeLeft);

  // Bind nav
  qs('#prevBtn').onclick = goPrev;
  qs('#nextBtn').onclick = goNext;
  qs('#submitBtn').onclick = submitExam;
}

function selectAnswer(i){
  answers[currentIndex] = i;
  saveProgress();
  render();
}
function goPrev(){ if(currentIndex>0){ currentIndex--; render(); saveProgress(); } }
function goNext(){ if(currentIndex<questions.length-1){ currentIndex++; render(); saveProgress(); } }

// ===== Submit & Review =====
function submitExam(){
  clearInterval(timer);
  let score = 0;
  questions.forEach((q,idx)=>{ if(answers[idx]===q.answer) score++; });

  const pct = Math.round((score/questions.length)*100);
  const res = qs('#result');
  res.className = (pct>=60? 'result-good' : 'result-bad');
  res.style.display = 'block';
  res.innerHTML = `
    <h2>Result</h2>
    <p>You scored <strong>${score}</strong> / ${questions.length} <span class="badge">${pct}%</span></p>
    <div class="review">
      <h3>Review</h3>
      ${questions.map((q,idx)=>{
        const user = answers[idx];
        const correct = q.answer;
        const isRight = user===correct;
        const uTxt = (user!=null ? q.choices[user] : "<em>No answer</em>");
        return `<details ${!isRight?'open':''}><summary>${idx+1}. ${isRight?'✅':'❌'} ${q.question}</summary>
          <div><strong>Your answer:</strong> ${uTxt}</div>
          <div><strong>Correct:</strong> ${q.choices[correct]}</div>
        </details>`;
      }).join('')}
    </div>
    <p><button class="primary" id="retryBtn">Retry Exam</button>
       <button id="clearBtn">Clear Answers</button></p>
  `;
  qs('#retryBtn').onclick = ()=>{
    answers={}; currentIndex=0; timeLeft=120*60;
    saveProgress();
    res.style.display='none';
    startTimer();
    render();
  };
  qs('#clearBtn').onclick = ()=>{
    localStorage.removeItem(`rbq_exam_${examNumber}_answers`);
    localStorage.removeItem(`rbq_exam_${examNumber}_index`);
    localStorage.removeItem(`rbq_exam_${examNumber}_timeleft`);
    answers={};
    res.style.display='none';
    render();
  };
}
