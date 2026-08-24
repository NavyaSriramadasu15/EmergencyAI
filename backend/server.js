const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// ==================================================
// CURRENT EMERGENCY STATE
// ==================================================

function createEmergency() {
    return {
        emergencyId: "EMG-" + Date.now(),

        status: "WAITING_FOR_CALL",

        callerNumber: "",

        language: "Detecting...",

        aiStatus: "AI STANDBY",

        location: "Waiting for location...",

        ambulance: "WAITING",

        priority: "ANALYZING",

        question: "Waiting for emergency information...",

        answers: {
            whatHappened: "",
            patients: "",
            conscious: "",
            breathing: "",
            bleeding: ""
        },

        transcript: [],

        dispatchTimeline: [],

        ambulanceDetails: {
            id: "AMB-" + Math.floor(100 + Math.random() * 900),
            eta: "08 min",
            distance: "2.4 km"
        },

        aiDecision: "AI is assessing the situation",

        callStartedAt: null,

        aiIntent: "",

        outcome: ""
    };
}


let emergencyData = createEmergency();


// ==================================================
// GET CURRENT EMERGENCY DATA
// ==================================================

app.get("/api/emergency", (req, res) => {

    res.json(emergencyData);

});


// ==================================================
// UPDATE EMERGENCY DATA
// ==================================================

app.post("/api/emergency/update", (req, res) => {

    emergencyData = {
        ...emergencyData,
        ...req.body
    };

    console.log("🚑 Emergency data updated");

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// START EMERGENCY CALL
// ==================================================

app.post("/api/emergency/start", (req, res) => {

    emergencyData = createEmergency();

    emergencyData.status = "CALL_CONNECTED";
    emergencyData.aiStatus = "LISTENING";
    emergencyData.callStartedAt = new Date().toISOString();

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "Emergency call received"
    });

    console.log("📞 Emergency call started");

    res.json({
        success: true,
        message: "Emergency call started",
        data: emergencyData
    });

});


// ==================================================
// LANGUAGE DETECTED
// ==================================================

app.post("/api/emergency/language", (req, res) => {

    const { language } = req.body;

    if (language) {

        emergencyData.language = language;

        emergencyData.dispatchTimeline.push({
            time: new Date().toLocaleTimeString(),
            event: `Language detected: ${language}`
        });

    }

    console.log("🌐 Language:", emergencyData.language);

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// AI QUESTION
// ==================================================

app.post("/api/emergency/question", (req, res) => {

    const { question } = req.body;

    emergencyData.aiStatus = "ASKING_QUESTIONS";

    emergencyData.question =
        question || "Please provide emergency information.";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "AI asked emergency question"
    });

    console.log("🤖 AI Question:", emergencyData.question);

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// AI TRANSCRIPT
// ==================================================

app.post("/api/emergency/transcript", (req, res) => {

    const { speaker, message } = req.body;

    if (speaker && message) {

        emergencyData.transcript.push({
            speaker,
            message,
            time: new Date().toLocaleTimeString()
        });

    }

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// PATIENT ANSWERS
// ==================================================

app.post("/api/emergency/answers", (req, res) => {

    emergencyData.answers = {
        ...emergencyData.answers,
        ...req.body
    };

    emergencyData.aiStatus = "ANALYZING";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "Emergency information collected"
    });

    console.log(
        "🧠 Emergency information:",
        emergencyData.answers
    );

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// LOCATION
// IMPORTANT:
// LOCATION CAN TRIGGER IMMEDIATE DISPATCH
// ==================================================

app.post("/api/emergency/location", (req, res) => {

    const { location } = req.body;

    emergencyData.location =
        location || "Location Detected";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "Patient location received"
    });

    // Immediate ambulance dispatch
    emergencyData.ambulance = "DISPATCHED";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "Ambulance dispatch initiated"
    });

    console.log(
        "📍 Location:",
        emergencyData.location
    );

    console.log("🚑 Ambulance dispatched");

    res.json({
        success: true,
        message:
            "Location received and ambulance dispatch initiated",
        data: emergencyData
    });

});


// ==================================================
// EMERGENCY PRIORITY
// ==================================================

app.post("/api/emergency/priority", (req, res) => {

    const { priority } = req.body;

    if (priority) {

        emergencyData.priority = priority;

        if (priority === "CRITICAL") {

            emergencyData.aiDecision =
                "Severe emergency indicators detected. Immediate ambulance response recommended.";

        } else if (priority === "HIGH") {

            emergencyData.aiDecision =
                "Urgent medical attention required.";

        } else {

            emergencyData.aiDecision =
                "Emergency assessed and response initiated.";

        }

        emergencyData.dispatchTimeline.push({
            time: new Date().toLocaleTimeString(),
            event: `Emergency classified as ${priority}`
        });

    }

    console.log(
        "🚨 Priority:",
        emergencyData.priority
    );

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// AMBULANCE STATUS
// ==================================================

app.post("/api/emergency/ambulance", (req, res) => {

    const {
        status,
        eta,
        distance
    } = req.body;

    if (status) {
        emergencyData.ambulance = status;
    }

    if (eta) {
        emergencyData.ambulanceDetails.eta = eta;
    }

    if (distance) {
        emergencyData.ambulanceDetails.distance = distance;
    }

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event:
            `Ambulance status: ${emergencyData.ambulance}`
    });

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// EXOTEL VOICEBOT WEBHOOK
// ==================================================

app.post("/api/exotel/webhook", (req, res) => {

    try {

        console.log("");
        console.log("========================================");
        console.log("📞 EXOTEL WEBHOOK RECEIVED");
        console.log("========================================");

        console.log(
            JSON.stringify(req.body, null, 2)
        );

        const data = req.body || {};

        // ------------------------------------------
        // CALLER NUMBER
        // ------------------------------------------

        const callerNumber =
            data["contact uri"] ||
            data.contact_uri ||
            data["customer number"] ||
            data.customer_number ||
            data.from ||
            data.From ||
            "";

        if (callerNumber) {
            emergencyData.callerNumber = callerNumber;
        }


        // ------------------------------------------
        // SESSION START
        // ------------------------------------------

        const sessionState =
            data["session state"] ||
            data.session_state ||
            data.sessionState ||
            "";

        if (
            sessionState === "session start" ||
            sessionState === "start" ||
            sessionState === "SESSION_START"
        ) {

            emergencyData = createEmergency();

            emergencyData.status = "CALL_CONNECTED";
            emergencyData.aiStatus = "LISTENING";
            emergencyData.callStartedAt =
                new Date().toISOString();

            if (callerNumber) {
                emergencyData.callerNumber =
                    callerNumber;
            }

            emergencyData.dispatchTimeline.push({
                time: new Date().toLocaleTimeString(),
                event:
                    "Emergency call received from Exotel"
            });

            console.log(
                "🚨 New emergency call started"
            );
        }


        // ------------------------------------------
        // TRANSCRIPT
        // ------------------------------------------

        const events =
            Array.isArray(data.events)
                ? data.events
                : [];

        events.forEach((event) => {

            const eventType =
                event["event type"] ||
                event.event_type ||
                event.type ||
                "";

            const eventData =
                event["event data"] ||
                event.event_data ||
                event.data ||
                {};

            // --------------------------------------
            // TRANSCRIPT EVENT
            // --------------------------------------

            if (
                eventType === "transcript" ||
                eventType === "TRANSCRIPT"
            ) {

                let transcripts =
                    eventData.transcripts;

                if (!Array.isArray(transcripts)) {
                    transcripts = [];
                }

                transcripts.forEach((transcript) => {

                    let segments =
                        transcript[
                            "transcript segments"
                        ];

                    if (!Array.isArray(segments)) {
                        segments =
                            transcript.transcript_segments;
                    }

                    if (!Array.isArray(segments)) {
                        segments = [];
                    }

                    segments.forEach((segment) => {

                        const speaker =
                            segment.speaker ||
                            segment["speaker"] ||
                            "";

                        const message =
                            segment.text ||
                            segment.transcript ||
                            segment.message ||
                            "";

                        if (!message) {
                            return;
                        }

                        let dashboardSpeaker =
                            "AI";

                        if (
                            speaker === "user" ||
                            speaker === "caller" ||
                            speaker === "customer"
                        ) {
                            dashboardSpeaker =
                                "CALLER";
                        }

                        emergencyData.transcript.push({
                            speaker:
                                dashboardSpeaker,
                            message:
                                message,
                            time:
                                new Date()
                                    .toLocaleTimeString()
                        });

                        console.log(
                            `${dashboardSpeaker}: ${message}`
                        );

                    });

                });

            }


            // --------------------------------------
            // SUMMARY
            // --------------------------------------

            if (
                eventType === "summary" ||
                eventType === "SUMMARY"
            ) {

                emergencyData.aiDecision =
                    eventData.summary ||
                    eventData.text ||
                    "AI assessment received";

            }


            // --------------------------------------
            // INTENT
            // --------------------------------------

            if (
                eventType === "intent" ||
                eventType === "INTENT"
            ) {

                emergencyData.aiIntent =
                    eventData.intent ||
                    eventData.name ||
                    "Emergency";

            }


            // --------------------------------------
            // OUTCOME
            // --------------------------------------

            if (
                eventType === "outcome" ||
                eventType === "OUTCOME"
            ) {

                emergencyData.outcome =
                    eventData.outcome ||
                    eventData.name ||
                    "Emergency call completed";

            }

        });


        // ------------------------------------------
        // SESSION END
        // ------------------------------------------

        if (
            sessionState === "session end" ||
            sessionState === "end" ||
            sessionState === "SESSION_END"
        ) {

            emergencyData.status =
                "CALL_COMPLETED";

            emergencyData.aiStatus =
                "COMPLETED";

            emergencyData.dispatchTimeline.push({
                time: new Date().toLocaleTimeString(),
                event:
                    "Emergency AI call completed"
            });

            console.log(
                "✅ Emergency call completed"
            );

        }


        // ------------------------------------------
        // ALWAYS RETURN SUCCESS
        // ------------------------------------------

        res.status(200).json({
            success: true,
            received: true
        });

    } catch (error) {

        console.error(
            "❌ Exotel webhook error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ==================================================
// DEMO SCENARIO
// This is for your hackathon presentation.
// ==================================================

app.post("/api/emergency/demo", async (req, res) => {

    emergencyData = createEmergency();

    const wait = (ms) =>
        new Promise(resolve =>
            setTimeout(resolve, ms)
        );


    // STEP 1 — CALL

    emergencyData.status =
        "CALL_CONNECTED";

    emergencyData.aiStatus =
        "LISTENING";

    emergencyData.callStartedAt =
        new Date().toISOString();

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event: "Emergency call received"
    });


    // AI greeting

    emergencyData.transcript.push({
        speaker: "AI",
        message:
            "Hello. Emergency AI is here to help. Please stay calm.",
        time:
            new Date().toLocaleTimeString()
    });

    await wait(1500);


    // STEP 2 — LANGUAGE

    emergencyData.language =
        "Telugu";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event:
            "Language detected: Telugu"
    });


    // STEP 3 — QUESTION

    emergencyData.aiStatus =
        "ASKING_QUESTIONS";

    emergencyData.question =
        "What happened? Please describe the emergency.";

    emergencyData.transcript.push({
        speaker: "AI",
        message:
            emergencyData.question,
        time:
            new Date().toLocaleTimeString()
    });

    await wait(1500);


    // CALLER RESPONSE

    emergencyData.transcript.push({
        speaker: "CALLER",
        message:
            "There was a road accident. Two people are injured.",
        time:
            new Date().toLocaleTimeString()
    });

    emergencyData.answers.whatHappened =
        "Road accident";

    emergencyData.answers.patients =
        "2";

    await wait(1200);


    // QUESTION 2

    emergencyData.question =
        "Is anyone unconscious or having difficulty breathing?";

    emergencyData.transcript.push({
        speaker: "AI",
        message:
            emergencyData.question,
        time:
            new Date().toLocaleTimeString()
    });

    await wait(1200);


    // CALLER RESPONSE

    emergencyData.transcript.push({
        speaker: "CALLER",
        message:
            "One person is unconscious and breathing is difficult.",
        time:
            new Date().toLocaleTimeString()
    });

    emergencyData.answers.conscious =
        "No";

    emergencyData.answers.breathing =
        "Difficult";


    // PRIORITY

    emergencyData.priority =
        "CRITICAL";

    emergencyData.aiDecision =
        "Unconscious patient and breathing difficulty detected. Immediate response required.";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event:
            "Emergency classified as CRITICAL"
    });

    await wait(1000);


    // LOCATION

    emergencyData.location =
        "Hyderabad, Telangana";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event:
            "Patient location received"
    });


    // DISPATCH

    emergencyData.ambulance =
        "DISPATCHED";

    emergencyData.dispatchTimeline.push({
        time: new Date().toLocaleTimeString(),
        event:
            "Ambulance dispatched"
    });


    emergencyData.transcript.push({
        speaker: "AI",
        message:
            "Emergency classified as critical. An ambulance has been dispatched to your location.",
        time:
            new Date().toLocaleTimeString()
    });


    res.json({
        success: true,
        message:
            "Demo emergency completed",
        data: emergencyData
    });

});


// ==================================================
// RESET EMERGENCY
// ==================================================

app.post("/api/emergency/reset", (req, res) => {

    emergencyData =
        createEmergency();

    console.log(
        "🔄 Emergency reset"
    );

    res.json({
        success: true,
        data: emergencyData
    });

});


// ==================================================
// HOME
// ==================================================

app.get("/", (req, res) => {

    res.send(
        "🚑 Emergency AI Backend is running!"
    );

});


// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {

    console.log(
        `🚑 Emergency AI Backend running on http://localhost:${PORT}`
    );

});