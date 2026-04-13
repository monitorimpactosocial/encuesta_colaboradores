/* =====================================================
   ENCUESTA COLABORADORES PARACEL
   Survey Form Logic (encuesta.html)
   ===================================================== */

'use strict';

let SURVEY = {
  currentSection: 0,
  answers: {},
  token: null,
  ci: null,
  nombre: null,
  year: new Date().getFullYear(),
  preview: false,
  submitting: false,
};

document.addEventListener('DOMContentLoaded', initSurvey);

function initSurvey() {
  const params = new URLSearchParams(window.location.search);
  SURVEY.year    = params.get('year') || SURVEY.year;
  SURVEY.preview = params.get('preview') === '1';

  const token = params.get('token');
  if (token) {
    SURVEY.token = token;
    try {
      const decoded = atob(decodeURIComponent(token));
      const parts   = decoded.split(':');
      SURVEY.colaboradorId = parts[0];
      SURVEY.ci    = parts[1];
      SURVEY.year  = parts[2] || SURVEY.year;
    } catch {}
  }

  // Pre-fill from query params (fallback)
  if (params.get('ci'))     SURVEY.ci     = params.get('ci');
  if (params.get('nombre')) SURVEY.nombre = params.get('nombre');

  // Restore draft
  const draft = localStorage.getItem('paracel_survey_draft_' + (SURVEY.token || 'anon'));
  if (draft) {
    try { SURVEY.answers = JSON.parse(draft); } catch {}
  }

  document.getElementById('survey-year').textContent = SURVEY.year;
  if (SURVEY.preview) {
    document.getElementById('survey-preview-banner')?.classList.remove('hidden');
  }

  renderSteps();
  renderSection(0);
  setupSurveyNavigation();
}

function renderSteps() {
  const container = document.getElementById('survey-steps');
  container.innerHTML = SECTIONS.map((sec, i) => `
    <div class="survey-step ${i === 0 ? 'active' : ''}" id="step-${i}" title="${sec.title}">
      ${i+1}
    </div>`).join('');
}

function updateSteps(currentIdx) {
  document.querySelectorAll('.survey-step').forEach((el, i) => {
    el.className = 'survey-step';
    if (i < currentIdx)       el.classList.add('done');
    else if (i === currentIdx) el.classList.add('active');
  });
  // Update progress bar
  const pct = Math.round((currentIdx / SECTIONS.length) * 100);
  document.getElementById('survey-progress-bar').style.width = pct + '%';
  document.getElementById('survey-progress-label').textContent = `Sección ${currentIdx+1} de ${SECTIONS.length}`;
}

function renderSection(idx) {
  SURVEY.currentSection = idx;
  updateSteps(idx);

  const sec = SECTIONS[idx];
  const container = document.getElementById('survey-form-container');

  const questionsHtml = sec.questions.map(q => renderQuestion(q)).join('');

  container.innerHTML = `
    <div class="survey-section-header">
      <div class="survey-section-icon">${sec.icon}</div>
      <div class="survey-section-text">
        <h2>${sec.title}</h2>
        <p>${sec.questions.length} pregunta${sec.questions.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
    <div id="questions-container">${questionsHtml}</div>`;

  // Wire conditional visibility
  setupConditions();

  // Restore values from SURVEY.answers
  restoreSection(sec);

  // Pre-fill known data
  if (SURVEY.ci && document.getElementById('q-cedula')) {
    document.getElementById('q-cedula').value = SURVEY.ci;
  }
  if (SURVEY.nombre && document.getElementById('q-nombre_apellido')) {
    document.getElementById('q-nombre_apellido').value = SURVEY.nombre;
  }

  // Update nav buttons
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');

  btnPrev.style.display  = idx > 0 ? 'flex' : 'none';
  btnNext.style.display  = idx < SECTIONS.length - 1 ? 'flex' : 'none';
  btnSubmit.style.display = idx === SECTIONS.length - 1 ? 'flex' : 'none';

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderQuestion(q) {
  const condAttr = q.condition ? `data-condition-field="${q.condition.field}" data-condition-value="${q.condition.value}"` : '';
  const condStyle = q.condition && !conditionMet(q.condition) ? 'style="display:none"' : '';

  let inputHtml = '';
  switch(q.type) {
    case 'text':
    case 'email':
      inputHtml = `<input type="${q.type}" id="q-${q.id}" name="${q.id}" class="form-control"
        placeholder="${q.placeholder||''}" ${q.required?'required':''} value="${esc(SURVEY.answers[q.id]||'')}">`;
      break;
    case 'number':
      inputHtml = `<input type="number" id="q-${q.id}" name="${q.id}" class="form-control"
        min="${q.min||0}" max="${q.max||999}" placeholder="${q.placeholder||''}"
        ${q.required?'required':''} value="${esc(SURVEY.answers[q.id]||'')}">`;
      break;
    case 'date':
      inputHtml = `<input type="date" id="q-${q.id}" name="${q.id}" class="form-control"
        ${q.required?'required':''} value="${esc(SURVEY.answers[q.id]||'')}">`;
      break;
    case 'select':
      inputHtml = `<select id="q-${q.id}" name="${q.id}" class="form-control" ${q.required?'required':''}>
        <option value="">— Seleccione —</option>
        ${(q.options||[]).map(o => `<option value="${esc(o)}" ${SURVEY.answers[q.id]===o?'selected':''}>${esc(o)}</option>`).join('')}
        </select>`;
      break;
    case 'radio':
      inputHtml = `<div class="radio-group${q.options?.length <= 3 ? ' inline' : ''}">
        ${(q.options||[]).map(o => {
          const checked = SURVEY.answers[q.id] === o;
          return `<label class="radio-item ${checked?'selected':''}">
            <input type="radio" name="${q.id}" value="${esc(o)}" ${checked?'checked':''}
              onchange="onRadioChange(this)">
            <span>${esc(o)}</span>
          </label>`;
        }).join('')}
        </div>`;
      break;
    case 'checkbox':
      const savedVals = SURVEY.answers[q.id] || [];
      inputHtml = `<div class="check-group">
        ${(q.options||[]).map(o => {
          const checked = savedVals.includes(o);
          return `<label class="check-item ${checked?'selected':''}">
            <input type="checkbox" name="${q.id}" value="${esc(o)}" ${checked?'checked':''}
              onchange="onCheckChange(this)">
            <span>${esc(o)}</span>
          </label>`;
        }).join('')}
        </div>`;
      break;
    default:
      inputHtml = `<input type="text" id="q-${q.id}" name="${q.id}" class="form-control">`;
  }

  const helpHtml = q.help ? `<div class="form-hint">${esc(q.help)}</div>` : '';

  return `
    <div class="survey-question" id="qwrap-${q.id}" data-qid="${q.id}"
      ${condAttr} ${condStyle}>
      <div class="survey-question-label">
        ${esc(q.label)} ${q.required ? '<span class="req">*</span>' : ''}
      </div>
      ${helpHtml}
      ${inputHtml}
      <div class="form-error" id="qerr-${q.id}"></div>
    </div>`;
}

function onRadioChange(input) {
  const name  = input.name;
  const value = input.value;
  SURVEY.answers[name] = value;
  // Update selected class
  document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
    el.closest('.radio-item')?.classList.toggle('selected', el === input);
  });
  saveDraft();
  setupConditions(); // re-evaluate conditions
}

function onCheckChange(input) {
  const name  = input.name;
  if (!Array.isArray(SURVEY.answers[name])) SURVEY.answers[name] = [];
  if (input.checked) {
    if (!SURVEY.answers[name].includes(input.value)) SURVEY.answers[name].push(input.value);
  } else {
    SURVEY.answers[name] = SURVEY.answers[name].filter(v => v !== input.value);
  }
  input.closest('.check-item')?.classList.toggle('selected', input.checked);
  saveDraft();
}

function collectSectionAnswers() {
  const sec = SECTIONS[SURVEY.currentSection];
  sec.questions.forEach(q => {
    const wrap = document.getElementById(`qwrap-${q.id}`);
    if (!wrap || wrap.style.display === 'none') return; // skip hidden

    if (q.type === 'radio') {
      const checked = document.querySelector(`input[name="${q.id}"]:checked`);
      if (checked) SURVEY.answers[q.id] = checked.value;
    } else if (q.type === 'checkbox') {
      SURVEY.answers[q.id] = Array.from(document.querySelectorAll(`input[name="${q.id}"]:checked`)).map(el=>el.value);
    } else {
      const el = document.getElementById(`q-${q.id}`);
      if (el) SURVEY.answers[q.id] = el.value.trim();
    }
  });
}

function restoreSection(sec) {
  sec.questions.forEach(q => {
    const val = SURVEY.answers[q.id];
    if (val === undefined || val === null) return;
    if (q.type === 'radio') {
      const inp = document.querySelector(`input[name="${q.id}"][value="${CSS.escape(val)}"]`);
      if (inp) { inp.checked = true; inp.closest('.radio-item')?.classList.add('selected'); }
    } else if (q.type === 'checkbox') {
      const vals = Array.isArray(val) ? val : [val];
      vals.forEach(v => {
        const inp = document.querySelector(`input[name="${q.id}"][value="${CSS.escape(v)}"]`);
        if (inp) { inp.checked = true; inp.closest('.check-item')?.classList.add('selected'); }
      });
    } else {
      const el = document.getElementById(`q-${q.id}`);
      if (el && val) el.value = val;
    }
  });
}

function setupConditions() {
  document.querySelectorAll('[data-condition-field]').forEach(wrap => {
    const field = wrap.dataset.conditionField;
    const value = wrap.dataset.conditionValue;
    const met   = conditionMetByField(field, value);
    wrap.style.display = met ? '' : 'none';
    // Clear answer if hidden
    if (!met) {
      const qid = wrap.dataset.qid;
      if (qid) delete SURVEY.answers[qid];
    }
  });
}

function conditionMet(condition) {
  return conditionMetByField(condition.field, condition.value);
}
function conditionMetByField(field, value) {
  const current = SURVEY.answers[field];
  if (Array.isArray(current)) return current.includes(value);
  return current === value;
}

function validateSection() {
  const sec = SECTIONS[SURVEY.currentSection];
  let valid = true;
  sec.questions.forEach(q => {
    const wrap = document.getElementById(`qwrap-${q.id}`);
    if (!wrap || wrap.style.display === 'none') return;
    if (!q.required) return;

    const errEl = document.getElementById(`qerr-${q.id}`);
    let val;
    if (q.type === 'radio') {
      val = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
    } else if (q.type === 'checkbox') {
      val = document.querySelectorAll(`input[name="${q.id}"]:checked`).length;
    } else {
      val = document.getElementById(`q-${q.id}`)?.value.trim();
    }

    if (!val || val === '' || val === 0) {
      wrap.classList.add('has-error');
      if (errEl) { errEl.textContent = 'Este campo es requerido.'; errEl.style.display = 'block'; }
      valid = false;
    } else {
      wrap.classList.remove('has-error');
      if (errEl) errEl.style.display = 'none';
    }
  });
  if (!valid) {
    const firstErr = document.querySelector('.has-error');
    firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return valid;
}

function setupSurveyNavigation() {
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (SURVEY.currentSection > 0) {
      collectSectionAnswers();
      saveDraft();
      renderSection(SURVEY.currentSection - 1);
    }
  });

  document.getElementById('btn-next')?.addEventListener('click', () => {
    collectSectionAnswers();
    if (!validateSection()) return;
    saveDraft();
    renderSection(SURVEY.currentSection + 1);
  });

  document.getElementById('btn-submit')?.addEventListener('click', async () => {
    collectSectionAnswers();
    if (!validateSection()) return;
    if (SURVEY.preview) { alert('Vista previa: el formulario no se enviará.'); return; }
    await submitSurvey();
  });
}

async function submitSurvey() {
  if (SURVEY.submitting) return;
  SURVEY.submitting = true;

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Enviando...';

  const payload = {
    ...SURVEY.answers,
    year:          SURVEY.year,
    token:         SURVEY.token || '',
    colaborador_id: SURVEY.colaboradorId || '',
    submitted_at:  new Date().toISOString(),
    _source:       'webapp_paracel_encuesta',
  };

  // Try to post to Apps Script
  const db = loadLocalDB();
  const appsScriptUrl = db.config?.appsScriptUrl;
  let success = false;

  if (appsScriptUrl) {
    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Apps Script usually needs no-cors
      });
      success = true;
    } catch(e) {
      console.warn('Apps Script submission failed:', e);
    }
  }

  // Always save locally
  saveResponseLocally(payload);

  // Clear draft
  localStorage.removeItem('paracel_survey_draft_' + (SURVEY.token || 'anon'));

  // Mark collaborador as completed
  if (SURVEY.colaboradorId) {
    const localDb = loadLocalDB();
    const colab   = localDb.colaboradores?.find(c => c.id === SURVEY.colaboradorId);
    if (colab) {
      colab.status      = 'completado';
      colab.completedAt = new Date().toISOString();
      saveLocalDB(localDb);
    }
  }

  // Show success
  showSurveySuccess();
}

function saveResponseLocally(data) {
  const db  = loadLocalDB();
  const key = `responses${data.year || new Date().getFullYear()}`;
  if (!Array.isArray(db[key])) db[key] = [];
  db[key].push(data);
  saveLocalDB(db);
}

function loadLocalDB() {
  try { return JSON.parse(localStorage.getItem('paracel_encuesta_app_v2')) || {}; }
  catch { return {}; }
}
function saveLocalDB(db) {
  try { localStorage.setItem('paracel_encuesta_app_v2', JSON.stringify(db)); } catch {}
}

function saveDraft() {
  const key = 'paracel_survey_draft_' + (SURVEY.token || 'anon');
  try { localStorage.setItem(key, JSON.stringify(SURVEY.answers)); } catch {}
}

function showSurveySuccess() {
  const container = document.querySelector('.survey-container');
  const nombre    = SURVEY.answers.nombre_apellido || SURVEY.nombre || 'colaborador/a';
  container.innerHTML = `
    <div class="survey-card survey-submitted">
      <div class="survey-submitted-icon">🎉</div>
      <h2>¡Muchas gracias, ${esc(nombre)}!</h2>
      <p>Tu encuesta fue enviada exitosamente.<br>Tu participación es muy valiosa para Paracel.</p>
      <div style="margin-top:24px">
        <p style="color:var(--text-muted);font-size:0.85rem">Año: ${SURVEY.year}</p>
      </div>
    </div>`;
}

// Utility
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
