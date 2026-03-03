package com.example.semsync

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.lifecycle.lifecycleScope
import com.example.semsync.databinding.FragmentNotificationsBinding
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class NotificationsFragment : Fragment() {

    private var _binding: FragmentNotificationsBinding? = null
    private val binding get() = _binding!!
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNotificationsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        binding.recyclerViewNotifications.layoutManager = LinearLayoutManager(context)
        
        fetchNotifications()
    }

    private fun fetchNotifications() {
        val userId = auth.currentUser?.uid ?: return

        viewLifecycleOwner.lifecycleScope.launch(Dispatchers.IO) {
            try {
                // 1. Get user's groups
                val groupsSnapshot = db.collection("groups")
                    .whereArrayContains("members", userId)
                    .get()
                    .await()
                
                val allPosts = mutableListOf<EnrichedPost>()

                // 2. Fetch posts from each group
                for (groupDoc in groupsSnapshot) {
                    val groupName = groupDoc.getString("name") ?: "Group"
                    
                    try {
                        val postsSnapshot = groupDoc.reference.collection("posts")
                            .orderBy("timestamp", Query.Direction.DESCENDING)
                            .limit(20) 
                            .get()
                            .await()

                        if (postsSnapshot.isEmpty) {
                            // If empty, it might be because all posts are old and lack 'timestamp' field
                            throw Exception("No new posts found, try legacy sort")
                        }

                        for (postDoc in postsSnapshot) {
                            val post = postDoc.toObject(GroupPost::class.java)
                            allPosts.add(EnrichedPost(post, groupName))
                        }
                    } catch (e: Exception) {
                        try {
                            // Fallback to createdAt if timestamp query fails
                            val retrySnapshot = groupDoc.reference.collection("posts")
                                .orderBy("createdAt", Query.Direction.DESCENDING)
                                .limit(20)
                                .get()
                                .await()

                            for (retryDoc in retrySnapshot) {
                                val post = retryDoc.toObject(GroupPost::class.java)
                                // Avoid duplicates if any overlap (though unlikely if first query failed)
                                if (allPosts.none { it.post.id == post.id }) {
                                    allPosts.add(EnrichedPost(post, groupName))
                                }
                            }
                        } catch (e2: Exception) {
                            Log.e("NotificationsFragment", "Failed to fetch posts for group $groupName", e2)
                        }
                    }
                }

                // 3. Sort all aggregated posts by timestamp (Newest first)
                val sortedPosts = allPosts.sortedByDescending {
                    it.post.timestamp?.toDate()?.time ?: it.post.createdAt?.toDate()?.time ?: 0L
                }

                // 4. Update UI
                withContext(Dispatchers.Main) {
                    if (_binding != null) {
                        binding.recyclerViewNotifications.adapter = AnnouncementsAdapter(sortedPosts)
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
