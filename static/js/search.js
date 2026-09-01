(function() {
  let searchIndex = null;
  let activeIndex = 0;
  let searchResults = [];

  function decodeHtml(html) {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  async function loadSearchIndex() {
    if (!searchIndex) {
      try {
        const res = await fetch('/index.json');
        searchIndex = await res.json();
      } catch (e) {
        console.error('Failed to load search index:', e);
        searchIndex = [];
      }
    }
    return searchIndex;
  }

  window.openSearch = async function() {
    const modal = document.getElementById('search-modal');
    modal.style.display = 'flex';
    const input = document.getElementById('search-input');
    input.value = '';
    input.focus();
    await loadSearchIndex();
  };

  window.closeSearch = function() {
    const modal = document.getElementById('search-modal');
    modal.style.display = 'none';
  };

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
    }
  });

  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      performSearch(q);
    });

    input.addEventListener('keydown', (e) => {
      const resultsList = document.querySelectorAll('.search-result-item');
      if (resultsList.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % resultsList.length;
        updateActiveResult(resultsList);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + resultsList.length) % resultsList.length;
        updateActiveResult(resultsList);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[activeIndex]) {
          window.location.href = searchResults[activeIndex].url;
        }
      }
    });
  }

  function performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    const previewContainer = document.getElementById('search-preview');
    if (!query || !searchIndex) {
      resultsContainer.innerHTML = '';
      previewContainer.innerHTML = '<div class="search-preview-placeholder">Select a note to preview</div>';
      searchResults = [];
      return;
    }

    const terms = query.split(/\s+/).filter(t => t.length > 0);
    searchResults = searchIndex.filter(item => {
      const titleLower = (item.title || '').toLowerCase();
      const contentLower = (item.content || '').toLowerCase();
      return terms.every(t => titleLower.includes(t) || contentLower.includes(t));
    }).slice(0, 30);

    if (searchResults.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--text-muted);">No matching clinical notes found.</div>';
      previewContainer.innerHTML = '';
      return;
    }

    activeIndex = 0;
    resultsContainer.innerHTML = searchResults.map((item, idx) => `
      <div class="search-result-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" onclick="window.location.href='${item.url}'" onmouseenter="showPreview(${idx})">
        <div class="search-res-title">${decodeHtml(item.title)}</div>
        <div class="search-res-cat">${(item.category || '').replace('notes/', '')}</div>
      </div>
    `).join('');

    showPreview(0);
  }

  window.showPreview = function(idx) {
    activeIndex = idx;
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((el, i) => el.classList.toggle('active', i === idx));

    const item = searchResults[idx];
    const previewContainer = document.getElementById('search-preview');
    if (item && previewContainer) {
      let previewHtml = '';
      if (item.html) {
        previewHtml = item.html;
      } else {
        previewHtml = `<p style="font-size: 0.9rem; line-height: 1.6;">${decodeHtml(item.content).substring(0, 1000)}...</p>`;
      }

      // Replace any mermaid blocks or diagrams with a clean, styled placeholder card
      previewHtml = previewHtml
        .replace(/<pre[^>]*class=["']?[^"']*mermaid[^"']*["']?[^>]*>[\s\S]*?<\/pre>/gi, '<div class="search-diagram-badge"><span class="search-diagram-icon">📊</span><span class="search-diagram-text">Diagram here, Open note to view</span></div>')
        .replace(/<div[^>]*class=["']?[^"']*mermaid[^"']*["']?[^>]*>[\s\S]*?<\/div>/gi, '<div class="search-diagram-badge"><span class="search-diagram-icon">📊</span><span class="search-diagram-text">Diagram here, Open note to view</span></div>')
        .replace(/<code[^>]*class=["']?[^"']*language-mermaid[^"']*["']?[^>]*>[\s\S]*?<\/code>/gi, '<div class="search-diagram-badge"><span class="search-diagram-icon">📊</span><span class="search-diagram-text">Diagram here, Open note to view</span></div>');

      previewContainer.innerHTML = `
        <h3 class="search-preview-title">${decodeHtml(item.title)}</h3>
        <div class="search-preview-body cm-s-obsidian note-content">${previewHtml}</div>
      `;

      // Double-check DOM for any remaining mermaid nodes
      previewContainer.querySelectorAll('.mermaid, pre[class*="mermaid"], code[class*="mermaid"]').forEach(el => {
        const badge = document.createElement('div');
        badge.className = 'search-diagram-badge';
        badge.innerHTML = '<span class="search-diagram-icon">📊</span><span class="search-diagram-text">Diagram here, Open note to view</span>';
        el.replaceWith(badge);
      });

      // Auto-render KaTeX LaTeX math in preview
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(previewContainer, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }

      // Re-create icons if any
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  };

  function updateActiveResult(elements) {
    elements.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    elements[activeIndex].scrollIntoView({ block: 'nearest' });
    showPreview(activeIndex);
  }
})();
