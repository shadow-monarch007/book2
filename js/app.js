document.addEventListener('DOMContentLoaded', () => {
    // Only run on reader page
    if (!document.getElementById('reader-container')) return;

    // --- State ---
    let currentChapterId = parseInt(localStorage.getItem('current-chapter')) || 1;
    let fontSize = parseFloat(localStorage.getItem('reader-font-size')) || 1.125;
    let isAudioPlaying = false;
    let lastScrollTop = 0;

    // --- DOM Elements ---
    const chapterContainer = document.getElementById('chapter-container');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFontInc = document.getElementById('btn-font-increase');
    const btnFontDec = document.getElementById('btn-font-decrease');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const navBar = document.getElementById('reader-nav');
    const progressBar = document.getElementById('reading-progress');
    const btnAudio = document.getElementById('btn-audio');
    const audioEl = document.getElementById('ambient-audio');
    
    // TOC Elements
    const btnToc = document.getElementById('btn-toc');
    const btnTocClose = document.getElementById('btn-toc-close');
    const tocDrawer = document.getElementById('toc-drawer');
    const tocOverlay = document.getElementById('toc-overlay');
    const tocList = document.getElementById('toc-list');

    // --- Initialization ---
    initTheme();
    applyFontSize();
    loadChapter(currentChapterId, false);

    // --- Event Listeners ---
    
    // Navigation
    btnPrev.addEventListener('click', () => navigateChapter(-1));
    btnNext.addEventListener('click', () => navigateChapter(1));

    // Font Controls
    btnFontInc.addEventListener('click', () => changeFontSize(0.125));
    btnFontDec.addEventListener('click', () => changeFontSize(-0.125));

    // Theme Controls
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.dataset.theme;
            setTheme(theme);
        });
    });

    // Audio Toggle
    btnAudio.addEventListener('click', toggleAudio);

    // TOC Toggle
    btnToc.addEventListener('click', openTOC);
    btnTocClose.addEventListener('click', closeTOC);
    tocOverlay.addEventListener('click', closeTOC);

    // Scroll Events (Progress Bar & Auto-hide Nav)
    window.addEventListener('scroll', () => {
        // Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";

        // Auto-hide Nav
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScroll > lastScrollTop && currentScroll > 100) {
            // Scroll down
            navBar.classList.add('nav-hidden');
        } else {
            // Scroll up
            navBar.classList.remove('nav-hidden');
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    // --- Functions ---

    function loadChapter(id, animate = true) {
        const chapter = window.bookChapters.find(c => c.id === id);
        
        if (!chapter) return;

        if (animate) {
            chapterContainer.classList.remove('fade-in');
            chapterContainer.classList.add('fade-out');
            
            setTimeout(() => {
                renderChapterContent(chapter);
                window.scrollTo(0, 0);
                chapterContainer.classList.remove('fade-out');
                chapterContainer.classList.add('fade-in');
            }, 400);
        } else {
            renderChapterContent(chapter);
        }

        // Update State
        currentChapterId = id;
        localStorage.setItem('current-chapter', id);
        
        // Update Buttons
        btnPrev.disabled = currentChapterId === 1;
        btnNext.disabled = currentChapterId === window.bookChapters[window.bookChapters.length - 1].id;
        
        // Save overall reading progress logic could be added here
    }

    function renderChapterContent(chapter) {
        chapterContainer.innerHTML = `
            <h2>${chapter.title}</h2>
            ${chapter.content}
        `;
    }

    function navigateChapter(direction) {
        const newId = currentChapterId + direction;
        const chapterExists = window.bookChapters.some(c => c.id === newId);
        
        if (chapterExists) {
            loadChapter(newId);
        }
    }

    function changeFontSize(delta) {
        fontSize += delta;
        // Clamp font size
        if (fontSize < 0.9) fontSize = 0.9;
        if (fontSize > 1.8) fontSize = 1.8;
        
        applyFontSize();
        localStorage.setItem('reader-font-size', fontSize);
    }

    function applyFontSize() {
        document.documentElement.style.setProperty('--base-font-size', `${fontSize}rem`);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('reader-theme') || 'theme-dark';
        setTheme(savedTheme);
    }

    function setTheme(theme) {
        document.body.className = `reader-page ${theme}`;
        localStorage.setItem('reader-theme', theme);
        
        // Update active state on buttons
        themeBtns.forEach(btn => {
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function toggleAudio() {
        if (isAudioPlaying) {
            audioEl.pause();
            btnAudio.classList.remove('audio-active');
        } else {
            // Set volume low for ambiance
            audioEl.volume = 0.3;
            audioEl.play().catch(e => console.log("Audio play failed:", e));
            btnAudio.classList.add('audio-active');
        }
        isAudioPlaying = !isAudioPlaying;
    }

    // --- Table of Contents Drawer Logic ---
    function populateTOC() {
        tocList.innerHTML = '';
        window.bookChapters.forEach(ch => {
            const li = document.createElement('li');
            li.className = `toc-item ${ch.id === currentChapterId ? 'active' : ''}`;
            li.textContent = ch.title;
            li.addEventListener('click', () => {
                loadChapter(ch.id);
                closeTOC();
            });
            tocList.appendChild(li);
        });
    }

    function openTOC() {
        populateTOC();
        tocDrawer.classList.add('active');
        tocOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeTOC() {
        tocDrawer.classList.remove('active');
        tocOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});
