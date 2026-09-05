(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${savedTheme}`);

  window.toggleTheme = function() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${newTheme}`);
    localStorage.setItem('theme', newTheme);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof window.renderMermaidDiagrams === 'function') window.renderMermaidDiagrams();
  };
})();
