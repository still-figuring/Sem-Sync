package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView

import androidx.recyclerview.widget.RecyclerView

class TaskAdapter(
    private val tasks: List<Task>,
    private val onCheckedChange: (Task, Boolean) -> Unit
) : RecyclerView.Adapter<TaskAdapter.TaskViewHolder>() {

    class TaskViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.textTaskTitle)
        val checkbox: CheckBox = view.findViewById(R.id.checkboxTask)
        val priority: TextView = view.findViewById(R.id.textPriority)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TaskViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_task, parent, false)
        return TaskViewHolder(view)
    }

    override fun onBindViewHolder(holder: TaskViewHolder, position: Int) {
        val task = tasks[position]
        holder.title.text = task.title
        holder.priority.text = task.priority

        // Temporarily null out listener to prevent trigger during binding
        holder.checkbox.setOnCheckedChangeListener(null)
        holder.checkbox.isChecked = task.completed

        holder.checkbox.setOnCheckedChangeListener { _, isChecked ->
            onCheckedChange(task, isChecked)
        }
    }

    override fun getItemCount() = tasks.size
}