package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import androidx.core.graphics.toColorInt
import android.graphics.Color

class TaskAdapter(
    private var tasks: List<Task>,
    private val onCheckedChange: (Task, Boolean) -> Unit,
    private val onDelete: (Task) -> Unit,
    private val onEdit: (Task) -> Unit,
    private val onSelectionChanged: (Int) -> Unit = {}
) : RecyclerView.Adapter<TaskAdapter.TaskViewHolder>() {

    private val selectedTasks = mutableSetOf<String>()
    
    fun getSelectedTasks(): List<Task> = tasks.filter { it.id in selectedTasks }
    
    fun isSelectionMode(): Boolean = selectedTasks.isNotEmpty()
    
    fun clearSelection() {
        selectedTasks.clear()
        notifyDataSetChanged()
        onSelectionChanged(0)
    }
    
    fun selectAll() {
        selectedTasks.addAll(tasks.map { it.id })
        notifyDataSetChanged()
        onSelectionChanged(selectedTasks.size)
    }
    
    fun removeFromSelection(taskId: String) {
        selectedTasks.remove(taskId)
        notifyDataSetChanged()
        onSelectionChanged(selectedTasks.size)
    }

    class TaskViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val checkbox: CheckBox = view.findViewById(R.id.checkboxTask)
        val title: TextView = view.findViewById(R.id.textTaskTitle)
        val description: TextView = view.findViewById(R.id.textTaskDescription)
        val chipPriority: Chip = view.findViewById(R.id.chipPriority)
        val textDueDate: TextView = view.findViewById(R.id.textDueDate)
        val chipCourseCode: Chip = view.findViewById(R.id.chipCourseCode)
        val chipType: Chip = view.findViewById(R.id.chipType)
        val btnDelete: ImageView = view.findViewById(R.id.btnDeleteTask)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TaskViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_task, parent, false)
        return TaskViewHolder(view)
    }

    override fun onBindViewHolder(holder: TaskViewHolder, position: Int) {
        val task = tasks[position]
        
        val isSelected = task.id in selectedTasks
        
        // Update background color based on selection
        if (isSelected) {
            holder.itemView.setBackgroundColor(Color.parseColor("#2d2d2d"))
        } else {
            holder.itemView.setBackgroundColor(Color.parseColor("#1a1a1a"))
        }
        
        // Click listener for editing task (only when not in selection mode)
        holder.itemView.setOnClickListener {
            if (!isSelectionMode()) {
                onEdit(task)
            } else {
                toggleSelection(task, holder, position)
            }
        }
        
        // Long-press for selection
        holder.itemView.setOnLongClickListener {
            toggleSelection(task, holder, position)
            true
        }
        
        holder.title.text = task.title

        // Description
        if (task.description.isNotEmpty()) {
            holder.description.text = task.description
            holder.description.visibility = View.VISIBLE
        } else {
            holder.description.visibility = View.GONE
        }

        // Priority
        holder.chipPriority.text = task.priority.replaceFirstChar { it.uppercase() }
        holder.chipPriority.chipBackgroundColor = android.content.res.ColorStateList.valueOf(
            when (task.priority.lowercase()) {
                "high" -> android.graphics.Color.parseColor("#ef4444")
                "medium" -> android.graphics.Color.parseColor("#f59e0b")
                else -> android.graphics.Color.parseColor("#10b981")
            }
        )

        // Due Date
        if (task.dueDate != null) {
            val sdf = SimpleDateFormat("MMM dd", Locale.getDefault())
            val dateStr = sdf.format(task.dueDate!!.toDate())
            holder.textDueDate.text = dateStr
            
            // Check if task is overdue
            val calendar = Calendar.getInstance()
            calendar.time = task.dueDate!!.toDate()
            val dueCalendar = calendar.timeInMillis
            val todayCalendar = Calendar.getInstance()
            todayCalendar.set(Calendar.HOUR_OF_DAY, 0)
            todayCalendar.set(Calendar.MINUTE, 0)
            todayCalendar.set(Calendar.SECOND, 0)
            
            val isOverdue = dueCalendar < todayCalendar.timeInMillis && !task.completed
            
            if (isOverdue) {
                holder.textDueDate.setTextColor("#ef4444".toColorInt())
                holder.textDueDate.text = "OVERDUE"
            } else {
                holder.textDueDate.setTextColor(android.graphics.Color.parseColor("#666666"))
            }
        }

        // Course Code
        if (task.courseCode.isNotEmpty()) {
            holder.chipCourseCode.text = task.courseCode
            holder.chipCourseCode.visibility = View.VISIBLE
        } else {
            holder.chipCourseCode.visibility = View.GONE
        }

        // Task Type
        if (task.taskType.isNotEmpty()) {
            holder.chipType.text = task.taskType.replaceFirstChar { it.uppercase() }
            holder.chipType.visibility = View.VISIBLE
        } else {
            holder.chipType.visibility = View.GONE
        }

        // Checkbox
        holder.checkbox.setOnCheckedChangeListener(null)
        holder.checkbox.isChecked = task.completed
        holder.checkbox.setOnCheckedChangeListener { _, isChecked ->
            onCheckedChange(task, isChecked)
        }

        // Delete button
        holder.btnDelete.setOnClickListener {
            onDelete(task)
        }
    }
    
    private fun toggleSelection(task: Task, holder: TaskViewHolder, position: Int) {
        if (task.id in selectedTasks) {
            selectedTasks.remove(task.id)
        } else {
            selectedTasks.add(task.id)
        }
        notifyItemChanged(position)
        onSelectionChanged(selectedTasks.size)
    }

    override fun getItemCount() = tasks.size

    fun updateTasks(newTasks: List<Task>) {
        this.tasks = newTasks
        selectedTasks.clear()
        notifyDataSetChanged()
    }
}