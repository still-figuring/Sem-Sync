const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

// Initialize Gemini
// Important: Ensure you set the GEMINI_API_KEY environment variable
// You can create a .env file in this functions folder with:
// GEMINI_API_KEY=your_key_here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

exports.extractTimetable = onCall({ cors: true }, async (request) => {
  // 1. Authentication Check
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to upload a timetable.",
    );
  }

  // 2. Data Validation
  const { image } = request.data;
  if (!image) {
    throw new HttpsError("invalid-argument", "No image data provided.");
  }

  // 3. Define the Schema (Same as frontend)
  const timetableSchema = {
    description: "List of classes from a timetable",
    type: "array",
    items: {
      type: "object",
      properties: {
        day: { type: "string", description: "Full day name (Monday, etc.)" },
        startTime: { type: "string", description: "HH:mm format" },
        endTime: { type: "string", description: "HH:mm format" },
        subject: { type: "string", description: "Course code and name" },
        room: { type: "string", description: "Venue/Location" },
        type: {
          type: "string",
          enum: ["lecture", "tutorial", "lab", "other"],
          description: "Class type",
        },
        lecturer: { type: "string", description: "Lecturer name if visible" },
      },
      required: ["day", "startTime", "endTime", "subject"],
    },
  };

  try {
    // 4. Call Gemini API
    // We use the stable model here since the backend key should have proper permissions
    // Or we keep the experimental one if you haven't fixed the project permissions yet.
    // Let's try the list approach for robustness on the backend too.

    // Note: The backend has higher limits usually, but let's stick to the working one.
    const modelName = "gemini-2.0-flash-exp";

    logger.info(
      `Processing timetable for user ${request.auth.uid} with model ${modelName}`,
    );

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
      },
    });

    const prompt = "Analyze this timetable image and extract the schedule.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/png" } }, // Assuming PNG/JPEG, API is flexible
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse and return
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    logger.error("Gemini Extraction Failed", error);

    if (error.message.includes("429")) {
      throw new HttpsError(
        "resource-exhausted",
        "AI service is busy. Please try again in 30 seconds.",
      );
    }

    throw new HttpsError("internal", "Failed to process timetable image.");
  }
});
