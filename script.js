document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentTab = 'dashboard';
    let language = 'en';
    let trendsChart;
    let lastCameraImageUrl = '';
    // Point this to your Render backend URL so it works even when using Live Server (port 5500)
    const API_BASE = 'https://ai-crop-disease-detection.onrender.com';

    // UI Elements
    const navItems = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');
    const langBtns = document.querySelectorAll('.language-switch button');

    // Dashboard Elements
    const valTemp = document.getElementById('val-temp');
    const valHum = document.getElementById('val-hum');
    const valSoil = document.getElementById('val-soil');
    const valRain = document.getElementById('val-rain');

    // Prediction Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const analyzeBtn = document.getElementById('analyze-btn');
    const removeBtn = document.getElementById('remove-img');
    const resultsSection = document.getElementById('predict-results');

    // Chat Elements
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    // Camera Elements
    const camImg = document.getElementById('latest-cam-img');
    const camStatus = document.getElementById('cam-status');
    const predictCamBtn = document.getElementById('predict-camera-btn');
    const refreshCamBtn = document.getElementById('refresh-camera');

    // Tab Switching
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    function switchTab(tabId) {
        currentTab = tabId;
        navItems.forEach(i => i.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (activeNav) activeNav.classList.add('active');

        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.getElementById(`${tabId}-tab`);
        if (activeTab) activeTab.classList.add('active');

        const titleMap = {
            dashboard: { title: 'Dashboard', subtitle: 'Real-time crop monitoring' },
            predict: { title: 'Disease Detection', subtitle: 'AI-powered leaf analysis' },
            camera: { title: 'Live Feed', subtitle: 'Remote visual monitoring' },
            history: { title: 'Records', subtitle: 'Past readings and detections' }
        };

        document.getElementById('page-title').textContent = titleMap[tabId].title;
        document.getElementById('page-subtitle').textContent = titleMap[tabId].subtitle;

        if (tabId === 'history') fetchHistory();
        if (tabId === 'camera') fetchCamera();
    }

    // Language Toggle
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            language = btn.id === 'lang-ur' ? 'ur' : 'en';
            updateLanguage();
        });
    });

    function updateLanguage() {
        const translations = {
            en: {
                welcome: 'Welcome Back,',
                dash_title: 'Agricultural Dashboard',
                temp: 'Temperature', hum: 'Humidity', soil: 'Soil Moisture', light: 'Sunlight', rain: 'Rain Status',
                dash: 'Dashboard', pred: 'Crop Doctor', cam: 'Live Feed', hist: 'Records',
                bot_greet: "Hello! I'm your AI agronomy assistant. How can I help you today?",
                bot_error: "AI service unavailable.",
                analyze_btn: 'Diagnose Disease',
                guidance_label: 'Treatment Guidance',
                confidence: 'Confidence',
                healthy_crop: 'Healthy Crop',
                disease_detected: 'Disease Detected',
                not_plant: 'Not a plant image. Please upload a clear leaf photo.'
            },
            ur: {
                welcome: 'خوش آمدید،',
                dash_title: 'زرعی ڈیش بورڈ',
                temp: 'درجہ حرارت', hum: 'نمی', soil: 'مٹی کی نمی', light: 'سورج کی روشنی', rain: 'بارش کی صورتحال',
                dash: 'ڈیش بورڈ', pred: 'ویژن اسٹوڈیو', cam: 'لائیو فیڈ', hist: 'تاریخ',
                bot_greet: "ہیلو! میں آپ کا AI زرعی معاون ہوں۔ میں آج آپ کی کیسے مدد کر سکتا ہوں؟",
                bot_error: "AI سروس دستیاب نہیں ہے۔",
                analyze_btn: 'تشخیص کریں',
                guidance_label: 'علاج اور رہنمائی',
                confidence: 'یقین',
                healthy_crop: 'صحت مند فصل',
                disease_detected: 'بیماری کی نشاندہی',
                not_plant: 'یہ پودے کی تصویر نہیں ہے۔ براہ کرم پتے کی صاف تصویر اپ لوڈ کریں۔'
            }
        };
        const diseaseNames = {
            en: { 'Leaf Spot': 'Leaf Spot', 'Blight': 'Blight', 'Rust': 'Rust', 'Nutrient deficiency': 'Nutrient Deficiency', 'Healthy': 'Healthy' },
            ur: { 'Leaf Spot': 'پتوں کے دھبے', 'Blight': 'جھلساؤ', 'Rust': 'رسٹ (کُنگی)', 'Nutrient deficiency': 'غذائی قلت', 'Healthy': 'صحت مند' }
        };

        const t = translations[language];
        const dn = diseaseNames[language];

        document.getElementById('welcome-msg').textContent = t.welcome;
        document.getElementById('page-subtitle').textContent = t.dash_title;

        const labels = document.querySelectorAll('.sensor-label');
        if (labels.length >= 5) {
            labels[0].textContent = t.temp;
            labels[1].textContent = t.hum;
            labels[2].textContent = t.soil;
            labels[3].textContent = t.light;
            labels[4].textContent = t.rain;
        }

        if (currentTab === 'dashboard') {
            document.getElementById('page-title').textContent = t.dash;
        } else if (currentTab === 'predict') {
            document.getElementById('page-title').textContent = t.pred;
        } else if (currentTab === 'camera') {
            document.getElementById('page-title').textContent = t.cam;
        } else if (currentTab === 'history') {
            document.getElementById('page-title').textContent = t.hist;
        }

        const analyzeBtnText = document.getElementById('analyze-btn');
        if (analyzeBtnText && !analyzeBtnText.disabled) analyzeBtnText.textContent = t.analyze_btn;

        if (chatMessages && chatMessages.children.length <= 1) {
            const botMsg = chatMessages.querySelector('.message.bot');
            if (botMsg) botMsg.textContent = t.bot_greet;
        }

        // Update results if present
        const resTitle = document.getElementById('res-disease');
        if (resTitle && resTitle.textContent !== 'Detected Disease') {
            // Re-render displayResult with localized names if we had a stored result
            // (For simplicity we'll just update the labels if they match keys)
            if (dn[resTitle.textContent]) resTitle.textContent = dn[resTitle.textContent];
        }
    }

    // System Health Check
    async function checkSystemHealth() {
        const dot = document.getElementById('system-status-dot');
        const text = document.getElementById('system-status-text');
        const mlText = document.getElementById('ml-status-text');

        try {
            const res = await fetch(`${API_BASE}/health`);
            const data = await res.json();

            if (data.ok) {
                dot.className = 'status-dot online';
                text.textContent = 'System Online';
                mlText.textContent = data.ml_available ? 'ML: Ready' : 'ML: Emulated';
                const modelConf = document.getElementById('conf-model');
                if (modelConf) modelConf.textContent = data.model_loaded ? 'Loaded' : 'Not Loaded';
            } else {
                throw new Error('Offline');
            }
        } catch (err) {
            dot.className = 'status-dot offline';
            text.textContent = 'System Offline';
            mlText.textContent = 'ML: Disconnected';
            const modelConf = document.getElementById('conf-model');
            if (modelConf) modelConf.textContent = 'Error';
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch(`${API_BASE}/sensors/config`);
            const data = await res.json();
            const espUrl = document.getElementById('conf-esp-url');
            const camUrl = document.getElementById('conf-cam-url');
            if (espUrl) espUrl.textContent = data.esp32_url || 'N/A';
            if (camUrl) camUrl.textContent = data.esp32_camera_url || 'N/A';
        } catch (err) {
            console.error('Config fetch failed');
        }
    }

    // Fetch Sensor Data
    async function fetchSensors() {
        try {
            const res = await fetch(`${API_BASE}/sensors/latest`);
            const data = await res.json();

            if (data && valTemp) {
                valTemp.textContent = data.temperature.toFixed(1);
                valHum.textContent = data.humidity.toFixed(1);

                // Soil Percentage Calculation (Calibrated like Flutter app)
                const rawSoil = data.soil;
                const wet = 1000;
                const dry = 4095;
                let pct = 0;
                if (rawSoil <= wet) pct = 100;
                else if (rawSoil >= dry) pct = 0;
                else pct = 100 * (1 - (rawSoil - wet) / (dry - wet));

                document.getElementById('val-soil-pct').textContent = pct.toFixed(0);
                document.getElementById('val-soil-raw').textContent = rawSoil;

                // Light
                const lightVal = document.getElementById('val-light');
                if (lightVal) lightVal.textContent = (data.light || 0).toFixed(0);

                // Rain (Threshold 3000 like Flutter app)
                if (data.rain < 3000) {
                    valRain.textContent = language === 'ur' ? 'بارش ہو رہی ہے' : 'Raining';
                    valRain.style.color = 'var(--secondary)';
                } else {
                    valRain.textContent = language === 'ur' ? 'بارش نہیں' : 'No Rain';
                    valRain.style.color = 'var(--text-main)';
                }
            }
        } catch (err) {
            console.error('Failed to fetch sensors:', err);
        }
    }

    // Initialize Chart
    function initChart() {
        const canvas = document.getElementById('trendsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#e74c3c',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Humidity (%)',
                    data: [],
                    borderColor: '#3498db',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                }
            }
        });
    }

    async function updateChart() {
        if (!trendsChart) return;
        try {
            const res = await fetch(`${API_BASE}/sensors/history?limit=10`);
            const data = await res.json();
            const readings = (data.readings || []).reverse();

            trendsChart.data.labels = readings.map(r => new Date(r.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            trendsChart.data.datasets[0].data = readings.map(r => r.temperature);
            trendsChart.data.datasets[1].data = readings.map(r => r.humidity);
            trendsChart.update();
        } catch (err) {
            console.error('Chart update failed:', err);
        }
    }

    // Prediction Logic
    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());

    if (fileInput) fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            dropZone.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            resultsSection.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    if (analyzeBtn) analyzeBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', language);
        formData.append('include_guidance', 'true');

        try {
            const res = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();

            if (data.is_plant === false) {
                showToast(data.message || 'Analysis rejected: Not a plant image.', 'error');
            } else if (data.error) {
                showToast('Analysis failed. Try again.', 'error');
            } else {
                displayResult(data);
                showToast('Analysis complete!', 'success');
            }
        } catch (err) {
            showToast('Server connection error', 'error');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Crop';
        }
    });

    function displayResult(data) {
        if (!resultsSection) return;
        const translations = {
            en: { healthy_crop: 'Healthy Crop', disease_detected: 'Disease Detected', confidence: 'Confidence', guidance: 'Treatment Guidance' },
            ur: { healthy_crop: 'صحت مند فصل', disease_detected: 'بیماری کی نشاندہی', confidence: 'یقین', guidance: 'علاج اور رہنمائی' }
        };
        const diseaseNames = {
            en: { 'Leaf Spot': 'Leaf Spot', 'Blight': 'Blight', 'Rust': 'Rust', 'Nutrient deficiency': 'Nutrient Deficiency', 'Healthy': 'Healthy' },
            ur: { 'Leaf Spot': 'پتوں کے دھبے', 'Blight': 'جھلساؤ', 'Rust': 'رسٹ (کُنگی)', 'Nutrient deficiency': 'غذائی قلت', 'Healthy': 'صحت مند' }
        };

        const t = translations[language];
        const dn = diseaseNames[language];
        const category = data.category_top || 'Unknown';
        const isHealthy = category.toLowerCase().includes('healthy');

        resultsSection.classList.remove('hidden');
        resultsSection.className = `results-section glass ${isHealthy ? 'healthy' : 'disease'}`;

        document.getElementById('res-disease').textContent = dn[category] || category;
        document.getElementById('res-category').textContent = (data.top_classes && data.top_classes[0]) ? data.top_classes[0].name : 'N/A';
        document.getElementById('res-confidence').textContent = data.confidence ? `${t.confidence}: ${(data.confidence * 100).toFixed(1)}%` : '--%';

        const guidanceTitle = resultsSection.querySelector('.guidance-box h4');
        if (guidanceTitle) guidanceTitle.textContent = t.guidance;
        document.getElementById('res-guidance').textContent = data.guidance || 'No specific guidance available.';

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    if (removeBtn) removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        previewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    });

    // Camera Logic
    async function fetchCamera() {
        if (!camImg) return;
        try {
            const res = await fetch(`${API_BASE}/camera/latest`);
            const data = await res.json();

            if (data.image_url || data.latest_image_url) {
                const url = data.image_url || data.latest_image_url;
                camImg.src = url;
                lastCameraImageUrl = url;
                camStatus.textContent = 'Last capture shown';
            } else {
                camStatus.textContent = 'No images captured yet';
                lastCameraImageUrl = '';
            }
        } catch (err) {
            camStatus.textContent = 'Failed to load camera data';
        }
    }

    if (predictCamBtn) predictCamBtn.addEventListener('click', async () => {
        if (!lastCameraImageUrl) {
            showToast('No image available to analyze', 'error');
            return;
        }

        predictCamBtn.disabled = true;
        predictCamBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const res = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: lastCameraImageUrl,
                    language: language,
                    include_guidance: true
                })
            });
            const data = await res.json();

            if (data.is_plant === false) {
                showToast(data.message, 'error');
            } else {
                switchTab('predict');
                displayResult(data);
                showToast('Camera analysis complete!', 'success');
            }
        } catch (err) {
            showToast('Cloud analysis failed', 'error');
        } finally {
            predictCamBtn.disabled = false;
            predictCamBtn.innerHTML = '<i class="fas fa-microscope"></i> Analyze This Capture';
        }
    });

    if (refreshCamBtn) refreshCamBtn.addEventListener('click', fetchCamera);

    // History Logic
    async function fetchHistory() {
        const tbody = document.querySelector('#predictions-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4">Loading history...</td></tr>';

        try {
            const res = await fetch(`${API_BASE}/predictions/history`);
            const data = await res.json();

            tbody.innerHTML = '';
            const predictions = data.predictions || [];
            if (predictions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No records found</td></tr>';
                return;
            }
            predictions.forEach(p => {
                const row = `
                    <tr>
                        <td>${new Date(p.ts * 1000).toLocaleDateString()}</td>
                        <td><strong>${p.disease}</strong></td>
                        <td>${(p.confidence * 100).toFixed(0)}%</td>
                        <td>${p.image_url ? `<img src="${p.image_url}" class="history-thumb" onclick="window.open('${p.image_url}')">` : 'N/A'}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="4">Failed to load history</td></tr>';
        }
    }

    // Chat Logic
    if (chatToggle) chatToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('hidden');
        if (!chatContainer.classList.contains('hidden')) {
            chatInput.focus();
        }
    });
    if (closeChat) closeChat.addEventListener('click', () => chatContainer.classList.add('hidden'));

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        appendMessage('user', msg);
        chatInput.value = '';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    language: language,
                    category: document.getElementById('res-disease').textContent !== 'Detected Disease' ? document.getElementById('res-disease').textContent : null
                })
            });
            const data = await res.json();
            typingDiv.remove();
            appendMessage('bot', data.reply || data.translated || "I couldn't process that request.");
        } catch (err) {
            typingDiv.remove();
            appendMessage('bot', 'Sorry, I am having trouble connecting to the AI.');
        }
    }

    function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    // Initialize
    updateLanguage();
    initChart();
    fetchSensors();
    updateChart();
    checkSystemHealth();
    fetchConfig();

    // Polling
    setInterval(fetchSensors, 5000);
    setInterval(updateChart, 30000);
    setInterval(checkSystemHealth, 15000);
});
