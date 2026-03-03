package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.util.Locale

class PostsAdapter(private val posts: List<GroupPost>) : RecyclerView.Adapter<PostsAdapter.PostViewHolder>() {

    class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val authorName: TextView = itemView.findViewById(R.id.text_author_name)
        val postDate: TextView = itemView.findViewById(R.id.text_post_date)
        val postType: TextView = itemView.findViewById(R.id.text_post_type)
        val content: TextView = itemView.findViewById(R.id.text_post_content)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        val post = posts[position]
        holder.authorName.text = post.authorName
        
        // Handle both timestamp types
        val timestamp = post.timestamp ?: post.createdAt
        val dateText = timestamp?.toDate()?.let {
            java.text.SimpleDateFormat("dd MMM yyyy, HH:mm", java.util.Locale.getDefault()).format(it)
        } ?: "Just now"
        
        holder.postDate.text = dateText 
        
        val type = post.type
        holder.postType.text = if (type.isNotEmpty()) {
             type.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }
        } else {
             "Post"
        }
        
        holder.content.text = post.content
    }

    override fun getItemCount() = posts.size
}
