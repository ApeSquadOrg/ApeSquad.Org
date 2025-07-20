// js/main.js

document.addEventListener("DOMContentLoaded", function() {

    // =====================================================
    // SECTION 1: EFFICIENTLY LOAD HEADER AND FOOTER
    // =====================================================
    const loadComponent = (selector, filePath) => {
        // This function now returns the fetch promise
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
    
    // Use Promise.all to wait for both components to load
    Promise.all([
        loadComponent('header', '/header.html'),
        loadComponent('footer', '/footer.html')
    ]).then(() => {
        // This code runs only AFTER the header and footer are loaded
        console.log("Header and Footer loaded. Initializing transitions...");
        initializePageTransitions();
    });


    // =========================================================
    // SECTION 2: SMOOTH PAGE TRANSITIONS (CORRECTED)
    // =========================================================
    function initializePageTransitions() {
        const allLinks = document.querySelectorAll(
            'a[href]:not([href^="#"]):not([href^="mailto:"]):not([target="_blank"])'
        );

        allLinks.forEach(link => {
            // This check prevents adding the same listener multiple times
            if (link.dataset.listenerAdded) return;

            link.addEventListener('click', function(event) {
                event.preventDefault();
                const destination = this.href;

                // KEY FIX: Add the class to the body tag, as intended by your CSS
                document.body.classList.add('is-leaving');

                // After the animation finishes, navigate to the new page
                setTimeout(() => {
                    window.location.href = destination;
                }, 500); // This duration MUST match your CSS animation-duration
            });

            link.dataset.listenerAdded = 'true';
        });
    }
    // We no longer call initializePageTransitions() here, we wait for components to load first.


    // =========================================================
    // SECTION 3: IMAGE CAROUSEL (Unchanged)
    // =========================================================
    const carouselTrack = document.querySelector('.carousel-track');
    
    if (carouselTrack) {
        // This entire section is self-contained and correct, no changes needed.
        const slides = Array.from(carouselTrack.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        const indicatorsContainer = document.querySelector('.carousel-indicators');
        
        // This check prevents errors if the carousel is empty
        if (slides.length === 0) return;

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
});

// =========================================================
// SECTION 4: FIX FOR BROWSER BACK/FORWARD CACHE (bfcache)
// =========================================================
// This event listener fires every time the page is displayed,
// including when navigating back/forward in browser history.
window.addEventListener('pageshow', function(event) {
    // The `is-leaving` class is added when a user clicks a link to navigate away.
    // If the user uses the back button, the browser might restore the page from its
    // cache with this class still applied, making the page invisible.
    // We remove the class to ensure the page is visible and the fadeIn animation plays.
    document.body.classList.remove('is-leaving');
});