package com.example.semsync

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class UserRepository {
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    suspend fun getCurrentUser(): User? {
        val uid = auth.currentUser?.uid ?: return null
        
        return try {
            val document = db.collection("users").document(uid).get().await()
            document.toObject(User::class.java)?.copy(uid = uid)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
