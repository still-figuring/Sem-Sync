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
import java.util.Calendar
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.ceil

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
            val bottomNav = requireActivity().findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)
            bottomNav.selectedItemId = R.id.navigation_timetable
        }

        binding.btnViewTasks.setOnClickListener {
            val bottomNav = requireActivity().findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)
            bottomNav.selectedItemId = R.id.navigation_tasks
        }

        binding.btnViewNotes.setOnClickListener {
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
        binding.tvGreeting.text = "${getGreeting()} $name! Here's what's happening today."
    }

    private fun fetchTodaySchedule() {
        val userId = auth.currentUser?.uid ?: return
        val calendar = Calendar.getInstance()
        val todayIndex = calendar.get(Calendar.DAY_OF_WEEK) // Sunday=1
        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val todayString = days[todayIndex - 1]

        val tomorrowIndexRaw = (todayIndex % 7) + 1
        val tomorrowString = days[tomorrowIndexRaw - 1]

        db.collection("groups")
            .whereArrayContains("members", userId)
            .get()
            .addOnSuccessListener { groupDocs ->
                val todayUnits = mutableListOf<TimetableEntry>()
                val tomorrowUnits = mutableListOf<TimetableEntry>()

                // FIX #6: Use AtomicInteger to avoid race condition on pendingFetches
                val pendingFetches = AtomicInteger(groupDocs.size())

                if (pendingFetches.get() == 0) {
                    updateDashboardSchedule(emptyList(), emptyList())
                    return@addOnSuccessListener
                }

                for (groupDoc in groupDocs) {
                    // FIX #9: Removed unused groupName variable that was declared but never used
                    groupDoc.reference.collection("units")
                        .get()
                        .addOnSuccessListener { unitDocs ->
                            // FIX #7: Guard against fragment being detached before callback fires
                            if (_binding == null) return@addOnSuccessListener

                            for (unitDoc in unitDocs) {
                                val unit = unitDoc.toObject(AcademicUnit::class.java)
                                for (schedule in unit.schedule) {
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
                            // FIX #6: Atomic decrement — thread-safe countdown
                            if (pendingFetches.decrementAndGet() == 0) {
                                updateDashboardSchedule(todayUnits, tomorrowUnits)
                            }
                        }
                        .addOnFailureListener {
                            if (_binding == null) return@addOnFailureListener
                            if (pendingFetches.decrementAndGet() == 0) {
                                updateDashboardSchedule(todayUnits, tomorrowUnits)
                            }
                        }
                }
            }
            .addOnFailureListener {
                if (_binding == null) return@addOnFailureListener
                binding.cardTodaysSchedule.visibility = View.GONE
            }
    }

    private fun updateDashboardSchedule(
        todayUnits: List<TimetableEntry>,
        tomorrowUnits: List<TimetableEntry>
    ) {
        if (_binding == null) return

        fun parseClassTime(timeStr: String): Int {
            if (timeStr.isBlank()) return -1
            return try {
                val parts = timeStr.trim().split(":")
                if (parts.size >= 2) {
                    val hour = parts[0].toInt()
                    val minute = parts[1].take(2).toInt()
                    if (hour !in 0..23 || minute !in 0..59) -1
                    else hour * 60 + minute
                } else -1
            } catch (e: Exception) {
                -1
            }
        }

        val calendar = Calendar.getInstance()
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val todayIndex = calendar.get(Calendar.DAY_OF_WEEK) - 1
        val todayName = days[todayIndex]

        val sortedToday = todayUnits.sortedBy { parseClassTime(it.startTime) }
        val sortedTomorrow = tomorrowUnits.sortedBy { parseClassTime(it.startTime) }

        val upcomingClass = sortedToday.firstOrNull {
            val endMinutes = parseClassTime(it.endTime)
            endMinutes > currentMinutes
        }

        binding.cardTodaysSchedule.visibility = View.VISIBLE

        if (upcomingClass != null) {
            binding.tvScheduleTitle.text = "Today's Schedule ($todayName)"
            binding.tvScheduleUnitName.text = upcomingClass.unitName
            binding.tvScheduleLocation.text = upcomingClass.location
            binding.tvScheduleUnitCode.text = upcomingClass.unitCode
            binding.tvScheduleTime.text = "${upcomingClass.startTime} - ${upcomingClass.endTime}"

            val index = sortedToday.indexOf(upcomingClass)
            val remaining = sortedToday.size - 1 - index
            binding.tvScheduleGroup.text = if (remaining > 0) "+$remaining more" else "Next Class"

        } else if (sortedTomorrow.isNotEmpty()) {
            val nextClass = sortedTomorrow.first()
            val tomorrowIndex = (todayIndex + 1) % 7
            val tomorrowName = days[tomorrowIndex]

            binding.tvScheduleTitle.text = "Tomorrow's Schedule ($tomorrowName)"
            binding.tvScheduleUnitName.text = nextClass.unitName
            binding.tvScheduleLocation.text = nextClass.location
            binding.tvScheduleUnitCode.text = nextClass.unitCode
            binding.tvScheduleTime.text = "${nextClass.startTime} - ${nextClass.endTime}"
            binding.tvScheduleGroup.text = if (sortedTomorrow.size > 1) "+${sortedTomorrow.size - 1} more" else "First Class"

        } else {
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
            .limit(3)
            .get()
            .addOnSuccessListener { documents ->
                // FIX #7: Guard against detached fragment
                if (_binding == null) return@addOnSuccessListener

                if (!documents.isEmpty) {
                    val taskList = documents.toObjects(Task::class.java)

                    if (taskList.isNotEmpty()) {
                        val task = taskList[0]

                        // FIX #2: task is never null from toObjects(); only check the nullable field
                        if (task.dueDate != null) {
                            binding.cardTasksDueSoon.visibility = View.VISIBLE

                            // FIX #10: Set tvTaskTitle only once using a single expression
                            binding.tvTaskTitle.text = if (taskList.size > 1) {
                                "${task.title} (+${taskList.size - 1} more)"
                            } else {
                                task.title
                            }

                            // FIX #1: task.dueDate is a Firestore Timestamp — convert via .toDate().time
                            val dueDateMillis = task.dueDate.toDate().time
                            val diff = dueDateMillis - Calendar.getInstance().time.time

                            // FIX #5: Use ceil to avoid truncation (1.9 days showing as "1 days")
                            val days = ceil(diff.toDouble() / (1000 * 60 * 60 * 24)).toLong()

                            binding.tvTaskDueDate.text = when {
                                days < -1  -> "${-days} days ago"
                                days == -1L -> "Yesterday"
                                days == 0L  -> "Today"
                                days == 1L  -> "Tomorrow"
                                else        -> "in $days days"
                            }
                        } else {
                            binding.cardTasksDueSoon.visibility = View.GONE
                        }
                    }
                } else {
                    binding.cardTasksDueSoon.visibility = View.GONE
                }
            }
            .addOnFailureListener {
                if (_binding == null) return@addOnFailureListener
                binding.cardTasksDueSoon.visibility = View.GONE
            }
    }

    private fun fetchAnnouncements() {
        val userId = auth.currentUser?.uid ?: return

        db.collection("groups")
            .whereArrayContains("members", userId)
            .get()
            .addOnSuccessListener { groupDocs ->
                val allPosts = mutableListOf<EnrichedPost>()

                // FIX #6: AtomicInteger for thread-safe countdown
                val pendingFetches = AtomicInteger(groupDocs.size())

                if (pendingFetches.get() == 0) {
                    updateAnnouncementsUI(emptyList())
                    return@addOnSuccessListener
                }

                for (groupDoc in groupDocs) {
                    val groupName = groupDoc.getString("name") ?: "Group"

                    groupDoc.reference.collection("posts")
                        .orderBy("timestamp", Query.Direction.DESCENDING)
                        .limit(3)
                        .get()
                        .addOnSuccessListener { postDocs ->
                            // FIX #7: Guard against detached fragment
                            if (_binding == null) return@addOnSuccessListener

                            for (postDoc in postDocs) {
                                val post = postDoc.toObject(GroupPost::class.java)
                                allPosts.add(EnrichedPost(post, groupName))
                            }
                            if (pendingFetches.decrementAndGet() == 0) {
                                updateAnnouncementsUI(allPosts)
                            }
                        }
                        .addOnFailureListener {
                            if (_binding == null) return@addOnFailureListener

                            // Fallback: try createdAt field if timestamp index is missing
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
                                    if (pendingFetches.decrementAndGet() == 0) {
                                        updateAnnouncementsUI(allPosts)
                                    }
                                }
                                .addOnFailureListener {
                                    if (pendingFetches.decrementAndGet() == 0) {
                                        updateAnnouncementsUI(allPosts)
                                    }
                                }
                        }
                }
            }
            .addOnFailureListener {
                if (_binding == null) return@addOnFailureListener
                binding.recyclerAnnouncements.visibility = View.GONE
            }
    }

    private fun updateAnnouncementsUI(posts: List<EnrichedPost>) {
        if (_binding == null) return

        // FIX #3: Filter out posts where both timestamp fields are null before sorting,
        // so they don't silently sink to the bottom with a fake epoch-0 timestamp.
        val sortedPosts = posts
            .filter { it.post.timestamp != null || it.post.createdAt != null }
            .sortedByDescending {
                val ts = it.post.timestamp ?: it.post.createdAt
                ts?.toDate()?.time ?: 0L
            }
            .take(5)

        if (sortedPosts.isNotEmpty()) {
            binding.recyclerAnnouncements.visibility = View.VISIBLE
            binding.recyclerAnnouncements.adapter = AnnouncementsAdapter(sortedPosts)
        } else {
            binding.recyclerAnnouncements.visibility = View.GONE
        }
    }

    private fun setupRecyclerViews() {
        // FIX #8: Only set layoutManagers here. Adapters are set by their respective update functions.
        binding.recyclerRecentNotes.layoutManager = LinearLayoutManager(context)
        binding.recyclerAnnouncements.layoutManager = LinearLayoutManager(context)
    }

    private fun getGreeting(): String {
        return when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
            in 0..11  -> "Good morning,"
            in 12..16 -> "Good afternoon,"
            else      -> "Good evening,"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

// Placeholder adapter — replaced by real data adapters once available
class NotesAdapter(private val items: List<Any>) : RecyclerView.Adapter<NotesAdapter.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view)
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        ViewHolder(TextView(parent.context))
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {}
    override fun getItemCount() = items.size
}