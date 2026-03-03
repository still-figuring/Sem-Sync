const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const path = require("path");

// Robust Environment Loading:
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

// Initialize Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

let genAI;

// Helper: Pause execution
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.extractTimetable = onCall(
  { cors: true, timeoutSeconds: 60 },
  async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    // 2. Data Validation
    const { image } = request.data;
    if (!image)
      throw new HttpsError("invalid-argument", "No image data provided.");

    // Initialize Gemini
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey)
        throw new HttpsError(
          "internal",
          "Server configuration error (missing API key).",
        );
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const timetableSchema = {
      description: "List of classes from a timetable",
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          subject: { type: "string" },
          room: { type: "string" },
          type: {
            type: "string",
            enum: ["lecture", "tutorial", "lab", "other"],
          },
          lecturer: { type: "string" },
        },
        required: ["day", "startTime", "endTime", "subject"],
      },
    };

    const modelsToTry = ["gemini-1.5-flash"];
    const prompt = "Analyze this timetable image and extract the schedule.";
    let lastError;

    // 3. Retry Loop with Multiple Models
    for (const modelName of modelsToTry) {
      try {
        logger.info(`Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: timetableSchema,
          },
        });

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: image, mimeType: "image/png" } },
        ]);

        const response = await result.response;
        return JSON.parse(response.text());
      } catch (error) {
        logger.warn(`Model ${modelName} failed:`, error.message);
        lastError = error;

        // Special handling for Experimental Model Rate Limits (429)
        if (modelName.includes("flash-exp") && error.message.includes("429")) {
          logger.info(
            "Hit experimental rate limit. Waiting 30s before final retry...",
          );
          await wait(30000);
          // We could retry the same model here, but simpler to just let the loop continue or fail
          // For now, if 2.0 fails with 429, we are likely stuck unless we wait.
          // Let's retry THIS model once after waiting.
          try {
            const result = await genAI
              .getGenerativeModel({
                model: modelName,
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: timetableSchema,
                },
              })
              .generateContent([
                prompt,
                { inlineData: { data: image, mimeType: "image/png" } },
              ]);
            return JSON.parse((await result.response).text());
          } catch (retryError) {
            lastError = retryError;
          }
        }
      }
    }

    // 4. Final Error Handling
    if (lastError && lastError.message.includes("429")) {
      throw new HttpsError(
        "resource-exhausted",
        "AI service is busy. Please try again in 30 seconds.",
      );
    }

    throw new HttpsError(
      "internal",
      "Failed to extract timetable. " + (lastError?.message || ""),
    );
  },
);

exports.chat = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in");
  }

  const { message, history } = request.data;
  const uid = request.auth.uid;
  if (!message) {
    throw new HttpsError("invalid-argument", "Message is required");
  }

  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("internal", "API Key missing");
    genAI = new GoogleGenerativeAI(apiKey);
  }

  try {
    // 1. Fetch User Context (Parallel)
    const db = admin.firestore();
    let systemContext = "";

    try {
      const [coursesSnap, tasksSnap, notesSnap] = await Promise.all([
        db.collection(`users/${uid}/courses`).get(),
        db
          .collection("tasks")
          .where("userId", "==", uid)
          .where("status", "!=", "done")
          .get(),
        db
          .collection(`users/${uid}/notes`)
          .orderBy("createdAt", "desc")
          .limit(3)
          .get(),
      ]);

      const courses = coursesSnap.docs
        .map(
          (d) =>
            `${d.data().code} (${d.data().name}) on Keep Day ${d.data().dayOfWeek}, ${d.data().startTime}`,
        )
        .join("; ");
      const tasks = tasksSnap.docs.map((d) => `- ${d.data().title}`).join("\n");
      const notes = notesSnap.docs
        .map(
          (d) =>
            `Note '${d.data().title}': ${d.data().content?.substring(0, 50)}...`,
        )
        .join("\n");

      systemContext = `
          Current Date/Time: ${new Date().toString()}
          USER DATA:
          [TIMETABLE]: ${courses || "None"}
          [TASKS]: ${tasks || "None"}
          [recent NOTES]: ${notes || "None"}
          Use this data to answer questions about 'next class', 'what is due', etc. If asked unrelated questions, ignore this context.
        `;
    } catch (e) {
      logger.warn("Context fetch failed", e);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert history format
    const formattedHistory = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.message }],
    }));

    // Inject system prompt as the first exchange if context matches
    const finalHistory = [
      { role: "user", parts: [{ text: "System Context: " + systemContext }] },
      { role: "model", parts: [{ text: "Context received." }] },
      ...formattedHistory,
    ];

    const chat = model.startChat({
      history: finalHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return { response: response.text() };
  } catch (error) {
    logger.error("Chat error", error);
    throw new HttpsError(
      "internal",
      "Failed to generate response " + error.message,
    );
  }
});

/**
 * Trigger: Send FCM notification when a post is created
 */
exports.sendNewPostNotification = onDocumentCreated(
  "groups/{groupId}/posts/{postId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const post = snapshot.data();
    const groupId = event.params.groupId;
    const authorName = post.authorName || "Someone";

    // Create Notification Payload
    const message = {
      notification: {
        title: `New Post in Group`,
        body: `${authorName}: ${post.content ? post.content.substring(0, 50) : "New attachment"}`,
      },
      topic: `group_${groupId}`, // Subscribed by mobile app
      data: {
        groupId: groupId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    try {
      await admin.messaging().send(message);
      logger.info(`Notification sent to topic group_${groupId}`);
    } catch (error) {
      logger.error("Error sending notification", error);
    }
  },
);
