(function() {
  let searchIndex = null;
  let isFetching = false;
  let activeIndex = 0;
  let searchResults = [];
  let pendingQuery = null;

  const ACRONYMS = {
    'sam': ['severe', 'acute', 'malnutrition'],
    'tb': ['tuberculosis'],
    'jaundice': ['hyperbilirubinemia', 'icterus'],
    'dka': ['diabetic', 'ketoacidosis'],
    'ards': ['respiratory', 'distress'],
    'uti': ['urinary', 'tract'],
    'svt': ['supraventricular', 'tachycardia'],
    'kd': ['kawasaki'],
    'psgn': ['glomerulonephritis'],
    'hie': ['hypoxic', 'ischemic', 'encephalopathy']
  };

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatches(text, words) {
    if (!text || !words || !words.length) return text || '';
    let result = text;
    for (const w of words) {
      if (w.length < 2) continue;
      const re = new RegExp('(' + escapeRegex(w) + ')', 'gi');
      result = result.replace(re, '<mark class="search-mark">$1</mark>');
    }
    return result;
  }

  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    if (isFetching) return null;

    isFetching = true;
    try {
      const res = await fetch('/index.json');
      searchIndex = await res.json();
      isFetching = false;
      if (pendingQuery !== null) {
        performSearch(pendingQuery);
        pendingQuery = null;
      }
    } catch (e) {
      console.error('Failed to load search index:', e);
      searchIndex = [];
      isFetching = false;
    }
    return searchIndex;
  }

  // Preload search index in background
  if (document.readyState === 'complete') {
    setTimeout(loadSearchIndex, 200);
  } else {
    window.addEventListener('load', () => setTimeout(loadSearchIndex, 200));
  }

  window.openSearch = function() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    const input = document.getElementById('search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    loadSearchIndex();
  };

  window.closeSearch = function() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.style.display = 'none';
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
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      debounceTimer = setTimeout(() => performSearch(q), 40);
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

  function scoreItem(item, queryLower, queryWords) {
    const title = (item.title || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const tags = (item.tags || []).map(t => String(t).toLowerCase()).join(' ');
    const snippet = (item.snippet || '').toLowerCase();

    // Exact title match
    if (title === queryLower) return 250;

    let score = 0;
    if (title.startsWith(queryLower)) {
      score += 100;
    } else if (title.includes(queryLower)) {
      score += 70;
    }

    let wordsFoundInTitle = 0;
    let allWordsMatched = true;

    for (const w of queryWords) {
      let wordMatched = false;

      if (title.includes(w)) {
        score += 40;
        wordsFoundInTitle++;
        wordMatched = true;
      } else if (cat.includes(w)) {
        score += 20;
        wordMatched = true;
      } else if (tags.includes(w)) {
        score += 15;
        wordMatched = true;
      } else if (snippet.includes(w)) {
        score += 6;
        wordMatched = true;
      }

      // Acronym expansion matching
      const expansions = ACRONYMS[w];
      if (expansions) {
        for (const exp of expansions) {
          if (title.includes(exp)) {
            score += 35;
            wordMatched = true;
            break;
          } else if (snippet.includes(exp)) {
            score += 10;
            wordMatched = true;
            break;
          }
        }
      }

      if (!wordMatched) {
        allWordsMatched = false;
      }
    }

    if (wordsFoundInTitle === queryWords.length && queryWords.length > 1) {
      score += 50;
    }

    return allWordsMatched ? score : (score > 40 ? Math.floor(score * 0.4) : 0);
  }

  function performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    const previewContainer = document.getElementById('search-preview');
    if (!resultsContainer || !previewContainer) return;

    if (!query) {
      resultsContainer.innerHTML = '';
      previewContainer.innerHTML = '<div class="search-preview-placeholder">Type to search notes or navigate with arrow keys</div>';
      searchResults = [];
      return;
    }

    if (!searchIndex) {
      pendingQuery = query;
      resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--text-muted);">⚡ Loading search index...</div>';
      loadSearchIndex();
      return;
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(Boolean);

    const scored = [];
    for (const item of searchIndex) {
      const score = scoreItem(item, queryLower, queryWords);
      if (score > 0) {
        scored.push({ item, score });
      }
    }

    searchResults = scored.sort((a, b) => b.score - a.score).slice(0, 30).map(s => s.item);

    if (searchResults.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 24px; color: var(--text-muted); text-align: center;">No matching clinical notes found.</div>';
      previewContainer.innerHTML = '';
      return;
    }

    activeIndex = 0;
    resultsContainer.innerHTML = searchResults.map((item, idx) => {
      const displayTitle = highlightMatches(item.title, queryWords);
      const categoryName = (item.category || '').replace('notes/', '');
      return `
        <div class="search-result-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" onclick="window.location.href='${item.url}'" onmouseenter="showPreview(${idx})">
          <div class="search-res-title">${displayTitle}</div>
          <div class="search-res-cat">${categoryName}</div>
        </div>
      `;
    }).join('');

    showPreview(0, queryWords);
  }

  window.showPreview = function(idx, words) {
    activeIndex = idx;
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((el, i) => el.classList.toggle('active', i === idx));

    const item = searchResults[idx];
    const previewContainer = document.getElementById('search-preview');
    if (!item || !previewContainer) return;

    const inputVal = document.getElementById('search-input')?.value || '';
    const queryWords = words || inputVal.toLowerCase().split(/\s+/).filter(Boolean);

    const displayTitle = highlightMatches(item.title, queryWords);
    const displaySnippet = highlightMatches(item.snippet || '', queryWords);
    const categoryName = (item.category || '').replace('notes/', '');

    let tagsHtml = '';
    if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
      tagsHtml = item.tags.map(t => `<span class="search-preview-tag">#${t}</span>`).join(' ');
    }

    previewContainer.innerHTML = `
      <div class="search-preview-header">
        <h3 class="search-preview-title" style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">${displayTitle}</h3>
        <div class="search-preview-meta">
          <span class="search-preview-cat">${categoryName}</span>
          ${tagsHtml}
        </div>
      </div>
      <div class="search-preview-text">
        <p>${displaySnippet || 'No summary excerpt available.'}</p>
      </div>
      <div class="search-preview-action">
        <a href="${item.url}" class="search-preview-btn">
          <span>Open Full Note</span>
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </a>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  function updateActiveResult(elements) {
    elements.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    elements[activeIndex].scrollIntoView({ block: 'nearest' });
    showPreview(activeIndex);
  }
})();
