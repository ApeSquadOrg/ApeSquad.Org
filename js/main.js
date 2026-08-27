// js/main.js - Unified CSV Engine for News and Tournaments

const App = {
    /**
     * The main initialization function.
     * It orchestrates the loading of components and the initialization of all features.
     */
    init() {
        // Start by loading critical components like header and footer.
        this.loadComponents().then(() => {
            console.log("Core components loaded successfully.");
            // Once loaded, initialize all interactive modules.
            this.initComponents();
            // Finally, trigger the fade-in to show the page.
            document.body.classList.add('is-loaded');
            console.log("Ape Squad App initialized.");
        }).catch(error => {
            console.error("Failed to load critical components:", error);
            // If loading fails, still show the page to avoid a blank screen.
            document.body.classList.add('is-loaded');
        });
    },

    /**
     * Fetches and injects HTML content for components like the header and footer.
     * @returns {Promise} A promise that resolves when all components are loaded.
     */
    loadComponents() {
        const fetchComponent = (selector, filePath) => {
            const element = document.querySelector(selector);
            if (!element) {
                // Silently fail if the component placeholder isn't on the page.
                return Promise.resolve();
            }
            return fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error(`Could not load ${filePath}`);
                    return response.text();
                })
                .then(data => {
                    element.innerHTML = data;
                })
                .catch(error => console.error(`Error loading component into ${selector}:`, error));
        };

        // Use Promise.all to load components in parallel for efficiency.
        return Promise.all([
            fetchComponent('header.navbar', '/header.html'),
            fetchComponent('footer.site-footer', '/footer.html')
        ]);
    },

    /**
     * A central place to run all module initializers after components are loaded.
     */
    initComponents() {
        this.initMobileNav();
        this.initPageTransitions();
        this.initCarousel();
        this.initBfCacheFix();
        this.initTournaments(); 
        this.initNews(); 
    },

    /**
     * Shared Helper: Reads raw CSV/TSV text and returns a 2D Array of rows.
     * Respects double quotes and line breaks inside cells.
     */
    csvToArray(text) {
        let lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            let next = text[i + 1];
            if (c === '"') {
                if (inQuotes && next === '"') {
                    row[row.length - 1] += '"'; // Unescape double double-quotes
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                row.push('');
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
                if (c === '\r' && next === '\n') { i++; }
                lines.push(row);
                row = [""];
            } else {
                row[row.length - 1] += c;
            }
        }
        if (row.length > 1 || row[0] !== '') {
            lines.push(row);
        }
        return lines;
    },

    /**
     * Parses standard raw CSV text into a structured Tournaments array.
     * Maps simple flat columns back to nested objects/arrays.
     */
    parseTournamentsCSV(csvText) {
        const rows = this.csvToArray(csvText);
        if (rows.length === 0) return [];

        const headers = rows[0].map(h => h.trim());
        const tournaments = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            if (values.length === 1 && values[0] === '') continue; // Skip empty trailing rows

            const rawItem = {};
            headers.forEach((header, index) => {
                rawItem[header] = values[index] !== undefined ? values[index].trim() : '';
            });

            // Rebuild nested structural mapping from flat spreadsheet headers [1]
            const t = {
                id: rawItem.id,
                title: rawItem.title,
                status: rawItem.status,
                featured: rawItem.featured.toLowerCase() === 'true',
                format: rawItem.format,
                regions: rawItem.regions ? rawItem.regions.split(',').map(r => r.trim()) : [],
                tags: rawItem.tags ? rawItem.tags.split(',').map(tag => tag.trim()) : [],
                dates: {
                    display: rawItem.displayDate,
                    timestampStart: rawItem.startDate,
                    timestampEnd: rawItem.endDate
                },
                winners: [],
                media: {
                    thumbnail: rawItem.thumbnail,
                    description: rawItem.description,
                    watchLiveUrl: rawItem.watchLiveUrl || null,
                    watchVodUrl: rawItem.watchVodUrl || null,
                    vods: []
                },
                links: {
                    pageUrl: rawItem.pageUrl
                }
            };

            // Reconstruct Winner List dynamically
            if (rawItem.winner1Team) {
                t.winners.push({
                    region: rawItem.winner1Region || 'Global',
                    team: rawItem.winner1Team
                });
            }
            if (rawItem.winner2Team) {
                t.winners.push({
                    region: rawItem.winner2Region || 'Global',
                    team: rawItem.winner2Team
                });
            }

            // Reconstruct VOD Array dynamically
            if (rawItem.vod1Label) {
                t.media.vods.push({
                    label: rawItem.vod1Label,
                    url: rawItem.vod1Url
                });
            }
            if (rawItem.vod2Label) {
                t.media.vods.push({
                    label: rawItem.vod2Label,
                    url: rawItem.vod2Url
                });
            }

            tournaments.push(t);
        }
        return tournaments;
    },

    /**
     * Parses standard raw CSV text into a structured News Articles array.
     */
    parseNewsCSV(csvText) {
        const rows = this.csvToArray(csvText);
        if (rows.length === 0) return [];

        const headers = rows[0].map(h => h.trim());
        const articles = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            if (values.length === 1 && values[0] === '') continue; // Skip empty trailing rows

            const item = {};
            headers.forEach((header, index) => {
                let val = values[index] !== undefined ? values[index].trim() : '';
                if (header === 'featured') {
                    item[header] = val.toLowerCase() === 'true';
                } else {
                    item[header] = val;
                }
            });

            // Convert flat narrative columns into standard body element array [1]
            const content = [];

            // 1. Process body1 text blocks (Separating double newlines into separate paragraphs)
            if (item.body1) {
                const paragraphs = item.body1.split(/\r?\n/).filter(p => p.trim() !== '');
                paragraphs.forEach(p => content.push(p));
            }

            // 2. Insert inline image directly in the middle flow
            if (item.inlineImage1) {
                content.push({
                    image: item.inlineImage1,
                    caption: item.inlineCaption1 || ''
                });
            }

            // 3. Process body2 text blocks (Separating double newlines into separate paragraphs)
            if (item.body2) {
                const paragraphs = item.body2.split(/\r?\n/).filter(p => p.trim() !== '');
                paragraphs.forEach(p => content.push(p));
            }

            item.content = content;
            articles.push(item);
        }
        return articles;
    },

    /**
     * Fetches tournaments.csv and builds the tournament & home pages dynamically.
     */
    initTournaments() {
        const showcaseContainer = document.querySelector('.showcase-container');
        const gridContainer = document.querySelector('.tournaments-grid');
        const homeRecentContainer = document.querySelector('#home-recent-container');

        if (!showcaseContainer && !gridContainer && !homeRecentContainer) return;

        // --- FETCH CSV FILE ---
        fetch('./tournaments.csv')
            .then(response => {
                if (!response.ok) throw new Error("HTTP error fetching tournaments.csv");
                return response.text();
            })
            .then(csvText => {
                // Parse flat CSV into structured tournament objects [2]
                const tournaments = this.parseTournamentsCSV(csvText);

                let showcaseHTML = '';
                let gridHTML = '';
                let homeRecentHTML = '';

                tournaments.forEach(t => {
                    
                    // 1. ACTION BUTTONS 
                    let buttonsHTML = '';
                    if (t.media.vods && t.media.vods.length > 0) {
                        t.media.vods.forEach(v => {
                            buttonsHTML += `<a href="${v.url}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube icon-youtube"></i> ${v.label} VOD</a>`;
                        });
                    } else if (t.media.watchLiveUrl) {
                        buttonsHTML = `<a href="${t.media.watchLiveUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-play icon-twitch"></i> Watch Live</a>`;
                    } else if (t.media.watchVodUrl) {
                        buttonsHTML = `<a href="${t.media.watchVodUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube icon-youtube"></i> Watch VOD</a>`;
                    } else {
                        buttonsHTML = `<a href="${t.links.pageUrl}" class="btn btn-secondary"><i class="fa-solid fa-scroll icon-info"></i> View Stats</a>`;
                    }

                    // 2. TOURNAMENTS PAGE (PREMIUM GRID)
                    if (showcaseContainer && t.featured) {
                        let badgeText = t.tags && t.tags.length > 0 ? t.tags[0] : 'Featured Event';
                        
                        showcaseHTML += `
                            <div class="tournament-showcase">
                                <img src="${t.media.thumbnail}" alt="${t.title}" class="showcase-bg">
                                <div class="showcase-badge"><i class="fa-solid fa-star"></i> ${badgeText}</div>
                                <a href="${t.links.pageUrl}" class="card-link-cover" aria-label="View details for ${t.title}"></a>
                                <div class="showcase-overlay">
                                    <div class="hc-content-wrapper" style="max-width: 800px; width: 100%;">
                                        <h3 class="showcase-content">${t.title}</h3>
                                        <div class="showcase-hover-content">
                                            <div class="showcase-hover-inner">
                                                <div class="showcase-meta">
                                                    <span><i class="fa-solid fa-trophy"></i> ${t.format}</span>
                                                    <span><i class="fa-solid fa-calendar-days"></i> ${t.dates.display}</span>
                                                </div>
                                                <p class="showcase-desc">${t.media.description}</p>
                                                <div class="card-actions">
                                                    <a href="${t.links.pageUrl}" class="btn btn-primary">ENTER ARENA <i class="fa-solid fa-arrow-right"></i></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                    } 
                    
                    if (gridContainer && !t.featured) {
                        let winnersBoxHTML = '';
                        if (t.status === 'completed') {
                            let winnersHTML = '';
                            if (t.winners && t.winners.length > 0) {
                                winnersHTML = t.winners.map(w => {
                                    if (w.region && w.region !== 'Global') {
                                        return `<div class="sc-winner-row"><span class="sc-region">${w.region}</span><span class="sc-team"><i class="fa-solid fa-crown"></i> ${w.team}</span></div>`;
                                    } else {
                                        return `<div class="sc-winner-row justify-center"><span class="sc-team"><i class="fa-solid fa-crown"></i> ${w.team}</span></div>`;
                                    }
                                }).join('');
                            } else {
                                winnersHTML = `<div class="sc-winner-row justify-center"><span class="sc-team" style="color:#888;">RESULTS PENDING</span></div>`;
                            }

                            winnersBoxHTML = `
                                <div class="sc-winners-box">
                                    <div class="sc-winners-label">CHAMPIONS</div>
                                    ${winnersHTML}
                                </div>`;
                        }

                        gridHTML += `
                            <div class="stats-card">
                                <div class="sc-image">
                                    <img src="${t.media.thumbnail}" alt="${t.title}">
                                    <a href="${t.links.pageUrl}" class="card-link-cover" aria-label="View details"></a>
                                </div>
                                <div class="sc-content">
                                    <h4 class="sc-title">${t.title}</h4>
                                    <div class="sc-meta">
                                        <span><i class="fa-regular fa-calendar"></i> ${t.dates.display}</span>
                                        <span><i class="fa-solid fa-gamepad"></i> ${t.format}</span>
                                    </div>
                                    ${winnersBoxHTML}
                                    <p class="hc-desc" style="margin-bottom: 1rem; flex-grow: 1;">${t.media.description}</p>
                                    <div class="sc-actions">
                                        ${buttonsHTML}
                                    </div>
                                </div>
                            </div>`;
                    }

                    // 3. HOME PAGE (RECENT RESULTS - HOVER CARDS)
                    if (homeRecentContainer && t.status === 'completed') {
                        let winnersTextHover = '';
                        if (t.winners && t.winners.length > 0) {
                            let teamsOnly = t.winners.map(w => w.team).join(' & ');
                            winnersTextHover = `<div style="color: var(--awards-gold, #FFD700); font-weight: bold; font-family: var(--font-headline); font-size: 1rem; margin-top: 5px; text-shadow: 0 0 10px rgba(0,0,0,1); white-space: normal; line-height: 1.1;"><i class="fa-solid fa-crown"></i> ${teamsOnly}</div>`;
                        }

                        homeRecentHTML += `
                            <div class="hover-card">
                                <img src="${t.media.thumbnail}" alt="${t.title}">
                                <a href="${t.links.pageUrl}" class="card-link-cover" aria-label="View details"></a>
                                <div class="hc-overlay">
                                    <div class="hc-content-wrapper">
                                        <h3 class="hc-title">${t.title}</h3>
                                        ${winnersTextHover}
                                        <div class="hc-hover-content">
                                            <div class="hc-hover-inner">
                                                <div class="hc-meta">
                                                    <span><i class="fa-regular fa-calendar"></i> ${t.dates.display}</span>
                                                </div>
                                                <p class="hc-desc">${t.media.description}</p>
                                                <div class="hc-actions">
                                                    ${buttonsHTML}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                    }
                });

                if (showcaseContainer) showcaseContainer.innerHTML = showcaseHTML;
                if (gridContainer) gridContainer.innerHTML = gridHTML;
                if (homeRecentContainer) homeRecentContainer.innerHTML = homeRecentHTML;

                this.initPageTransitions();
            })
            .catch(error => console.error("Error loading tournaments:", error));
    },

    /**
     * Fetches news.csv and acts as a dynamic CMS for articles and banners.
     */
    initNews() {
        const carouselTrack = document.getElementById('news-carousel-track');
        const newsGrid = document.getElementById('news-grid-container');
        const articleContainer = document.getElementById('single-article-container');

        if (!carouselTrack && !newsGrid && !articleContainer) return;

        // --- FETCH CSV FILE ---
        fetch('./news.csv')
            .then(response => {
                if (!response.ok) throw new Error("HTTP error fetching news.csv");
                return response.text();
            })
            .then(csvText => {
                // Parse standard raw CSV text into articles
                const articles = this.parseNewsCSV(csvText);

                // ==========================================
                // 1. HOME PAGE CAROUSEL (Top 5 Recent News)
                // ==========================================
                if (carouselTrack) {
                    let slidesHTML = '';
                    
                    // LIMIT TO THE 5 MOST RECENT ARTICLES
                    const top5News = articles.slice(0, 5);

                    top5News.forEach((item) => {
                        // SMART ROUTING: If item has a link, use it. Otherwise, go to article.html
                        let linkUrl = item.link ? item.link : `/article.html?id=${item.id}`;
                        // If it's an external website, open in a new tab
                        let targetAttr = (item.link && item.link.startsWith('http')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                        
                        let dateObj = new Date(item.date);
                        let monthStr = isNaN(dateObj) ? "NEWS" : dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                        let dayStr = isNaN(dateObj) ? "!" : String(dateObj.getDate()).padStart(2, '0');

                        slidesHTML += `
                            <a href="${linkUrl}" class="news-slide-premium" ${targetAttr}>
                                <img src="${item.bannerImage}" alt="${item.title}" class="news-slide-bg">
                                <div class="news-slide-overlay"></div>
                                <div class="news-slide-content">
                                    <div class="news-date-badge">
                                        <span class="news-date-month">${monthStr}</span>
                                        <span class="news-date-day">${dayStr}</span>
                                    </div>
                                    <div class="news-text-group">
                                        <div class="news-mini-tag">${item.tag}</div>
                                        <h3 class="news-mini-title">${item.title}</h3>
                                        <p class="news-mini-desc">${item.description}</p>
                                    </div>
                                    <div class="news-mini-cta">${item.buttonText} <i class="fa-solid fa-arrow-right"></i></div>
                                </div>
                            </a>
                        `;
                    });

                    carouselTrack.innerHTML = slidesHTML;

                    // Carousel Scroll & Arrow Logic
                    let currentIndex = 0;
                    const totalSlides = top5News.length;
                    
                    const leftArrow = document.querySelector('.news-arrow.prev');
                    const rightArrow = document.querySelector('.news-arrow.next');

                    const goToSlide = (index) => {
                        currentIndex = index;
                        carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
                    };

                    const nextSlide = () => {
                        currentIndex = (currentIndex + 1) % totalSlides;
                        goToSlide(currentIndex);
                    };

                    const prevSlide = () => {
                        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                        goToSlide(currentIndex);
                    };

                    let autoScroll = setInterval(nextSlide, 6000);

                    if(rightArrow) {
                        rightArrow.addEventListener('click', () => {
                            clearInterval(autoScroll);
                            nextSlide();
                            autoScroll = setInterval(nextSlide, 6000);
                        });
                    }
                    if(leftArrow) {
                        leftArrow.addEventListener('click', () => {
                            clearInterval(autoScroll);
                            prevSlide();
                            autoScroll = setInterval(nextSlide, 6000);
                        });
                    }

                    carouselTrack.addEventListener('mouseenter', () => clearInterval(autoScroll));
                    carouselTrack.addEventListener('mouseleave', () => autoScroll = setInterval(nextSlide, 6000));
                }

                // ==========================================
                // 2. NEWS HUB GRID
                // ==========================================
                if (newsGrid) {
                    let gridHTML = '';
                    articles.forEach(item => {
                        // SMART ROUTING FOR GRID
                        let linkUrl = item.link ? item.link : `/article.html?id=${item.id}`;
                        let targetAttr = (item.link && item.link.startsWith('http')) ? 'target="_blank" rel="noopener noreferrer"' : '';

                        gridHTML += `
                            <div class="hover-card">
                                <img src="${item.gridImage}" alt="${item.title}">
                                <a href="${linkUrl}" class="card-link-cover" ${targetAttr}></a>
                                <div class="hc-overlay">
                                    <div class="hc-content-wrapper">
                                        <div style="color: var(--electric-blue); font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; font-family: 'Ayuthaya', monospace;">${item.date} • ${item.tag}</div>
                                        <h3 class="hc-title">${item.title}</h3>
                                        <div class="hc-hover-content">
                                            <div class="hc-hover-inner">
                                                <p class="hc-desc">${item.description}</p>
                                                <div class="hc-actions">
                                                    <a href="${linkUrl}" class="btn btn-secondary" ${targetAttr}>${item.buttonText} <i class="fa-solid fa-arrow-right"></i></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    newsGrid.innerHTML = gridHTML;
                }

                // ==========================================
                // 3. SINGLE ARTICLE PAGE (Dynamic Generator)
                // ==========================================
                if (articleContainer) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const articleId = urlParams.get('id');
                    const article = articles.find(a => a.id === articleId);

                    if (article && !article.link) { // Ensure it's actually an article, not an external link
                        document.title = `${article.title} | Ape Squad News`;
                        
                        // Join the content array into HTML paragraphs AND Images
                        let contentHTML = '';
                        if (Array.isArray(article.content)) {
                            contentHTML = article.content.map(block => {
                                // 1. If it's a normal text string
                                if (typeof block === 'string') {
                                    if (block.startsWith('<')) return block; // Leave raw HTML alone
                                    return `<p>${block}</p>`; // Wrap normal text in paragraphs
                                }
                                
                                // 2. If it's an Image Object
                                if (typeof block === 'object' && block !== null && block.image) {
                                    let captionHTML = block.caption ? `<figcaption>${block.caption}</figcaption>` : '';
                                    return `
                                        <figure class="article-inline-image">
                                            <img src="${block.image}" alt="${block.caption || 'Article image'}">
                                            ${captionHTML}
                                        </figure>
                                    `;
                                }
                                return '';
                            }).join('');
                        }

                        articleContainer.innerHTML = `
                            <div class="article-hero" style="background-image: url('${article.gridImage}');">
                                <div class="article-hero-overlay">
                                    <span class="news-tag" style="display:inline-block; background:var(--electric-blue); color:white; padding:6px 16px; border-radius:4px; margin-bottom:1rem; font-weight:bold;">${article.tag}</span>
                                    <h1>${article.title}</h1>
                                    <div class="article-meta">
                                        <span><i class="fa-regular fa-calendar"></i> ${article.date}</span>
                                        <span><i class="fa-solid fa-pen-nib"></i> ${article.author}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="container article-body">
                                <a href="/news.html" class="back-link" style="margin-bottom: 2rem; display: inline-block; color: var(--electric-blue);"><i class="fa-solid fa-arrow-left"></i> Back to News</a>
                                ${contentHTML}
                            </div>
                        `;
                    } else {
                        articleContainer.innerHTML = `
                            <div class="container" style="text-align: center; padding: 100px 20px;">
                                <h2>Content Not Found</h2>
                                <p>The article you are looking for does not exist or has been moved.</p>
                                <a href="/news.html" class="btn btn-primary">Return to News</a>
                            </div>
                        `;
                    }
                }

                this.initPageTransitions();
            })
            .catch(error => console.error("Error loading news:", error));
    },

    /**
     * Initializes the mobile navigation (hamburger) menu and dropdown logic.
     */
    initMobileNav() {
        const navToggle = document.querySelector('.mobile-nav-toggle');
        const primaryNav = document.querySelector('.nav-links');

        if (!navToggle || !primaryNav) return;

        navToggle.addEventListener('click', () => {
            const isVisible = primaryNav.getAttribute('data-visible') === 'true';
            primaryNav.setAttribute('data-visible', !isVisible);
            navToggle.setAttribute('aria-expanded', !isVisible);
            document.body.classList.toggle('nav-open');
        });

        const dropdowns = primaryNav.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const dropBtn = dropdown.querySelector('.dropbtn');
            if (dropBtn) {
                dropBtn.addEventListener('click', (e) => {
                    // Only activate dropdown toggle on mobile view.
                    if (window.getComputedStyle(navToggle).display !== 'none') {
                        e.preventDefault();
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });
    },

    /**
     * Initializes smooth page transitions (fade out) for internal links.
     */
    initPageTransitions() {
        const allLinks = document.querySelectorAll(
            'a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])'
        );

        allLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                // Prevent transition logic for mobile dropdown toggles.
                if (window.getComputedStyle(document.querySelector('.mobile-nav-toggle')).display !== 'none' && this.matches('.dropbtn')) {
                    return;
                }
                
                event.preventDefault();
                document.body.classList.add('is-leaving');

                setTimeout(() => {
                    window.location.href = this.href;
                }, 500); // Duration should match the CSS transition.
            });
        });
    },

    /**
     * Initializes the image carousel if one exists on the current page.
     */
    initCarousel() {
        const carouselTrack = document.querySelector('.carousel-track');
        if (!carouselTrack) return; // Exit if no carousel on this page.

        const slides = Array.from(carouselTrack.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        const indicatorsContainer = document.querySelector('.carousel-indicators');

        if (slides.length <= 1) return; // No need for a carousel with one or zero slides.

        const slideWidth = slides[0].getBoundingClientRect().width;
        const setSlidePosition = (slide, index) => {
            slide.style.left = slideWidth * index + 'px';
        };
        slides.forEach(setSlidePosition);

        // Create indicator dots
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('indicator-dot');
            if (index === 0) dot.classList.add('active');
            indicatorsContainer.appendChild(dot);
        });
        const indicators = Array.from(indicatorsContainer.children);

        const moveToSlide = (currentSlide, targetSlide) => {
            carouselTrack.style.transform = `translateX(-${targetSlide.style.left})`;
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        const updateIndicators = (currentIndex, targetIndex) => {
            indicators[currentIndex].classList.remove('active');
            indicators[targetIndex].classList.add('active');
        };

        const getCurrentIndex = () => slides.findIndex(slide => slide.classList.contains('current-slide'));

        nextButton.addEventListener('click', () => {
            const currentIndex = getCurrentIndex();
            const nextIndex = (currentIndex + 1) % slides.length;
            moveToSlide(slides[currentIndex], slides[nextIndex]);
            updateIndicators(currentIndex, nextIndex);
        });

        prevButton.addEventListener('click', () => {
            const currentIndex = getCurrentIndex();
            const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            moveToSlide(slides[currentIndex], slides[prevIndex]);
            updateIndicators(currentIndex, prevIndex);
        });

        indicatorsContainer.addEventListener('click', e => {
            const targetDot = e.target.closest('button.indicator-dot');
            if (!targetDot) return;
            
            const currentIndex = getCurrentIndex();
            const targetIndex = indicators.findIndex(dot => dot === targetDot);
            
            if (currentIndex !== targetIndex) {
                moveToSlide(slides[currentIndex], slides[targetIndex]);
                updateIndicators(currentIndex, targetIndex);
            }
        });
        
        slides[0].classList.add('current-slide');
    },

    /**
     * Fixes an issue where the 'is-leaving' class persists when using browser back/forward buttons.
     */
    initBfCacheFix() {
        window.addEventListener('pageshow', (event) => {
            if (event.persisted && document.body.classList.contains('is-leaving')) {
                document.body.classList.remove('is-leaving');
            }
        });
    }
};

// Start the application once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});