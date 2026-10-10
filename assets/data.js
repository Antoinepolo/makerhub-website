/* =====================================================================
   MAKER HUB — données du site
   ---------------------------------------------------------------------
   Pour ajouter un article : ajoute un objet dans la liste (l'ordre n'a
   pas d'importance, le site trie par date, le plus récent d'abord).
   Il apparaît automatiquement sur l'accueil, sur articles.html, dans
   les suggestions en bas des autres articles, dans le terminal
   (ls / open) et dans Ctrl+K.

   href  : chemin depuis la racine du site
   date  : AAAA-MM-JJ
   tags  : "new" | "tuto" | "info" (plusieurs possibles)
   color : couleur de survol (amber, rose, purple, neon, cyan, pink)
   grad  : dégradé du titre (g-amber, g-rose, g-purple, g-rainbow, g-ocean, g-matrix)
   ===================================================================== */
window.MH_ARTICLES = [
    {
        title: "Introduction à la LTZ1000",
        desc: "L'une des références de tension les plus stables du monde.",
        href: "articles/ltz1000.html",
        date: "2026-10-09", author: "antoine8205", read: 20,
        tags: ["new", "info"], color: "rose", grad: "g-rose"
    },
    {
        title: "Tutoriel ADC sur PIC16F84A",
        desc: "Numériser une tension avec un convertisseur tension-fréquence et un PIC16F84A.",
        href: "articles/adc.html",
        date: "2026-09-29", author: "antoine8205", read: 8,
        tags: ["new", "tuto"], color: "amber", grad: "g-amber"
    },
    {
        title: "Introduction à la logique combinatoire",
        desc: "Comment fonctionnent les circuits intégrés, en plongeant dans la puce.",
        href: "articles/ttl.html",
        date: "2026-07-20", author: "antoine8205", read: 15,
        tags: ["tuto"], color: "purple", grad: "g-purple"
    },
    {
        title: "Tutoriel DAC externe",
        desc: "Utiliser un DAC externe avec un microcontrôleur Arduino.",
        href: "articles/dac.html",
        date: "2026-07-20", author: "antoine8205", read: 10,
        tags: ["tuto"], color: "neon", grad: "g-rainbow"
    },
    {
        title: "Maker Hub",
        desc: "Qui nous sommes et notre philosophie.",
        href: "articles/mkhb.html",
        date: "2026-07-20", author: "antoine8205", read: 5,
        tags: ["info"], color: "cyan", grad: "g-ocean"
    }
];

/* Formations, regroupées par domaine (utilisé par le terminal et Ctrl+K).
   La mise en page de l'accueil est dans index.html (section #formations). */
window.MH_FORMATIONS = [
    { domain: "Arduino", level: 1, title: "Arduino — Niveau I",   href: "formations/arduino-niv1.html",
      desc: "Les bases de l'électronique programmée avec l'Arduino Uno.", author: "mixmix92",   duration: "20 h" },
    { domain: "Arduino", level: 2, title: "Arduino — Niveau II",  href: "formations/arduino-niv2.html",
      desc: "Composants avancés, PlatformIO et systèmes plus autonomes.",  author: "antoine8205", duration: "10 h" },
    { domain: "Arduino", level: 3, title: "Arduino — Niveau III", href: "formations/arduino-niv3.html",
      desc: "Puces ARM haute performance et fonctionnalités avancées.",    author: "antoine8205", duration: "en préparation" }
];

window.MH_LINKS = {
    discord: "https://discord.gg/QNEzFvfCaS",
    github:  "https://github.com/Antoinepolo/makerhub-docs",
    mail:    "administration.makerhub@gmail.com"
};
