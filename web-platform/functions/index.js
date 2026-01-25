const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const path = require("path");

// Robust Environment Loading:
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

admin.initializeApp();

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
