const API_URL = "https://emergencyai.onrender.com/api/emergency";
const DEMO_URL = "https://emergencyai.onrender.com/api/emergency/demo";

let demoRunning = false;


// ==================================================
// HELPER
// ==================================================

function setText(id, value, fallback = "—") {

    const element = document.getElementById(id);

    if (!element) return;

    element.textContent =
        value !== undefined &&
        value !== null &&
        value !== ""
            ? value
            : fallback;
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==================================================
// TRANSCRIPT
// ==================================================

function renderTranscript(transcript) {

    const container =
        document.getElementById("transcript");

    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(transcript) || transcript.length === 0) {

        container.innerHTML = `
            <div class="empty-transcript">
                Waiting for emergency conversation...
            </div>
        `;

        return;
    }

    transcript.forEach(item => {

        const message =
            document.createElement("div");

        const speaker =
            String(item.speaker || "").toUpperCase();

        message.className =
            speaker === "AI"
                ? "transcript-message ai-message"
                : "transcript-message caller-message";

        message.innerHTML = `
            <div class="transcript-speaker">
                ${speaker === "AI" ? "🤖 AI" : "👤 CALLER"}
            </div>

            <div class="transcript-text">
                ${escapeHtml(item.message || "")}
            </div>

            <div class="transcript-time">
                ${escapeHtml(item.time || "")}
            </div>
        `;

        container.appendChild(message);
    });

    container.scrollTop =
        container.scrollHeight;
}


// ==================================================
// RESPONSE TIMELINE
// ==================================================

function renderTimeline(events) {

    const container =
        document.getElementById("dispatchTimeline");

    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {

        container.innerHTML = `
            <div class="timeline-empty">
                Waiting for incident activity...
            </div>
        `;

        return;
    }

    events.forEach((event, index) => {

        const item =
            document.createElement("div");

        item.className =
            index === events.length - 1
                ? "timeline-item latest new-event"
                : "timeline-item";

        item.innerHTML = `
            <div class="timeline-marker"></div>

            <div class="timeline-content">

                <strong>
                    ${escapeHtml(event.event || "")}
                </strong>

                <span>
                    ${escapeHtml(event.time || "")}
                </span>

            </div>
        `;

        container.appendChild(item);
    });
}


// ==================================================
// LIVE ANIMATIONS
// ==================================================

function updateAnimations(data) {

    const callCard =
        document.querySelector(".call-card");

    const aiCard =
        document.querySelector(".ai-card");

    const locationCard =
        document.querySelector(".location-panel");

    const ambulanceCard =
        document.querySelector(".ambulance-panel");

    const priorityCard =
        document.querySelector(".triage-panel");


    // CALL

    if (
        data.status &&
        data.status !== "WAITING_FOR_CALL"
    ) {

        callCard?.classList.add("call-active");

    } else {

        callCard?.classList.remove("call-active");

    }


    // AI

    if (
        data.aiStatus &&
        data.aiStatus !== "AI STANDBY"
    ) {

        aiCard?.classList.add("ai-listening");

    } else {

        aiCard?.classList.remove("ai-listening");

    }


    // LOCATION

    if (
        data.location &&
        data.location !== "Waiting for location..."
    ) {

        locationCard?.classList.add("location-active");

    } else {

        locationCard?.classList.remove("location-active");

    }


    // AMBULANCE

    if (data.ambulance === "DISPATCHED") {

        ambulanceCard?.classList.add(
            "ambulance-dispatched"
        );

    } else {

        ambulanceCard?.classList.remove(
            "ambulance-dispatched"
        );

    }


    // CRITICAL

    if (data.priority === "CRITICAL") {

        priorityCard?.classList.add(
            "critical-active"
        );

    } else {

        priorityCard?.classList.remove(
            "critical-active"
        );

    }
}


// ==================================================
// LOAD EMERGENCY DATA
// ==================================================

async function loadEmergencyData() {

    try {

        const response =
            await fetch(API_URL, {
                cache: "no-store"
            });


        if (!response.ok) {

            throw new Error(
                "Emergency API request failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "🚑 Emergency data:",
            data
        );


        // ------------------------------
        // ANIMATIONS
        // ------------------------------

        updateAnimations(data);


        // ------------------------------
        // EMERGENCY ID
        // ------------------------------

        setText(
            "headerEmergencyId",
            data.emergencyId
        );

        setText(
            "emergencyId",
            data.emergencyId
        );


        // ------------------------------
        // CALL
        // ------------------------------

        setText(
            "callStatus",
            data.status,
            "WAITING"
        );

        setText(
            "callMessage",
            data.status === "WAITING_FOR_CALL"
                ? "Waiting for emergency call..."
                : "AI Emergency Agent is active"
        );


        // ------------------------------
        // LANGUAGE
        // ------------------------------

        setText(
            "language",
            data.language,
            "Detecting..."
        );

        setText(
            "conversationLanguage",
            data.language,
            "Detecting..."
        );

        setText(
            "languageDetails",
            data.language
        );


        // ------------------------------
        // AI
        // ------------------------------

        setText(
            "aiStatus",
            data.aiStatus,
            "AI STANDBY"
        );

        setText(
            "topAiStatus",
            data.aiStatus,
            "STANDBY"
        );

        setText(
            "aiQuestion",
            data.question,
            "Waiting for emergency information..."
        );


        // ------------------------------
        // LOCATION
        // ------------------------------

        setText(
            "locationStatus",
            data.location,
            "Waiting for location..."
        );

        setText(
            "triageLocation",
            data.location
        );


        if (
            data.location &&
            data.location !== "Waiting for location..."
        ) {

            setText(
                "locationDetected",
                "DETECTED"
            );

            setText(
                "locationAccuracy",
                "Demo location"
            );

        } else {

            setText(
                "locationDetected",
                "WAITING"
            );

            setText(
                "locationAccuracy",
                "—"
            );
        }


        // ------------------------------
        // AMBULANCE
        // ------------------------------

        setText(
            "ambulanceStatus",
            data.ambulance,
            "WAITING"
        );

        setText(
            "topAmbulanceStatus",
            data.ambulance,
            "WAITING"
        );


        if (data.ambulance === "DISPATCHED") {

            setText(
                "ambulanceMessage",
                "🚑 Ambulance is on the way"
            );

        } else {

            setText(
                "ambulanceMessage",
                "Waiting for emergency confirmation"
            );
        }


        // Ambulance details

        if (data.ambulanceDetails) {

            setText(
                "ambulanceId",
                data.ambulanceDetails.id,
                "AMBULANCE —"
            );

            setText(
                "ambulanceEta",
                data.ambulanceDetails.eta
            );

            setText(
                "ambulanceDistance",
                data.ambulanceDetails.distance
            );

        }


        // ------------------------------
        // DISPATCH TIME
        // ------------------------------

        let dispatchEvent = null;

        if (
            Array.isArray(data.dispatchTimeline)
        ) {

            dispatchEvent =
                data.dispatchTimeline.find(
                    item =>
                        String(
                            item.event || ""
                        )
                        .toLowerCase()
                        .includes("dispatch")
                );
        }

        setText(
            "dispatchTime",
            dispatchEvent?.time
        );


        // ------------------------------
        // PRIORITY
        // ------------------------------

        setText(
            "priorityStatus",
            data.priority,
            "ANALYZING"
        );

        setText(
            "topPriorityStatus",
            data.priority,
            "ANALYZING"
        );


        if (data.priority === "CRITICAL") {

            setText(
                "priorityMessage",
                "Immediate medical attention required"
            );

        } else if (data.priority === "HIGH") {

            setText(
                "priorityMessage",
                "Urgent medical response required"
            );

        } else if (data.priority === "MODERATE") {

            setText(
                "priorityMessage",
                "Medical attention recommended"
            );

        } else if (data.priority === "LOW") {

            setText(
                "priorityMessage",
                "Low-risk emergency detected"
            );

        } else {

            setText(
                "priorityMessage",
                "AI is assessing the emergency"
            );
        }


        // ------------------------------
        // AI DECISION
        // ------------------------------

        setText(
            "aiDecision",
            data.aiDecision,
            "AI is waiting for emergency information."
        );


        // ------------------------------
        // PATIENT DETAILS
        // ------------------------------

        if (data.answers) {

            setText(
                "whatHappened",
                data.answers.whatHappened
            );

            setText(
                "patients",
                data.answers.patients
            );

            setText(
                "conscious",
                data.answers.conscious
            );

            setText(
                "breathing",
                data.answers.breathing
            );

            setText(
                "bleeding",
                data.answers.bleeding
            );
        }


        // ------------------------------
        // CALL STARTED
        // ------------------------------

        if (data.callStartedAt) {

            const date =
                new Date(data.callStartedAt);

            setText(
                "callStartedAt",
                date.toLocaleTimeString()
            );

        } else {

            setText(
                "callStartedAt",
                "—"
            );
        }


        // ------------------------------
        // TRANSCRIPT
        // ------------------------------

        renderTranscript(
            data.transcript || []
        );


        // ------------------------------
        // TIMELINE
        // ------------------------------

        renderTimeline(
            data.dispatchTimeline || []
        );


        // ------------------------------
        // HOSPITAL
        // ------------------------------

        if (
            data.priority === "CRITICAL" &&
            data.location &&
            data.location !== "Waiting for location..."
        ) {

            setText(
                "hospitalName",
                "Nearest Emergency Hospital"
            );

            setText(
                "hospitalReason",
                "AI recommends immediate emergency admission."
            );

            setText(
                "hospitalDistance",
                "3.1 km • DEMO"
            );

            setText(
                "hospitalCapacity",
                "REVIEW REQUIRED"
            );

            setText(
                "hospitalAlert",
                "DEMO READY"
            );

            setText(
                "hospitalStatus",
                "RECOMMENDED"
            );

        } else {

            setText(
                "hospitalName",
                "Hospital recommendation pending"
            );

            setText(
                "hospitalReason",
                "AI will recommend an appropriate emergency facility."
            );

            setText(
                "hospitalDistance",
                "—"
            );

            setText(
                "hospitalCapacity",
                "—"
            );

            setText(
                "hospitalAlert",
                "NOT SENT"
            );

            setText(
                "hospitalStatus",
                "PENDING"
            );
        }

    }

    catch (error) {

        console.error(
            "❌ Dashboard API error:",
            error
        );
    }
}


// ==================================================
// START DEMO
// ==================================================

async function startDemo() {

    if (demoRunning) return;

    demoRunning = true;


    const button =
        document.getElementById(
            "demoButton"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "🚑 EMERGENCY ACTIVE...";

    }


    try {

        const response =
            await fetch(
                DEMO_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Demo API failed: " +
                response.status
            );
        }


        console.log(
            "✅ Emergency demo started"
        );


        await loadEmergencyData();


        // Fast updates during demo

        const liveUpdater =
            setInterval(
                loadEmergencyData,
                300
            );


        setTimeout(() => {

            clearInterval(
                liveUpdater
            );

            loadEmergencyData();

            demoRunning = false;


            if (button) {

                button.disabled = false;

                button.textContent =
                    "🚨 START EMERGENCY DEMO";
            }

        }, 12000);


    }
    catch (error) {

        console.error(
            "❌ Demo failed:",
            error
        );


        demoRunning = false;


        if (button) {

            button.disabled = false;

            button.textContent =
                "❌ DEMO FAILED";
        }
    }
}


// ==================================================
// CREATE DEMO BUTTON
// ==================================================

function createDemoButton() {

    // Don't create twice

    if (
        document.getElementById(
            "demoButton"
        )
    ) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "demoButton";


    button.type =
        "button";


    button.textContent =
        "🚨 START EMERGENCY DEMO";


    // Position

    button.style.position =
        "fixed";

    button.style.right =
        "24px";

    button.style.bottom =
        "24px";

    button.style.zIndex =
        "999999";


    // Appearance

    button.style.padding =
        "14px 22px";

    button.style.border =
        "none";

    button.style.borderRadius =
        "10px";

    button.style.background =
        "#e53935";

    button.style.color =
        "#ffffff";

    button.style.fontSize =
        "14px";

    button.style.fontWeight =
        "700";

    button.style.cursor =
        "pointer";

    button.style.boxShadow =
        "0 8px 30px rgba(0,0,0,0.45)";


    // Click

    button.addEventListener(
        "click",
        startDemo
    );


    document.body.appendChild(
        button
    );


    console.log(
        "🚨 Emergency Demo Button Ready"
    );
}


// ==================================================
// INITIALIZE
// ==================================================

function initializeDashboard() {

    console.log(
        "🚑 Emergency AI Dashboard Loaded"
    );


    createDemoButton();

    loadEmergencyData();


    // Normal live refresh

    setInterval(
        loadEmergencyData,
        1000
    );
}


// ==================================================
// START AFTER HTML LOADS
// ==================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard
    );

} else {

    initializeDashboard();

}
// ==================================================
// LIVE PATIENT MONITORING
// ==================================================

const systemLiveButton =
    document.getElementById("systemLiveButton");

const monitoringOverlay =
    document.getElementById("monitoringOverlay");

const closeMonitoring =
    document.getElementById("closeMonitoring");

const closeMonitoringButton =
    document.getElementById("closeMonitoringButton");

let monitoringTimer = null;
function openMonitoring() {

    const ambulanceStatus =
        document.getElementById("ambulanceStatus")
            ?.textContent
            ?.trim()
            .toUpperCase();

    if (ambulanceStatus !== "ARRIVED") {

        alert(
            "🫀 Live Patient Monitoring will be available after the ambulance reaches the patient."
        );

        return;
    }

    if (!monitoringOverlay) return;

    monitoringOverlay.classList.add("active");

    loadMonitoringData();
}


function closeMonitoringModule() {

    if (!monitoringOverlay) return;

    monitoringOverlay.classList.remove("active");

    if (monitoringTimer) {

        clearInterval(
            monitoringTimer
        );

        monitoringTimer = null;
    }
}


systemLiveButton?.addEventListener(
    "click",
    openMonitoring
);


closeMonitoring?.addEventListener(
    "click",
    closeMonitoringModule
);


closeMonitoringButton?.addEventListener(
    "click",
    closeMonitoringModule
);

async function loadMonitoringData() {
    

    // Get values already loaded in the main dashboard
    const mainEmergencyId =
        document.getElementById("emergencyId")?.textContent?.trim();

    const mainAmbulanceId =
        document.getElementById("ambulanceId")?.textContent?.trim();

    const mainAmbulanceStatus =
        document.getElementById("ambulanceStatus")?.textContent?.trim();

    setText(
        "monitorEmergencyId",
        mainEmergencyId,
        "EMG-DEMO"
    );

    setText(
        "monitorAmbulanceId",
        mainAmbulanceId,
        "AMB-DEMO"
    );

    setText(
        "monitorAmbulanceStatus",
        mainAmbulanceStatus,
        "EN ROUTE"
    );

    setText(
        "monitoringUpdated",
        "Last updated: " +
        new Date().toLocaleTimeString()
    );

    startMonitoringSimulation();
}


function startMonitoringSimulation() {

    if (monitoringTimer) {
        clearInterval(monitoringTimer);
    }

    monitoringTimer =
        setInterval(() => {

            const heartRate =
                Math.floor(112 + Math.random() * 10);

            const spo2 =
                Math.floor(89 + Math.random() * 5);

            setText(
                "monitorHeartRate",
                heartRate
            );

            setText(
                "monitorSpo2",
                spo2
            );

            setText(
                "monitorBloodPressure",
                "90/60"
            );

            setText(
                "monitorConsciousness",
                "Unconscious"
            );

            setText(
                "monitorBleeding",
                "Severe"
            );

            setText(
                "monitorCondition",
                spo2 <= 90
                    ? "CRITICAL"
                    : "HIGH"
            );

            setText(
                "monitoringAlertText",
                spo2 <= 90
                    ? "SpO₂ dropped. Emergency team should be prepared."
                    : "Patient condition is being monitored continuously."
            );

            setText(
                "monitoringUpdated",
                "Last updated: " +
                new Date().toLocaleTimeString()
            );

        }, 2000);
}