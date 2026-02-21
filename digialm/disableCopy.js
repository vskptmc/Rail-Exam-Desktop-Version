// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable printing (Ctrl+P, Print Preview, etc.)
window.addEventListener('beforeprint', function (e) {
  alert("Printing is disabled on this exam portal.");
  e.preventDefault();
});

// Block print shortcut (Ctrl+P)
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    alert("Printing is disabled on this exam portal.");
  }
});

