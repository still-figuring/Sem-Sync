package com.example.semsync.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object GeminiService {

    private val client = OkHttpClient()

    private const val FUNCTION_URL =
        "https://us-central1-semsync-bf92d.cloudfunctions.net/chat"

    suspend fun sendMessage(message: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject().apply {
            put("message", message)
        }

        val body = json.toString()
            .toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(FUNCTION_URL)
            .post(body)
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext "Error ${response.code}"
                }
                response.body?.string() ?: "Empty response"
            }
        } catch (e: Exception) {
            "Network error: ${e.localizedMessage}"
        }
    }
}
