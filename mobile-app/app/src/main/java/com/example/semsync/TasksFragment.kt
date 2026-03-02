package com.example.semsync

import android.app.DatePickerDialog
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.ArrayAdapter
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TasksFragment : Fragment(R.layout.fragment_tasks) {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: TaskAdapter
    private var allTasks: List<Task> = emptyList()
    private var currentFilter = "all" // all, todo, completed

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView = view.findViewById(R.id.recyclerViewTasks)
        val btnAddPersonalTask = view.findViewById<MaterialButton>(R.id.btnAddPersonalTask)
        val tabAll = view.findViewById<MaterialButton>(R.id.tabAll)
        val tabTodo = view.findViewById<MaterialButton>(R.id.tabTodo)
        val tabCompleted = view.findViewById<MaterialButton>(R.id.tabCompleted)
        val emptyState = view.findViewById<LinearLayout>(R.id.emptyState)

        val currentUser = auth.currentUser?.uid ?: return

        // Initialize adapter
        adapter = TaskAdapter(
            emptyList(),
            onCheckedChange = { task, isChecked ->
                db.collection("tasks").document(task.id).update("completed", isChecked)
            },
            onDelete = { task ->
                db.collection("tasks").document(task.id).delete()
            }
        )
        recyclerView.adapter = adapter

        // Listen for tasks from Firestore
        db.collection("tasks")
            .whereEqualTo("userId", currentUser)
            .addSnapshotListener { snapshots, e ->
                if (e != null) return@addSnapshotListener

                allTasks = snapshots?.mapNotNull { doc ->
                    try {
                        val task = doc.toObject(Task::class.java)
                        task.copy(id = doc.id)
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()

                applyFilter(currentFilter)
                updateEmptyState(emptyState)
            }

        // Add task button
        btnAddPersonalTask.setOnClickListener {
            showAddTaskDialog(currentUser)
        }

        // Filter buttons
        tabAll.setOnClickListener {
            currentFilter = "all"
            applyFilter("all")
            updateFilterButtons(tabAll, tabTodo, tabCompleted)
        }

        tabTodo.setOnClickListener {
            currentFilter = "todo"
            applyFilter("todo")
            updateFilterButtons(tabTodo, tabAll, tabCompleted)
        }

        tabCompleted.setOnClickListener {
            currentFilter = "completed"
            applyFilter("completed")
            updateFilterButtons(tabCompleted, tabAll, tabTodo)
        }

        // Set default filter button state
        updateFilterButtons(tabAll, tabTodo, tabCompleted)
    }

    private fun applyFilter(filter: String) {
        val filtered = when (filter) {
            "todo" -> allTasks.filter { !it.completed }
            "completed" -> allTasks.filter { it.completed }
            else -> allTasks
        }
        adapter.updateTasks(filtered)
        recyclerView.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
    }

    private fun updateEmptyState(emptyState: LinearLayout) {
        if (allTasks.isEmpty()) {
            recyclerView.visibility = View.GONE
            emptyState.visibility = View.VISIBLE
        } else {
            emptyState.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

    private fun updateFilterButtons(active: MaterialButton, vararg inactive: MaterialButton) {
        active.setBackgroundColor(android.graphics.Color.parseColor("#7c3aed"))
        active.setTextColor(android.graphics.Color.WHITE)
        inactive.forEach { btn ->
            btn.setBackgroundColor(android.graphics.Color.TRANSPARENT)
            btn.setTextColor(android.graphics.Color.parseColor("#a0a0a0"))
        }
    }

    private fun showAddTaskDialog(uid: String) {
        val dialogView = LayoutInflater.from(requireContext())
            .inflate(R.layout.dialog_add_task, null)

        val inputTaskTitle = dialogView.findViewById<EditText>(R.id.inputTaskTitle)
        val inputCourseCode = dialogView.findViewById<EditText>(R.id.inputCourseCode)
        val spinnerPriority = dialogView.findViewById<Spinner>(R.id.spinnerPriority)
        val inputDueDate = dialogView.findViewById<EditText>(R.id.inputDueDate)
        val btnDatePicker = dialogView.findViewById<android.widget.ImageButton>(R.id.btnDatePicker)
        val inputDescription = dialogView.findViewById<EditText>(R.id.inputDescription)

        // Setup Priority Spinner
        val priorityAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            listOf("Low", "Medium", "High")
        ).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }
        spinnerPriority.adapter = priorityAdapter
        spinnerPriority.setSelection(1) // Default to Medium

        var selectedDate: Long? = null

        // Function to show date picker
        fun showDatePickerDialog() {
            val calendar = Calendar.getInstance()
            val datePickerDialog = DatePickerDialog(
                requireContext(),
                { _, year, month, dayOfMonth ->
                    val selectedCalendar = Calendar.getInstance()
                    selectedCalendar.set(year, month, dayOfMonth)
                    selectedDate = selectedCalendar.timeInMillis
                    val sdf = SimpleDateFormat("MM/dd/yyyy", Locale.getDefault())
                    inputDueDate.setText(sdf.format(selectedCalendar.time))
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            )
            datePickerDialog.show()
        }

        // Date Picker - open from button click
        btnDatePicker.setOnClickListener {
            showDatePickerDialog()
        }

        // Date Picker - open from edit field click
        inputDueDate.setOnClickListener {
            showDatePickerDialog()
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Setup buttons
        val btnCancel = dialogView.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCancel)
        val btnCreateTask = dialogView.findViewById<com.google.android.material.button.MaterialButton>(R.id.btnCreateTask)
        val btnCloseDialog = dialogView.findViewById<android.widget.ImageButton>(R.id.btnCloseDialog)

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        btnCloseDialog.setOnClickListener {
            dialog.dismiss()
        }

        btnCreateTask.setOnClickListener {
            val title = inputTaskTitle.text.toString()
            if (title.isNotEmpty()) {
                val newTask = hashMapOf(
                    "title" to title,
                    "description" to inputDescription.text.toString(),
                    "courseCode" to inputCourseCode.text.toString(),
                    "completed" to false,
                    "userId" to uid,
                    "priority" to spinnerPriority.selectedItem.toString().lowercase(),
                    "dueDate" to if (selectedDate != null) {
                        com.google.firebase.Timestamp(java.util.Date(selectedDate!!))
                    } else {
                        null
                    },
                    "taskType" to if (inputCourseCode.text.toString().isNotEmpty()) "academic" else "personal"
                )
                db.collection("tasks").add(newTask)
                dialog.dismiss()
            }
        }

        dialog.show()
    }
}