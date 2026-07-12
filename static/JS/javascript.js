// Web3 & NFC Terminal Connection JS
let wallet = {
    provider: null,
    signer: null,
    address: "",
    contract: null,
    isScanningNfc: false
};

// Mapa y marcadores de San Bernardino Lagunas
let map = null;
let markers = {};
let routePolylines = [];

// Coordenadas geográficas reales basadas en Google Maps
const coords = {
    stage1: [18.6010, -97.2750], // Hospedaje (Cabañas El Mirador)
    stage2: [18.6015, -97.2735], // Gastronomía (Cocina de Humo)
    stage3: [18.6030, -97.2725], // Lancha (Laguna Grande)
    stage4: [18.6045, -97.2710], // Senderismo (Sendero de Aves)
    stage5: [18.6025, -97.2680], // Experiencia Nocturna (Fogata)
    stage6: [18.6020, -97.2650]  // Cierre (Cumbre Otzelotzi)
};


// Smart Contract ABI pre-cargado para evitar la molestia de copiar y pegar
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_restaurant",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tourist",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "allergy",
                "type": "string"
            }
        ],
        "name": "EscrowCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            }
        ],
        "name": "MilestoneReleased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tourist",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Refunded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "allergy",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_groupSize",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_allergy",
                "type": "string"
            }
        ],
        "name": "createEscrow",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "groupSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "milestoneReleased",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "releaseMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refundRemaining",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "restaurant",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tourist",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // DOM Bindings
    const btnConnect = document.getElementById('btn-connect');
    const btnLoad = document.getElementById('btn-load');
    const btnDeposit = document.getElementById('btn-deposit');
    const btnRefund = document.getElementById('btn-refund');
    const btnNfcScan = document.getElementById('btn-nfc-scan');

    const touristNameInput = document.getElementById('tourist-name');
    const nfcCardholderDisplay = document.getElementById('nfc-cardholder-display');

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.unified-nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Sync input name to NFC Cardholder Graphic in real time
    if (touristNameInput && nfcCardholderDisplay) {
        touristNameInput.addEventListener('input', () => {
            nfcCardholderDisplay.innerText = touristNameInput.value.toUpperCase() || "TURISTA";
        });
    }

    // Connect wallet event
    if (btnConnect) {
        btnConnect.addEventListener('click', connectWallet);
    }

    // Load Contract event
    if (btnLoad) {
        btnLoad.addEventListener('click', loadContract);
    }

    // Send Deposit event
    if (btnDeposit) {
        btnDeposit.addEventListener('click', depositToEscrow);
    }

    // WebNFC Real Scan event
    if (btnNfcScan) {
        btnNfcScan.addEventListener('click', startNfcScan);
    }

    // Release checkpoints events (Manual)
    for (let i = 1; i <= 6; i++) {
        const mBtn = document.getElementById(`btn-milestone-${i}`);
        if (mBtn) {
            mBtn.addEventListener('click', () => releaseMilestone(i));
        }
    }

    // Simulation events (Tap)
    for (let i = 1; i <= 6; i++) {
        const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
        if (simBtn) {
            simBtn.addEventListener('click', () => simulateNfcTap(i));
        }
    }

    // Refund event
    if (btnRefund) {
        btnRefund.addEventListener('click', refundEscrow);
    }

    // Back to video button handler
    const btnBackVideo = document.getElementById('btn-back-video');
    if (btnBackVideo) {
        btnBackVideo.addEventListener('click', playVideoShowcase);
    }

    logToConsole("Terminal Web3 iniciada. Conecte MetaMask y digite el contrato para comenzar.", "info");
    checkNfcSupport();
    
    // Inicializar mapa de Leaflet de forma segura
    try {
        initLeafletMap();
    } catch(e) {
        console.error("Error al iniciar el mapa: ", e);
        logToConsole("Error al cargar el mapa interactivo.", "warning");
    }
});

// Logs messages into the terminal view
function logToConsole(message, type = "info") {
    const consoleLogs = document.getElementById('console-logs');
    if (!consoleLogs) return;

    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    let prefix = "💡 ";
    if (type === "success") prefix = "✅ ";
    if (type === "danger") prefix = "❌ ";
    if (type === "warning") prefix = "⚠️ ";
    if (type === "nfc") prefix = "📡 ";

    line.innerText = `[${time}] ${prefix}${message}`;

    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Check NFC support on device
function checkNfcSupport() {
    if ('NDEFReader' in window) {
        logToConsole("Hardware NFC detectado en el navegador (Compatible con WebNFC nativo).", "success");
    } else {
        logToConsole("WebNFC nativo no disponible en esta plataforma. Utilice la 'Simulación de NFC Tap' en computadoras de escritorio.", "warning");
    }
}

// Inicializar mapa real con Leaflet
function initLeafletMap() {
    if (!document.getElementById('map')) return;

    // Centrar mapa en San Bernardino Lagunas
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView([18.6025, -97.2700], 15);

    // Cargar capa de mapa oscuro (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Segmentos individuales entre etapas sucesivas
    const segments = [
        [coords.stage1, coords.stage2],
        [coords.stage2, coords.stage3],
        [coords.stage3, coords.stage4],
        [coords.stage4, coords.stage5],
        [coords.stage5, coords.stage6]
    ];

    routePolylines = segments.map(seg => {
        return L.polyline(seg, {
            color: 'rgba(255, 255, 255, 0.1)',
            weight: 4,
            dashArray: '6, 6'
        }).addTo(map);
    });

    // Pintar estado inicial bloqueado
    updateProgressMap([false, false, false, false, false, false], false);
}

// Retorna el elemento HTML para el marcador de Leaflet
function getMarkerIcon(state, labelText) {
    return L.divIcon({
        className: `custom-map-marker ${state}`,
        html: `
            <div class="marker-inner">${labelText}</div>
            <div class="marker-glow-ring"></div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });
}

// 1. Connect MetaMask Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            if (window.location.protocol === 'http:') {
                const manualUrl = "http://" + window.location.host + window.location.pathname;
                alert("Para conectarte en el celular durante el desarrollo local, copia este enlace y pégalo en el navegador integrado de MetaMask:\n\n" + manualUrl);
                logToConsole("Por favor, abre la URL manualmente en el navegador de MetaMask.", "warning");
                return;
            } else {
                logToConsole("Redirigiendo a la app de MetaMask...", "info");
                const dappUrl = window.location.host + window.location.pathname;
                window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
                return;
            }
        } else {
            alert("MetaMask no está instalado.");
            logToConsole("MetaMask no detectado. Instale la extensión de navegador.", "danger");
            return;
        }
    }

    try {
        logToConsole("Solicitando conexión a MetaMask...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        wallet.provider = new ethers.providers.Web3Provider(window.ethereum);
        wallet.signer = wallet.provider.getSigner();
        wallet.address = accounts[0];

        // Update UI
        const shortenedWallet = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
        document.getElementById('nav-wallet-status').innerText = `Billetera: ${shortenedWallet}`;
        document.getElementById('nav-wallet-status').classList.add('success');
        
        // Update header button
        const connectBtn = document.getElementById('btn-connect');
        connectBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Conectado`;
        connectBtn.style.color = "#10B981";
        connectBtn.style.borderColor = "#10B981";
        
        // Show navigation wallet badge
        const badge = document.getElementById('wallet-badge');
        if (badge) {
            document.getElementById('display-wallet-nav').innerText = shortenedWallet;
            badge.style.display = 'inline-flex';
        }

        logToConsole(`Billetera conectada exitosamente: ${wallet.address}`, "success");

        // Listen for change events
        window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length === 0) {
                window.location.reload();
            } else {
                wallet.address = newAccounts[0];
                const newShortened = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
                document.getElementById('nav-wallet-status').innerText = `Billetera: ${newShortened}`;
                if (badge) {
                    document.getElementById('display-wallet-nav').innerText = newShortened;
                }
                logToConsole(`Cuenta de MetaMask cambiada a: ${wallet.address}`, "warning");
            }
        });

    } catch (err) {
        logToConsole(`Error de conexión: ${err.message}`, "danger");
    }
}

// 2. Load deployed smart contract
async function loadContract() {
    if (!wallet.signer) {
        alert("Por favor, conecte primero MetaMask.");
        logToConsole("Carga de contrato cancelada: Requiere conectar billetera primero.", "warning");
        return;
    }

    const addr = document.getElementById('contract-address').value.trim();

    if (!ethers.utils.isAddress(addr)) {
        alert("Dirección de contrato no válida.");
        logToConsole("Error de validación: La dirección provista no es una dirección Ethereum válida.", "danger");
        return;
    }

    try {
        logToConsole(`Cargando contrato inteligente en dirección: ${addr}...`);
        
        wallet.contract = new ethers.Contract(addr, CONTRACT_ABI, wallet.signer);
        
        const shortenedContract = `${addr.substring(0, 6)}...${addr.substring(38)}`;
        document.getElementById('nav-contract-status').innerText = `Contrato: ${shortenedContract}`;
        document.getElementById('nav-contract-status').classList.add('success');
        
        logToConsole(`Smart Contract cargado correctamente en: ${addr}`, "success");

        // Enable action buttons
        for (let i = 1; i <= 6; i++) {
            const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
            const mBtn = document.getElementById(`btn-milestone-${i}`);
            if (simBtn) simBtn.disabled = false;
            if (mBtn) mBtn.disabled = false;
        }
        document.getElementById('btn-refund').disabled = false;

        // Try reading balance and state from contract
        await readContractState();
        
        // Listen to Events
        listenToContractEvents();

    } catch (err) {
        logToConsole(`Error al enlazar el contrato: ${err.message}`, "danger");
    }
}

// 3. Read contract ether balance and states
async function readContractState() {
    if (!wallet.provider || !wallet.contract) return;
    try {
        const bal = await wallet.provider.getBalance(wallet.contract.address);
        const ethBalance = ethers.utils.formatEther(bal);
        logToConsole(`[Blockchain Query] Balance del Smart Contract: ${ethBalance} ETH`, "info");
        
        // Actualizar estado visual de la tarjeta NFC basado en el saldo y depósitos
        const nfcStatusDisplay = document.getElementById('nfc-status-display');
        const nfcCardUi = document.getElementById('nfc-card-ui');
        
        const hasBalance = parseFloat(ethBalance) > 0;
        
        if (hasBalance) {
            nfcStatusDisplay.innerText = "Fideicomiso Activo";
            nfcStatusDisplay.style.color = "#34d399";
            nfcCardUi.style.borderColor = "rgba(16, 185, 129, 0.4)";
        } else {
            nfcStatusDisplay.innerText = "No Depositada / Vacío";
            nfcStatusDisplay.style.color = "#fbbf24";
            nfcCardUi.style.borderColor = "rgba(255,255,255,0.1)";
        }

        let milestones = [false, false, false, false, false, false];

        // Consultar hitos liberados en blockchain
        for (let i = 1; i <= 6; i++) {
            const isReleased = await wallet.contract.milestoneReleased(i);
            milestones[i-1] = isReleased;
            const mBtn = document.getElementById(`btn-milestone-${i}`);
            const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
            
            if (isReleased) {
                if (mBtn) {
                    mBtn.classList.add('active-released');
                    mBtn.innerText = `Hito ${i} (Liberado)`;
                }
                if (simBtn) {
                    simBtn.classList.add('active-released');
                    simBtn.disabled = true;
                }
            } else {
                if (mBtn) {
                    mBtn.classList.remove('active-released');
                    mBtn.innerText = `Hito ${i} (${i===6?'Resto':'16%'})`;
                }
                if (simBtn) {
                    simBtn.classList.remove('active-released');
                    simBtn.disabled = false;
                }
            }
        }
        
        // Actualizar mapa interactivo
        updateProgressMap(milestones, hasBalance);
        
    } catch (err) {
        logToConsole(`Error al consultar estado del contrato: ${err.message}`, "warning");
    }
}

// Función auxiliar para actualizar el mapa interactivo de progreso con marcadores reales de Leaflet
function updateProgressMap(milestones, hasBalance) {
    if (!map) return;

    // Remover marcadores antiguos si existen
    Object.keys(markers).forEach(key => {
        if (markers[key]) {
            map.removeLayer(markers[key]);
        }
    });

    const stageEmojis = ['🏡', '🍳', '🛶', '🥾', '🔥', '⛰️'];
    const stageTitles = [
        "1. Hospedaje (Alojamiento)",
        "2. Gastronomía (Degustación)",
        "3. Lancha (Paseo Laguna)",
        "4. Senderismo (Guiado Bosque)",
        "5. Fogata (Exp. Nocturna)",
        "6. Cierre (Cumbre Otzelotzi)"
    ];
    
    // Determinar el estado de cada uno de los 6 marcadores
    let markerStates = [];
    for (let i = 1; i <= 6; i++) {
        if (i === 1) {
            if (milestones[0]) markerStates.push('completed');
            else if (hasBalance) markerStates.push('active');
            else markerStates.push('locked');
        } else {
            if (milestones[i-1]) markerStates.push('completed');
            else if (milestones[i-2]) markerStates.push('active');
            else markerStates.push('locked');
        }
    }

    const coordKeys = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'];
    for (let i = 0; i < 6; i++) {
        markers[coordKeys[i]] = L.marker(coords[coordKeys[i]], {
            icon: getMarkerIcon(markerStates[i], stageEmojis[i])
        }).addTo(map).bindTooltip(`<b>${stageTitles[i]}</b>`, {
            permanent: true,
            direction: 'top',
            className: 'map-tooltip'
        });
    }

    // Actualizar polilíneas (segmentos entre estaciones)
    for (let k = 0; k < 5; k++) {
        const isCompleted = milestones[k];
        const isActive = !isCompleted && (k === 0 ? hasBalance : milestones[k-1]);
        
        if (isCompleted) {
            routePolylines[k].setStyle({ color: '#10B981', dashArray: null, weight: 5 });
        } else if (isActive) {
            routePolylines[k].setStyle({ color: '#00f2fe', dashArray: '6, 6', weight: 4 });
        } else {
            routePolylines[k].setStyle({ color: 'rgba(255, 255, 255, 0.1)', dashArray: '6, 6', weight: 4 });
        }
    }
}

// 4. Send Deposit
async function depositToEscrow() {
    if (!wallet.contract) {
        alert("Por favor, cargue o asocie el contrato primero.");
        logToConsole("Operación cancelada: No se ha cargado un contrato inteligente.", "warning");
        return;
    }

    const name = document.getElementById('tourist-name').value.trim();
    const gSize = parseInt(document.getElementById('group-size').value) || 1;
    const allergy = document.getElementById('allergy-select').value;
    const amountVal = document.getElementById('deposit-amount').value;

    try {
        logToConsole(`Enviando depósito de reserva por ${amountVal} ETH al smart contract...`);
        
        let tx = await wallet.contract.createEscrow(gSize, allergy, {
            value: ethers.utils.parseEther(amountVal)
        });

        logToConsole(`Transacción enviada. Hash: ${tx.hash}`, "info");
        logToConsole("Esperando confirmación de la red Ethereum (Testnet)...");
        
        const receipt = await tx.wait();
        logToConsole(`Transacción confirmada en bloque #${receipt.blockNumber}!`, "success");
        
        // Registrar en la base de datos local
        logToConsole("Registrando progreso en base de datos local...");
        const res = await fetch('/api/tourists/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                contract_address: wallet.contract.address.toLowerCase(),
                group_size: gSize,
                allergy: allergy
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole(`Turista registrado exitosamente en base de datos (ID: ${dbResult.id})`, "success");
        } else {
            logToConsole(`Error al registrar en DB local: ${dbResult.error}`, "danger");
        }

        if (allergy !== 'Ninguna') {
            document.getElementById('allergy-type').innerText = allergy.toUpperCase();
            document.getElementById('allergy-alert').style.display = 'flex';
            logToConsole(`Alerta de alergia registrada en cocina: ${allergy}`, "danger");
        } else {
            document.getElementById('allergy-alert').style.display = 'none';
        }
        
        await readContractState();

    } catch (err) {
        logToConsole(`Error en depósito de reserva: ${err.message}`, "danger");
    }
}

// 5. Release Milestone checkpoint
async function releaseMilestone(id) {
    if (!wallet.contract) return;

    try {
        logToConsole(`Enviando transacción 'releaseMilestone(${id})' desde la terminal...`);
        
        const tx = await wallet.contract.releaseMilestone(id);
        logToConsole(`Transacción enviada. Hash: ${tx.hash}`, "info");
        logToConsole(`Esperando confirmación de liberación del Hito ${id}...`);
        
        const receipt = await tx.wait();
        logToConsole(`Hito ${id} liberado exitosamente en bloque #${receipt.blockNumber}! Fondos transferidos.`, "success");
        
        // Sincronizar actualización con base de datos local
        logToConsole(`Actualizando etapa ${id} en base de datos local...`);
        const res = await fetch('/api/tourists/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contract_address: wallet.contract.address.toLowerCase(),
                stage_id: id
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole(`Base de datos sincronizada. Etapa actual: ${id} (${dbResult.status})`, "success");
        } else {
            logToConsole(`Fallo al sincronizar con base de datos: ${dbResult.error}`, "danger");
        }

        // Actualizar visualmente la tarjeta NFC
        const nfcStatusDisplay = document.getElementById('nfc-status-display');
        if (nfcStatusDisplay) {
            nfcStatusDisplay.innerText = `Hito ${id} Completado`;
            nfcStatusDisplay.style.color = "#00f2fe";
        }
        
        await readContractState();

    } catch (err) {
        logToConsole(`Error al liberar el hito ${id}: ${err.message}`, "danger");
    }
}

// 6. Refund remaining escrow (Admin override)
async function refundEscrow() {
    if (!wallet.contract) return;

    try {
        logToConsole("Solicitando reembolso completo al turista 'refundRemaining()'.");
        
        const tx = await wallet.contract.refundRemaining();
        logToConsole(`Transacción de reembolso enviada. Hash: ${tx.hash}`, "info");
        
        const receipt = await tx.wait();
        logToConsole(`Fideicomiso reembolsado exitosamente en bloque #${receipt.blockNumber}`, "success");
        
        // Sincronizar actualización con base de datos local
        logToConsole("Sincronizando estado de REEMBOLSO en base de datos local...");
        const res = await fetch('/api/tourists/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contract_address: wallet.contract.address.toLowerCase(),
                status: 'refunded'
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole("Base de datos sincronizada: Estado marcado como REEMBOLSADO.", "success");
        } else {
            logToConsole(`Fallo al sincronizar con base de datos: ${dbResult.error}`, "danger");
        }

        await readContractState();

    } catch (err) {
        logToConsole(`Error al reembolsar fondos: ${err.message}`, "danger");
    }
}

// 7. WebNFC Real Scan API (Mobile Android Support)
async function startNfcScan() {
    if (!('NDEFReader' in window)) {
        alert("WebNFC no es soportado en este navegador/dispositivo. Utilice la emulación de escritorio.");
        logToConsole("Hardware NFC no disponible. Escaneo cancelado.", "warning");
        return;
    }

    if (wallet.isScanningNfc) {
        logToConsole("El lector NFC ya se encuentra activo.", "warning");
        return;
    }

    try {
        logToConsole("Iniciando sensor WebNFC. Coloque la tarjeta cerca de la antena...", "info");
        const ndef = new NDEFReader();
        await ndef.scan();
        
        wallet.isScanningNfc = true;
        
        // Animate UI
        document.getElementById('console-scanner-dot').classList.add('scanning-active');
        document.getElementById('nfc-card-ui').classList.add('scanning');
        document.getElementById('btn-nfc-scan').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lector NFC Escaneando...`;
        
        ndef.addEventListener("readingerror", () => {
            logToConsole("Error de lectura NFC. Acerque de nuevo la tarjeta.", "danger");
        });

        ndef.addEventListener("reading", async ({ message, serialNumber }) => {
            logToConsole(`[NFC Físico] Tarjeta detectada con Serial: ${serialNumber}`, "nfc");
            
            // Decodificar mensaje
            const decoder = new TextDecoder();
            let actionType = "";
            
            for (const record of message.records) {
                if (record.recordType === "text") {
                    const text = decoder.decode(record.data);
                    logToConsole(`[NFC Físico] Registro leído: "${text}"`, "nfc");
                    actionType = text.trim().toLowerCase();
                }
            }

            // Flash visual en la tarjeta
            animateCardTap();

            // Lógica: Si el tag especifica un hito, lo liberamos.
            if (actionType.includes("milestone-1") || actionType.includes("hito-1")) {
                await releaseMilestone(1);
            } else if (actionType.includes("milestone-2") || actionType.includes("hito-2")) {
                await releaseMilestone(2);
            } else if (actionType.includes("milestone-3") || actionType.includes("hito-3")) {
                await releaseMilestone(3);
            } else if (actionType.includes("milestone-4") || actionType.includes("hito-4")) {
                await releaseMilestone(4);
            } else if (actionType.includes("milestone-5") || actionType.includes("hito-5")) {
                await releaseMilestone(5);
            } else if (actionType.includes("milestone-6") || actionType.includes("hito-6")) {
                await releaseMilestone(6);
            } else {
                // Auto-detectar siguiente hito pendiente
                logToConsole("Mensaje NFC genérico. Detectando automáticamente siguiente hito en blockchain...", "info");
                await triggerNextMilestone();
            }
        });

    } catch (err) {
        logToConsole(`Error al encender WebNFC: ${err.message}`, "danger");
        stopNfcScanUI();
    }
}

function stopNfcScanUI() {
    wallet.isScanningNfc = false;
    document.getElementById('console-scanner-dot').classList.remove('scanning-active');
    document.getElementById('nfc-card-ui').classList.remove('scanning');
    document.getElementById('btn-nfc-scan').innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> Activar Lector WebNFC Real`;
}

// 8. Desktop Tap Simulation Handler
async function simulateNfcTap(milestoneId) {
    if (!wallet.contract) {
        alert("Por favor, conecte primero su billetera y asocie el contrato.");
        logToConsole("Simulación fallida: Contrato no cargado.", "warning");
        return;
    }

    logToConsole(`[NFC Simulado] Tarjeta acercada al sensor de la terminal. Acción: Hito ${milestoneId}`, "nfc");
    
    // Animate the Virtual Card Tap
    animateCardTap();

    // Trigger the transaction in MetaMask
    await releaseMilestone(milestoneId);
}

// Helper to trigger the next milestone in sequence
async function triggerNextMilestone() {
    if (!wallet.contract) return;
    try {
        let nextToRelease = 0;
        for (let i = 1; i <= 6; i++) {
            const isReleased = await wallet.contract.milestoneReleased(i);
            if (!isReleased) {
                nextToRelease = i;
                break;
            }
        }

        if (nextToRelease > 0) {
            await releaseMilestone(nextToRelease);
        } else {
            logToConsole("Todos los hitos ya han sido liberados en este contrato.", "warning");
        }
    } catch (err) {
        console.error(err);
    }
}

// Card Tap Animation Effect
function animateCardTap() {
    const cardUi = document.getElementById('nfc-card-ui');
    if (!cardUi) return;
    
    // Add rapid scale and glow
    cardUi.style.transform = "scale(1.05) translateY(-5px)";
    cardUi.style.boxShadow = "0 0 35px var(--primary)";
    
    setTimeout(() => {
        cardUi.style.transform = "";
        cardUi.style.boxShadow = "";
    }, 400);
}

// Event Listeners for Smart Contract Logs in Blockchain
function listenToContractEvents() {
    if (!wallet.contract) return;
    try {
        wallet.contract.removeAllListeners();
        
        wallet.contract.on("EscrowCreated", (tourist, amount, allergy) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Fideicomiso Creado por ${tourist}. Monto: ${formattedEth} ETH. Alergias: ${allergy}`, "success");
            readContractState();
        });

        wallet.contract.on("MilestoneReleased", (milestoneId, amount, beneficiary) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Hito ${milestoneId} Confirmado. Fondos pagados: ${formattedEth} ETH a ${beneficiary}`, "success");
            readContractState();
        });
        
        wallet.contract.on("Refunded", (tourist, amount) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Fondos devueltos al turista ${tourist}. Devuelto: ${formattedEth} ETH`, "warning");
            readContractState();
        });
        
        logToConsole("Sincronización de eventos blockchain en vivo activa.", "success");
    } catch (err) {
        console.error("Error al suscribirse a eventos: ", err);
    }
}

// INTERACTIVE GALLERY SHOWCASE CONTROLS
window.swapShowcase = function(imgSrc, title, desc) {
    const video = document.getElementById('gallery-video');
    const imgShowcase = document.getElementById('gallery-img-showcase');
    const sTitle = document.getElementById('showcase-title');
    const sDesc = document.getElementById('showcase-desc');
    const btnBackVideo = document.getElementById('btn-back-video');
    
    if (video) video.style.display = 'none';
    if (imgShowcase) {
        imgShowcase.src = imgSrc;
        imgShowcase.style.display = 'block';
    }
    
    if (sTitle) sTitle.innerText = title;
    if (sDesc) sDesc.innerText = desc;
    if (btnBackVideo) btnBackVideo.style.display = 'block';
}

window.playVideoShowcase = function() {
    const video = document.getElementById('gallery-video');
    const imgShowcase = document.getElementById('gallery-img-showcase');
    const sTitle = document.getElementById('showcase-title');
    const sDesc = document.getElementById('showcase-desc');
    const btnBackVideo = document.getElementById('btn-back-video');
    
    if (imgShowcase) imgShowcase.style.display = 'none';
    if (video) {
        video.style.display = 'block';
        video.play().catch(() => {});
    }
    
    if (sTitle) sTitle.innerText = "Degustación de Antojitos Regionales";
    if (sDesc) sDesc.innerText = "Experiencia gastronómica auténtica en Restaurante Campestre El Mirador con Escrow Web3 y NFC.";
    if (btnBackVideo) btnBackVideo.style.display = 'none';
}

window.swapShowcaseFromElement = function(element) {
    if (!element) return;
    const src = element.getAttribute('data-src');
    const title = element.getAttribute('data-title');
    const desc = element.getAttribute('data-desc');
    swapShowcase(src, title, desc);
}

// =========================================================
// FLASHCARDS (Turismo Tarjetas) LOGIC
// =========================================================
const flashcardsData = [
    { q: "¿Qué significado tiene el nombre del cerro 'Otzelotzi' donde hacemos nuestra cumbre?", a: "Significa 'Cerro del Ocelote' o 'Cerro del Tigre' en náhuatl." },
    { q: "¿Cuál es el secreto de nuestras quesadillas y empanadas hechas a mano?", a: "Se elaboran con masa de maíz criollo, cultivado y nixtamalizado en nuestra propia comunidad." },
    { q: "¿Qué cuerpo de agua exploramos durante el paseo en lancha?", a: "La Laguna Grande de San Bernardino Lagunas, un paraíso natural rodeado de montañas." },
    { q: "¿Por qué nuestra gastronomía se basa en la 'Cocina de Humo'?", a: "Porque cocinamos a la leña a fuego abierto, una técnica ancestral que da un sabor inigualable a cada platillo." },
    { q: "¿Qué majestuoso paisaje se puede observar desde nuestro mirador principal?", a: "Una vista panorámica impresionante de la laguna y, en días despejados, el volcán Pico de Orizaba." }
];

let currentCardIndex = 0;
let wrongCount = 0;
let rightCount = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', () => {
    initFlashcards();
});

function initFlashcards() {
    const container = document.getElementById('fc-container');
    const btnPrev = document.getElementById('fc-prev');
    const btnNext = document.getElementById('fc-next');
    const btnWrong = document.getElementById('fc-wrong');
    const btnRight = document.getElementById('fc-right');
    
    if (!container) return;

    renderCard();

    // Event listeners
    container.addEventListener('click', () => {
        isFlipped = !isFlipped;
        const cardElement = container.querySelector('.flashcard');
        if (cardElement) {
            cardElement.classList.toggle('flipped', isFlipped);
        }
    });

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isFlipped = !isFlipped;
            const cardElement = container.querySelector('.flashcard');
            if (cardElement) {
                cardElement.classList.toggle('flipped', isFlipped);
            }
        } else if (e.code === 'ArrowLeft') {
            navigateCard(-1);
        } else if (e.code === 'ArrowRight') {
            navigateCard(1);
        }
    });

    if (btnPrev) btnPrev.addEventListener('click', () => navigateCard(-1));
    if (btnNext) btnNext.addEventListener('click', () => navigateCard(1));

    if (btnWrong) {
        btnWrong.addEventListener('click', () => {
            wrongCount++;
            document.getElementById('fc-count-wrong').innerText = wrongCount;
            navigateCard(1);
        });
    }

    if (btnRight) {
        btnRight.addEventListener('click', () => {
            rightCount++;
            document.getElementById('fc-count-right').innerText = rightCount;
            navigateCard(1);
        });
    }
}

function renderCard() {
    const container = document.getElementById('fc-container');
    if (!container || flashcardsData.length === 0) return;

    const data = flashcardsData[currentCardIndex];
    
    container.innerHTML = `
        <div class="flashcard active ${isFlipped ? 'flipped' : ''}">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-header">
                        <span>Dato ${currentCardIndex + 1} de ${flashcardsData.length}</span>
                        <i class="fa-solid fa-circle-question"></i>
                    </div>
                    <div class="flashcard-body">
                        <h3>${data.q}</h3>
                    </div>
                    <div class="flashcard-footer">
                        <i class="fa-solid fa-hand-pointer"></i> Clic o Espacio para voltear
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-header">
                        <span>Curiosidad</span>
                        <i class="fa-solid fa-lightbulb"></i>
                    </div>
                    <div class="flashcard-body">
                        <p>${data.a}</p>
                    </div>
                    <div class="flashcard-footer">
                        <i class="fa-solid fa-hand-pointer"></i> Clic o Espacio para regresar
                    </div>
                </div>
            </div>
        </div>
    `;
}

function navigateCard(direction) {
    currentCardIndex += direction;
    if (currentCardIndex < 0) currentCardIndex = flashcardsData.length - 1;
    if (currentCardIndex >= flashcardsData.length) currentCardIndex = 0;
    isFlipped = false;
    renderCard();
}
