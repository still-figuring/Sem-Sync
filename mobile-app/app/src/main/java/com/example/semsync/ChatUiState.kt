package com.example.semsync

sealed class ChatUiState {
    object Idle : ChatUiState()
    data class Updated(
        val messages: List<ChatMessage>,
        val isSending: Boolean = false
    ) : ChatUiState()
    data class FatalError(val message: String) : ChatUiState()
}
