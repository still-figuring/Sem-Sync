package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class UnitsAdapter(
    private val units: List<AcademicUnit>,
    private val isRep: Boolean,
    private val onDeleteClick: (AcademicUnit) -> Unit
) : RecyclerView.Adapter<UnitsAdapter.UnitViewHolder>() {

    class UnitViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val unitName: TextView = itemView.findViewById(R.id.text_unit_name)
        val unitCode: TextView = itemView.findViewById(R.id.text_unit_code)
        val lecturer: TextView = itemView.findViewById(R.id.text_lecturer)
        val time: TextView = itemView.findViewById(R.id.text_time)
        val location: TextView = itemView.findViewById(R.id.text_location)
        val deleteBtn: ImageView = itemView.findViewById(R.id.btn_delete_unit)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UnitViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_unit, parent, false)
        return UnitViewHolder(view)
    }

    override fun onBindViewHolder(holder: UnitViewHolder, position: Int) {
        val unit = units[position]
        holder.unitName.text = unit.name
        holder.unitCode.text = unit.code
        holder.lecturer.text = unit.lecturerName
        
        if (isRep) {
            holder.deleteBtn.visibility = View.VISIBLE
            holder.deleteBtn.setOnClickListener { onDeleteClick(unit) }
        } else {
            holder.deleteBtn.visibility = View.GONE
        }

        // Format schedule (assuming first schedule item for now)
        if (unit.schedule.isNotEmpty()) {
            val sched = unit.schedule[0]
            if (sched.startTime.isNotBlank()) {
                val baseTimeText = "${sched.day} • ${sched.startTime} - ${sched.endTime}"
                val extraCount = unit.schedule.size - 1
                val timeText = if (extraCount > 0) {
                    "$baseTimeText (+$extraCount more)"
                } else {
                    baseTimeText
                }
                holder.time.text = timeText
                holder.location.text = sched.location
            } else {
                holder.time.text = "No Schedule"
                holder.location.text = "TBA"
            }
        } else {
            holder.time.text = "No Schedule"
            holder.location.text = "TBA"
        }
    }

    override fun getItemCount() = units.size
}
