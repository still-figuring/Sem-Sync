package com.example.semsync

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * AiChatViewModel — the brain of the chat feature.
 *
 * Threading model:
 *   - All UI state mutations happen on the main thread (StateFlow collectors
 *     run on main by default in Fragments using lifecycleScope).
 *   - GeminiRepository.sendMessage() suspends on Dispatchers.IO internally.
 *   - viewModelScope is tied to the ViewModel lifecycle, so coroutines are
 *     automatically cancelled when the ViewModel is cleared — no leaks.
 *
 * State persistence:
 *   - Messages survive configuration changes (rotation) because the ViewModel
 *     outlives the Fragment across config changes.
 *   - For process-death persistence, save/restore _messages via
 *     SavedStateHandle (extension point noted below).
 *
 * Decoupling:
 *   - The ViewModel depends only on GeminiRepository (injected via constructor).
 *   - No Android framework imports except ViewModel — fully unit-testable.
 */
class AiChatViewModel(
    private val repository: GeminiRepository = GeminiRepository()
) : ViewModel() {

    // The mutable backing flow — private so only this class can mutate it.
    private val _uiState = MutableStateFlow<ChatUiState>(ChatUiState.Idle)

    /** The Fragment observes this read-only flow. */
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    // Internal mutable list — copied into immutable snapshots before emitting.
    private val _messages = mutableListOf<ChatMessage>()

    /**
     * Call this when the user taps Send.
     *
     * Flow:
     * 1. Append the user's message immediately (instant UI feedback).
     * 2. Append a LOADING bot placeholder (shows typing indicator).
     * 3. Suspend on the repository call (IO thread, non-blocking).
     * 4a. On success: replace the placeholder with the real reply.
     * 4b. On failure: replace the placeholder with an ERROR message.
     */
    fun sendMessage(userInput: String) {
        val trimmed = userInput.trim()
        if (trimmed.isEmpty()) return

        // 1. User message
        _messages += ChatMessage(text = trimmed, sender = Sender.USER)
        emitUpdated(isSending = true)

        // 2. Bot loading placeholder — we'll find it by this fixed ID later.
        val loadingId = java.util.UUID.randomUUID().toString()
        _messages += ChatMessage(
            id = loadingId,
            text = "",
            sender = Sender.BOT,
            state = MessageState.LOADING
        )
        emitUpdated(isSending = true)

        viewModelScope.launch {
            try {
                val reply = repository.sendMessage(trimmed)

                // 4a. Replace placeholder with real reply
                replacePlaceholder(
                    id = loadingId,
                    replacement = ChatMessage(
                        text = reply,
                        sender = Sender.BOT,
                        state = MessageState.DELIVERED
                    )
                )
            } catch (e: Exception) {
                // 4b. Replace placeholder with error state
                replacePlaceholder(
                    id = loadingId,
                    replacement = ChatMessage(
                        text = "Failed to get a response. Tap to retry.",
                        sender = Sender.BOT,
                        state = MessageState.ERROR
                    )
                )
            } finally {
                emitUpdated(isSending = false)
            }
        }
    }

    /** Removes a message by ID and retries it. Called from the Fragment on error tap. */
    fun retryMessage(failedBotMessageId: String) {
        // Find the user message just before the failed bot message
        val botIndex = _messages.indexOfFirst { it.id == failedBotMessageId }
        if (botIndex <= 0) return
        val userMessage = _messages.getOrNull(botIndex - 1) ?: return

        // Remove the error placeholder
        _messages.removeAt(botIndex)
        emitUpdated()

        // Resend
        sendMessage(userMessage.text)
    }

    private fun replacePlaceholder(id: String, replacement: ChatMessage) {
        val index = _messages.indexOfFirst { it.id == id }
        if (index != -1) _messages[index] = replacement
    }

    private fun emitUpdated(isSending: Boolean = false) {
        _uiState.value = ChatUiState.Updated(
            messages = _messages.toList(), // immutable snapshot
            isSending = isSending
        )
    }

    // ─── EXTENSION POINT: SavedStateHandle ──────────────────────────────────
    // To survive process death, inject SavedStateHandle and serialize _messages
    // to JSON in onCleared() / restore in init {}.
}
