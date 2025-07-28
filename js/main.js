// js/main.js

document.addEventListener("DOMContentLoaded", function() {

    // =====================================================
    // SECTION 1: DYNAMICALLY LOAD HEADER AND FOOTER
    // =====================================================
    const loadComponent = (selector, filePath) => {
        const element = document.querySelector(selector);
        if (element) {
            return fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error(`Could not load ${filePath}`);
                    return response.text();
                })
                .then(data => { 
                    element.innerHTML = data; 
                })
                .catch(error => { console.error(`Error loading component into ${selector}:`, error); });
        }
        return Promise.resolve();
    };
    
    Promise.all([
        loadComponent('header', 'header.html'),
        loadComponent('footer', 'footer.html')
    ]).then(() => {
        console.log("Header and Footer loaded. Initializing site modules...");
        initializePageTransitions();
        initializeMobileNav();
    });


    // =========================================================
    // SECTION 2: MOBILE NAVIGATION & DROPDOWN LOGIC (UPDATED)
    // =========================================================
    function initializeMobileNav() {
        const navToggle = document.querySelector('.mobile-nav-toggle');
        const primaryNav = document.querySelector('header nav');

        if (!navToggle || !primaryNav) {
            console.warn("Mobile navigation elements not found, skipping initialization.");
            return;
        }

        // --- Handle Hamburger Button Click ---
        navToggle.addEventListener('click', () => {
            const isVisible = primaryNav.getAttribute('data-visible') === 'true';
            
            if (isVisible) {
                // If menu is open, close it
                primaryNav.setAttribute('data-visible', 'false');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open'); // <-- NEW LINE: Remove overlay class
            } else {
                // If menu is closed, open it
                primaryNav.setAttribute('data-visible', 'true');
                navToggle.setAttribute('aria-expanded', 'true');
                document.body.classList.add('nav-open'); // <-- NEW LINE: Add overlay class
            }
        });

        // --- Handle Dropdown Accordion on Mobile ---
        const dropdowns = primaryNav.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const dropBtn = dropdown.querySelector('.dropbtn');
            if (dropBtn) {
                dropBtn.addEventListener('click', (e) => {
                    if (window.getComputedStyle(navToggle).display !== 'none') {
                        e.preventDefault(); 
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });
    }


    // =========================================================
    // SECTION 3: SMOOTH PAGE TRANSITIONS
    // =========================================================
    function initializePageTransitions() {
        const allLinks = document.querySelectorAll(
            'a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])'
        );

        allLinks.forEach(link => {
            if (link.dataset.listenerAdded) return;

            link.addEventListener('click', function(event) {
                const destination = this.href;
                if (window.getComputedStyle(document.querySelector('.mobile-nav-toggle')).display !== 'none' && this.matches('.dropbtn')) {
                    return;
                }
                
                event.preventDefault(); 
                document.body.classList.add('is-leaving');

                setTimeout(() => {
                    window.location.href = destination;
                }, 500);
            });

            link.dataset.listenerAdded = 'true';
        });
    }
    

    // =========================================================
    // SECTION 4: IMAGE CAROUSEL (IF PRESENT ON PAGE)
    // =========================================================
    const carouselTrack = document.querySelector('.carousel-track');
    if (carouselTrack) {
        const slides = Array.from(carouselTrack.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        const indicatorsContainer = document.querySelector('.carousel-indicators');
        
        if (slides.length > 0) {
            const slideWidth = slides[0].getBoundingClientRect().width;

            const setSlidePosition = (slide, index) => {
                slide.style.left = slideWidth * index + 'px';
            };
            slides.forEach(setSlidePosition);

            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.classList.add('indicator-dot');
                if (index === 0) dot.classList.add('active');
                indicatorsContainer.appendChild(dot);
            });
            const indicators = Array.from(indicatorsContainer.children);

            const moveToSlide = (track, currentSlide, targetSlide) => {
                if (!targetSlide) return;
                track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
                currentSlide.classList.remove('current-slide');
                targetSlide.classList.add('current-slide');
            };

            const updateIndicators = (currentDot, targetDot) => {
                if (!targetDot) return;
                currentDot.classList.remove('active');
                targetDot.classList.add('active');
            };
            
            slides[0].classList.add('current-slide');

            nextButton.addEventListener('click', e => {
                const currentSlide = carouselTrack.querySelector('.current-slide') || slides[0];
                const nextSlide = currentSlide.nextElementSibling || slides[0];
                const currentDot = indicatorsContainer.querySelector('.active');
                const nextDot = currentDot.nextElementSibling || indicators[0];

                moveToSlide(carouselTrack, currentSlide, nextSlide);
                updateIndicators(currentDot, nextDot);
            });

            prevButton.addEventListener('click', e => {
                const currentSlide = carouselTrack.querySelector('.current-slide') || slides[0];
                const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
                const currentDot = indicatorsContainer.querySelector('.active');
                const prevDot = currentDot.previousElementSibling || indicators[indicators.length - 1];
                
                moveToSlide(carouselTrack, currentSlide, prevSlide);
                updateIndicators(currentDot, prevDot);
            });

            indicatorsContainer.addEventListener('click', e => {
                const targetDot = e.target.closest('button.indicator-dot');
                if (!targetDot) return;

                const currentSlide = carouselTrack.querySelector('.current-slide') || slides[0];
                const currentDot = indicatorsContainer.querySelector('.active');
                const targetIndex = indicators.findIndex(dot => dot === targetDot);
                const targetSlide = slides[targetIndex];

                moveToSlide(carouselTrack, currentSlide, targetSlide);
                updateIndicators(currentDot, targetDot);
            });
        }
    }
});

// =========================================================
// SECTION 5: FIX FOR BROWSER BACK/FORWARD CACHE (bfcache)
// =========================================================
window.addEventListener('pageshow', function(event) {
    if (document.body.classList.contains('is-leaving')) {
        document.body.classList.remove('is-leaving');
    }
});
