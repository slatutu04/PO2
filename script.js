/**
 * QUALISCAN 3000 - Factory Quality Scanner
 * Versão Blindada (Teclado + IA)
 */

const URL_MODELO = "https://teachablemachine.withgoogle.com/models/6F40A-3Td/"; 

let model, webcam, maxPredictions;
let currentLabel = "Vazio";
const CONFIDENCE_THRESHOLD = 0.85;

// Configurações do Jogo
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let score = 0;
let efficiency = 100;
let items = [];
let baseSpeed = 2;
let spawnRate = 120;
let stars = 0;
let frameCount = 0;
let gameRunning = false;

const SCAN_ZONE_X = 450;
const SCAN_ZONE_WIDTH = 80;

/**
 * MODO TECLADO - Inicia o jogo sem tocar na câmera
 */
function initKeyboardMode() {
    console.log("Iniciando Modo Teclado...");
    document.getElementById("loading").style.display = "none";
    
    const containerButtons = document.getElementById("keyboard-btn").parentElement;
    if(containerButtons) containerButtons.style.display = "none";

    document.getElementById("status-text").innerText = "MODO TESTE: ESPAÇO";
    document.getElementById("status-text").style.color = "#38bdf8";

    setupKeyboardListeners();
    startGame();
}

function setupKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            currentLabel = "Joia";
            const bar = document.getElementById("confidence-bar");
            if(bar) bar.style.width = "100%";
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
            currentLabel = "Vazio";
            const bar = document.getElementById("confidence-bar");
            if(bar) bar.style.width = "0%";
        }
    });
}

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    console.log("Jogo Iniciado!");
    requestAnimationFrame(gameLoop);
}

/**
 * MODO WEBCAM (Original)
 */
async function init() {
    const startBtn = document.getElementById("start-btn");
    const keyboardBtn = document.getElementById("keyboard-btn");
    
    startBtn.disabled = true;
    keyboardBtn.disabled = true;
    startBtn.innerText = "Carregando...";
    document.getElementById("loading").style.display = "flex";

    try {
        // Tenta carregar bibliotecas
        if (typeof tmImage === 'undefined') throw new Error("Bibliotecas não carregadas. Verifique sua conexão.");

        model = await tmImage.load(URL_MODELO + "model.json", URL_MODELO + "metadata.json");
        maxPredictions = model.getTotalClasses();

        webcam = new tmImage.Webcam(200, 200, true);
        await webcam.setup();
        await webcam.play();

        document.getElementById("loading").style.display = "none";
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        startBtn.parentElement.style.display = "none";

        startGame();
        predictLoop();
    } catch (e) {
        console.error(e);
        alert("Erro na Câmera/Modelos. Iniciando Modo Teclado automaticamente.");
        initKeyboardMode();
    }
}

async function predictLoop() {
    if(!webcam || !gameRunning) return;
    webcam.update();
    const prediction = await model.predict(webcam.canvas);
    let highest = { className: "Vazio", probability: 0 };
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highest.probability) highest = prediction[i];
    }
    currentLabel = highest.probability >= CONFIDENCE_THRESHOLD ? highest.className : "Vazio";
    document.getElementById("label-container").innerText = `IA Vê: ${currentLabel}`;
    document.getElementById("confidence-bar").style.width = (highest.probability * 100) + "%";
    requestAnimationFrame(predictLoop);
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    baseSpeed = 2 + (score / 150);
    spawnRate = Math.max(40, 120 - (score / 5));

    drawConveyor();
    updateItems();
    drawItems();
    updateStats();

    frameCount++;
    if (frameCount % Math.floor(spawnRate) === 0) {
        items.push({ x: -50, y: 80, isGood: Math.random() > 0.4, scanned: false });
    }

    requestAnimationFrame(gameLoop);
}

function drawConveyor() {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 110, canvas.width, 20);
    
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.strokeRect(SCAN_ZONE_X, 20, SCAN_ZONE_WIDTH, 110);
    ctx.fillStyle = "rgba(74, 222, 128, 0.1)";
    ctx.fillRect(SCAN_ZONE_X, 20, SCAN_ZONE_WIDTH, 110);
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.x += baseSpeed;

        if (!item.scanned && item.x > SCAN_ZONE_X && item.x < SCAN_ZONE_X + SCAN_ZONE_WIDTH) {
            if (currentLabel === "Joia") {
                item.scanned = true;
                if (item.isGood) {
                    score += 10;
                    showBadge("BOA!", "#4ade80");
                    checkStars();
                } else {
                    efficiency = Math.max(0, efficiency - 5);
                    showBadge("RUIM!", "#ef4444");
                }
            }
        }

        if (!item.scanned && item.x > SCAN_ZONE_X + SCAN_ZONE_WIDTH) {
            item.scanned = true;
            if (item.isGood) {
                efficiency = Math.max(0, efficiency - 5);
                showBadge(" PASSOU!", "#ef4444");
            } else {
                score += 5;
                checkStars();
            }
        }
        if (item.x > canvas.width) items.splice(i, 1);
    }
}

function drawItems() {
    ctx.font = "40px Arial";
    items.forEach(item => {
        if (!item.isGood) {
            ctx.filter = "grayscale(100%) opacity(0.7)";
            ctx.fillText("🍎", item.x, item.y);
            ctx.filter = "none";
        } else {
            ctx.fillText("🍏", item.x, item.y);
        }
    });
}

function checkStars() {
    const starsNeeded = Math.floor(score / 100);
    if (starsNeeded > stars) {
        stars = starsNeeded;
        const container = document.getElementById("stars-container");
        if(container) {
            container.innerHTML = "";
            for (let i = 0; i < stars; i++) container.innerHTML += '⭐';
        }
    }
}

function showBadge(text, color) {
    const status = document.getElementById("status-text");
    if(status) {
        status.innerText = text;
        status.style.color = color;
    }
    const card = document.getElementById("main-card");
    if(card) {
        card.style.borderColor = color;
        setTimeout(() => card.style.borderColor = "rgba(255,255,255,0.1)", 300);
    }
}

function updateStats() {
    const s = document.getElementById("score");
    const e = document.getElementById("efficiency");
    if(s) s.innerText = score;
    if(e) e.innerText = efficiency;
}
