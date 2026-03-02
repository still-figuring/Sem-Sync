package com.example.semsync

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import kotlinx.coroutines.tasks.await

class TaskRepository {
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    suspend fun getUpcomingTasks(): List<Task> {
        val uid = auth.currentUser?.uid ?: return emptyList()
        
        return try {
            val now = Timestamp.now()
            val sevenDaysLater = Timestamp(now.seconds + (7 * 24 * 60 * 60), now.nanoseconds)
            
            val snapshot = db.collection("tasks")
                .whereEqualTo("userId", uid)
                .whereEqualTo("completed", false)
                .whereLessThanOrEqualTo("dueDate", sevenDaysLater)
                .whereGreaterThanOrEqualTo("dueDate", now)
                .orderBy("dueDate")
                .get()
                .await()
            
            snapshot.toObjects(Task::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getAllTasks(): List<Task> {
        val uid = auth.currentUser?.uid ?: return emptyList()
        
        return try {
            val snapshot = db.collection("tasks")
                .whereEqualTo("userId", uid)
                .get()
                .await()
            
            snapshot.toObjects(Task::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
