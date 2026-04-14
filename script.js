/**
 * QUALISCAN 3000 - Factory Quality Scanner
 * Integrado com Teachable Machine
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
let totalProcessed = 0;
let errors = 0;

const items = [];
let spawnRate = 120; 
let baseSpeed = 2; // Velocidade inicial
let stars = 0;
let frameCount = 0;

const SCAN_ZONE_X = 450;
const SCAN_ZONE_WIDTH = 80;

/**
 * MODO DE TECLADO (SEM CÂMERA)
 */
function initKeyboardMode() {
    console.log("Iniciando Modo Teclado...");
    document.getElementById("loading").style.display = "none";
    document.getElementById("start-btn").parentElement.style.display = "none";
    
    document.getElementById("status-text").innerText = "MODO TECLADO: USE ESPAÇO";
    document.getElementById("status-text").style.color = "#38bdf8";

    // Listeners
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            currentLabel = "Joia";
            document.getElementById("confidence-bar").style.width = "100%";
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
            currentLabel = "Vazio";
            document.getElementById("confidence-bar").style.width = "0%";
        }
    });

    gameLoop();
}

/**
 * INICIALIZAÇÃO COM IA (WEBCAM)
 */
async function init() {
    const startBtn = document.getElementById("start-btn");
    const keyboardBtn = document.getElementById("keyboard-btn");
    
    startBtn.disabled = true;
    keyboardBtn.disabled = true;
    startBtn.innerText = "Carregando Modelo...";
    document.getElementById("loading").style.display = "flex";

    try {
        model = await tmImage.load(URL_MODELO + "model.json", URL_MODELO + "metadata.json");
        maxPredictions = model.getTotalClasses();

        startBtn.innerText = "Configurando Câmera...";
        webcam = new tmImage.Webcam(200, 200, true);
        await webcam.setup();
        await webcam.play();

        document.getElementById("loading").style.display = "none";
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        startBtn.parentElement.style.display = "none";

        gameLoop(); 
        predictLoop(); 
    } catch (e) {
        console.error(e);
        alert("Erro na IA: Certifique-se de usar Live Server e permitir a câmera.");
        startBtn.disabled = false;
        keyboardBtn.disabled = false;
        startBtn.innerText = "Tentar com Webcam";
    }
}

async function predictLoop() {
    webcam.update();
    const prediction = await model.predict(webcam.canvas);
    let highest = { className: "Vazio", probability: 0 };
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highest.probability) {
            highest = prediction[i];
        }
    }
    currentLabel = highest.probability >= CONFIDENCE_THRESHOLD ? highest.className : "Vazio";
    document.getElementById("label-container").innerText = `IA Vê: ${currentLabel}`;
    document.getElementById("confidence-bar").style.width = (highest.probability * 100) + "%";
    window.requestAnimationFrame(predictLoop);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    baseSpeed = 2 + (score / 150); 
    spawnRate = Math.max(40, 120 - (score / 5));

    drawConveyor();
    updateItems();
    drawItems();
    updateStats();
    checkStars();

    frameCount++;
    if (frameCount % Math.floor(spawnRate) === 0) spawnItem();

    window.requestAnimationFrame(gameLoop);
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

function spawnItem() {
    const isGood = Math.random() > 0.4;
    items.push({ x: -50, y: 80, isGood: isGood, scanned: false });
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
                    showFeedback("BOA!", "#4ade80");
                } else {
                    takeDamage("REJEITE O RUIM!");
                }
            }
        }

        if (!item.scanned && item.x > SCAN_ZONE_X + SCAN_ZONE_WIDTH) {
            item.scanned = true;
            if (item.isGood) {
                takeDamage("DEIXOU PASSAR BOM!");
            } else {
                score += 5;
            }
        }
        if (item.x > canvas.width) items.splice(i, 1);
    }
}

function checkStars() {
    const starsNeeded = Math.floor(score / 100);
    if (starsNeeded > stars) {
        stars = starsNeeded;
        updateStarsUI();
    }
}

function updateStarsUI() {
    const container = document.getElementById("stars-container");
    container.innerHTML = "";
    for (let i = 0; i < stars; i++) {
        container.innerHTML += '<span class="star-pop">⭐</span>';
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

function takeDamage(reason) {
    efficiency = Math.max(0, efficiency - 5);
    showFeedback(reason, "#ef4444");
}

function showFeedback(text, color) {
    document.getElementById("status-text").innerText = text;
    document.getElementById("status-text").style.color = color;
    document.getElementById("main-card").style.borderColor = color;
    setTimeout(() => document.getElementById("main-card").style.borderColor = "rgba(255,255,255,0.1)", 300);
}

function updateStats() {
    document.getElementById("score").innerText = score;
    document.getElementById("efficiency").innerText = efficiency;
}
