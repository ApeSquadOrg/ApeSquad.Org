// js/profile-card.js
document.addEventListener('DOMContentLoaded', () => {
    // Select all card wrappers on the page
    const cardWrappers = document.querySelectorAll('.pc-card-wrapper');

    // If there are no cards, do nothing
    if (cardWrappers.length === 0) return;

    const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

    // Function to update CSS variables for a specific card
    const updateCardTransform = (card, wrapper, offsetX, offsetY) => {
        const width = card.clientWidth;
        const height = card.clientHeight;

        const percentX = clamp((100 / width) * offsetX);
        const percentY = clamp((100 / height) * offsetY);
        
        const centerX = percentX - 50;
        const centerY = percentY - 50;

        const properties = {
            '--pointer-x': `${percentX}%`,
            '--pointer-y': `${percentY}%`,
            '--pointer-from-center': clamp(Math.hypot(centerY, centerX) / 50, 0, 1),
            '--pointer-from-top': percentY / 100,
            '--pointer-from-left': percentX / 100,
            '--rotate-x': `${(centerX / 4.5).toFixed(2)}deg`, // Less intense rotation
            '--rotate-y': `${(-centerY / 4.5).toFixed(2)}deg`,
            '--background-x': `${50 + centerX / 4}%`,
            '--background-y': `${50 + centerY / 4}%`,
            '--card-opacity': '1'
        };
        
        Object.entries(properties).forEach(([property, value]) => {
            wrapper.style.setProperty(property, value);
        });
    };

    // Add event listeners to each card
    cardWrappers.forEach(wrap => {
        const card = wrap.querySelector('.pc-card');
        if (!card) return;

        card.addEventListener('pointerenter', () => {
            wrap.classList.add('active');
            card.classList.add('active');
        });

        card.addEventListener('pointerleave', () => {
            wrap.classList.remove('active');
            card.classList.remove('active');
            // Reset properties for smooth transition back
            wrap.style.setProperty('--rotate-x', '0deg');
            wrap.style.setProperty('--rotate-y', '0deg');
            wrap.style.setProperty('--card-opacity', '0');
        });

        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            updateCardTransform(card, wrap, event.clientX - rect.left, event.clientY - rect.top);
        });
    });
});