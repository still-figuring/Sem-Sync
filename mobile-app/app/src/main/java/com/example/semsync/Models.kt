package com.example.semsync

import com.google.firebase.Timestamp

data class AcademicGroup(
    var id: String = "",
    val name: String = "",
    val code: String = "",
    val joinCode: String = "",
    val lecturerName: String = "",
    val repId: String = "",
    val course: String = "",
    val description: String = "",
    val members: List<String> = emptyList(),
    val units: List<String> = emptyList(),
    val createdAt: Long? = null
) {
    val memberCount: Int
        get() = members.size
}

data class GroupPost(
    var id: String = "",
    val groupId: String = "",
    val authorId: String = "",
    val authorName: String = "",
    val content: String = "",
    val createdAt: Timestamp? = null,
    val timestamp: Timestamp? = null, // Support both Long and Timestamp
    val type: String = "announcement", // "announcement", "material", "urgent"
    val attachments: List<String> = emptyList()
)

// NOTE: The Task data class has been moved to its own file, Task.kt, to resolve a redeclaration error.

// Added based on UI requirements for the dashboard schedule card
data class TimetableEntry(
    val unitName: String = "",
    val unitCode: String = "",
    val location: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val dayOfWeek: Int = 0
)

data class AcademicUnit(
    var id: String = "",
    val groupId: String = "",
    val name: String = "",
    val code: String = "",
    val lecturerName: String = "",
    val schedule: List<UnitSchedule> = emptyList()
)

data class UnitSchedule(
    val day: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val location: String = ""
)

data class EnrichedPost(
    val post: GroupPost,
    val groupName: String
)
