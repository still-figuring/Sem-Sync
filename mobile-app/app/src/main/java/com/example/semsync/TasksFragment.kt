package com.example.semsync

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import com.google.android.material.floatingactionbutton.FloatingActionButton
import androidx.fragment.app.add
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class TasksFragment : Fragment(R.layout.fragment_tasks) {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private lateinit var recyclerView: RecyclerView

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        recyclerView = view.findViewById(R.id.recyclerViewTasks)
        val fab: androidx.compose.material3.FloatingActionButton = view.findViewById(R.id.fabAddTask)

        val currentUser = auth.currentUser?.uid ?: return

        // 1. Listen for Tasks from Firestore
        db.collection("tasks")
            .whereEqualTo("userId", currentUser)
            .addSnapshotListener { snapshots, e ->
                if (e != null) return@addSnapshotListener

                val taskList = snapshots?.map { doc ->
                    val task = doc.toObject(Task::class.java)
                    task.copy(id = doc.id) // Map Firestore ID to our object
                } ?: emptyList()

                // 2. Set the Adapter
                recyclerView.adapter = TaskAdapter(taskList) { task, isChecked ->
                    // Update 'completed' status in Firestore when checkbox clicked
                    db.collection("tasks").document(task.id).update("completed", isChecked)
                }
            }

        // 3. Add Task FAB (Simple Dialog version)
        fab.setOnClickListener {
            showAddTaskDialog(currentUser)
        }
    }

    private fun showAddTaskDialog(uid: String) {
        // For simplicity, you can use an AlertDialog with an EditText
        // to get the task title and save it to Firestore
        val editText = EditText(requireContext())
        AlertDialog.Builder(requireContext())
            .setTitle("New Task")
            .setView(editText)
            .setPositiveButton("Add") { _, _ ->
                val title = editText.text.toString()
                if (title.isNotEmpty()) {
                    val newTask = hashMapOf(
                        "title" to title,
                        "completed" to false,
                        "userId" to uid,
                        "priority" to "medium",
                        "dueDate" to com.google.firebase.Timestamp.now()
                    )
                    db.collection("tasks").add(newTask)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}