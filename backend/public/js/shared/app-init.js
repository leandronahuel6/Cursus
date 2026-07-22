const trigger = document.getElementById('btn-toggle-student-menu');
const popup = document.getElementById('student-menu-popup');
const caret = document.getElementById('student-menu-caret');

if (trigger && popup && caret) {
  trigger.addEventListener('click', function (event) {
    event.stopPropagation();
    popup.classList.toggle('open');
    caret.style.transform = popup.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  document.addEventListener('click', function (event) {
    if (popup.classList.contains('open') && !popup.contains(event.target) && !trigger.contains(event.target)) {
      popup.classList.remove('open');
      caret.style.transform = 'rotate(0deg)';
    }
  });
}
