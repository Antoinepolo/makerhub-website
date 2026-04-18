/* ==========================================
   INITIALISATION ET THEME
   ========================================== */
lucide.createIcons();

const themeBtn = document.getElementById('themeBtn');
const body = document.body;

themeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    themeBtn.innerHTML = newTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    lucide.createIcons();
});

/* ==========================================
   ANIMATION AU SCROLL (Intersection Observer)
   ========================================== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(s => observer.observe(s));

/* ==========================================
   ANIMATION TYPEWRITER (Titre Hero)
   ========================================== */
const textElement = document.getElementById('typewriter');
const phrases = [
    "Construire le futur...",
    "Concevoir...",
    "Créer des projets...",
    "Rejoindre Maker Hub..."
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 150;

function type() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        textElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50; 
    } else {
        textElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 150; 
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000; // Temps d'arrêt quand la phrase est complète
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500; 
    }

    setTimeout(type, typeSpeed);
}

document.addEventListener('DOMContentLoaded', type);