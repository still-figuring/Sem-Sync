package com.example.semsync

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import android.widget.ArrayAdapter
import android.widget.TimePicker
import android.app.TimePickerDialog
import android.app.AlertDialog
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.semsync.databinding.FragmentTimetableBinding
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.tabs.TabLayout
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.util.Calendar
import java.util.Locale

class TimetableFragment : Fragment() {

    private var _binding: FragmentTimetableBinding? = null
    // This property is only valid between onCreateView and onDestroyView.
    private val binding get() = _binding!!
    private val db = FirebaseFirestore.getInstance()
    private val auth by lazy { FirebaseAuth.getInstance() }
    private lateinit var adapter: TimetableAdapter
    
    // Day names and corresponding indices (Web: Sunday=0, Monday=1, etc.)
    private val daysOfWeek = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTimetableBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupTabs()
        setupFab()
        
        // Select today's tab by default
        // Calendar.SUNDAY is 1, we want 0 for Sunday
        val calendar = Calendar.getInstance()
        val todayIndex = calendar.get(Calendar.DAY_OF_WEEK) - 1
        
        // Selecting the tab will trigger onTabSelected which calls fetchClasses
        binding.tabLayoutDays.getTabAt(todayIndex)?.select()
    }

    private fun setupFab() {
        binding.fabAddClass.setOnClickListener {
            showAddClassDialog()
        }
    }

    private fun showAddClassDialog() {
        // Inflate the custom layout for the dialog
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_add_class, null)
        val etUnitName = dialogView.findViewById<EditText>(R.id.etUnitName)
        val etUnitCode = dialogView.findViewById<EditText>(R.id.etUnitCode)
        val etLocation = dialogView.findViewById<EditText>(R.id.etLocation)
        val spinnerDay = dialogView.findViewById<Spinner>(R.id.spinnerDay)
        val btnStartTime = dialogView.findViewById<Button>(R.id.btnStartTime)
        val btnEndTime = dialogView.findViewById<Button>(R.id.btnEndTime)
        val btnSave = dialogView.findViewById<Button>(R.id.btnSave)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancel)

        // Setup Day Spinner
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, daysOfWeek)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerDay.adapter = adapter
        // Default to current selected tab
        spinnerDay.setSelection(binding.tabLayoutDays.selectedTabPosition)

        var startTimeStr = "09:00"
        var endTimeStr = "10:00"

        btnStartTime.setOnClickListener {
            val calendar = Calendar.getInstance()
            TimePickerDialog(context, { _, hourOfDay, minute ->
                startTimeStr = String.format(Locale.getDefault(), "%02d:%02d", hourOfDay, minute)
                btnStartTime.text = "Start: $startTimeStr"
            }, 9, 0, true).show()
        }

        btnEndTime.setOnClickListener {
            val calendar = Calendar.getInstance()
            TimePickerDialog(context, { _, hourOfDay, minute ->
                endTimeStr = String.format(Locale.getDefault(), "%02d:%02d", hourOfDay, minute)
                btnEndTime.text = "End: $endTimeStr"
            }, 10, 0, true).show()
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        btnCancel.setOnClickListener { dialog.dismiss() }

        btnSave.setOnClickListener {
            val unitName = etUnitName.text.toString()
            val unitCode = etUnitCode.text.toString()
            val location = etLocation.text.toString()
            val selectedDayIndex = spinnerDay.selectedItemPosition // 0-6

            if (unitName.isBlank()) {
                etUnitName.error = "Required"
                return@setOnClickListener
            }

            saveClass(unitName, unitCode, location, selectedDayIndex, startTimeStr, endTimeStr)
            dialog.dismiss()
        }
        
        dialog.show()
    }

    private fun saveClass(name: String, code: String, loc: String, dayIndex: Int, start: String, end: String) {
        val userId = auth.currentUser?.uid ?: return
        
        val newClass = hashMapOf(
            "unitName" to name,
            "unitCode" to code,
            "location" to loc,
            "dayOfWeek" to dayIndex,
            "startTime" to start,
            "endTime" to end
        )

        db.collection("users").document(userId).collection("timetable")
            .add(newClass)
            .addOnSuccessListener {
                Toast.makeText(context, "Class added!", Toast.LENGTH_SHORT).show()
                // Refresh if the current tab matches the added day
                if (binding.tabLayoutDays.selectedTabPosition == dayIndex) {
                    fetchClasses(dayIndex)
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Failed to add class: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun setupTabs() {
        daysOfWeek.forEach { dayName ->
            val tab = binding.tabLayoutDays.newTab().setText(dayName)
            binding.tabLayoutDays.addTab(tab)
        }

        binding.tabLayoutDays.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                tab?.let {
                    fetchClasses(it.position)
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {
                tab?.let { fetchClasses(it.position) }
            }
        })
    }

    private fun setupRecyclerView() {
        adapter = TimetableAdapter(emptyList())
        binding.recyclerTimetable.layoutManager = LinearLayoutManager(context)
        binding.recyclerTimetable.adapter = adapter
    }

    private fun fetchClasses(dayIndex: Int) {
        val userId = auth.currentUser?.uid ?: return
        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val dayName = days[dayIndex]
        
        // Show loading or empty state initially? 
        // For now, let's just clear
        adapter.updateData(emptyList())

        db.collection("groups")
            .whereArrayContains("members", userId)
            .get()
            .addOnSuccessListener { groupDocs ->
                val allEntries = mutableListOf<TimetableEntry>()
                var pendingGroups = groupDocs.size()
                
                if (pendingGroups == 0) {
                     updateTimetableUI(emptyList())
                     return@addOnSuccessListener
                }

                for (groupDoc in groupDocs) {
                    val unitsRef = groupDoc.reference.collection("units")
                    unitsRef.get().addOnSuccessListener { unitDocs ->
                        for (unitDoc in unitDocs) {
                            val unit = unitDoc.toObject(AcademicUnit::class.java)
                            for (schedule in unit.schedule) {
                                if (schedule.day.trim().equals(dayName, ignoreCase = true)) {
                                    allEntries.add(
                                        TimetableEntry(
                                            unitName = unit.name,
                                            unitCode = unit.code,
                                            location = schedule.location,
                                            startTime = schedule.startTime,
                                            endTime = schedule.endTime,
                                            dayOfWeek = dayIndex
                                        )
                                    )
                                }
                            }
                        }
                        pendingGroups--
                        if (pendingGroups == 0) {
                            Log.d("TimetableFragment", "Found ${allEntries.size} classes")
                            updateTimetableUI(allEntries)
                        }
                    }.addOnFailureListener {
                        pendingGroups--
                        if (pendingGroups == 0) updateTimetableUI(allEntries)
                    }
                }
            }
            .addOnFailureListener { e ->
                Log.e("TimetableFragment", "Error fetching timetable", e)
                updateTimetableUI(emptyList())
            }
    }

    private fun updateTimetableUI(classes: List<TimetableEntry>) {
        val sortedClasses = classes.sortedBy { it.startTime }
        
        // Ensure UI updates run on main thread just in case
        activity?.runOnUiThread {
            if (_binding != null) {
                adapter = TimetableAdapter(sortedClasses)
                binding.recyclerTimetable.adapter = adapter
                
                if (sortedClasses.isEmpty()) {
                    binding.tvEmptyState.visibility = View.VISIBLE
                    binding.recyclerTimetable.visibility = View.GONE
                } else {
                    binding.tvEmptyState.visibility = View.GONE
                    binding.recyclerTimetable.visibility = View.VISIBLE
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}