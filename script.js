let questions = [];
let currentIndex = 0;
let answers = {};
let timeLeft = 60 * 60; // 1 hour in seconds

// Load exam based on URL param
const params = new URLSearchParams(window.location.search);
const examNumber = params.get("exam") || "1";

fetch(`questions/exam${examNumber}.json`)
  .then(res => res.json())
  .then(data => {
    questions = data;
    showQuestion();
    startTimer();
  });

function showQuestion() {
  let q = questions[currentIndex];
  if (!q) return;

  let container = document.getElementById("exam-container");
  container.innerHTML = `
    <h3>Question ${currentIndex + 1} of ${questions.length}</h3>
    <p>${q.question}</p>
    ${q.choices.map((c, i) => `
      <button class="choice-btn ${answers[currentIndex] === i ? "selected" : ""}" 
              onclick="selectAnswer(${i})">${c}</button>
    `).join("")}
  `;
}

function selectAnswer(i) {
  answers[currentIndex] = i;
  showQuestion();
}

document.getElementById("prevBtn").onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showQuestion();
  }
};

document.getElementById("submitBtn").onclick = submitExam;

function startTimer() {
  let timerElement = document.getElementById("timer");
  let timer = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      submitExam();
    }
    timeLeft--;
  }, 1000);
}

function submitExam() {
  let score = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.answer) {
      score++;
    }
  });

  document.getElementById("result").textContent = 
    `You scored ${score} out of ${questions.length}`;
}
