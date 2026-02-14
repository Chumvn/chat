/* ============================================================
   CHUM P2P CHAT — app.js
   PeerJS P2P Chat with QR join, Tet food names, Mai blossom FX
   ============================================================ */

/* ==================== QR CODE (using qrcode-generator lib) ==================== */
const QR = {
    renderToCanvas(canvas, text, cellSize) {
        cellSize = cellSize || 5;
        const qr = qrcode(0, "L");
        qr.addData(text);
        qr.make();
        const count = qr.getModuleCount();
        const padding = 4;
        const total = (count + padding * 2) * cellSize;
        canvas.width = total;
        canvas.height = total;
        canvas.style.display = "block";
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, total, total);
        ctx.fillStyle = "#000000";
        for (let r = 0; r < count; r++)
            for (let c = 0; c < count; c++)
                if (qr.isDark(r, c))
                    ctx.fillRect((c + padding) * cellSize, (r + padding) * cellSize, cellSize, cellSize);
    }
};


/* ==================== CONSTANTS ==================== */
const STORAGE_KEY = "chum_app_v1";
const APP_VERSION = "chum_v4.1";
const APP_NAME = "p2p_chat_app";

const TET_FOODS = [
    { name: "Bánh Chưng", icon: "🍚" },
    { name: "Bánh Tét", icon: "🌿" },
    { name: "Mứt Gừng", icon: "🫚" },
    { name: "Mứt Dừa", icon: "🥥" },
    { name: "Thịt Kho", icon: "🍖" },
    { name: "Dưa Hành", icon: "🧅" },
    { name: "Chả Lụa", icon: "🥖" },
    { name: "Xôi Gấc", icon: "🔴" },
    { name: "Nem Rán", icon: "🥟" },
    { name: "Kẹo Mè", icon: "🍬" },
    { name: "Mứt Sen", icon: "🪷" },
    { name: "Hạt Dưa", icon: "🌻" },
    { name: "Khổ Qua", icon: "🥒" },
    { name: "Thịt Đông", icon: "🧊" },
    { name: "Giò Lụa", icon: "🌸" },
    { name: "Bánh Mứt", icon: "🧁" },
    { name: "Chè Kho", icon: "☕" },
    { name: "Tôm Khô", icon: "🦐" },
    { name: "Lạp Xưởng", icon: "🌭" },
    { name: "Măng Khô", icon: "🎋" }
];


/* ==================== STATE ==================== */
let state = {
    version: APP_VERSION,
    app: APP_NAME,
    theme: "dark",
    data: [],
    meta: { created_at: "", updated_at: "" }
};

let myName = null;
let peerName = null;
let peer = null;
let conn = null;
let pendingFile = null;
let incomingFile = null;
let particles = [];
let particleAnimId = null;
let typingTimeout = null;
let isTyping = false;

const EMOJI_LIST = [
    "😀", "😂", "🥰", "😍", "😎", "🤩", "😇", "🥳",
    "😘", "😜", "🤗", "🤔", "😴", "🤯", "😱", "🥺",
    "👍", "👎", "👏", "🙏", "✌️", "🤝", "💪", "🫶",
    "❤️", "🔥", "⭐", "🌈", "🎉", "🎊", "🧧", "🎁",
    "🌸", "🌺", "🌹", "💐", "🍀", "🎋", "🎄", "🏮",
    "🍚", "🥟", "🍖", "🍜", "🧁", "🎂", "🍰", "☕",
    "😡", "💀", "👻", "🤡", "💩", "🐉", "🦁", "🐱"
];


/* ==================== STATE MANAGEMENT ==================== */
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            if (saved.version === APP_VERSION) state = saved;
        }
    } catch (e) { /* ignore */ }
    if (!state.meta.created_at) state.meta.created_at = new Date().toISOString();
}

function saveState() {
    state.meta.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


/* ==================== THEME ==================== */
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
    saveState();
}

function toggleTheme() {
    applyTheme(state.theme === "dark" ? "light" : "dark");
}


/* ==================== TET NAMES ==================== */
function getRandomName() {
    const food = TET_FOODS[Math.floor(Math.random() * TET_FOODS.length)];
    return `${food.icon} ${food.name}`;
}

function refreshMyName() {
    myName = getRandomName();
    document.getElementById("my-name").textContent = myName;
    document.getElementById("user-badge").textContent = myName;
}


/* ==================== TOAST ==================== */
function showToast(msg, type) {
    type = type || "info";
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}


/* ==================== ROOM ID GENERATOR ==================== */
function generateRoomId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function getRoomPeerId(roomId) {
    return "chum-p2p-" + roomId.toUpperCase();
}


/* ==================== PEERJS CONNECTION ==================== */
function setupConnection(connection) {
    conn = connection;

    conn.on("open", () => {
        showScreen("chat-screen");
        document.getElementById("peer-name").textContent = peerName || "Bạn Chat";
        document.getElementById("connection-status").classList.add("online");
        document.getElementById("empty-chat").style.display = "flex";

        sendJSON({ type: "name", content: myName });
        showToast("Đã kết nối! Chúc Mừng Năm Mới 🧧", "success");
    });

    conn.on("data", (data) => {
        if (typeof data === "string") {
            try {
                const msg = JSON.parse(data);
                handleIncomingMessage(msg);
            } catch (err) {
                addMessage(data, "received");
            }
        } else if (data && typeof data === "object" && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)) {
            // PeerJS default serialization delivers parsed objects directly
            handleIncomingMessage(data);
        } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            handleIncomingBinary(data instanceof Uint8Array ? data.buffer : data);
        }
    });

    conn.on("close", () => handleDisconnect());
    conn.on("error", (err) => {
        showToast("Lỗi kết nối: " + err.message, "error");
        handleDisconnect();
    });
}

function handleIncomingMessage(msg) {
    switch (msg.type) {
        case "text":
            hideTypingIndicator();
            addMessage(msg.content, "received", msg.sender);
            break;
        case "name":
            peerName = msg.content;
            document.getElementById("peer-name").textContent = peerName;
            break;
        case "typing":
            showTypingIndicator(msg.sender);
            break;
        case "stop-typing":
            hideTypingIndicator();
            break;
        case "file-start":
            incomingFile = { name: msg.name, size: msg.size, chunks: [], received: 0 };
            showToast("Đang nhận file: " + msg.name, "info");
            break;
        case "file-end":
            if (incomingFile) {
                const blob = new Blob(incomingFile.chunks);
                const url = URL.createObjectURL(blob);
                addFileMessage(incomingFile.name, incomingFile.size, url, "received");
                incomingFile = null;
            }
            break;
    }
}

function handleIncomingBinary(data) {
    if (incomingFile) {
        incomingFile.chunks.push(data);
        incomingFile.received += data.byteLength;
    }
}


/* ==================== CREATE ROOM ==================== */
async function createRoom() {
    const createPanel = document.getElementById("create-panel");
    createPanel.classList.remove("hidden");

    document.getElementById("create-loading").classList.add("active");
    document.getElementById("create-ready").classList.remove("active");

    const roomId = generateRoomId();
    const peerId = getRoomPeerId(roomId);

    try {
        peer = new Peer(peerId, {
            debug: 0,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            }
        });

        peer.on("open", () => {
            document.getElementById("create-loading").classList.remove("active");
            document.getElementById("create-ready").classList.add("active");

            // Show room ID
            document.getElementById("room-id-text").textContent = roomId;

            // Determine QR content based on protocol
            const isWeb = window.location.protocol.startsWith("http");
            let qrData;
            if (isWeb) {
                const baseUrl = window.location.href.split("?")[0].split("#")[0];
                qrData = baseUrl + "?room=" + roomId;
            } else {
                // file:// protocol — just encode room ID
                qrData = roomId;
            }

            // Render QR
            try {
                QR.renderToCanvas(document.getElementById("room-qr"), qrData, 6);
            } catch (e) {
                console.error("QR render error:", e);
            }
        });

        peer.on("connection", (connection) => {
            setupConnection(connection);
        });

        peer.on("error", (err) => {
            if (err.type === "unavailable-id") {
                showToast("Mã phòng trùng, đang tạo lại...", "info");
                if (peer) { peer.destroy(); peer = null; }
                setTimeout(createRoom, 500);
            } else {
                showToast("Lỗi: " + err.message, "error");
            }
        });

    } catch (err) {
        showToast("Lỗi tạo phòng: " + err.message, "error");
    }
}


/* ==================== AUTO-JOIN (from URL) ==================== */
function autoJoinRoom(roomId) {
    const autoPanel = document.getElementById("auto-join-panel");
    autoPanel.classList.remove("hidden");

    // Clear ?room= from URL
    window.history.replaceState({}, "", window.location.pathname);

    const peerId = getRoomPeerId(roomId);

    try {
        peer = new Peer({
            debug: 0,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            }
        });

        peer.on("open", () => {
            const connection = peer.connect(peerId, { reliable: true });
            setupConnection(connection);

            setTimeout(() => {
                if (!conn || !conn.open) {
                    showToast("Không tìm thấy phòng. Mã có thể sai hoặc phòng đã đóng!", "error");
                    autoPanel.classList.add("hidden");
                }
            }, 15000);
        });

        peer.on("error", (err) => {
            if (err.type === "peer-unavailable") {
                showToast("Phòng không tồn tại hoặc đã đóng!", "error");
            } else {
                showToast("Lỗi: " + err.message, "error");
            }
            autoPanel.classList.add("hidden");
        });

    } catch (err) {
        showToast("Lỗi kết nối: " + err.message, "error");
        autoPanel.classList.add("hidden");
    }
}


/* ==================== DISCONNECT ==================== */
function handleDisconnect() {
    if (conn) { conn.close(); conn = null; }
    if (peer) { peer.destroy(); peer = null; }
    peerName = null;
    document.getElementById("connection-status").classList.remove("online");
    showScreen("connect-screen");
    resetPanels();
    showToast("Đã ngắt kết nối", "info");
}

function resetPanels() {
    document.getElementById("create-panel").classList.add("hidden");
    document.getElementById("auto-join-panel").classList.add("hidden");
    document.getElementById("create-loading").classList.add("active");
    document.getElementById("create-ready").classList.remove("active");
    document.getElementById("messages-container").innerHTML = "";
    document.getElementById("empty-chat").style.display = "flex";
}


/* ==================== CHAT ==================== */
function sendJSON(obj) {
    if (conn && conn.open) {
        conn.send(JSON.stringify(obj));
    }
}

function sendMessage() {
    const input = document.getElementById("msg-input");
    const text = input.value.trim();
    if (!text && !pendingFile) return;

    // Hide emoji panel and stop typing
    document.getElementById("emoji-panel").classList.add("hidden");
    if (isTyping) {
        isTyping = false;
        sendJSON({ type: "stop-typing" });
        clearTimeout(typingTimeout);
    }

    if (pendingFile) {
        sendFile(pendingFile);
        pendingFile = null;
        document.getElementById("file-preview").classList.add("hidden");
    }

    if (text) {
        sendJSON({ type: "text", content: text, sender: myName });
        addMessage(text, "sent", myName);
        input.value = "";
    }
}

function addMessage(content, direction, sender) {
    const container = document.getElementById("messages-container");
    document.getElementById("empty-chat").style.display = "none";

    const msgEl = document.createElement("div");
    msgEl.className = "msg " + direction;

    const senderEl = document.createElement("div");
    senderEl.className = "msg-sender";
    senderEl.textContent = sender || (direction === "sent" ? myName : "...");
    msgEl.appendChild(senderEl);

    const contentEl = document.createElement("div");
    contentEl.className = "msg-content";
    contentEl.textContent = content;
    msgEl.appendChild(contentEl);

    const timeEl = document.createElement("div");
    timeEl.className = "msg-time";
    timeEl.textContent = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    msgEl.appendChild(timeEl);

    container.appendChild(msgEl);
    container.parentElement.scrollTop = container.parentElement.scrollHeight;

    state.data.push({
        content, sender: sender || myName, direction,
        time: new Date().toISOString()
    });
    saveState();
}

function addFileMessage(fileName, fileSize, url, direction) {
    const container = document.getElementById("messages-container");
    document.getElementById("empty-chat").style.display = "none";

    const msgEl = document.createElement("div");
    msgEl.className = "msg file-msg " + direction;

    const info = document.createElement("div");
    info.className = "file-info";

    const icon = document.createElement("span");
    icon.className = "file-icon";
    icon.textContent = "📄";
    info.appendChild(icon);

    const details = document.createElement("div");
    details.className = "file-details";

    const nameEl = document.createElement("span");
    nameEl.textContent = fileName;
    details.appendChild(nameEl);

    const sizeEl = document.createElement("span");
    sizeEl.className = "file-size";
    sizeEl.textContent = formatSize(fileSize);
    details.appendChild(sizeEl);

    info.appendChild(details);
    msgEl.appendChild(info);

    const timeEl = document.createElement("div");
    timeEl.className = "msg-time";
    timeEl.textContent = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    msgEl.appendChild(timeEl);

    if (url) {
        msgEl.style.cursor = "pointer";
        msgEl.onclick = () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
        };
    }

    container.appendChild(msgEl);
    container.parentElement.scrollTop = container.parentElement.scrollHeight;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

async function sendFile(file) {
    if (!conn || !conn.open) {
        showToast("Chưa kết nối!", "error");
        return;
    }

    sendJSON({ type: "file-start", name: file.name, size: file.size });

    const CHUNK_SIZE = 16384;
    const reader = file.stream().getReader();
    let buffer = new Uint8Array(0);

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const newBuf = new Uint8Array(buffer.length + value.length);
        newBuf.set(buffer);
        newBuf.set(value, buffer.length);
        buffer = newBuf;

        while (buffer.length >= CHUNK_SIZE) {
            const chunk = buffer.slice(0, CHUNK_SIZE);
            buffer = buffer.slice(CHUNK_SIZE);
            conn.send(chunk);
            await new Promise(r => setTimeout(r, 5));
        }
    }

    if (buffer.length > 0) conn.send(buffer);

    sendJSON({ type: "file-end" });

    const url = URL.createObjectURL(file);
    addFileMessage(file.name, file.size, url, "sent");
    showToast("Đã gửi file: " + file.name, "success");
}


/* ==================== MAI BLOSSOM PARTICLE EFFECTS ==================== */
const PETAL_COLORS = [
    "#FFD700", "#FFC107", "#FF9800", "#FFEB3B", "#FFE082",
    "#FF6F61", "#FF8A80", "#F48FB1", "#E91E63", "#FFCDD2"
];

class Petal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 12 + 6;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6 - 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.15;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
        this.petalType = Math.random() > 0.4 ? "flower" : "petal";
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.08;
        this.speedX *= 0.98;
        this.rotation += this.rotSpeed;
        this.alpha -= this.decay;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.petalType === "flower") {
            const petals = 5;
            for (let i = 0; i < petals; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / petals);
                ctx.beginPath();
                ctx.ellipse(0, -this.size * 0.4, this.size * 0.3, this.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = "#FFD700";
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 0.3, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        ctx.restore();
    }
}

function spawnPetals(x, y, count) {
    count = count || 15;
    for (let i = 0; i < count; i++) {
        particles.push(new Petal(x, y));
    }
    if (!particleAnimId) animateParticles();
}

function animateParticles() {
    const canvas = document.getElementById("particle-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => {
        p.draw(ctx);
        return p.update();
    });

    if (particles.length > 0) {
        particleAnimId = requestAnimationFrame(animateParticles);
    } else {
        particleAnimId = null;
    }
}


/* ==================== SCREEN MANAGEMENT ==================== */
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
}


/* ==================== EMOJI PICKER ==================== */
function initEmojiPanel() {
    const grid = document.querySelector(".emoji-grid");
    grid.innerHTML = "";
    EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = emoji;
        btn.addEventListener("click", () => insertEmoji(emoji));
        grid.appendChild(btn);
    });
}

function toggleEmojiPanel(e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById("emoji-panel");
    const isHidden = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    if (isHidden) {
        // Close panel when clicking outside
        setTimeout(() => {
            document.addEventListener("click", closeEmojiOnOutsideClick);
        }, 10);
    }
}

function closeEmojiOnOutsideClick(e) {
    const panel = document.getElementById("emoji-panel");
    const btn = document.getElementById("btn-emoji");
    if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.add("hidden");
        document.removeEventListener("click", closeEmojiOnOutsideClick);
    }
}

function insertEmoji(emoji) {
    const input = document.getElementById("msg-input");
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
}


/* ==================== TYPING INDICATOR ==================== */
function broadcastTyping() {
    if (!conn || !conn.open) return;
    if (!isTyping) {
        isTyping = true;
        sendJSON({ type: "typing", sender: myName });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        sendJSON({ type: "stop-typing" });
    }, 2000);
}

function showTypingIndicator(name) {
    const indicator = document.getElementById("typing-indicator");
    indicator.querySelector(".typing-name").textContent = name || "...";
    indicator.classList.remove("hidden");

    // Auto-hide after 3s
    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(hideTypingIndicator, 3000);

    // Scroll to bottom
    const chatBox = document.getElementById("chat-messages");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    indicator.classList.add("hidden");
}


/* ==================== EVENT BINDING ==================== */
function bindEvents() {
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
    document.getElementById("refresh-name").addEventListener("click", refreshMyName);

    // Create room
    document.getElementById("btn-create").addEventListener("click", createRoom);

    // Copy room ID
    document.getElementById("copy-room-id").addEventListener("click", () => {
        const roomId = document.getElementById("room-id-text").textContent;
        const baseUrl = window.location.href.split("?")[0].split("#")[0];
        const joinUrl = baseUrl + "?room=" + roomId;
        navigator.clipboard.writeText(joinUrl).then(() => {
            showToast("Đã copy link phòng! 📋", "success");
        }).catch(() => {
            // Fallback: copy room ID only
            navigator.clipboard.writeText(roomId);
            showToast("Đã copy mã phòng: " + roomId, "success");
        });
    });

    // Cancel create
    document.getElementById("btn-cancel-create").addEventListener("click", () => {
        if (peer) { peer.destroy(); peer = null; }
        conn = null;
        resetPanels();
    });

    // Chat
    document.getElementById("btn-disconnect").addEventListener("click", handleDisconnect);
    document.getElementById("btn-send").addEventListener("click", sendMessage);
    document.getElementById("msg-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    // File
    document.getElementById("btn-attach").addEventListener("click", () => {
        document.getElementById("file-input").click();
    });

    document.getElementById("file-input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            pendingFile = file;
            document.getElementById("file-name").textContent = file.name + " (" + formatSize(file.size) + ")";
            document.getElementById("file-preview").classList.remove("hidden");
        }
        e.target.value = "";
    });

    document.getElementById("cancel-file").addEventListener("click", () => {
        pendingFile = null;
        document.getElementById("file-preview").classList.add("hidden");
    });

    // Petal effect on chat click
    document.getElementById("chat-messages").addEventListener("click", (e) => {
        if (e.target.closest(".msg")) return;
        spawnPetals(e.clientX, e.clientY, 12 + Math.floor(Math.random() * 8));
    });

    // Emoji picker
    document.getElementById("btn-emoji").addEventListener("click", toggleEmojiPanel);

    // Typing detection
    document.getElementById("msg-input").addEventListener("input", broadcastTyping);
    document.getElementById("msg-input").addEventListener("blur", () => {
        if (isTyping) {
            isTyping = false;
            sendJSON({ type: "stop-typing" });
        }
    });

    window.addEventListener("resize", () => {
        const canvas = document.getElementById("particle-canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}


/* ==================== APP LIFECYCLE ==================== */
function init() {
    loadState();
    applyTheme(state.theme);
    myName = getRandomName();

    document.getElementById("my-name").textContent = myName;
    document.getElementById("user-badge").textContent = myName;

    initEmojiPanel();
    bindEvents();

    // Check URL for auto-join
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
        autoJoinRoom(roomParam.toUpperCase());
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => { });
    }
}

window.addEventListener("DOMContentLoaded", init);
