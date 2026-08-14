/* ============================================= */
/* INIT                                           */
/* ============================================= */
document.addEventListener("DOMContentLoaded", () => {
    buildPersonaField();
    setupDragAndDrop();
    fetchWeather();

    // Houd de live temperaturen actueel zolang de website geopend blijft.
    setInterval(fetchWeather, 10 * 60 * 1000);
});

/* ============================================= */
/* SCHERM NAVIGATIE                               */
/* ============================================= */
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("screen-" + id).classList.add("active");
}

/* ============================================= */
/* SCHERM 1: LIVE WEER (Open-Meteo, geen API-key nodig) */
/* ============================================= */
const cities = [
    { key: "brussel",   lat: 50.85, lon: 4.35 },
    { key: "antwerpen", lat: 51.22, lon: 4.40 },
    { key: "brugge",    lat: 51.21, lon: 3.22 },
    { key: "luik",      lat: 50.63, lon: 5.57 }
];

async function fetchWeather() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        // Open-Meteo ondersteunt meerdere locaties in één aanvraag.
        const latitudes = cities.map(city => city.lat).join(",");
        const longitudes = cities.map(city => city.lon).join(",");

        const url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + latitudes +
            "&longitude=" + longitudes +
            "&current=temperature_2m";

        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error("Weer-API gaf foutcode " + response.status);
        }

        const result = await response.json();
        const weatherData = Array.isArray(result) ? result : [result];

        cities.forEach((city, index) => {
            const temperature = weatherData[index]?.current?.temperature_2m;
            const element = document.getElementById("temp-" + city.key);

            if (element && Number.isFinite(temperature)) {
                element.textContent = Math.round(temperature) + "°C";
            }
        });
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("Het ophalen van het weer duurde te lang.");
        } else {
            console.error("Kon het weer niet ophalen:", error);
        }
    } finally {
        clearTimeout(timeoutId);
    }
}

/* ============================================= */
/* SCHERM 2: WOLKEN-PERSONAGES                    */
/* Pas hier namen, kleuren en informatie aan.     */
/* ============================================= */
const personas = {
    puffy: {
        name: "Puffy",
        type: "Cumulus",
        dormantImage: "Images/cumulus_dormant.png",
        activeImage: "Images/cumulus_active.png",
        monologue: "Hoi, ik ben Puffy, een <span class=\"highlight\">cumulus</span>wolk! Ik zie eruit als een dikke <span class=\"highlight\">wattenbol</span> in de lucht. Ik verschijn als de zon de grond lekker opwarmt. Waar ik zweef, blijft het meestal <span class=\"highlight\">mooi weer</span>!"
    },
    boomer: {
        name: "Boomer",
        type: "Cumulonimbus",
        dormantImage: "Images/cumulonimbus_dormant.png",
        activeImage: "Images/cumulonimbus_active.png",
        monologue: "Ik ben Boomer, een <span class=\"highlight\">cumulonimbus</span>wolk en ik word <span class=\"highlight\">groot</span> — wel 12 kilometer hoog! Bovenaan plat ik uit als een aambeeld van ijs. Pas op: ik breng <span class=\"highlight\">bliksem</span> en harde wind!"
    },
    misty: {
        name: "Misty",
        type: "Stratus",
        dormantImage: "Images/stratus_dormant.png",
        activeImage: "Images/stratus_active.png",
        monologue: "Ik ben Misty, een <span class=\"highlight\">stratus</span>wolk. Ik hang als een grijze <span class=\"highlight\">deken</span> laag over de hemel. Bij mij wordt het niet stormachtig, gewoon grijs met soms wat <span class=\"highlight\">motregen</span>."
    },
    wispy: {
        name: "Wispy",
        type: "Cirrus",
        dormantImage: "Images/cirrus_dormant.png",
        activeImage: "Images/cirrus_active.png",
        monologue: "Hallo, ik ben Wispy, een <span class=\"highlight\">cirrus</span>wolk! Ik zweef heel <span class=\"highlight\">hoog</span>, hoger dan alle andere wolken. Ik besta uit piepkleine <span class=\"highlight\">ijskristallen</span>. Zie je mij? Dan verandert het weer binnenkort!"
    },
    drizzle: {
        name: "Drizzle",
        type: "Nimbostratus",
        dormantImage: "Images/nimbostratus_dormant.png",
        activeImage: "Images/nimbostratus_active.png",
        monologue: "Ik ben Drizzle, een <span class=\"highlight\">nimbostratus</span>. Een dikke <span class=\"highlight\">regenwolk</span>. Ik breng geen onweer, maar wel <span class=\"highlight\">urenlange regen</span>. Vergeet je paraplu niet!"
    }
};

/* Startposities van de 5 persona's op het scherm (in %) */
const personaPositions = [
    { top: "20%", left: "33%" },  // puffy  
    { top: "6%",  left: "7%" },  // boomer 
    { top: "50%", left: "48%" },  // misty  
    { top: "4%",  left: "62%" },  // wispy  
    { top: "55%", left: "12%" }   // drizzle 
];

function buildPersonaField() {
    const field = document.getElementById("personaField");
    if (!field) return;

    Object.keys(personas).forEach((key, i) => {
        const p = personas[key];
        const pos = personaPositions[i];

        const wrapper = document.createElement("div");
        wrapper.className = "persona-wrapper";
        wrapper.id = "wrapper-" + key;
        wrapper.style.top = pos.top;
        wrapper.style.left = pos.left;
        wrapper.style.animationDuration = (5 + i) + "s";
        wrapper.onclick = () => openPersonaBubble(key);

        const cloud = document.createElement("img");
        cloud.className = "persona-img";
        cloud.id = "persona-img-" + key;
        cloud.src = p.dormantImage;
        cloud.loading = "lazy";
        cloud.decoding = "async";
        cloud.alt = p.name;

        const label = document.createElement("span");
        label.className = "persona-name";
        label.textContent = p.name;

        // Wolken links op het scherm krijgen een bubbel rechts van zich, en omgekeerd,
        // zodat de bubbel niet van het scherm afloopt.
        const side = parseFloat(pos.left) < 50 ? "bubble-right" : "bubble-left";

        const bubble = document.createElement("div");
        bubble.className = "speech-bubble " + side;
        bubble.id = "bubble-" + key;
        bubble.innerHTML = `
            <button class="bubble-close" onclick="event.stopPropagation(); closePersonaBubble('${key}')">×</button>
            <h3>${p.name}</h3>
            <p>${p.monologue}</p>
        `;

        wrapper.appendChild(cloud);
        wrapper.appendChild(label);
        wrapper.appendChild(bubble);
        field.appendChild(wrapper);
    });
}

let activePersonaKey = null;

function setPersonaState(key, isActive) {
    const img = document.getElementById("persona-img-" + key);
    if (!img) return;
    img.src = isActive ? personas[key].activeImage : personas[key].dormantImage;
}

function openPersonaBubble(key) {
    if (activePersonaKey && activePersonaKey !== key) {
        setPersonaState(activePersonaKey, false);
        document.getElementById("bubble-" + activePersonaKey).classList.remove("active");
        document.getElementById("wrapper-" + activePersonaKey).style.animationPlayState = "running";
    }
    activePersonaKey = key;
    setPersonaState(key, true);
    document.getElementById("bubble-" + key).classList.add("active");
    document.getElementById("wrapper-" + key).style.animationPlayState = "paused";
}

function closePersonaBubble(key) {
    setPersonaState(key, false);
    document.getElementById("bubble-" + key).classList.remove("active");
    document.getElementById("wrapper-" + key).style.animationPlayState = "running";
    if (activePersonaKey === key) activePersonaKey = null;
}

/* ============================================= */
/* SCHERM 3: BOUW-EEN-STORM SPEL                  */
/* ============================================= */
let state = {
    koud: false,
    warm: false,
    water: false
};

/* Quizvragen zijn gebaseerd op de feiten die Boomer (Cumulonimbus) op
   scherm 2 geeft. Pas gerust vragen/antwoorden aan of voeg er meer toe. */
const quizQuestions = {
    koud: {
        question: "Wat gebeurt er als koude lucht een warme luchtmassa ontmoet?",
        options: [
            { text: "Ze botsen, en dat kan een storm veroorzaken", correct: true },
            { text: "Er gebeurt niets bijzonders", correct: false },
            { text: "De lucht wordt meteen droog", correct: false }
        ]
    },
    warm: {
        question: "Wat doet warme lucht in de atmosfeer?",
        options: [
            { text: "Ze daalt naar de grond", correct: false },
            { text: "Ze stijgt op en vormt wolken", correct: true },
            { text: "Ze blijft stilstaan", correct: false }
        ]
    },
    water: {
        question: "Wat heeft een wolk vooral nodig om te groeien?",
        options: [
            { text: "Waterdamp / vocht in de lucht", correct: true },
            { text: "Zand", correct: false },
            { text: "Alleen zonlicht", correct: false }
        ]
    }
};

let pendingType = null;

function setupDragAndDrop() {
    const cloud = document.getElementById("gameCloud");
    if (!cloud) return;

    const elements = ["koud", "warm", "water"];

    elements.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("type", id);
        });
    });

    cloud.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    cloud.addEventListener("drop", (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("type");
        if (!type || state[type]) return; // al actief, niets te doen
        openQuiz(type);
    });
}

function openQuiz(type) {
    pendingType = type;
    const q = quizQuestions[type];

    document.getElementById("quizQuestion").textContent = q.question;
    document.getElementById("quizFeedback").textContent = "";

    const optionsEl = document.getElementById("quizOptions");
    optionsEl.innerHTML = "";

    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt.text;
        btn.onclick = () => checkAnswer(opt.correct);
        optionsEl.appendChild(btn);
    });

    document.getElementById("quizModal").classList.add("active");
}

function checkAnswer(correct) {
    const feedback = document.getElementById("quizFeedback");

    if (correct) {
        feedback.textContent = "Juist! ✔";
        feedback.style.color = "#2e8b57";

        setTimeout(() => {
            document.getElementById("quizModal").classList.remove("active");
            state[pendingType] = true;
            addActiveIcon(pendingType);
            updateGameCloud();
            pendingType = null;
        }, 700);
    } else {
        feedback.textContent = "Niet helemaal — probeer opnieuw!";
        feedback.style.color = "#c0392b";
    }
}

let lightningInterval = null;

function updateGameCloud() {
    const cloud = document.getElementById("gameCloud");
    const { koud, warm, water } = state;
    const count = [koud, warm, water].filter(Boolean).length;
    const isStorm = koud && warm && water;

    // Wolkvorm o.b.v. het AANTAL actieve ingrediënten (niet welk specifiek).
    if (count === 0) {
        cloud.src = "Images/cumulus_dormant.png";
    } else if (count === 1) {
        cloud.src = "Images/storm-bouwen2.png";
    } else if (count === 2) {
        cloud.src = "Images/cumulonimbus_dormant.png";
    } else {
        cloud.src = "Images/cumulonimbus_active.png";
    }

    // Water -> regendruppels. Bij volledige storm wordt de regen heviger.
    const rainOverlay = document.getElementById("rainOverlay");
    rainOverlay.classList.toggle("active", water);
    rainOverlay.classList.toggle("heavy", isStorm);

    // Warm -> lucht wordt donkerder, alsof er regenwolken samentrekken.
    // Bij volledige storm wordt het scherm nog veel donkerder.
    const darkOverlay = document.getElementById("darkOverlay");
    darkOverlay.classList.toggle("active", warm && !isStorm);
    darkOverlay.classList.toggle("storm", isStorm);

    // Koud -> vorst kruipt vanaf de randen het scherm in.
    // Bij volledige storm nemen de regen en duisternis het beeld over.
    const frostOverlay = document.getElementById("frostOverlay");
    frostOverlay.classList.toggle("active", koud && !isStorm);

    setLightningMode(isStorm);
}

function setLightningMode(isStorm) {
    const flash = document.getElementById("lightningFlash");

    if (isStorm && !lightningInterval) {
        const strike = () => {
            flash.classList.add("flash");
            setTimeout(() => flash.classList.remove("flash"), 120);
        };
        lightningInterval = setInterval(strike, 2200 + Math.random() * 2200);
    } else if (!isStorm && lightningInterval) {
        clearInterval(lightningInterval);
        lightningInterval = null;
        flash.classList.remove("flash");
    }
}

function addActiveIcon(type) {
    const container = document.getElementById("activeElements");
    if (document.getElementById("active-" + type)) return;

    const wrapper = document.createElement("div");
    wrapper.className = "activeItem";
    wrapper.id = "active-" + type;

    const img = document.createElement("img");
    img.src = "Images/" + capitalize(type) + ".png";
    img.className = "activeIcon";
    img.decoding = "async";

    const text = document.createElement("span");
    text.className = "activeText";
    text.innerText = "Moet ik weg? Klik op mij.";

    wrapper.onclick = () => {
        state[type] = false;
        wrapper.remove();
        updateGameCloud();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(text);
    container.appendChild(wrapper);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
