// ============================================================
// VALORANT LINEUP TRAINER
// ============================================================

// ------------------------------------------------------------
// AGENTEN
// ------------------------------------------------------------

const agents = [
    {
        id: "jett",
        name: "Jett",
        role: "Duelist",
        symbol: "J",
        color: "#c9e8ff"
    },
    {
        id: "sova",
        name: "Sova",
        role: "Initiator",
        symbol: "S",
        color: "#5bbcff"
    },
    {
        id: "viper",
        name: "Viper",
        role: "Controller",
        symbol: "V",
        color: "#65e66d"
    },
    {
        id: "killjoy",
        name: "Killjoy",
        role: "Sentinel",
        symbol: "K",
        color: "#f4d35e"
    },
    {
        id: "brimstone",
        name: "Brimstone",
        role: "Controller",
        symbol: "B",
        color: "#f38b59"
    },
    {
        id: "kayo",
        name: "KAY/O",
        role: "Initiator",
        symbol: "K",
        color: "#719cff"
    },
    {
        id: "sage",
        name: "Sage",
        role: "Sentinel",
        symbol: "S",
        color: "#76e4df"
    },
    {
        id: "gekko",
        name: "Gekko",
        role: "Initiator",
        symbol: "G",
        color: "#9be35a"
    }
];


// ------------------------------------------------------------
// DATEN
// ------------------------------------------------------------

let lineups = JSON.parse(
    localStorage.getItem("valorantLineups") || "[]"
);

let statistics = JSON.parse(
    localStorage.getItem("valorantStatistics") ||
    '{"attempts":0,"correct":0}'
);

let selectedAgent = null;
let currentLineup = null;

let editorImageData = null;
let editorReference = null;
let editorTarget = null;

let trainingStep = 1;
let userReference = null;
let userTarget = null;


// ------------------------------------------------------------
// ELEMENTE
// ------------------------------------------------------------

const agentGrid = document.getElementById("agentGrid");
const lineupGrid = document.getElementById("lineupGrid");

const agentSection = document.getElementById("agentSection");
const lineupSection = document.getElementById("lineupSection");
const trainerSection = document.getElementById("trainerSection");
const createSection = document.getElementById("createSection");

const selectedAgentName =
    document.getElementById("selectedAgentName");

const totalLineups =
    document.getElementById("totalLineups");

const accuracy =
    document.getElementById("accuracy");


// ------------------------------------------------------------
// INITIALISIERUNG
// ------------------------------------------------------------

renderAgents();
updateStats();


// ------------------------------------------------------------
// AGENTEN RENDERN
// ------------------------------------------------------------

function renderAgents() {

    agentGrid.innerHTML = "";

    agents.forEach(agent => {

        const count = lineups.filter(
            lineup => lineup.agent === agent.id
        ).length;

        const card = document.createElement("div");

        card.className = "agent-card";

        card.innerHTML = `
            <div
                class="agent-bg"
                style="
                    background:
                    linear-gradient(
                        145deg,
                        ${agent.color}22,
                        transparent 60%
                    );
                "
            ></div>

            <div
                class="agent-symbol"
                style="color:${agent.color}"
            >
                ${agent.symbol}
            </div>

            <div class="agent-info">
                <h3>${agent.name}</h3>

                <p>
                    ${agent.role} · ${count} Lineup${count !== 1 ? "s" : ""}
                </p>
            </div>
        `;

        card.onclick = () => selectAgent(agent.id);

        agentGrid.appendChild(card);
    });
}


// ------------------------------------------------------------
// AGENT AUSWÄHLEN
// ------------------------------------------------------------

function selectAgent(agentId) {

    selectedAgent = agentId;

    const agent = getAgent(agentId);

    selectedAgentName.textContent = agent.name;

    showScreen("lineupSection");

    renderLineups();
}


// ------------------------------------------------------------
// LINEUPS RENDERN
// ------------------------------------------------------------

function renderLineups() {

    lineupGrid.innerHTML = "";

    const filtered = lineups.filter(
        lineup => lineup.agent === selectedAgent
    );

    if (filtered.length === 0) {

        lineupGrid.innerHTML = `
            <div class="empty">
                <strong>Noch keine Lineups</strong>
                Erstelle dein erstes Lineup für diesen Agenten.
            </div>
        `;

        return;
    }

    filtered.forEach(lineup => {

        const card = document.createElement("div");

        card.className = "lineup-card";

        card.innerHTML = `
            <div class="lineup-thumbnail">

                <img
                    src="${lineup.image}"
                    alt="${escapeHtml(lineup.name)}"
                >

                <button
                    class="delete-lineup"
                    title="Lineup löschen"
                >
                    ×
                </button>

            </div>

            <div class="lineup-info">
                <h3>${escapeHtml(lineup.name)}</h3>

                <p>
                    ${escapeHtml(
                        lineup.description || "Keine Beschreibung"
                    )}
                </p>
            </div>
        `;

        card.addEventListener("click", () => {
            startTraining(lineup.id);
        });

        card.querySelector(".delete-lineup")
            .addEventListener("click", event => {

                event.stopPropagation();

                deleteLineup(lineup.id);
            });

        lineupGrid.appendChild(card);
    });
}


// ------------------------------------------------------------
// TRAINING STARTEN
// ------------------------------------------------------------

function startTraining(lineupId) {

    const found = lineups.find(
        lineup => lineup.id === lineupId
    );

    if (!found) return;

    currentLineup = found;

    document.getElementById("trainerTitle")
        .textContent = found.name;

    showScreen("trainerSection");

    restartAttempt();
}


// ------------------------------------------------------------
// TRAINING NEU STARTEN
// ------------------------------------------------------------

function restartAttempt() {

    trainingStep = 1;

    userReference = null;
    userTarget = null;

    document.getElementById("referenceMarker")
        .classList.add("hidden");

    document.getElementById("targetMarker")
        .classList.add("hidden");

    document.getElementById("userReferenceMarker")
        .classList.add("hidden");

    document.getElementById("userTargetMarker")
        .classList.add("hidden");

    document.getElementById("resultBox")
        .className = "result-box hidden";

    document.getElementById("trainingImage")
        .src = currentLineup.image;

    setTrainingStep(1);
}


// ------------------------------------------------------------
// TRAINING KLICK
// ------------------------------------------------------------

document
    .getElementById("trainingImageWrapper")
    .addEventListener("click", function(event) {

        if (!currentLineup) return;

        const rect = this.getBoundingClientRect();

        const x =
            (event.clientX - rect.left) / rect.width;

        const y =
            (event.clientY - rect.top) / rect.height;

        if (trainingStep === 1) {

            userReference = { x, y };

            placeMarker(
                "userReferenceMarker",
                x,
                y
            );

            trainingStep = 2;

            setTrainingStep(2);

        } else if (trainingStep === 2) {

            userTarget = { x, y };

            placeMarker(
                "userTargetMarker",
                x,
                y
            );

            checkAnswer();
        }
    });


// ------------------------------------------------------------
// ANTWORT PRÜFEN
// ------------------------------------------------------------

function checkAnswer() {

    statistics.attempts++;

    const referenceDistance =
        distance(
            userReference,
            currentLineup.reference
        );

    const targetDistance =
        distance(
            userTarget,
            currentLineup.target
        );

    /*
        Toleranz:

        0.08 = ungefähr 8% der Bildbreite/-höhe.
        Du kannst diesen Wert kleiner machen,
        wenn das Training schwieriger werden soll.
    */

    const tolerance = 0.08;

    const referenceCorrect =
        referenceDistance <= tolerance;

    const targetCorrect =
        targetDistance <= tolerance;

    const correct =
        referenceCorrect && targetCorrect;

    if (correct) {
        statistics.correct++;
    }

    saveStatistics();

    showCorrectPositions();

    const resultBox =
        document.getElementById("resultBox");

    resultBox.classList.remove("hidden");

    if (correct) {

        resultBox.className =
            "result-box good";

        resultBox.innerHTML =
            "✓ RICHTIG! Deine Positionen liegen im Toleranzbereich.";

    } else {

        resultBox.className =
            "result-box bad";

        let reason = [];

        if (!referenceCorrect) {
            reason.push("Referenzposition");
        }

        if (!targetCorrect) {
            reason.push("Zielposition");
        }

        resultBox.innerHTML =
            "✕ Nicht ganz. Falsch: " +
            reason.join(" und ") +
            ".";
    }

    updateStats();
}


// ------------------------------------------------------------
// RICHTIGE POSITIONEN ANZEIGEN
// ------------------------------------------------------------

function showCorrectPositions() {

    placeMarker(
        "referenceMarker",
        currentLineup.reference.x,
        currentLineup.reference.y
    );

    placeMarker(
        "targetMarker",
        currentLineup.target.x,
        currentLineup.target.y
    );
}


// ------------------------------------------------------------
// NÄCHSTE LINEUP
// ------------------------------------------------------------

function nextLineup() {

    const agentLineups =
        lineups.filter(
            lineup => lineup.agent === selectedAgent
        );

    if (agentLineups.length <= 1) {
        restartAttempt();
        return;
    }

    const currentIndex =
        agentLineups.findIndex(
            lineup => lineup.id === currentLineup.id
        );

    const nextIndex =
        (currentIndex + 1) % agentLineups.length;

    currentLineup =
        agentLineups[nextIndex];

    document.getElementById("trainerTitle")
        .textContent = currentLineup.name;

    restartAttempt();
}


// ------------------------------------------------------------
// TRAINING SCHRITT
// ------------------------------------------------------------

function setTrainingStep(step) {

    trainingStep = step;

    const step1 =
        document.getElementById("step1");

    const step2 =
        document.getElementById("step2");

    const text =
        document.getElementById("attemptCounter");

    step1.classList.toggle(
        "active",
        step === 1
    );

    step2.classList.toggle(
        "active",
        step === 2
    );

    text.textContent =
        step === 1
            ? "1 / 2"
            : "2 / 2";
}


// ------------------------------------------------------------
// LINEUP ERSTELLEN
// ------------------------------------------------------------

function openCreateLineup() {

    showScreen("createSection");

    const select =
        document.getElementById("createAgent");

    select.innerHTML = "";

    agents.forEach(agent => {

        const option =
            document.createElement("option");

        option.value = agent.id;
        option.textContent = agent.name;

        if (agent.id === selectedAgent) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    resetEditor();
}


// ------------------------------------------------------------
// BILD AUSWÄHLEN
// ------------------------------------------------------------

document
    .getElementById("imageInput")
    .addEventListener("change", function() {

        const file = this.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(event) {

            editorImageData =
                event.target.result;

            const preview =
                document.getElementById("previewImage");

            preview.src = editorImageData;

            preview.classList.remove("hidden");

            document
                .getElementById("positionEditor")
                .classList.remove("hidden");

            document
                .getElementById("editorImage")
                .src = editorImageData;

            editorReference = null;
            editorTarget = null;

            document
                .getElementById("editorReference")
                .classList.add("hidden");

            document
                .getElementById("editorTarget")
                .classList.add("hidden");

            document
                .getElementById("editorStep")
                .textContent =
                "Klicke auf die Referenzposition.";

            document
                .getElementById("saveButton")
                .disabled = true;
        };

        reader.readAsDataURL(file);
    });


// ------------------------------------------------------------
// EDITOR KLICK
// ------------------------------------------------------------

document
    .getElementById("editorImageWrapper")
    .addEventListener("click", function(event) {

        if (!editorImageData) return;

        const rect =
            this.getBoundingClientRect();

        const x =
            (event.clientX - rect.left) /
            rect.width;

        const y =
            (event.clientY - rect.top) /
            rect.height;

        if (!editorReference) {

            editorReference = { x, y };

            placeMarker(
                "editorReference",
                x,
                y
            );

            document
                .getElementById("editorStep")
                .textContent =
                "Jetzt auf die Zielposition klicken.";

        } else if (!editorTarget) {

            editorTarget = { x, y };

            placeMarker(
                "editorTarget",
                x,
                y
            );

            document
                .getElementById("editorStep")
                .textContent =
                "Fertig! Du kannst das Lineup speichern.";

            document
                .getElementById("saveButton")
                .disabled = false;
        }
    });


// ------------------------------------------------------------
// LINEUP SPEICHERN
// ------------------------------------------------------------

function saveLineup() {

    if (
        !editorImageData ||
        !editorReference ||
        !editorTarget
    ) {
        showToast(
            "Bitte Bild, Referenz und Ziel festlegen."
        );

        return;
    }

    const name =
        document.getElementById("lineupName")
            .value.trim();

    const description =
        document.getElementById("lineupDescription")
            .value.trim();

    const agent =
        document.getElementById("createAgent")
            .value;

    if (!name) {

        showToast("Bitte einen Namen eingeben.");

        return;
    }

    const lineup = {

        id:
            Date.now().toString(),

        agent,

        name,

        description,

        image:
            editorImageData,

        reference:
            editorReference,

        target:
            editorTarget,

        createdAt:
            new Date().toISOString()
    };

    lineups.push(lineup);

    saveLineups();

    selectedAgent = agent;

    showToast("Lineup wurde gespeichert.");

    renderAgents();

    setTimeout(() => {
        selectAgent(agent);
    }, 500);
}


// ------------------------------------------------------------
// LINEUP LÖSCHEN
// ------------------------------------------------------------

function deleteLineup(id) {

    const lineup =
        lineups.find(
            item => item.id === id
        );

    if (!lineup) return;

    const confirmed =
        confirm(
            `Lineup "${lineup.name}" wirklich löschen?`
        );

    if (!confirmed) return;

    lineups =
        lineups.filter(
            item => item.id !== id
        );

    saveLineups();

    renderAgents();

    renderLineups();

    updateStats();

    showToast("Lineup gelöscht.");
}


// ------------------------------------------------------------
// EDITOR ZURÜCKSETZEN
// ------------------------------------------------------------

function resetEditor() {

    editorImageData = null;
    editorReference = null;
    editorTarget = null;

    document.getElementById("lineupName").value = "";
    document.getElementById("lineupDescription").value = "";

    document.getElementById("imageInput").value = "";

    document
        .getElementById("previewImage")
        .classList.add("hidden");

    document
        .getElementById("positionEditor")
        .classList.add("hidden");

    document
        .getElementById("saveButton")
        .disabled = true;
}


// ------------------------------------------------------------
// MARKER POSITIONIEREN
// ------------------------------------------------------------

function placeMarker(id, x, y) {

    const marker =
        document.getElementById(id);

    marker.style.left =
        `${x * 100}%`;

    marker.style.top =
        `${y * 100}%`;

    marker.classList.remove("hidden");
}


// ------------------------------------------------------------
// DISTANZ
// ------------------------------------------------------------

function distance(a, b) {

    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
    );
}


// ------------------------------------------------------------
// SCREENS
// ------------------------------------------------------------

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    document
        .getElementById(id)
        .classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showAgents() {

    selectedAgent = null;

    renderAgents();

    showScreen("agentSection");
}


function showLineups() {

    if (!selectedAgent) {
        showAgents();
        return;
    }

    renderLineups();

    showScreen("lineupSection");
}


// ------------------------------------------------------------
// SPEICHERN
// ------------------------------------------------------------

function saveLineups() {

    localStorage.setItem(
        "valorantLineups",
        JSON.stringify(lineups)
    );
}


function saveStatistics() {

    localStorage.setItem(
        "valorantStatistics",
        JSON.stringify(statistics)
    );
}


// ------------------------------------------------------------
// STATISTIK
// ------------------------------------------------------------

function updateStats() {

    totalLineups.textContent =
        lineups.length;

    if (statistics.attempts === 0) {

        accuracy.textContent = "0%";

    } else {

        accuracy.textContent =
            Math.round(
                statistics.correct /
                statistics.attempts *
                100
            ) + "%";
    }
}


// ------------------------------------------------------------
// AGENT SUCHEN
// ------------------------------------------------------------

function getAgent(id) {

    return agents.find(
        agent => agent.id === id
    );
}


// ------------------------------------------------------------
// HTML SICHER MACHEN
// ------------------------------------------------------------

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------

let toastTimeout;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
}
