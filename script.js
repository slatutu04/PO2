/**
 * TEACEHABLE MACHINE BOILERPLATE
 * Este script gerencia a webcam, carrega o modelo TF.js e processa as predições.
 */

// URL DO MODELO: Substitua pelo link fornecido pelo Teachable Machine
// O link deve terminar com uma barra "/", exemplo: "https://teachablemachine.withgoogle.com/models/ABCD123/""
const URL_MODELO = ""; // <--- INSIRA SEU LINK AQUI

let model, webcam, labelContainer, maxPredictions;
const CONFIDENCE_THRESHOLD = 0.85; // Limite de 85% para disparar a ação

/**
 * Inicializa a Webcam e carrega o modelo
 */
async function init() {
    if (!URL_MODELO) {
        alert("Por favor, insira a URL do seu modelo no arquivo script.js");
        return;
    }

    const startBtn = document.getElementById("start-btn");
    startBtn.disabled = true;
    startBtn.innerText = "Carregando...";

    const modelURL = URL_MODELO + "model.json";
    const metadataURL = URL_MODELO + "metadata.json";

    try {
        // Carrega o modelo e os metadados
        // tmImage.loadFromFiles() pode ser usado se os arquivos forem locais
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Configuração da webcam
        const flip = true; // Espelhar a imagem?
        webcam = new tmImage.Webcam(400, 400, flip); // largura, altura, flip
        await webcam.setup(); // Solicita acesso à câmera
        await webcam.play();
        
        // Remove overlay de loading
        document.getElementById("loading").style.opacity = "0";
        setTimeout(() => document.getElementById("loading").style.display = "none", 500);

        // Adiciona canvas ao DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        document.getElementById("status-text").innerText = "Status: Online";
        document.getElementById("status-text").style.color = "#4ade80";

        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error("Erro ao inicializar:", error);
        alert("Erro ao acessar a câmera ou carregar o modelo. Verifique se o link está correto e se o site tem permissão de câmera.");
        startBtn.disabled = false;
        startBtn.innerText = "Tentar Novamente";
    }
}

/**
 * Loop contínuo de atualização da webcam e predição
 */
async function loop() {
    webcam.update(); // Atualiza o frame da webcam
    await predict();
    window.requestAnimationFrame(loop);
}

/**
 * Realiza as predições e gerencia a lógica de triggers
 */
async function predict() {
    // A predição pode receber uma imagem, vídeo ou elemento de canvas
    const prediction = await model.predict(webcam.canvas);
    
    // Encontrar a classe com maior probabilidade
    let highestPrediction = { className: "", probability: 0 };
    
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
        }
    }

    // Atualiza a UI
    updateUI(highestPrediction);

    // Lógica de Trigger: Se a confiança for maior que o threshold, executa ação
    if (highestPrediction.probability >= CONFIDENCE_THRESHOLD) {
        triggerAction(highestPrediction.className);
    }
}

/**
 * Atualiza os elementos visuais na tela
 */
function updateUI(topResult) {
    const labelDiv = document.getElementById("label-container");
    const bar = document.getElementById("confidence-bar");
    
    const probability = (topResult.probability * 100).toFixed(0);
    
    labelDiv.innerText = `${topResult.className} (${probability}%)`;
    bar.style.width = probability + "%";
}

/**
 * Função CUSTOMIZÁVEL para disparar ações baseadas no rótulo detectado
 * @param {string} label - Nome da classe detectada
 */
function triggerAction(label) {
    const card = document.getElementById("main-card");
    
    // Exemplo de ação: Feedback visual de "pulso" no container
    card.classList.add("trigger-active");
    setTimeout(() => card.classList.remove("trigger-active"), 500);

    // EXEMPLO DE LÓGICA POR CLASSE:
    // Se você tiver uma classe chamada "Luz Acesa", pode mudar o fundo do site
    /*
    if (label === "Classe_Especifica") {
        document.body.style.backgroundColor = "#4f46e5";
    }
    */
    
    console.log(`Ação disparada para: ${label}`);
}
