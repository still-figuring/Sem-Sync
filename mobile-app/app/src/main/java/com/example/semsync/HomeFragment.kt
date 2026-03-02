package com.example.semsync

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.semsync.databinding.FragmentHomeBinding
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupGreeting()
        fetchTodaySchedule()
        fetchTasksDueSoon()
        fetchAnnouncements()
        setupRecyclerViews()
        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.btnViewCalendar.setOnClickListener {
            // Navigate to Timetable
            val bottomNav = requireActivity().findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)
            bottomNav.selectedItemId = R.id.navigation_timetable
        }
        
        binding.btnViewTasks.setOnClickListener {
            // Navigate to Tasks
            val bottomNav = requireActivity().findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)
            bottomNav.selectedItemId = R.id.navigation_tasks
        }
        
        binding.btnViewNotes.setOnClickListener {
            // Navigate to Notebook
            val bottomNav = requireActivity().findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)
            bottomNav.selectedItemId = R.id.navigation_notebook
        }

        binding.btnNotifications.setOnClickListener {
           findNavController().navigate(R.id.navigation_notifications)
        }

        binding.btnProfile.setOnClickListener {
            // TODO: Profile screen
        }
    }

    private fun setupGreeting() {
        val user = auth.currentUser
        val name = user?.displayName?.split(" ")?.firstOrNull() ?: "Student"
        val fullGreeting = "${getGreeting()} $name! Here's what's happening today."
        binding.tvGreeting.text = fullGreeting
    }

    private fun fetchTodaySchedule() {
        val userId = auth.currentUser?.uid ?: return
        val calendar = Calendar.getInstance()
        val todayIndex = calendar.get(Calendar.DAY_OF_WEEK) // Sunday=1
        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val todayString = days[todayIndex - 1]
        
        // Calculate tomorrow's index for fallback
        val tomorrowIndexRaw = (todayIndex % 7) + 1
        val tomorrowString = days[tomorrowIndexRaw - 1]

        db.collection("groups")
            .whereArrayContains("members", userId)
            .get()
            .addOnSuccessListener { groupDocs ->
                val todayUnits = mutableListOf<TimetableEntry>()
                val tomorrowUnits = mutableListOf<TimetableEntry>()
                // Track pending fetches
                var pendingFetches = groupDocs.size()
                
                if (pendingFetches == 0) {
                     updateDashboardSchedule(emptyList(), emptyList())
                     return@addOnSuccessListener
                }

                for (groupDoc in groupDocs) {
                    val groupName = groupDoc.getString("name") ?: ""
                    groupDoc.reference.collection("units")
                        .get()
                        .addOnSuccessListener { unitDocs ->
                            for (unitDoc in unitDocs) {
                                val unit = unitDoc.toObject(AcademicUnit::class.java)
                                for (schedule in unit.schedule) {
                                    // Check Today
                                    if (schedule.day.equals(todayString, ignoreCase = true)) {
                                        todayUnits.add(
                                            TimetableEntry(
                                                unitName = unit.name,
                                                unitCode = unit.code,
                                                location = schedule.location,
                                                startTime = schedule.startTime,
                                                endTime = schedule.endTime,
                                                dayOfWeek = todayIndex - 1
                                            )
                                        )
                                    }
                                    // Check Tomorrow
                                    if (schedule.day.equals(tomorrowString, ignoreCase = true)) {
                                        tomorrowUnits.add(
                                            TimetableEntry(
                                                unitName = unit.name,
                                                unitCode = unit.code,
                                                location = schedule.location,
                                                startTime = schedule.startTime,
                                                endTime = schedule.endTime,
                                                dayOfWeek = tomorrowIndexRaw - 1
                                            )
                                        )
                                    }
                                }
                            }
                            pendingFetches--
                            if (pendingFetches == 0) {
                                updateDashboardSchedule(todayUnits, tomorrowUnits)
                            }
                        }
                        .addOnFailureListener {
                            pendingFetches--
                            if (pendingFetches == 0) {
                                updateDashboardSchedule(todayUnits, tomorrowUnits)
                            }
                        }
                }
            }
            .addOnFailureListener {
                binding.cardTodaysSchedule.visibility = View.GONE
            }
    }

    private fun updateDashboardSchedule(todayUnits: List<TimetableEntry>, tomorrowUnits: List<TimetableEntry>) {
        // Parse class times assuming a 24-hour "HH:mm" format (e.g. "08:30", "13:15").
        // Returns the number of minutes since midnight, or -1 if the time string is invalid.
        fun parseClassTime(timeStr: String): Int {
            if (timeStr.isBlank()) return -1
            return try {
                val parts = timeStr.trim().split(":")
                if (parts.size >= 2) {
                    val hour = parts[0].toInt()
                    val minute = parts[1].take(2).toInt() // Handle potential seconds or suffixes

                    // Validate that the parsed hour and minute are within 24-hour clock bounds.
                    if (hour !in 0..23 || minute !in 0..59) {
                        -1
                    } else {
                        hour * 60 + minute
                    }
                } else {
                    -1
                }
            } catch (e: Exception) {
                -1
            }
        }

        val calendar = Calendar.getInstance()
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val todayIndex = calendar.get(Calendar.DAY_OF_WEEK) - 1
        val todayName = days[todayIndex]
        
        // Sort using parsed time
        val sortedToday = todayUnits.sortedBy { parseClassTime(it.startTime) }
        val sortedTomorrow = tomorrowUnits.sortedBy { parseClassTime(it.startTime) }

        // Find first class that hasn't ended yet
        val upcomingClass = sortedToday.firstOrNull { 
            val endMinutes = parseClassTime(it.endTime)
            endMinutes > currentMinutes
        }

        binding.cardTodaysSchedule.visibility = View.VISIBLE

        if (upcomingClass != null) {
            // Case 1: Active class today
            binding.tvScheduleTitle.text = "Today's Schedule ($todayName)"
            binding.tvScheduleUnitName.text = upcomingClass.unitName
            binding.tvScheduleLocation.text = upcomingClass.location
            binding.tvScheduleUnitCode.text = upcomingClass.unitCode
            binding.tvScheduleTime.text = "${upcomingClass.startTime} - ${upcomingClass.endTime}"
            
            // Check if there are MORE classes today
            val endMinutes = parseClassTime(upcomingClass.endTime)
            // Logic: count how many classes start AFTER this one ends? Or just remaining in list?
            // Simple logic: count classes whose end time is in future, minus the current one we are showing.
            // Or better: count classes in the sorted list that appear AFTER the upcomingClass index
            val index = sortedToday.indexOf(upcomingClass)
            val remaining = sortedToday.size - 1 - index
            
            if (remaining > 0) {
                binding.tvScheduleGroup.text = "+$remaining more"
            } else {
                binding.tvScheduleGroup.text = "Next Class"
            }
            
        } else if (sortedTomorrow.isNotEmpty()) {
            // Case 2: No more classes today, show tomorrow
            val nextClass = sortedTomorrow.first()
            val tomorrowIndex = (todayIndex + 1) % 7
            val tomorrowName = days[tomorrowIndex]
            
            binding.tvScheduleTitle.text = "Tomorrow's Schedule ($tomorrowName)"
            binding.tvScheduleUnitName.text = nextClass.unitName
            binding.tvScheduleLocation.text = nextClass.location
            binding.tvScheduleUnitCode.text = nextClass.unitCode
            binding.tvScheduleTime.text = "${nextClass.startTime} - ${nextClass.endTime}"
            
            if (sortedTomorrow.size > 1) {
                binding.tvScheduleGroup.text = "+${sortedTomorrow.size - 1} more"
            } else {
                binding.tvScheduleGroup.text = "First Class"
            }
        } else {
            // Case 3: No classes today or tomorrow
            binding.tvScheduleTitle.text = "Schedule"
            binding.tvScheduleUnitName.text = "No upcoming classes"
            binding.tvScheduleLocation.text = ""
            binding.tvScheduleUnitCode.text = ""
            binding.tvScheduleTime.text = ""
            binding.tvScheduleGroup.text = "-"
        }
    }

    private fun fetchTasksDueSoon() {
        val userId = auth.currentUser?.uid ?: return

        db.collection("tasks")
            .whereEqualTo("userId", userId)
            .whereEqualTo("completed", false)
            .orderBy("dueDate", Query.Direction.ASCENDING)
            .limit(3) // Increased from 1 to 3
            .get()
            .addOnSuccessListener { documents ->
                if (!documents.isEmpty) {
                    val taskList = documents.toObjects(Task::class.java)
                    
                    if (taskList.isNotEmpty()) {
                        binding.cardTasksDueSoon.visibility = View.VISIBLE
                        // For now we just bind the first one since UI is single card
                        // TODO: Update UI to show list?
                        val task = taskList[0]
                        if (task != null && task.dueDate != null) {
                            binding.tvTaskTitle.text = task.title
                            if (taskList.size > 1) {
                                binding.tvTaskTitle.text = "${task.title} (+${taskList.size - 1} more)"
                            }
                            
                            // Calculate days until due or overdue
                            val diff = task.dueDate - Calendar.getInstance().time.time
                            val days = diff / (1000 * 60 * 60 * 24)
                            binding.tvTaskDueDate.text = when {
                                days < -1 -> "${-days} days ago"
                                days == -1L -> "Yesterday"
                                days == 0L -> "Today"
                                days == 1L -> "Tomorrow"
                                else -> "in $days days"
                            }
                        } else {
                            binding.cardTasksDueSoon.visibility = View.GONE
                        }
                    } 
                } else {
                    // No tasks found
                    binding.cardTasksDueSoon.visibility = View.GONE
                }
            }
    }

    private fun fetchAnnouncements() {
        val userId = auth.currentUser?.uid ?: return
        
        db.collection("groups")
            .whereArrayContains("members", userId)
            .get()
            .addOnSuccessListener { groupDocs ->
                val allPosts = mutableListOf<EnrichedPost>()
                var pendingFetches = groupDocs.size()

                if (pendingFetches == 0) {
                     updateAnnouncementsUI(emptyList())
                     return@addOnSuccessListener
                }

                for (groupDoc in groupDocs) {
                    val groupName = groupDoc.getString("name") ?: "Group"
                    
                    // Fetch recent posts - Order by multiple fields to ensure index usage if needed
                    // Use limit 3 to grab a few recent ones
                    groupDoc.reference.collection("posts")
                        .orderBy("timestamp", Query.Direction.DESCENDING) // Primary timestamp field
                        .limit(3)
                        .get()
                        .addOnSuccessListener { postDocs ->
                            if (_binding == null) return@addOnSuccessListener
                            for (postDoc in postDocs) {
                                val post = postDoc.toObject(GroupPost::class.java)
                                allPosts.add(EnrichedPost(post, groupName))
                            }
                            pendingFetches--
                            if (pendingFetches == 0) {
                                updateAnnouncementsUI(allPosts)
                            }
                        }
                        .addOnFailureListener {
                            // If timestamp fails (e.g. older index), try createdAt
                             groupDoc.reference.collection("posts")
                                .orderBy("createdAt", Query.Direction.DESCENDING)
                                .limit(3)
                                .get()
                                .addOnSuccessListener { retryDocs ->
                                    if (_binding == null) return@addOnSuccessListener
                                    for (retryDoc in retryDocs) {
                                        val post = retryDoc.toObject(GroupPost::class.java)
                                        allPosts.add(EnrichedPost(post, groupName))
                                    }
                                    pendingFetches--
                                    if (pendingFetches == 0) {
                                        updateAnnouncementsUI(allPosts)
                                    }
                                }
                                .addOnFailureListener {
                                    pendingFetches--
                                    if (pendingFetches == 0) {
                                        updateAnnouncementsUI(allPosts)
                                    }
                                }
                        }
                }
            }
            .addOnFailureListener {
                if (_binding != null) {
                    binding.recyclerAnnouncements.visibility = View.GONE
                }
            }
    }

    private fun updateAnnouncementsUI(posts: List<EnrichedPost>) {
        if (_binding == null) return
        
        // Sort manually since we fetched from multiple collections
        // User requested "latest ones at the top". 
        // Previously they said "earliest result are at top" (e.g. sortedBy ASC?)
        // The previous code was sortedByDescending (DESC), which IS "latest at top".
        // HOWEVER, if they are seeing "Oldest -> Newest", then sortedByDescending should be correct for "Newest -> Oldest".
        // Let's ensure we are using the timestamp correctly.
        val sortedPosts = posts.sortedByDescending { 
             val timestamp = it.post.timestamp ?: it.post.createdAt
             timestamp?.toDate()?.time ?: 0L 
        }.take(5) // Show top 5 latest (newest first)
            
        if (sortedPosts.isNotEmpty()) {
            binding.recyclerAnnouncements.visibility = View.VISIBLE
            binding.recyclerAnnouncements.adapter = AnnouncementsAdapter(sortedPosts)
        } else {
             // For now, let's just leave it empty or show a placeholder item
             binding.recyclerAnnouncements.visibility = View.GONE
             binding.recyclerAnnouncements.adapter = AnnouncementsAdapter(emptyList())
        }
    }

    private fun setupRecyclerViews() {
        binding.recyclerRecentNotes.layoutManager = LinearLayoutManager(context)
        binding.recyclerRecentNotes.adapter = NotesAdapter(emptyList())

        binding.recyclerAnnouncements.layoutManager = LinearLayoutManager(context)
        binding.recyclerAnnouncements.adapter = AnnouncementsAdapter(emptyList())
    }


    private fun getGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 0..11 -> "Good morning,"
            in 12..16 -> "Good afternoon,"
            else -> "Good evening,"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

// Placeholder Adapters for RecyclerViews with corrected structure
class NotesAdapter(private val items: List<Any>) : RecyclerView.Adapter<NotesAdapter.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view)
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = TextView(parent.context)
        return ViewHolder(view)
    }
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {}
    override fun getItemCount() = items.size
}