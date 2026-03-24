// js/ads.js - Injects side ads into the page

document.addEventListener('DOMContentLoaded', () => {
    // Prevent adding ads twice if the script accidentally loads multiple times
    if (document.querySelector('.side-ad')) return;

    // 1. Create Left Ad (Merch)
    const leftAd = document.createElement('a');
    leftAd.href = "https://apesquadshop.org"; // UPDATE YOUR MERCH LINK HERE
    leftAd.target = "_blank";
    leftAd.className = "side-ad left";
    leftAd.innerHTML = `
        <img src="/images/ads/merch.png" alt="Shop Ape Squad Merch" style="width: 100%; height: 100%; object-fit: cover;">
    `;

    // 2. Create Right Ad (Discord)
    const rightAd = document.createElement('a');
    rightAd.href = "https://store.steampowered.com/app/4124660/THE_FINALS__APE_SQUAD_TGM25/?curator_clanid=42849803"; // UPDATE YOUR DISCORD LINK HERE
    rightAd.target = "_blank";
    rightAd.className = "side-ad right";
    rightAd.innerHTML = `
        <img src="/images/ads/bundle.png" alt="Join Ape Squad Discord" style="width: 100%; height: 100%; object-fit: cover;">
    `;

    // 3. Inject them into the page
    document.body.appendChild(leftAd);
    document.body.appendChild(rightAd);
});
