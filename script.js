/**
 * QUALISCAN 3000 - Factory Quality Scanner
 * Integrado com Teachable Machine
 */

const URL_MODELO = ""; // <--- INSIRA SEU LINK DO TM AQUI

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

// ... (init e predictLoop permanecem iguais)

/**
 * Loop do Jogo (Gráficos e Logica)
 */
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ATUALIZAÇÃO DA DIFICULDADE:
    // A cada 100 pontos a velocidade base aumenta
    // E o tempo de spawn diminui
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

// ... (drawConveyor e spawnItem permanecem iguais)

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.x += baseSpeed; // Usa a velocidade dinâmica

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

        if (item.x > canvas.width) {
            items.splice(i, 1);
            totalProcessed++;
        }
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
        // Se for ruim, aplicamos um filtro leve
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
    errors++;
    efficiency = Math.max(0, 100 - (errors * 5));
    showFeedback(reason, "#ef4444");
}

function showFeedback(text, color) {
    const statusText = document.getElementById("status-text");
    statusText.innerText = text;
    statusText.style.color = color;
    
    const card = document.getElementById("main-card");
    card.style.borderColor = color;
    setTimeout(() => card.style.borderColor = "rgba(255,255,255,0.1)", 300);
}

function updateStats() {
    document.getElementById("score").innerText = score;
    document.getElementById("efficiency").innerText = efficiency;
}
