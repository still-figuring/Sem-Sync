package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class AnnouncementsAdapter(private val items: List<EnrichedPost>) : RecyclerView.Adapter<AnnouncementsAdapter.ViewHolder>() {
    
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val groupName: TextView = view.findViewById(R.id.text_group_name)
        val authorName: TextView = view.findViewById(R.id.text_author_name)
        val postTime: TextView = view.findViewById(R.id.text_post_time)
        val content: TextView = view.findViewById(R.id.text_post_content)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_announcement_preview, parent, false)
        return ViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.groupName.text = item.groupName
        holder.authorName.text = item.post.authorName
        holder.content.text = item.post.content
        
        // Time formatting - Correctly prioritize timestamp field
        val timestamp = item.post.timestamp ?: item.post.createdAt
        val createdTime = timestamp?.toDate()?.time ?: System.currentTimeMillis() // Default to now if missing to avoid 20507d ago
        
        val timeDiff = System.currentTimeMillis() - createdTime
        val seconds = timeDiff / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24
        
        holder.postTime.text = when {
            days > 365 -> "Old" // Catch extreme dates
            days > 0 -> "${days}d ago"
            hours > 0 -> "${hours}h ago"
            minutes > 0 -> "${minutes}m ago"
            else -> "Just now"
        }
    }
    
    override fun getItemCount() = items.size
}
