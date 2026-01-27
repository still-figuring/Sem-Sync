# Gemini Integration Guide for Android

Since we are presenting tomorrow, we cannot rely on complex client-side AI setups. We will route requests through our existing stable Firebase Cloud Function.

## 1. The Endpoint

We are using the HTTP Callable Function or a direct HTTP request.
Since we set up specific head-ers in the web app, let's use a standard **HTTP POST** request from Android.

**Base URL:**
_(You need to get this from the Firebase Console or `firebase deploy` output. It looks like `https://us-central1-your-project.cloudfunctions.net/api`)_

**Route:** `/generate-content` (or whatever specific endpoint we defined in `functions/index.js`)

## 2. Request Format (JSON)

```json
{
  "prompt": "I have a test tomorrow, help me plan.",
  "history": [] // Optional context
}
```

## 3. Implementation in Kotlin (Member 6 Task)

Use `OkHttp` or `Retrofit`. Here is a quick `OkHttp` snippet you can copy-paste.

### Dependency (in `build.gradle.kts`)

```kotlin
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
```

### The Service Class

```kotlin
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

object GeminiService {
    private val client = OkHttpClient()
    // TODO: REPLACE WITH ACTUAL CLOUD FUNCTION URL
    private const val FUNCTION_URL = "http://10.0.2.2:5001/semsync-bf92d/us-central1/chat" // Use 10.0.2.2 for Local Emulator
    // OR
    // private const val FUNCTION_URL = "https://us-central1-semsync-bf92d.cloudfunctions.net/chat" // Production

    suspend fun sendMessage(message: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject()
        json.put("message", message)

        // Simulating the body structure the web app sends
        val body = json.toString()
            .toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(FUNCTION_URL)
            .post(body)
            .build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext "Error: ${response.code}"
            }
            return@withContext response.body?.string() ?: "No response"
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext "Failed to connect: ${e.message}"
        }
    }
}
```

## 4. Guidelines for the AI Persona

To match the web app, ensure the "System Instruction" is set on the SERVER side (Cloud Function). The mobile app just sends the user input.

**Tip:** If the Cloud Function isn't working for the mobile team, Member 6 can switch to using the **Gemini Android SDK** directly as a fallback:
`implementation("com.google.ai.client.generativeai:generativeai:0.9.0")`
_Only do this if the backend integration fails._
