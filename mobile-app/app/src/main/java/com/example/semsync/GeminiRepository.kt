package com.example.semsync

import kotlinx.coroutines.delay

/**
 * GeminiRepository — currently running in MOCK MODE.
 *
 * The real HTTP call is commented out until Member 6 deploys the
 * Cloud Function. Swap the two blocks below when the URL is ready.
 */
class GeminiRepository {

    suspend fun sendMessage(prompt: String): String {
        // ── MOCK MODE (active until Cloud Function is ready) ────────────────
        delay(1200) // simulate realistic network latency

        return when {
            prompt.contains("class", ignoreCase = true) ||
                    prompt.contains("lecture", ignoreCase = true) ->
                "Your next class is CS 2313 at 2:00 PM in SCC 100. Don't be late! 📚"

            prompt.contains("assignment", ignoreCase = true) ||
                    prompt.contains("due", ignoreCase = true) ->
                "You have 2 assignments due this week: Database Design (Tuesday 11:59 PM) and the Algorithms problem set ( Friday 9:00 AM)."

            prompt.contains("task", ignoreCase = true) ||
                    prompt.contains("pending", ignoreCase = true) ->
                "You have a Mobile Development (Tuesday 9:00 AM) and the Simulation and Modelling group discussion (Wednesday 6:00 PM)."

            prompt.contains("study", ignoreCase = true) ||
                    prompt.contains("plan", ignoreCase = true) ->
                "I'd suggest blocking 2 hours tonight for your Database assignment, then 1 hour tomorrow morning for Algorithms before class."

            prompt.contains("hello", ignoreCase = true) ||
                    prompt.contains("hi", ignoreCase = true) ->
                "Hey! I'm SemSync AI. Ask me about your schedule, assignments, tasks or study planning! 👋"

            else ->
                "I'm SemSync AI — I can help with your schedule, deadlines, and study planning. What do you need?"
        }
        // ── REAL MODE (uncomment when Cloud Function URL is ready) ──────────
        /*
        return withContext(Dispatchers.IO) {
            val connection = (URL(cloudFunctionUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
                connectTimeout = 15_000
                readTimeout = 30_000
            }
            val payload = JSONObject().put("prompt", prompt).toString()
            OutputStreamWriter(connection.outputStream).use { it.write(payload) }

            val responseCode = connection.responseCode
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw Exception("Server error: $responseCode")
            }
            val responseBody = connection.inputStream.bufferedReader().readText()
            JSONObject(responseBody).getString("reply")
        }
        */
    }

    // Paste your Cloud Function URL here when Member 6 is ready:
    // private val cloudFunctionUrl = "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/askGemini"
}