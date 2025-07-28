// js/main.js

document.addEventListener("DOMContentLoaded", function() {

    // =====================================================
    // SECTION 1: DYNAMICALLY LOAD HEADER AND FOOTER
    // =====================================================
    // This function fetches HTML content and injects it into a specified element.
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
        // Return a resolved promise if the element doesn't exist to prevent errors
        return Promise.resolve();
    };
    
    // Use Promise.all to wait for both components to load before running other scripts
    Promise.all([
        loadComponent('header', 'header.html'),
        loadComponent('footer', 'footer.html')
    ]).then(() => {
        // This code runs only AFTER the header and footer are loaded
        console.log("Header and Footer loaded. Initializing site modules...");
        
        // Initialize all scripts that depend on the header/footer HTML
        initializePageTransitions();
        initializeMobileNav();
    });


    // =========================================================
    // SECTION 2: MOBILE NAVIGATION & DROPDOWN LOGIC
    // =========================================================
    function initializeMobileNav() {
        const navToggle = document.querySelector('.mobile-nav-toggle');
        const primaryNav = document.querySelector('header nav');

        // Safety check in case the elements aren't found
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
            } else {
                // If menu is closed, open it
                primaryNav.setAttribute('data-visible', 'true');
                navToggle.setAttribute('aria-expanded', 'true');
            }
        });

        // --- Handle Dropdown Accordion on Mobile ---
        const dropdowns = primaryNav.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const dropBtn = dropdown.querySelector('.dropbtn');
            if (dropBtn) {
                dropBtn.addEventListener('click', (e) => {
                    // Check if we are in mobile view (the toggle is visible)
                    // This makes it work like an accordion on mobile but not on desktop
                    if (window.getComputedStyle(navToggle).display !== 'none') {
                        e.preventDefault(); // Prevent link navigation on mobile
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
        // Select all links that don't open in a new tab or point to an anchor
        const allLinks = document.querySelectorAll(
            'a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])'
        );

        allLinks.forEach(link => {
            if (link.dataset.listenerAdded) return; // Prevent adding multiple listeners

            link.addEventListener('click', function(event) {
                const destination = this.href;

                // Don't run the animation if the link is inside a mobile dropdown button
                if (window.getComputedStyle(document.querySelector('.mobile-nav-toggle')).display !== 'none' && this.matches('.dropbtn')) {
                    return; // Let the mobile nav script handle it
                }
                
                event.preventDefault(); // Stop the default navigation
                
                // Add the class to trigger the fade-out animation
                document.body.classList.add('is-leaving');

                // After the animation finishes, navigate to the new page
                setTimeout(() => {
                    window.location.href = destination;
                }, 500); // This duration MUST match your CSS animation-duration
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
// This listener fires when a page is shown from the browser's cache (e.g., using the back button).
// It removes the 'is-leaving' class to make sure the page is visible after navigating back.
window.addEventListener('pageshow', function(event) {
    if (document.body.classList.contains('is-leaving')) {
        document.body.classList.remove('is-leaving');
    }
});
