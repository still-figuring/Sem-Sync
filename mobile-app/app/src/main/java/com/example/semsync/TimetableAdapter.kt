package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class TimetableAdapter(
    private var classes: List<TimetableEntry>
) : RecyclerView.Adapter<TimetableAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvClassTime: TextView = view.findViewById(R.id.tvClassTime)
        val tvUnitName: TextView = view.findViewById(R.id.tvUnitName)
        val tvUnitCode: TextView = view.findViewById(R.id.tvUnitCode)
        val tvLocation: TextView = view.findViewById(R.id.tvLocation)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_timetable_class, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val entry = classes[position]
        holder.tvUnitName.text = entry.unitName
        holder.tvUnitCode.text = entry.unitCode
        holder.tvLocation.text = entry.location
        
        // Format time. Assuming "HH:mm" from Strings
        holder.tvClassTime.text = "${entry.startTime}\n${entry.endTime}"
    }

    override fun getItemCount() = classes.size

    fun updateData(newClasses: List<TimetableEntry>) {
        classes = newClasses
        notifyDataSetChanged()
    }
}