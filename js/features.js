// js/features.js - Injects side features into the page

document.addEventListener('DOMContentLoaded', () => {
    // Prevent adding features twice if the script accidentally loads multiple times
    if (document.querySelector('.side-feature')) return;

    // 1. Create Left Feature (Merch)
    const leftFeature = document.createElement('a');
    leftFeature.href = "https://apesquadshop.org";
    leftFeature.target = "_blank";
    leftFeature.rel = "noopener noreferrer";
    leftFeature.className = "side-feature left";
    leftFeature.innerHTML = `
        <img src="/images/features/merch.png" alt="Ape Squad Merch">
    `;

    // 2. Create Right Feature (Steam/Bundle)
    const rightFeature = document.createElement('a');
    rightFeature.href = "https://store.steampowered.com/app/4124660/THE_FINALS__APE_SQUAD_TGM25/?curator_clanid=42849803";
    rightFeature.target = "_blank";
    rightFeature.rel = "noopener noreferrer";
    rightFeature.className = "side-feature right";
    rightFeature.innerHTML = `
        <img src="/images/features/bundle.png" alt="Ape Squad Community">
    `;

    // 3. Inject into the page
    document.body.appendChild(leftFeature);
    document.body.appendChild(rightFeature);
});