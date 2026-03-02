package com.example.semsync

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth

class GroupsAdapter(
    private val groups: List<AcademicGroup>,
    private val onClick: (AcademicGroup) -> Unit
) : RecyclerView.Adapter<GroupsAdapter.GroupViewHolder>() {

    private val currentUserId = FirebaseAuth.getInstance().currentUser?.uid

    class GroupViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val groupName: TextView = view.findViewById(R.id.text_group_name)
        val groupCode: TextView = view.findViewById(R.id.text_group_code)
        val memberCount: TextView = view.findViewById(R.id.text_member_count)
        val lecturerName: TextView = view.findViewById(R.id.text_lecturer)
        val joinCode: TextView = view.findViewById(R.id.text_join_code)
        val repBadge: TextView = view.findViewById(R.id.badge_rep)
        val copyIcon: ImageView = view.findViewById(R.id.icon_copy)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GroupViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_group, parent, false)
        return GroupViewHolder(view)
    }

    override fun onBindViewHolder(holder: GroupViewHolder, position: Int) {
        val group = groups[position]
        holder.groupName.text = group.name
        holder.groupCode.text = group.code
        holder.memberCount.text = "${group.memberCount} Members"
        holder.lecturerName.text = group.lecturerName.ifEmpty { "Not specified" }
        holder.joinCode.text = group.joinCode

        // Show Rep Badge if current user is the Rep
        if (group.repId == currentUserId) {
            holder.repBadge.visibility = View.VISIBLE
        } else {
            holder.repBadge.visibility = View.GONE
        }

        // Handle card click
        holder.itemView.setOnClickListener {
            onClick(group)
        }

        // Handle Copy Join Code
        holder.copyIcon.setOnClickListener {
            val clipboard = holder.itemView.context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Join Code", group.joinCode)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(holder.itemView.context, "Code copied!", Toast.LENGTH_SHORT).show()
        }
    }

    override fun getItemCount() = groups.size
}
