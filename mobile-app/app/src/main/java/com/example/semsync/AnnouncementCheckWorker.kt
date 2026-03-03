package com.example.semsync

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.semsync.MainActivity
import com.example.semsync.R
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await
import java.util.Date

class AnnouncementCheckWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val sharedPrefs = applicationContext.getSharedPreferences("semsync_prefs", Context.MODE_PRIVATE)

    companion object {
        const val CHANNEL_ID = "semsync_announcements"
        const val PREF_LAST_CHECK_TIME = "last_announcement_check_timestamp"
    }

    override suspend fun doWork(): Result {
        val userId = auth.currentUser?.uid ?: return Result.failure()

        try {
            // Get last check time from prefs, default to now minus 1 hour if not set (to avoid notify about old stuff on fresh install)
            // Or default to 24 hours ago if really needed? Let's say 1 hour.
            var lastCheckTime = sharedPrefs.getLong(PREF_LAST_CHECK_TIME, System.currentTimeMillis() - 3600000)

            Log.d("Worker", "Checking for announcements since: ${Date(lastCheckTime)}")

            // 1. Get user's groups
            val groupsSnapshot = db.collection("groups")
                .whereArrayContains("members", userId)
                .get()
                .await()

            if (groupsSnapshot.isEmpty) {
                return Result.success() // No groups to check
            }

            var newAnnouncementCount = 0
            var exampleTitle = ""
            var exampleGroup = ""
            
            val checkTimestamp = Timestamp(Date(lastCheckTime))

            // 2. Check each group for new posts
            // Ideally we'd do a collection group query or simpler query, but structure is groups/{id}/posts
            // For now, iterate (watch out for read limits on large scale, OK for prototype)
            for (groupDoc in groupsSnapshot) {
                val groupName = groupDoc.getString("name") ?: "Group"

                // Track processed posts to avoid double counting when they have both fields
                val processedPostIds = mutableSetOf<String>()

                // First, check posts using the "timestamp" field
                val timestampPostsSnapshot = groupDoc.reference.collection("posts")
                    .whereGreaterThan("timestamp", checkTimestamp)
                    .limit(5)
                    .get()
                    .await()

                for (postDoc in timestampPostsSnapshot) {
                    if (processedPostIds.add(postDoc.id)) {
                        val authorId = postDoc.getString("authorId")
                        if (authorId != userId) { // Don't notify about own posts
                            newAnnouncementCount++
                            if (exampleTitle.isEmpty()) {
                                exampleTitle = postDoc.getString("content") ?: "New Content"
                                exampleGroup = groupName
                            }
                        }
                    }
                }

                // Then, check posts using the "createdAt" field as a fallback
                val createdAtPostsSnapshot = groupDoc.reference.collection("posts")
                    .whereGreaterThan("createdAt", checkTimestamp)
                    .limit(5)
                    .get()
                    .await()

                for (postDoc in createdAtPostsSnapshot) {
                    if (processedPostIds.add(postDoc.id)) {
                        val authorId = postDoc.getString("authorId")
                        if (authorId != userId) { // Don't notify about own posts
                            newAnnouncementCount++
                            if (exampleTitle.isEmpty()) {
                                exampleTitle = postDoc.getString("content") ?: "New Content"
                                exampleGroup = groupName
                            }
                        }
                    }
                }
            }

            if (newAnnouncementCount > 0) {
                sendNotification(newAnnouncementCount, exampleGroup, exampleTitle)
                
                // Update last check time
                // Use the time we started checking, or just 'now'
                sharedPrefs.edit().putLong(PREF_LAST_CHECK_TIME, System.currentTimeMillis()).apply()
            }

            return Result.success()

        } catch (e: Exception) {
            Log.e("Worker", "Error checking announcements", e)
            return Result.retry()
        }
    }

    private fun sendNotification(count: Int, groupName: String, previewText: String) {
        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create channel if needed (safe to call repeatedly)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Class Announcements",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications for new class announcements"
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Create intent to open app
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            applicationContext, 
            0, 
            intent, 
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val title = if (count == 1) "New in $groupName" else "$count new announcements"
        val content = if (count == 1) previewText else "Check your groups for new updates."

        val builder = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) // Make sure this exists, or use android system icon temporarily
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}
