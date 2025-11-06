// js/main.js - Revamped for Modularity and Readability

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
        // --- FIX: Using root-relative paths ('/header.html') ensures this works from any page depth ---
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
