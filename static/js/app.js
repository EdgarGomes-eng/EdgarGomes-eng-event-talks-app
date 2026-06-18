// App State
let state = {
    notes: [],
    selectedNote: null,
    searchQuery: '',
    currentFilter: 'all'
};

// DOM Elements
const els = {
    statusText: document.getElementById('status-text'),
    statusDot: document.querySelector('.status-dot'),
    btnRefresh: document.getElementById('btn-refresh'),
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),
    filterPills: document.getElementById('filter-pills'),
    notesList: document.getElementById('notes-list'),
    skeletonContainer: document.getElementById('skeleton-container'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    btnErrorRetry: document.getElementById('btn-error-retry'),
    emptyResults: document.getElementById('empty-results'),
    resultsCount: document.getElementById('results-count'),
    notesTotalLabel: document.getElementById('notes-total-label'),
    
    // Tweet Composer
    composerEmpty: document.getElementById('composer-empty-state'),
    composerActive: document.getElementById('composer-active-state'),
    composerNoteType: document.getElementById('composer-note-type'),
    composerNoteDate: document.getElementById('composer-note-date'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    btnResetTweet: document.getElementById('btn-reset-tweet'),
    btnTweetSubmit: document.getElementById('btn-tweet-submit'),
    
    // Toast Notification
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Load from Cache first for instant load
    const cachedData = localStorage.getItem('bq_release_notes_cache');
    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            state.notes = parsed.notes;
            updateStatusText(parsed.updated, true);
            renderNotes();
            
            // Do a background update silently
            fetchNotes(true);
        } catch (e) {
            localStorage.removeItem('bq_release_notes_cache');
            fetchNotes();
        }
    } else {
        fetchNotes();
    }
    
    setupEventListeners();
}

// Event Listeners Wiring
function setupEventListeners() {
    // Refresh buttons
    els.btnRefresh.addEventListener('click', () => fetchNotes(false));
    els.btnErrorRetry.addEventListener('click', () => fetchNotes(false));
    
    // Search input
    els.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        els.searchClear.style.display = state.searchQuery ? 'block' : 'none';
        renderNotes();
    });
    
    els.searchClear.addEventListener('click', () => {
        els.searchInput.value = '';
        state.searchQuery = '';
        els.searchClear.style.display = 'none';
        els.searchInput.focus();
        renderNotes();
    });
    
    // Filter pills
    els.filterPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        state.currentFilter = pill.dataset.filter;
        renderNotes();
    });
    
    // Tweet composer input
    els.tweetTextarea.addEventListener('input', () => {
        updateCharCount();
    });
    
    // Reset Tweet text
    els.btnResetTweet.addEventListener('click', () => {
        if (state.selectedNote) {
            selectNoteForTweet(state.selectedNote);
            showToast('Draft reset to default template');
        }
    });
}

// API Fetching
async function fetchNotes(isBackground = false) {
    if (!isBackground) {
        showLoadingState();
    }
    
    els.statusDot.className = 'status-dot loading';
    els.btnRefresh.querySelector('svg').classList.add('spin');
    els.statusText.textContent = isBackground ? 'Checking for updates...' : 'Fetching release notes...';
    
    try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Server reported failure');
        
        state.notes = data.notes;
        
        // Save to cache
        localStorage.setItem('bq_release_notes_cache', JSON.stringify({
            notes: data.notes,
            updated: data.updated
        }));
        
        updateStatusText(data.updated, false);
        renderNotes();
    } catch (error) {
        console.error('Error fetching release notes:', error);
        els.statusDot.className = 'status-dot error';
        
        if (state.notes.length === 0) {
            // Only show full error layout if we don't have cached data
            showErrorState(error.message);
        } else {
            els.statusText.textContent = 'Failed to update. Using cached feed.';
            showToast('Could not refresh feed. Showing offline data.');
        }
    } finally {
        els.btnRefresh.querySelector('svg').classList.remove('spin');
    }
}

// UI State Toggles
function showLoadingState() {
    els.skeletonContainer.style.display = 'flex';
    els.notesList.style.display = 'none';
    els.errorContainer.style.display = 'none';
    els.emptyResults.style.display = 'none';
}

function showErrorState(message) {
    els.skeletonContainer.style.display = 'none';
    els.notesList.style.display = 'none';
    els.errorContainer.style.display = 'block';
    els.errorMessage.textContent = message;
    els.emptyResults.style.display = 'none';
}

function updateStatusText(updatedIsoString, isCached) {
    let displayText = 'Feed updated';
    if (updatedIsoString) {
        try {
            const date = new Date(updatedIsoString);
            displayText = `Updated ${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`;
        } catch (e) {
            displayText = 'Feed updated';
        }
    }
    
    els.statusDot.className = 'status-dot';
    els.statusText.textContent = displayText + (isCached ? ' (cached)' : '');
}

// Filter and Render
function renderNotes() {
    els.skeletonContainer.style.display = 'none';
    els.errorContainer.style.display = 'none';
    
    // Filter logic
    const filtered = state.notes.filter(note => {
        // Category Filter
        const matchesCategory = state.currentFilter === 'all' || note.type === state.currentFilter;
        
        // Search Filter
        const query = state.searchQuery.toLowerCase();
        const matchesSearch = !query || 
            note.title.toLowerCase().includes(query) || 
            note.clean_text.toLowerCase().includes(query) || 
            note.type.toLowerCase().includes(query);
            
        return matchesCategory && matchesSearch;
    });
    
    // Update headers
    els.notesTotalLabel.textContent = `${filtered.length} update${filtered.length === 1 ? '' : 's'}`;
    if (state.searchQuery || state.currentFilter !== 'all') {
        els.resultsCount.textContent = 'Filtered Results';
    } else {
        els.resultsCount.textContent = 'All Release Notes';
    }
    
    if (filtered.length === 0) {
        els.notesList.style.display = 'none';
        els.emptyResults.style.display = 'block';
        return;
    }
    
    els.emptyResults.style.display = 'none';
    els.notesList.style.display = 'flex';
    
    // Generate card HTML elements
    els.notesList.innerHTML = filtered.map(note => {
        const isSelected = state.selectedNote && state.selectedNote.id === note.id;
        const typeClass = note.type.toLowerCase();
        
        return `
            <div class="note-card ${isSelected ? 'selected' : ''}" data-id="${note.id}" data-type="${note.type}">
                <div class="note-meta">
                    <div class="note-meta-left">
                        <span class="badge ${typeClass}">${note.type}</span>
                        <span class="note-date">${note.title}</span>
                    </div>
                </div>
                <div class="note-body">
                    ${note.content_html}
                </div>
                <div class="note-footer">
                    <a href="${note.link}" target="_blank" class="note-link" rel="noopener noreferrer">
                        <span>View original release note</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                    </a>
                    <div class="note-actions">
                        <button class="btn-copy" data-id="${note.id}" title="Copy release note text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                        <button class="btn-card-tweet" data-id="${note.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            <span>Draft Tweet</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add Click listeners
    document.querySelectorAll('.note-card').forEach(card => {
        const id = card.dataset.id;
        const note = state.notes.find(n => n.id === id);
        
        // Card Body click selects it
        card.addEventListener('click', (e) => {
            // Ignore if clicking a link or copy button inside the footer
            if (e.target.closest('.note-link') || e.target.closest('.btn-copy') || e.target.closest('.btn-card-tweet')) {
                return;
            }
            selectNoteForTweet(note);
        });
        
        // Footer buttons click
        card.querySelector('.btn-card-tweet').addEventListener('click', () => {
            selectNoteForTweet(note);
            // Scroll to composer on mobile
            if (window.innerWidth <= 992) {
                els.composerActive.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        card.querySelector('.btn-copy').addEventListener('click', (e) => {
            e.stopPropagation();
            copyNoteText(note);
        });
    });
}

// Clipboard Action
function copyNoteText(note) {
    const textToCopy = `BigQuery Release Note (${note.title}) - ${note.type}\n\n${note.clean_text}\n\nSource: ${note.link}`;
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('Copied full update text to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy to clipboard.');
        });
}

// Toast System
function showToast(message) {
    els.toastMessage.textContent = message;
    els.toast.classList.add('show');
    
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

// Tweet Draft Generation
function selectNoteForTweet(note) {
    state.selectedNote = note;
    
    // Highlight selected card visually
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.id === note.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Toggle composer view
    els.composerEmpty.style.display = 'none';
    els.composerActive.style.display = 'flex';
    
    // Set note context info
    els.composerNoteType.textContent = note.type;
    els.composerNoteType.className = `badge ${note.type.toLowerCase()}`;
    els.composerNoteDate.textContent = note.title;
    
    // Generate tweet text
    const text = draftTweetText(note);
    els.tweetTextarea.value = text;
    
    updateCharCount();
    
    // Focus textarea
    els.tweetTextarea.focus();
}

function draftTweetText(note) {
    const typeLabel = note.type !== 'Update' ? `[${note.type}] ` : '';
    
    // Standard template elements
    const prefix = `📢 BigQuery: ${typeLabel}`;
    // Format date in a short version e.g. "June 17"
    let shortDate = note.title;
    const dateParts = shortDate.split(',');
    if (dateParts.length > 0) {
        shortDate = dateParts[0].trim();
    }
    
    const suffix = `\n\n🔗 ${note.link}\n#GoogleCloud #BigQuery`;
    
    // Remaining space for body content
    const totalMax = 280;
    const bodyMaxLen = totalMax - prefix.length - suffix.length - 2; // -2 for newlines
    
    let body = note.clean_text;
    if (body.length > bodyMaxLen) {
        body = body.substring(0, bodyMaxLen - 4) + '...';
    }
    
    return `${prefix}${body}${suffix}`;
}

function updateCharCount() {
    const len = els.tweetTextarea.value.length;
    els.charCounter.textContent = `${len} / 280`;
    
    // Reset classes
    els.charCounter.className = 'char-counter';
    els.btnTweetSubmit.classList.remove('disabled');
    
    if (len > 280) {
        els.charCounter.classList.add('danger');
        els.btnTweetSubmit.classList.add('disabled');
    } else if (len > 250) {
        els.charCounter.classList.add('warning');
    }
    
    // Update link
    els.btnTweetSubmit.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(els.tweetTextarea.value)}`;
}
