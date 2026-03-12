document.addEventListener("DOMContentLoaded", function() {
const API_KEY_MISSING_MSG = "Para usar o LM EduKids, configure sua chave da API Gemini.";

let currentGrade = "1";
let uploadedImageBase64 = null;
let uploadedImageType = null;
let totalStars = 0;
let quizAnswers = {};
let quizCorrect = 0;
let quizTotal = 0;

// Grade buttons
document.querySelectorAll('.grade-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGrade = btn.dataset.grade;
  });
});

// File inputs
const fileInputCamera = document.getElementById('fileInputCamera');
const fileInputGallery = document.getElementById('fileInputGallery');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadZone = document.getElementById('uploadZone');

// Camera button
document.getElementById('cameraBtn').addEventListener('click', () => {
  fileInputCamera.value = '';
  fileInputCamera.click();
});

// Gallery/file button
document.getElementById('galleryBtn').addEventListener('click', () => {
  fileInputGallery.value = '';
  fileInputGallery.click();
});

fileInputCamera.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

fileInputGallery.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Drag and drop
const uploadCard = document.getElementById('uploadCard');
uploadCard.addEventListener('dragover', (e) => { e.preventDefault(); uploadCard.classList.add('drag-over'); });
uploadCard.addEventListener('dragleave', () => uploadCard.classList.remove('drag-over'));
uploadCard.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadCard.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    const base64 = result.split(',')[1];
    uploadedImageBase64 = base64;
    uploadedImageType = file.type;
    previewImage.src = result;
    previewContainer.style.display = 'block';
    uploadZone.style.display = 'none';
    document.getElementById('btnText').textContent = 'Analisar Tarefa com IA! 🚀';
    document.getElementById('btnIcon').textContent = '🚀';
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

document.getElementById('removeBtn').addEventListener('click', () => {
  uploadedImageBase64 = null;
  uploadedImageType = null;
  previewContainer.style.display = 'none';
  uploadZone.style.display = 'block';
  fileInputCamera.value = '';
  fileInputGallery.value = '';
  document.getElementById('btnText').textContent = 'Envie uma foto primeiro';
  document.getElementById('btnIcon').textContent = '🔍';
  analyzeBtn.disabled = true;
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Analyze button
analyzeBtn.addEventListener('click', analyzeTask);

document.getElementById('newTaskBtn').addEventListener('click', () => {
  document.getElementById('results').style.display = 'none';
  document.getElementById('uploadCard').style.display = 'block';
  uploadedImageBase64 = null;
  uploadedImageType = null;
  previewContainer.style.display = 'none';
  uploadZone.style.display = 'block';
  fileInputCamera.value = '';
  fileInputGallery.value = '';
  document.getElementById('btnText').textContent = 'Envie uma foto primeiro';
  document.getElementById('btnIcon').textContent = '🔍';
  analyzeBtn.disabled = true;
  quizAnswers = {};
  quizCorrect = 0;
  quizTotal = 0;
  document.getElementById('quizScore').style.display = 'none';
  document.getElementById('starsReward').style.display = 'none';
  // Reset tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="explanation"]').classList.add('active');
  document.getElementById('tab-explanation').classList.add('active');
});

async function analyzeTask() {
  if (!uploadedImageBase64) return;

  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingOverlay.classList.add('active');

  const loadingMessages = [
    "Analisando a tarefa... 🔍",
    "Entendendo o assunto... 🧠",
    "Criando explicação mágica... ✨",
    "Inventando exercícios divertidos... 🎨",
    "Preparando o quiz... 🎮",
    "Quase pronto... 🚀"
  ];

  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIdx];
  }, 1500);

  try {
    // Envia imagem + série para o backend Gemini
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: uploadedImageBase64,
        imageType: uploadedImageType,
        grade: currentGrade
      })
    });

    clearInterval(msgInterval);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || `Erro ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();

    let parsed;
    try {
      parsed = JSON.parse(data.content);
    } catch (e) {
      throw new Error('Não foi possível interpretar a resposta da IA. Tente novamente.');
    }

    loadingOverlay.classList.remove('active');
    renderResults(parsed);

  } catch (err) {
    clearInterval(msgInterval);
    loadingOverlay.classList.remove('active');
    alert('Erro ao analisar: ' + err.message + '\n\nTente novamente.');
  }
}

function renderResults(data) {
  // Show results
  document.getElementById('uploadCard').style.display = 'none';
  document.getElementById('results').style.display = 'block';

  // Render explanation
  renderExplanation(data.explicacao, data.topico);

  // Render exercises
  renderExercises(data.exercicios);

  // Render quiz
  renderQuiz(data.quiz);

  // Render tips
  renderTips(data.dicas_pais);

  // Reset tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="explanation"]').classList.add('active');
  document.getElementById('tab-explanation').classList.add('active');

  // Scroll to results
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderExplanation(exp, topico) {
  const html = `
    <h3>📌 Assunto: ${topico}</h3>
    <p>${exp.intro}</p>
    ${exp.conceitos.map(c => `
      <div style="background:#F8FBFF;border-radius:14px;padding:14px 16px;margin:12px 0;border-left:4px solid var(--sky);">
        <strong>${c.emoji} ${c.titulo}</strong>
        <p style="margin-top:6px;margin-bottom:0;">${c.descricao}</p>
      </div>
    `).join('')}
    <h3>💡 Exemplo do dia a dia</h3>
    <p>${exp.exemplo}</p>
    <h3>🌈 Você sabia?</h3>
    <p>${exp.curiosidade}</p>
  `;
  document.getElementById('explanationContent').innerHTML = html;
}

// Armazena as respostas corretas para acesso via event delegation
const exerciseAnswers = {};
const quizExplanations = {};

function renderExercises(exercises) {
  const html = exercises.map((ex, i) => {
    exerciseAnswers[i] = ex.resposta;
    return `
    <div class="exercise-item" id="exercise-${i}">
      <div class="exercise-number">${i + 1}</div>
      <div class="exercise-question">${ex.pergunta}</div>
      <div style="font-size:13px;color:#8899AA;margin-bottom:10px;font-weight:600;">💡 Dica: ${ex.dica}</div>
      <textarea class="exercise-answer-area" id="answer-${i}" placeholder="Digite sua resposta aqui..." rows="2"></textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px;">
        <button class="check-btn" data-action="check" data-idx="${i}">
          ✓ Verificar resposta
        </button>
        <button data-action="reveal" data-idx="${i}" style="padding:10px 16px;background:white;border:2px solid #E0E8F0;border-radius:12px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;color:#8899AA;cursor:pointer;transition:all 0.2s;">
          👁 Ver resposta
        </button>
      </div>
      <div class="feedback-box" id="feedback-${i}"></div>
    </div>`;
  }).join('');

  const container = document.getElementById('exercisesContent');
  container.innerHTML = html;

  // Event delegation — um único listener para todos os botões
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.idx);
    const correctAnswer = exerciseAnswers[idx];

    if (action === 'check') {
      const userAnswer = document.getElementById(`answer-${idx}`).value.trim().toLowerCase();
      const correct = correctAnswer.toLowerCase().trim();
      const feedback = document.getElementById(`feedback-${idx}`);

      if (!userAnswer) {
        alert('Escreva sua resposta antes de verificar! ✏️');
        return;
      }

      // Verificação flexível: exata, ou contém, ou número correto presente
      const normalize = s => s.replace(/[^a-záéíóúãõâêîôûàèìòùç0-9]/gi, '').toLowerCase();
      const nu = normalize(userAnswer);
      const nc = normalize(correct);
      const isCorrect = nu === nc || nc.includes(nu) || nu.includes(nc) || (nc.length > 0 && nu.length > 0 && nc.startsWith(nu.slice(0,4)));

      if (isCorrect) {
        feedback.className = 'feedback-box correct';
        feedback.innerHTML = '🌟 Muito bem! Você acertou!';
        feedback.style.display = 'flex';
        addStar();
      } else {
        feedback.className = 'feedback-box incorrect';
        feedback.innerHTML = `😊 Quase lá! A resposta correta é: <strong style="margin-left:6px">${correctAnswer}</strong>`;
        feedback.style.display = 'flex';
      }
    }

    if (action === 'reveal') {
      const feedback = document.getElementById(`feedback-${idx}`);
      feedback.className = 'feedback-box incorrect';
      feedback.innerHTML = `📖 Resposta: <strong style="margin-left:6px">${correctAnswer}</strong>`;
      feedback.style.display = 'flex';
    }
  });
}

function renderQuiz(quizData) {
  quizTotal = quizData.length;
  quizCorrect = 0;

  const html = quizData.map((q, i) => {
    quizExplanations[i] = { correta: q.correta, explicacao: q.explicacao };
    return `
    <div class="exercise-item" id="quiz-item-${i}" style="margin-bottom:20px;">
      <div class="exercise-number">${i + 1}</div>
      <div class="exercise-question">${q.pergunta}</div>
      <div class="quiz-options">
        ${q.opcoes.map((opt, j) => `
          <button class="quiz-option" id="quiz-opt-${i}-${j}"
            data-action="quiz" data-q="${i}" data-opt="${j}">
            <span class="option-letter">${['A','B','C','D'][j]}</span>
            ${opt.replace(/^[A-D]\)\s*/, '')}
          </button>
        `).join('')}
      </div>
      <div class="feedback-box" id="quiz-feedback-${i}"></div>
    </div>`;
  }).join('');

  const container = document.getElementById('quizContent');
  container.innerHTML = html;

  // Event delegation para o quiz
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action="quiz"]');
    if (!btn || btn.disabled) return;

    const questionIdx = parseInt(btn.dataset.q);
    const selectedIdx = parseInt(btn.dataset.opt);
    const { correta: correctIdx, explicacao: explanation } = quizExplanations[questionIdx];

    // Desabilita todas as opções dessa questão
    for (let j = 0; j < 4; j++) {
      const optBtn = document.getElementById(`quiz-opt-${questionIdx}-${j}`);
      if (optBtn) {
        optBtn.disabled = true;
        if (j === correctIdx) optBtn.classList.add('correct');
        else if (j === selectedIdx && j !== correctIdx) optBtn.classList.add('wrong');
      }
    }

    const feedback = document.getElementById(`quiz-feedback-${questionIdx}`);
    const isCorrect = selectedIdx === correctIdx;

    if (isCorrect) {
      quizCorrect++;
      feedback.className = 'feedback-box correct';
      feedback.innerHTML = `🌟 Correto! ${explanation}`;
      addStar();
    } else {
      feedback.className = 'feedback-box incorrect';
      feedback.innerHTML = `💪 ${explanation}`;
    }
    feedback.style.display = 'flex';

    updateQuizScore();
  });
}

function updateQuizScore() {
  const answered = document.querySelectorAll('.quiz-option[disabled]').length / 4;
  if (answered > 0) {
    document.getElementById('quizScore').style.display = 'flex';
    document.getElementById('scoreText').textContent = `${quizCorrect}/${Math.floor(document.querySelectorAll('.quiz-option[disabled]').length / 4)}`;
  }

  // Check if quiz complete
  const allAnswered = document.querySelectorAll('.quiz-option[disabled]').length === quizTotal * 4;
  if (allAnswered) {
    showStarsReward(quizCorrect, quizTotal);
  }
}

function showStarsReward(correct, total) {
  const pct = correct / total;
  let stars, msg;

  if (pct === 1) {
    stars = '⭐⭐⭐⭐⭐';
    msg = 'Perfeito! Você é um supercampeão! 🏆';
  } else if (pct >= 0.75) {
    stars = '⭐⭐⭐⭐';
    msg = 'Muito bem! Você arrasouu! 🎉';
  } else if (pct >= 0.5) {
    stars = '⭐⭐⭐';
    msg = 'Boa! Continue praticando! 💪';
  } else if (pct >= 0.25) {
    stars = '⭐⭐';
    msg = 'Você está melhorando! Tente de novo! 😊';
  } else {
    stars = '⭐';
    msg = 'Revise o assunto e tente de novo! 📚';
  }

  document.getElementById('rewardStars').textContent = stars;
  document.getElementById('rewardText').textContent = msg;
  document.getElementById('starsReward').style.display = 'block';
}

function renderTips(tips) {
  const html = tips.map(tip => `
    <div class="tip-item">
      <span class="tip-icon">${tip.emoji}</span>
      <div class="tip-text">
        <strong>${tip.titulo}</strong>
        ${tip.texto}
      </div>
    </div>
  `).join('');

  document.getElementById('tipsContent').innerHTML = html;
}

function addStar() {
  totalStars++;
  document.getElementById('starCount').textContent = totalStars;

  // Animate badge
  const badge = document.getElementById('starsBadge');
  badge.style.transform = 'scale(1.2)';
  setTimeout(() => badge.style.transform = 'scale(1)', 300);
  badge.style.transition = 'transform 0.3s ease';
}

// ─── Salvar PDF ───────────────────────────────────────────────────────────────
document.getElementById('savePdfBtn').addEventListener('click', savePDF);

function savePDF() {
  const btn = document.getElementById('savePdfBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Gerando PDF...';
  btn.disabled = true;

  // Coleta conteúdo de cada seção diretamente do DOM renderizado
  const explanationHTML = document.getElementById('explanationContent').innerHTML;
  const exercisesHTML   = document.getElementById('exercisesContent').innerHTML;
  const quizHTML        = document.getElementById('quizContent').innerHTML;
  const tipsHTML        = document.getElementById('tipsContent').innerHTML;

  const pdfContent = `
    <div style="font-family: Arial, sans-serif; color: #1a202c; padding: 10px;">

      <!-- Cabeçalho -->
      <div style="text-align:center; margin-bottom:28px; padding-bottom:16px; border-bottom:3px solid #667EEA;">
        <div style="font-size:28px; font-weight:900; color:#667EEA; margin-bottom:4px;">LM EduKids ✨</div>
        <div style="font-size:13px; color:#718096;">Aprender é Divertido com IA</div>
      </div>

      <!-- Explicação -->
      <div style="margin-bottom:28px;">
        <div style="background:#667EEA; color:white; padding:10px 16px; border-radius:10px; font-size:15px; font-weight:800; margin-bottom:14px;">
          🌟 Explicação
        </div>
        <div style="padding:0 8px; font-size:13px; line-height:1.7;">${explanationHTML}</div>
      </div>

      <!-- Exercícios -->
      <div style="margin-bottom:28px;">
        <div style="background:#F6AD55; color:white; padding:10px 16px; border-radius:10px; font-size:15px; font-weight:800; margin-bottom:14px;">
          ✏️ Exercícios
        </div>
        <div style="padding:0 8px; font-size:13px; line-height:1.7;">${exercisesHTML}</div>
      </div>

      <!-- Quiz -->
      <div style="margin-bottom:28px;">
        <div style="background:#9F7AEA; color:white; padding:10px 16px; border-radius:10px; font-size:15px; font-weight:800; margin-bottom:14px;">
          🎮 Quiz
        </div>
        <div style="padding:0 8px; font-size:13px; line-height:1.7;">${quizHTML}</div>
      </div>

      <!-- Dicas -->
      <div style="margin-bottom:20px;">
        <div style="background:#F6AD55; color:white; padding:10px 16px; border-radius:10px; font-size:15px; font-weight:800; margin-bottom:14px;">
          💡 Dicas para os Pais
        </div>
        <div style="padding:0 8px; font-size:13px; line-height:1.7;">${tipsHTML}</div>
      </div>

      <!-- Rodapé -->
      <div style="text-align:center; margin-top:24px; padding-top:12px; border-top:2px solid #E2E8F0; font-size:11px; color:#A0AEC0;">
        Gerado pelo LM EduKids • aprender é divertido! 🚀
      </div>
    </div>
  `;

  const elemento = document.createElement('div');
  elemento.innerHTML = pdfContent;
  document.body.appendChild(elemento);

  const opcoes = {
    margin:       [10, 10, 10, 10],
    filename:     'LMEduKids-Aula.pdf',
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opcoes).from(elemento).save().then(() => {
    document.body.removeChild(elemento);
    btn.innerHTML = originalText;
    btn.disabled = false;
  }).catch(() => {
    document.body.removeChild(elemento);
    btn.innerHTML = originalText;
    btn.disabled = false;
    alert('Erro ao gerar PDF. Tente novamente.');
  });
}
});
