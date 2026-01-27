package com.example.semsync

import com.google.firebase.Timestamp

data class Task(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val completed: Boolean = false,
    val priority: String = "medium",
    val dueDate: Timestamp? = null
)