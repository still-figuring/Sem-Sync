package com.example.semsync

import java.util.UUID

/**
 * ChatMessage — the core data model for a single chat message.
 *
 * Immutable data class. The ViewModel always creates new instances rather
 * than mutating existing ones, which makes DiffUtil comparisons reliable.
 */
data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val text: String,
    val sender: Sender,
    val timestamp: Long = System.currentTimeMillis(),
    val state: MessageState = MessageState.DELIVERED
)

enum class Sender { USER, BOT }

enum class MessageState {
    DELIVERED,  // fully rendered
    LOADING,    // bot is thinking — shows typing indicator
    ERROR       // failed — tappable to retry
}
