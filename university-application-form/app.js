const form = document.querySelector('#application-form');
const sections = [...document.querySelectorAll('.form-step')];
const steps = [...document.querySelectorAll('.step')];
const backButton = document.querySelector('#back-button');
const nextButton = document.querySelector('#next-button');
const reviewButton = document.querySelector('#review-button');
const saveButton = document.querySelector('#save-button');
const printButton = document.querySelector('#print-button');
const reviewCard = document.querySelector('#review-card');
const toast = document.querySelector('#toast');
const progressBar = document.querySelector('#progress-bar');
const mobileStepLabel = document.querySelector('#mobile-step-label');
const storageKey = 'university-application-draft-v1';
let currentStep = 0;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateView() {
  sections.forEach((section, index) => section.classList.toggle('is-visible', index === currentStep));
  steps.forEach((step, index) => {
    step.classList.toggle('is-active', index === currentStep);
    step.classList.toggle('is-complete', index < currentStep);
    step.toggleAttribute('aria-current', index === currentStep);
  });
  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === sections.length - 1;
  reviewButton.hidden = currentStep !== sections.length - 1;
  mobileStepLabel.textContent = `Step ${currentStep + 1} of ${sections.length}`;
  progressBar.style.width = `${((currentStep + 1) / sections.length) * 100}%`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateControl(control) {
  const field = control.closest('.field');
  const valid = control.checkValidity();
  if (field) field.classList.toggle('has-error', !valid);
  control.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function validateGroup(group) {
  const checked = group.querySelector('input:checked');
  group.classList.toggle('has-error', !checked);
  return Boolean(checked);
}

function validateStep(index) {
  const section = sections[index];
  const controls = [...section.querySelectorAll('input, select, textarea')];
  let valid = true;
  controls.forEach(control => {
    if (control.type === 'checkbox' && !control.required) return;
    if (!validateControl(control)) valid = false;
  });
  section.querySelectorAll('[data-required-group]').forEach(group => {
    if (!validateGroup(group)) valid = false;
  });

  const declaration = section.querySelector('.declaration input');
  if (declaration) {
    declaration.closest('.declaration').classList.toggle('has-error', !declaration.checked);
    if (!declaration.checked) valid = false;
  }

  if (!valid) {
    section.querySelector('[aria-invalid="true"], .has-error input')?.focus();
    showToast('Please complete the highlighted fields.');
  }
  return valid;
}

function serializeForm() {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (data[key]) data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
    else data[key] = value;
  });
  return data;
}

function saveDraft(showMessage = true) {
  localStorage.setItem(storageKey, JSON.stringify(serializeForm()));
  if (showMessage) showToast('Draft saved on this device.');
}

function restoreDraft() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([name, value]) => {
      const controls = [...form.elements].filter(control => control.name === name);
      controls.forEach(control => {
        if (control.type === 'checkbox') control.checked = Array.isArray(value) ? value.includes(control.value) : control.value === value;
        else control.value = value;
      });
    });
    showToast('Your saved draft has been restored.');
  } catch {
    localStorage.removeItem(storageKey);
  }
}

nextButton.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  saveDraft(false);
  currentStep += 1;
  updateView();
});

backButton.addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  updateView();
});

steps.forEach((step, index) => step.addEventListener('click', () => {
  if (index > currentStep && !validateStep(currentStep)) return;
  currentStep = index;
  updateView();
}));

saveButton.addEventListener('click', () => saveDraft());
printButton.addEventListener('click', () => window.print());

form.addEventListener('input', event => {
  if (event.target.matches('input, select, textarea')) validateControl(event.target);
  event.target.closest('[data-required-group]')?.classList.remove('has-error');
  event.target.closest('.declaration')?.classList.remove('has-error');
  reviewCard.hidden = true;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateStep(currentStep)) return;
  saveDraft(false);
  reviewCard.hidden = false;
  reviewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Application checked successfully.');
});

restoreDraft();
updateView();
