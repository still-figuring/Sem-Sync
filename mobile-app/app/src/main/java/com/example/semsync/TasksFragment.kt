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
        val dialogView = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 16)
        }

        // Task Title
        val titleLabel = android.widget.TextView(requireContext()).apply {
            text = "Task Title"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
        }
        dialogView.addView(titleLabel)

        val titleInput = EditText(requireContext()).apply {
            hint = "e.g. Complete Calculus Assignment"
            setHintTextColor(android.graphics.Color.parseColor("#666666"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(12, 8, 12, 8)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }
        dialogView.addView(titleInput)

        // Course Code
        val courseLabel = android.widget.TextView(requireContext()).apply {
            text = "Course Code (Optional)"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
        }
        dialogView.addView(courseLabel)

        val courseInput = EditText(requireContext()).apply {
            hint = "e.g. CS101"
            setHintTextColor(android.graphics.Color.parseColor("#666666"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(12, 8, 12, 8)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }
        dialogView.addView(courseInput)

        // Priority
        val priorityLabel = android.widget.TextView(requireContext()).apply {
            text = "Priority"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
        }
        dialogView.addView(priorityLabel)

        val prioritySpinner = Spinner(requireContext()).apply {
            adapter = ArrayAdapter(
                requireContext(),
                android.R.layout.simple_spinner_item,
                listOf("Low", "Medium", "High")
            ).apply {
                setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
            setSelection(1) // Default to Medium
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }
        dialogView.addView(prioritySpinner)

        // Due Date
        val dateLabel = android.widget.TextView(requireContext()).apply {
            text = "Due Date"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
        }
        dialogView.addView(dateLabel)

        var selectedDate: Long? = null
        val dateInput = EditText(requireContext()).apply {
            hint = "mm/dd/yyyy"
            setHintTextColor(android.graphics.Color.parseColor("#666666"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(12, 8, 12, 8)
            isFocusable = false
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
            setOnClickListener {
                val calendar = Calendar.getInstance()
                val datePickerDialog = DatePickerDialog(
                    requireContext(),
                    { _, year, month, dayOfMonth ->
                        val calendar = Calendar.getInstance()
                        calendar.set(year, month, dayOfMonth)
                        selectedDate = calendar.timeInMillis
                        val sdf = SimpleDateFormat("MM/dd/yyyy", Locale.getDefault())
                        dateInput.setText(sdf.format(calendar.time))
                    },
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH)
                )
                datePickerDialog.show()
            }
        }
        dialogView.addView(dateInput)

        // Description
        val descLabel = android.widget.TextView(requireContext()).apply {
            text = "Description"
            textSize = 14f
            setTextColor(android.graphics.Color.WHITE)
        }
        dialogView.addView(descLabel)

        val descInput = EditText(requireContext()).apply {
            hint = "Add details about this task..."
            setHintTextColor(android.graphics.Color.parseColor("#666666"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(12, 8, 12, 8)
            minLines = 3
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        dialogView.addView(descInput)

        AlertDialog.Builder(requireContext())
            .setTitle("Add New Task")
            .setView(dialogView)
            .setPositiveButton("Create Task") { _, _ ->
                val title = titleInput.text.toString()
                if (title.isNotEmpty()) {
                    val newTask = hashMapOf(
                        "title" to title,
                        "description" to descInput.text.toString(),
                        "courseCode" to courseInput.text.toString(),
                        "completed" to false,
                        "userId" to uid,
                        "priority" to prioritySpinner.selectedItem.toString().lowercase(),
                        "dueDate" to if (selectedDate != null) {
                            com.google.firebase.Timestamp(java.util.Date(selectedDate!!))
                        } else {
                            null
                        },
                        "taskType" to if (courseInput.text.toString().isNotEmpty()) "academic" else "personal"
                    )
                    db.collection("tasks").add(newTask)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}