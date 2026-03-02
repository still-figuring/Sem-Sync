package com.example.semsync.data.repository

import com.example.semsync.data.remote.GeminiService

class GeminiRepository {

    suspend fun sendUserPrompt(prompt: String): String {
        return GeminiService.sendMessage(prompt)
    }
}
