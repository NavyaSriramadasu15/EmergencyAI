const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// ==================================================
// EXOTEL WEBSOCKET / AGENTSTREAM
// ==================================================

const wss = new WebSocket.Server({
    server,
    path: "/media"
});

wss.on("connection", (ws) => {

    console.log("🔌 Exotel WebSocket connected");

    ws.on("message", (rawMessage) => {

        try {

            const data =
                JSON.parse(rawMessage.toString());

            console.log(
                "📡 WebSocket event:",
                JSON.stringify(data, null, 2)
            );

            const event =
                String(
                    data.event ||
                    data.type ||
                    ""
                ).toLowerCase();

            // ------------------------------------------
            // INCOMING CALL
            // ------------------------------------------

            if (
                event === "connected" ||
                event === "start" ||
                event === "call_started"
            ) {

                emergencyData =
                    createEmergency();

                emergencyData.status =
                    "CALL_CONNECTED";

                emergencyData.aiStatus =
                    "LISTENING";

                emergencyData.callStartedAt =
                    new Date().toISOString();

                emergencyData.dispatchTimeline.push({
                    time:
                        new Date()
                            .toLocaleTimeString(),

                    event:
                        "Incoming emergency call received"
                });

                console.log(
                    "🚨 INCOMING EMERGENCY CALL"
                );
            }

            // ------------------------------------------
            // CALL ENDED
            // ------------------------------------------

            if (
                event === "stop" ||
                event === "disconnected" ||
                event === "call_ended"
            ) {

                emergencyData.status =
                    "CALL_COMPLETED";

                emergencyData.aiStatus =
                    "COMPLETED";

                emergencyData.dispatchTimeline.push({
                    time:
                        new Date()
                            .toLocaleTimeString(),

                    event:
                        "Emergency AI call completed"
                });

                console.log(
                    "✅ Emergency call completed"
                );
            }

        } catch (error) {

            console.error(
                "❌ WebSocket message error:",
                error.message
            );

        }

    });

    ws.on("close", () => {

        console.log(
            "🔌 Exotel WebSocket disconnected"
        );

    });

    ws.on("error", (error) => {

        console.error(
            "❌ WebSocket error:",
            error.message
        );

    });

});

app.use(cors());
app.use(express.json());


// ==================================================
// CURRENT EMERGENCY STATE
// ==================================================

function createEmergency() {

    return {

        emergencyId:
            "EMG-" + Date.now(),

        status:
            "WAITING_FOR_CALL",

        callerNumber:
            "",

        language:
            "Detecting...",

        aiStatus:
            "AI STANDBY",

        location:
            "Waiting for location...",

        ambulance:
            "WAITING",

        priority:
            "ANALYZING",

        question:
            "Waiting for emergency information...",

        answers: {

            whatHappened:
                "",

            patients:
                "",

            conscious:
                "",

            breathing:
                "",

            bleeding:
                ""
        },

        transcript:
            [],

        dispatchTimeline:
            [],

        ambulanceDetails: {

            id:
                "AMB-" +
                Math.floor(
                    100 +
                    Math.random() * 900
                ),

            eta:
                "08 min",

            distance:
                "2.4 km"
        },

        aiDecision:
            "AI is assessing the situation",

        callStartedAt:
            null,

        aiIntent:
            "",

        outcome:
            ""
    };
}


let emergencyData =
    createEmergency();
    // ==================================================
// AI EMERGENCY INFORMATION EXTRACTION
// ==================================================

function processEmergencyTranscript(text) {

    if (!text) return;

    const lower = text.toLowerCase();

    // WHAT HAPPENED
    if (
        lower.includes("accident") ||
        lower.includes("crash") ||
        lower.includes("collision")
    ) {
        emergencyData.answers.whatHappened = "Road accident";
    }
    else if (
        lower.includes("fire") ||
        lower.includes("burn")
    ) {
        emergencyData.answers.whatHappened = "Fire / burn emergency";
    }
    else if (
        lower.includes("chest pain") ||
        lower.includes("heart attack")
    ) {
        emergencyData.answers.whatHappened = "Medical emergency";
    }
    else if (
        lower.includes("injured") ||
        lower.includes("injury")
    ) {
        emergencyData.answers.whatHappened = "Injury emergency";
    }

    // NUMBER OF PATIENTS
    const numberMatch = lower.match(
        /(\d+)\s+(people|persons|patients|injured|victims)/
    );

    if (numberMatch) {
        emergencyData.answers.patients = numberMatch[1];
    }

    const wordNumbers = {
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5"
    };

    for (const word in wordNumbers) {

        if (
            lower.includes(word + " people") ||
            lower.includes(word + " persons") ||
            lower.includes(word + " patients")
        ) {
            emergencyData.answers.patients =
                wordNumbers[word];

            break;
        }
    }

    // CONSCIOUSNESS
    if (
        lower.includes("unconscious") ||
        lower.includes("not conscious") ||
        lower.includes("not responding")
    ) {
        emergencyData.answers.conscious = "No";
    }
    else if (
        lower.includes("conscious") ||
        lower.includes("awake") ||
        lower.includes("responding")
    ) {
        emergencyData.answers.conscious = "Yes";
    }

    // BREATHING
    if (
        lower.includes("not breathing") ||
        lower.includes("cannot breathe") ||
        lower.includes("can't breathe") ||
        lower.includes("stopped breathing")
    ) {
        emergencyData.answers.breathing = "No";
    }
    else if (
        lower.includes("breathing")
    ) {
        emergencyData.answers.breathing = "Yes";
    }

    // BLEEDING
    if (
        lower.includes("severe bleeding") ||
        lower.includes("heavy bleeding") ||
        lower.includes("bleeding badly") ||
        lower.includes("bleeding heavily")
    ) {
        emergencyData.answers.bleeding = "Severe bleeding";
    }
    else if (
        lower.includes("bleeding")
    ) {
        emergencyData.answers.bleeding = "Bleeding";
    }

    // PRIORITY
    if (
        emergencyData.answers.conscious === "No" ||
        emergencyData.answers.breathing === "No" ||
        emergencyData.answers.bleeding === "Severe bleeding"
    ) {
        emergencyData.priority = "CRITICAL";

        emergencyData.aiDecision =
            "Severe emergency indicators detected. Immediate ambulance response recommended.";
    }
    else if (
        emergencyData.answers.whatHappened ||
        emergencyData.answers.patients
    ) {
        emergencyData.priority = "HIGH";

        emergencyData.aiDecision =
            "Urgent medical attention required.";
    }

    console.log(
        "🧠 Extracted emergency data:",
        emergencyData.answers
    );
}
// ==================================================
// TEST EMERGENCY INFORMATION EXTRACTION
// ==================================================

app.post("/api/test-emergency", (req, res) => {

    const testText = req.body.text;

    if (!testText) {
        return res.status(400).json({
            success: false,
            message: "Please provide test text"
        });
    }

    processEmergencyTranscript(testText);

    res.json({
        success: true,
        message: "Emergency information extracted",
        answers: emergencyData.answers,
        priority: emergencyData.priority,
        aiDecision: emergencyData.aiDecision
    });
});
    // ==================================================
// AI EMERGENCY INFORMATION EXTRACTION
// ==================================================

function processEmergencyTranscript(text) {

    if (!text) return;

    const lower = text.toLowerCase();

    // ------------------------------------------
    // EMERGENCY TYPE / WHAT HAPPENED
    // ------------------------------------------

    if (
        lower.includes("accident") ||
        lower.includes("crash") ||
        lower.includes("collision")
    ) {
        emergencyData.answers.whatHappened =
            "Road accident";
    }
    else if (
        lower.includes("fire") ||
        lower.includes("burn")
    ) {
        emergencyData.answers.whatHappened =
            "Fire / burn emergency";
    }
    else if (
        lower.includes("chest pain") ||
        lower.includes("heart attack")
    ) {
        emergencyData.answers.whatHappened =
            "Medical emergency";
    }
    else if (
        lower.includes("injured") ||
        lower.includes("injury")
    ) {
        emergencyData.answers.whatHappened =
            "Injury emergency";
    }

    // ------------------------------------------
    // NUMBER OF PATIENTS
    // ------------------------------------------

    const numberMatch =
        lower.match(
            /(\d+)\s+(people|persons|patients|injured|victims)/
        );

    if (numberMatch) {

        emergencyData.answers.patients =
            numberMatch[1];

    }
    else {

        const wordNumbers = {
            one: "1",
            two: "2",
            three: "3",
            four: "4",
            five: "5"
        };

        for (const word in wordNumbers) {

            if (
                lower.includes(
                    word + " people"
                ) ||
                lower.includes(
                    word + " persons"
                ) ||
                lower.includes(
                    word + " patients"
                )
            ) {

                emergencyData.answers.patients =
                    wordNumbers[word];

                break;
            }
        }
    }

    // ------------------------------------------
    // CONSCIOUSNESS
    // ------------------------------------------

    if (
        lower.includes("unconscious") ||
        lower.includes("not conscious") ||
        lower.includes("not responding")
    ) {

        emergencyData.answers.conscious =
            "No";

    }
    else if (
        lower.includes("conscious") ||
        lower.includes("awake") ||
        lower.includes("responding")
    ) {

        emergencyData.answers.conscious =
            "Yes";

    }

    // ------------------------------------------
    // BREATHING
    // ------------------------------------------

    if (
        lower.includes("not breathing") ||
        lower.includes("cannot breathe") ||
        lower.includes("can't breathe") ||
        lower.includes("stopped breathing")
    ) {

        emergencyData.answers.breathing =
            "No";

    }
    else if (
        lower.includes("breathing") ||
        lower.includes("is breathing")
    ) {

        emergencyData.answers.breathing =
            "Yes";

    }

    // ------------------------------------------
    // SEVERE BLEEDING
    // ------------------------------------------

    if (
        lower.includes("severe bleeding") ||
        lower.includes("heavy bleeding") ||
        lower.includes("bleeding badly") ||
        lower.includes("bleeding heavily")
    ) {

        emergencyData.answers.bleeding =
            "Severe bleeding";

    }
    else if (
        lower.includes("bleeding")
    ) {

        emergencyData.answers.bleeding =
            "Bleeding";

    }

    // ------------------------------------------
    // LOCATION
    // ------------------------------------------

    const locationMatch =
        text.match(
            /(?:location is|we are at|we are in|near|at)\s+([A-Za-z0-9 ,.-]{3,60})/i
        );

    if (locationMatch) {

        const detectedLocation =
            locationMatch[1]
                .trim()
                .replace(/[.!?]+$/, "");

        if (detectedLocation.length >= 3) {

            emergencyData.location =
                detectedLocation;

            emergencyData.dispatchTimeline.push({
                time:
                    new Date()
                        .toLocaleTimeString(),

                event:
                    "Patient location received"
            });

            console.log(
                "📍 Location detected:",
                detectedLocation
            );

            triggerAmbulanceDispatch();
        }
    }

    // ------------------------------------------
    // PRIORITY
    // ------------------------------------------

    if (
        emergencyData.answers.conscious === "No" ||
        emergencyData.answers.breathing === "No" ||
        emergencyData.answers.bleeding === "Severe bleeding"
    ) {

        emergencyData.priority =
            "CRITICAL";

        emergencyData.aiDecision =
            "Severe emergency indicators detected. Immediate ambulance response recommended.";

    }
    else if (
        emergencyData.answers.whatHappened ||
        emergencyData.answers.patients
    ) {

        emergencyData.priority =
            "HIGH";

        emergencyData.aiDecision =
            "Urgent medical attention required.";
    }

    // ------------------------------------------
    // UPDATE AI STATUS
    // ------------------------------------------

    if (
        emergencyData.answers.whatHappened ||
        emergencyData.answers.patients ||
        emergencyData.answers.conscious ||
        emergencyData.answers.breathing ||
        emergencyData.answers.bleeding
    ) {

        emergencyData.aiStatus =
            "ANALYZING";

        emergencyData.dispatchTimeline.push({
            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Emergency information extracted from caller"
        });

        console.log(
            "🧠 Extracted emergency data:",
            emergencyData.answers
        );
    }
    // Update AI status
if (emergencyData.priority === "CRITICAL") {
    emergencyData.aiStatus = "CRITICAL EMERGENCY";
}
else if (emergencyData.priority === "HIGH") {
    emergencyData.aiStatus = "HIGH PRIORITY";
}
else if (
    emergencyData.answers.whatHappened ||
    emergencyData.answers.patients
) {
    emergencyData.aiStatus = "ASSESSING";
}
}


// ==================================================
// SIMULATED AMBULANCE DISPATCH
// ==================================================

function triggerAmbulanceDispatch() {

    if (
        emergencyData.location ===
        "Waiting for location..."
    ) {
        return;
    }

    if (
        emergencyData.ambulance !==
        "WAITING"
    ) {
        return;
    }

    emergencyData.ambulance =
        "DISPATCHED";

    emergencyData.dispatchTimeline.push({
        time:
            new Date()
                .toLocaleTimeString(),

        event:
            "Ambulance dispatch initiated"
    });

    emergencyData.ambulance =
        "EN ROUTE";

    emergencyData.dispatchTimeline.push({
        time:
            new Date()
                .toLocaleTimeString(),

        event:
            "Ambulance is en route to patient"
    });

    console.log(
        "🚑 Ambulance dispatched to:",
        emergencyData.location
    );

    // Demo simulation only
    setTimeout(() => {

        emergencyData.ambulance =
            "ARRIVED";

        emergencyData.ambulanceDetails.eta =
            "ARRIVED";

        emergencyData.dispatchTimeline.push({
            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Ambulance arrived at patient location"
        });

        console.log(
            "🚑 Ambulance ARRIVED"
        );

    }, 3000);
}


// ==================================================
// GET CURRENT EMERGENCY DATA
// ==================================================

app.get(
    "/api/emergency",
    (req, res) => {

        res.json(
            emergencyData
        );

    }
);


// ==================================================
// UPDATE EMERGENCY DATA
// ==================================================

app.post(
    "/api/emergency/update",
    (req, res) => {

        emergencyData = {

            ...emergencyData,

            ...req.body

        };

        console.log(
            "🚑 Emergency data updated"
        );

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// START EMERGENCY CALL
// ==================================================

app.post(
    "/api/emergency/start",
    (req, res) => {

        emergencyData =
            createEmergency();

        emergencyData.status =
            "CALL_CONNECTED";

        emergencyData.aiStatus =
            "LISTENING";

        emergencyData.callStartedAt =
            new Date().toISOString();

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Emergency call received"

        });

        console.log(
            "📞 Emergency call started"
        );

        res.json({

            success:
                true,

            message:
                "Emergency call started",

            data:
                emergencyData

        });

    }
);


// ==================================================
// LANGUAGE DETECTED
// ==================================================

app.post(
    "/api/emergency/language",
    (req, res) => {

        const {
            language
        } = req.body;

        if (language) {

            emergencyData.language =
                language;

            emergencyData.dispatchTimeline.push({

                time:
                    new Date()
                        .toLocaleTimeString(),

                event:
                    `Language detected: ${language}`

            });

        }

        console.log(
            "🌐 Language:",
            emergencyData.language
        );

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// AI QUESTION
// ==================================================

app.post(
    "/api/emergency/question",
    (req, res) => {

        const {
            question
        } = req.body;

        emergencyData.aiStatus =
            "ASKING_QUESTIONS";

        emergencyData.question =
            question ||
            "Please provide emergency information.";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "AI asked emergency question"

        });

        console.log(
            "🤖 AI Question:",
            emergencyData.question
        );

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// AI TRANSCRIPT
// ==================================================

app.post(
    "/api/emergency/transcript",
    (req, res) => {

        const {
            speaker,
            message
        } = req.body;

        if (
            speaker &&
            message
        ) {

            emergencyData.transcript.push({

                speaker,

                message,

                time:
                    new Date()
                        .toLocaleTimeString()

            });

        }

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// PATIENT ANSWERS
// ==================================================

app.post(
    "/api/emergency/answers",
    (req, res) => {

        emergencyData.answers = {

            ...emergencyData.answers,

            ...req.body

        };

        emergencyData.aiStatus =
            "ANALYZING";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Emergency information collected"

        });

        console.log(
            "🧠 Emergency information:",
            emergencyData.answers
        );

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// LOCATION
// IMPORTANT:
// LOCATION CAN TRIGGER IMMEDIATE DISPATCH
// ==================================================

app.post(
    "/api/emergency/location",
    (req, res) => {

        const {
            location
        } = req.body;

        emergencyData.location =
            location ||
            "Location Detected";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Patient location received"

        });

        // Immediate ambulance dispatch

        emergencyData.ambulance =
            "DISPATCHED";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Ambulance dispatch initiated"

        });
        emergencyData.ambulance =
    "EN ROUTE";

emergencyData.dispatchTimeline.push({

    time:
        new Date()
            .toLocaleTimeString(),

    event:
        "Ambulance is en route to patient"

});

setTimeout(() => {

    emergencyData.ambulance =
        "ARRIVED";

    emergencyData.dispatchTimeline.push({

        time:
            new Date()
                .toLocaleTimeString(),

        event:
            "Ambulance arrived at patient location"

    });

    console.log(
        "🚑 Ambulance ARRIVED"
    );

}, 3000);

        console.log(
            "📍 Location:",
            emergencyData.location
        );

        console.log(
            "🚑 Ambulance dispatched"
        );

        res.json({

            success:
                true,

            message:
                "Location received and ambulance dispatch initiated",

            data:
                emergencyData

        });

    }
);


// ==================================================
// EMERGENCY PRIORITY
// ==================================================

app.post(
    "/api/emergency/priority",
    (req, res) => {

        const {
            priority
        } = req.body;

        if (priority) {

            emergencyData.priority =
                priority;

            if (
                priority === "CRITICAL"
            ) {

                emergencyData.aiDecision =
                    "Severe emergency indicators detected. Immediate ambulance response recommended.";

            }

            else if (
                priority === "HIGH"
            ) {

                emergencyData.aiDecision =
                    "Urgent medical attention required.";

            }

            else {

                emergencyData.aiDecision =
                    "Emergency assessed and response initiated.";

            }

            emergencyData.dispatchTimeline.push({

                time:
                    new Date()
                        .toLocaleTimeString(),

                event:
                    `Emergency classified as ${priority}`

            });

        }

        console.log(
            "🚨 Priority:",
            emergencyData.priority
        );

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// AMBULANCE STATUS
// ==================================================

app.post(
    "/api/emergency/ambulance",
    (req, res) => {

        const {

            status,

            eta,

            distance

        } = req.body;

        if (status) {

            emergencyData.ambulance =
                status;

        }

        if (eta) {

            emergencyData.ambulanceDetails.eta =
                eta;

        }

        if (distance) {

            emergencyData.ambulanceDetails.distance =
                distance;

        }

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                `Ambulance status: ${emergencyData.ambulance}`

        });

        res.json({

            success:
                true,

            data:
                emergencyData

        });

    }
);


// ==================================================
// VAPI WEBHOOK
// ==================================================

app.post("/api/vapi/webhook", (req, res) => {

    try {

        console.log("");
        console.log("========================================");
        console.log("🤖 VAPI WEBHOOK RECEIVED");
        console.log("========================================");

        console.log(
            JSON.stringify(req.body, null, 2)
        );

        const message = req.body?.message || {};
        const type = message.type || "";

        if (type === "status-update") {

            const status = message.status;

            console.log(
                "📞 Vapi call status:",
                status
            );

            if (
                status === "in-progress" ||
                status === "ringing"
            ) {

                emergencyData =
                    createEmergency();

                emergencyData.status =
                    "CALL_CONNECTED";

                emergencyData.aiStatus =
                    "LISTENING";

                emergencyData.callStartedAt =
                    new Date().toISOString();

                const callerNumber =
                    message.call?.customer?.number;

                if (callerNumber) {
                    emergencyData.callerNumber =
                        callerNumber;
                }

                emergencyData.dispatchTimeline.push({

                    time:
                        new Date()
                            .toLocaleTimeString(),

                    event:
                        "Incoming emergency call received through Vapi"

                });

                console.log(
                    "🚨 INCOMING EMERGENCY CALL"
                );

            }

            if (status === "ended") {

                emergencyData.status =
                    "CALL_COMPLETED";

                emergencyData.aiStatus =
                    "COMPLETED";

                emergencyData.dispatchTimeline.push({

                    time:
                        new Date()
                            .toLocaleTimeString(),

                    event:
                        "Emergency AI call completed"

                });

                console.log(
                    "✅ Emergency call completed"
                );

            }

        }

      // ==================================================
// VAPI TRANSCRIPT
// ==================================================

if (type === "transcript") {

    const transcript =
        message.transcript || "";

    const role =
        message.role || "user";

    if (transcript) {

        emergencyData.transcript.push({

            speaker:
                role === "assistant"
                    ? "AI"
                    : "CALLER",

            message:
                transcript,

            time:
                new Date()
                    .toLocaleTimeString()

        });

        console.log(
            `${role}: ${transcript}`
        );
        processEmergencyTranscript(transcript);

    }

}


// ==================================================
// VAPI CONVERSATION UPDATE
// ==================================================

if (type === "conversation-update") {

    const messages =
        message.conversation?.messages ||
        message.messages ||
        [];

    if (Array.isArray(messages)) {

        messages.forEach((item) => {

            const role =
                item.role || "";

            const text =
                item.content ||
                item.message ||
                item.transcript ||
                "";

            if (!text) return;

            const speaker =
                role === "assistant"
                    ? "AI"
                    : role === "user"
                        ? "CALLER"
                        : null;

            if (!speaker) return;

            // Prevent duplicate messages
            const alreadyExists =
                emergencyData.transcript.some(
                    existing =>
                        existing.message === text &&
                        existing.speaker === speaker
                );

            if (alreadyExists) return;

            emergencyData.transcript.push({

                speaker,

                message:
                    text,

                time:
                    new Date()
                        .toLocaleTimeString()

            });

            console.log(
                `📝 Conversation update [${speaker}]: ${text}`
            );
            if (speaker === "CALLER") {
    processEmergencyTranscript(text);
}

        });

    }

}


// ==================================================
// END OF CALL REPORT
// ==================================================

if (type === "end-of-call-report") {

    console.log(
        "📋 Vapi end-of-call report received"
    );

    const summary =
        message.artifact?.transcript;

    if (summary) {

        emergencyData.aiDecision =
            "AI call summary received";

    }

}


        res.status(200).json({
            received: true
        });

    }

    catch (error) {

        console.error(
            "❌ Vapi webhook error:",
            error
        );

        res.status(500).json({

            received: false,

            error:
                error.message

        });

    }

});

// ==================================================
// EXOTEL VOICEBOT WEBHOOK
// ==================================================

app.post(
    "/api/exotel/webhook",
    (req, res) => {

        try {

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "📞 EXOTEL WEBHOOK RECEIVED"
            );

            console.log(
                "========================================"
            );

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            const data =
                req.body || {};


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

                emergencyData.callerNumber =
                    callerNumber;

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

                sessionState ===
                    "session start" ||

                sessionState ===
                    "start" ||

                sessionState ===
                    "SESSION_START"

            ) {

                emergencyData =
                    createEmergency();

                emergencyData.status =
                    "CALL_CONNECTED";

                emergencyData.aiStatus =
                    "LISTENING";

                emergencyData.callStartedAt =
                    new Date().toISOString();


                if (callerNumber) {

                    emergencyData.callerNumber =
                        callerNumber;

                }


                emergencyData.dispatchTimeline.push({

                    time:
                        new Date()
                            .toLocaleTimeString(),

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

                Array.isArray(
                    data.events
                )

                    ? data.events

                    : [];


            events.forEach(
                (event) => {

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

                        eventType ===
                            "transcript" ||

                        eventType ===
                            "TRANSCRIPT"

                    ) {

                        let transcripts =
                            eventData.transcripts;


                        if (
                            !Array.isArray(
                                transcripts
                            )
                        ) {

                            transcripts =
                                [];

                        }


                        transcripts.forEach(
                            (transcript) => {

                                let segments =

                                    transcript[
                                        "transcript segments"
                                    ];


                                if (
                                    !Array.isArray(
                                        segments
                                    )
                                ) {

                                    segments =
                                        transcript.transcript_segments;

                                }


                                if (
                                    !Array.isArray(
                                        segments
                                    )
                                ) {

                                    segments =
                                        [];

                                }


                                segments.forEach(
                                    (segment) => {

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

                                            speaker ===
                                                "user" ||

                                            speaker ===
                                                "caller" ||

                                            speaker ===
                                                "customer"

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

                                    }
                                );

                            }
                        );

                    }


                    // --------------------------------------
                    // SUMMARY
                    // --------------------------------------

                    if (

                        eventType ===
                            "summary" ||

                        eventType ===
                            "SUMMARY"

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

                        eventType ===
                            "intent" ||

                        eventType ===
                            "INTENT"

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

                        eventType ===
                            "outcome" ||

                        eventType ===
                            "OUTCOME"

                    ) {

                        emergencyData.outcome =

                            eventData.outcome ||

                            eventData.name ||

                            "Emergency call completed";

                    }

                }
            );


            // ------------------------------------------
            // SESSION END
            // ------------------------------------------

            if (

                sessionState ===
                    "session end" ||

                sessionState ===
                    "end" ||

                sessionState ===
                    "SESSION_END"

            ) {

                emergencyData.status =
                    "CALL_COMPLETED";

                emergencyData.aiStatus =
                    "COMPLETED";

                emergencyData.dispatchTimeline.push({

                    time:
                        new Date()
                            .toLocaleTimeString(),

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

                success:
                    true,

                received:
                    true

            });

        }

        catch (error) {

            console.error(
                "❌ Exotel webhook error:",
                error
            );

            res.status(500).json({

                success:
                    false,

                error:
                    error.message

            });

        }

    }
);
// ==================================================
// DEMO EMERGENCY
// ==================================================

app.post(
    "/api/emergency/demo",
    (req, res) => {

        console.log(
            "🚨 Emergency demo started"
        );

        emergencyData =
            createEmergency();

        // ------------------------------------------
        // CALL CONNECTED
        // ------------------------------------------

        emergencyData.status =
            "CALL_CONNECTED";

        emergencyData.aiStatus =
            "LISTENING";

        emergencyData.callStartedAt =
            new Date().toISOString();

        emergencyData.callerNumber =
            "+91 XXXXX XXXXX";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Incoming emergency call received"

        });


        // ------------------------------------------
        // LANGUAGE
        // ------------------------------------------

        emergencyData.language =
            "English / Telugu";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Language detected"

        });


        // ------------------------------------------
        // AI QUESTION
        // ------------------------------------------

        emergencyData.aiStatus =
            "ASKING_QUESTIONS";

        emergencyData.question =
            "What happened? How many people are injured?";

        emergencyData.transcript.push({

            speaker:
                "AI",

            message:
                "Please tell me what happened and how many people are injured.",

            time:
                new Date()
                    .toLocaleTimeString()

        });


        // ------------------------------------------
        // CALLER RESPONSE
        // ------------------------------------------

        emergencyData.answers = {

            whatHappened:
                "Road accident",

            patients:
                "2",

            conscious:
                "1 unconscious",

            breathing:
                "Yes",

            bleeding:
                "Severe bleeding"

        };


        emergencyData.transcript.push({

            speaker:
                "CALLER",

            message:
                "There was a road accident. Two people are injured. One person is unconscious and there is severe bleeding.",

            time:
                new Date()
                    .toLocaleTimeString()

        });


        // ------------------------------------------
        // LOCATION
        // ------------------------------------------

        emergencyData.location =
            "Hyderabad, Telangana";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Patient location received"

        });


        // ------------------------------------------
        // PRIORITY
        // ------------------------------------------

        emergencyData.priority =
            "CRITICAL";

        emergencyData.aiStatus =
            "ANALYZING";

        emergencyData.aiDecision =
            "Severe emergency indicators detected. Immediate ambulance response required.";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Emergency classified as CRITICAL"

        });


        // ------------------------------------------
        // AMBULANCE
        // ------------------------------------------

        emergencyData.ambulance =
            "DISPATCHED";

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "Ambulance dispatch initiated"

        });


        emergencyData.ambulanceDetails = {

            id:
                "AMB-247",

            eta:
                "08 min",

            distance:
                "2.4 km"

        };


        // ------------------------------------------
        // AI DECISION
        // ------------------------------------------

        emergencyData.aiStatus =
            "ACTIVE";

        emergencyData.question =
            "Ambulance dispatched. Stay on the line and follow emergency instructions.";


        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                "AI emergency response activated"

        });
        // ==================================================
// DEMO HOSPITAL DATA
// ==================================================

const demoHospitals = [

    {
        id: "HOSP-01",
        name: "City Emergency Hospital",
        distance: "3.1 km",
        emergencyCapacity: "HIGH",
        icuBeds: 3,
        traumaTeam: "AVAILABLE",
        status: "ACCEPTING"
    },

    {
        id: "HOSP-02",
        name: "Metro Care Hospital",
        distance: "4.8 km",
        emergencyCapacity: "MEDIUM",
        icuBeds: 1,
        traumaTeam: "AVAILABLE",
        status: "LIMITED"
    },

    {
        id: "HOSP-03",
        name: "LifeLine Hospital",
        distance: "6.2 km",
        emergencyCapacity: "FULL",
        icuBeds: 0,
        traumaTeam: "BUSY",
        status: "NOT_ACCEPTING"
    }

];
// ==================================================
// DEMO HOSPITAL REROUTING
// ==================================================

setTimeout(() => {

    // Current hospital becomes unavailable
    demoHospitals[0].status =
        "NOT_ACCEPTING";

    demoHospitals[0].emergencyCapacity =
        "FULL";

    demoHospitals[0].icuBeds =
        0;

    demoHospitals[0].traumaTeam =
        "BUSY";

    // Find another available hospital
    const newHospital =
        demoHospitals.find(
            hospital =>
                hospital.status === "ACCEPTING"
        );

    if (newHospital) {

        emergencyData.hospital.selected =
            newHospital;

        emergencyData.dispatchTimeline.push({

            time:
                new Date()
                    .toLocaleTimeString(),

            event:
                `${demoHospitals[0].name} became unavailable. Ambulance rerouted to ${newHospital.name}`

        });

        console.log(
            "🔄 Ambulance rerouted to:",
            newHospital.name
        );
    }

}, 7000);

const selectedHospital =
    demoHospitals.find(
        hospital =>
            hospital.status === "ACCEPTING"
    );

emergencyData.hospital = {

    hospitals:
        demoHospitals,

    selected:
        selectedHospital,

    alertStatus:
        "SENT",

    patientCondition:
        emergencyData.priority,

    eta:
        emergencyData.ambulanceDetails.eta

};

emergencyData.dispatchTimeline.push({

    time:
        new Date()
            .toLocaleTimeString(),

    event:
        `Hospital selected: ${selectedHospital.name}`

});

emergencyData.dispatchTimeline.push({

    time:
        new Date()
            .toLocaleTimeString(),

    event:
        "Patient condition sent to receiving hospital"

});

console.log(
    "🏥 Hospital selected:",
    selectedHospital.name
);
// ------------------------------------------
// AMBULANCE ARRIVAL SIMULATION
// ------------------------------------------

setTimeout(() => {

    emergencyData.ambulance =
        "ARRIVED";

    emergencyData.ambulanceDetails.eta =
        "ARRIVED";

    emergencyData.dispatchTimeline.push({

        time:
            new Date()
                .toLocaleTimeString(),

        event:
            "Ambulance arrived at patient location"

    });

    console.log(
        "🚑 Ambulance ARRIVED"
    );

}, 3000);

        res.status(200).json({

            success:
                true,

            message:
                "Demo emergency started",

            data:
                emergencyData

        });

    }
);


// ==================================================
// RESET EMERGENCY
// ==================================================

app.post(
    "/api/emergency/reset",
    (req, res) => {

        emergencyData =
            createEmergency();

        console.log(
            "🔄 Emergency state reset"
        );

        res.json({

            success:
                true,

            message:
                "Emergency reset",

            data:
                emergencyData

        });

    }
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "🚑 Emergency AI Backend is running!"
        );

    }
);


// ==================================================
// HEALTH API
// ==================================================

app.get(
    "/health",
    (req, res) => {

        res.json({

            success:
                true,

            status:
                "online",

            websocket:
                "enabled",

            emergency:
                emergencyData.status,

            timestamp:
                new Date().toISOString()

        });

    }
);


// ==================================================
// START SERVER
// IMPORTANT:
// Use server.listen(), NOT app.listen()
// because WebSocket uses the same server.
// ==================================================

server.listen(
    PORT,
    () => {

        console.log(
            `🚑 Emergency AI Backend running on http://localhost:${PORT}`
        );

        console.log(
            `🔌 WebSocket endpoint: ws://localhost:${PORT}/media`
        );

    }
);