package com.example.semsync

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView

/**
 * ChatAdapter — drives the RecyclerView message list.
 *
 * Uses ListAdapter + DiffUtil for efficient, animated list updates.
 * Three view types:
 *   0 = USER message  (right-aligned bubble)
 *   1 = BOT  message  (left-aligned bubble, DELIVERED)
 *   2 = BOT  LOADING  (animated typing indicator)
 *   3 = BOT  ERROR    (tappable retry state)
 *
 * Decoupling: The adapter has zero knowledge of the ViewModel or repository.
 * It receives data via submitList() and fires callbacks via lambdas.
 */
class ChatAdapter(
    private val onRetry: (messageId: String) -> Unit
) : ListAdapter<ChatMessage, RecyclerView.ViewHolder>(DIFF_CALLBACK) {

    companion object {
        private const val TYPE_USER     = 0
        private const val TYPE_BOT      = 1
        private const val TYPE_LOADING  = 2
        private const val TYPE_ERROR    = 3

        private val DIFF_CALLBACK = object : DiffUtil.ItemCallback<ChatMessage>() {
            override fun areItemsTheSame(old: ChatMessage, new: ChatMessage) = old.id == new.id
            override fun areContentsTheSame(old: ChatMessage, new: ChatMessage) = old == new
        }
    }

    override fun getItemViewType(position: Int): Int {
        val msg = getItem(position)
        return when {
            msg.sender == Sender.USER                      -> TYPE_USER
            msg.state  == MessageState.LOADING             -> TYPE_LOADING
            msg.state  == MessageState.ERROR               -> TYPE_ERROR
            else                                           -> TYPE_BOT
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_USER    -> UserViewHolder(inflater.inflate(R.layout.item_message_user, parent, false))
            TYPE_LOADING -> LoadingViewHolder(inflater.inflate(R.layout.item_message_bot_loading, parent, false))
            TYPE_ERROR   -> ErrorViewHolder(inflater.inflate(R.layout.item_message_bot_error, parent, false))
            else         -> BotViewHolder(inflater.inflate(R.layout.item_message_bot, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = getItem(position)
        when (holder) {
            is UserViewHolder    -> holder.bind(msg)
            is BotViewHolder     -> holder.bind(msg)
            is ErrorViewHolder   -> holder.bind(msg, onRetry)
            is LoadingViewHolder -> { /* no data to bind — the animation is purely in XML */ }
        }
    }

    // ─── ViewHolders ─────────────────────────────────────────────────────────

    class UserViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvText: TextView = view.findViewById(R.id.tvMessageText)
        fun bind(msg: ChatMessage) { tvText.text = msg.text }
    }

    class BotViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvText: TextView = view.findViewById(R.id.tvMessageText)
        fun bind(msg: ChatMessage) { tvText.text = msg.text }
    }

    class LoadingViewHolder(view: View) : RecyclerView.ViewHolder(view)

    class ErrorViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvText: TextView = view.findViewById(R.id.tvMessageText)
        fun bind(msg: ChatMessage, onRetry: (String) -> Unit) {
            tvText.text = msg.text
            itemView.setOnClickListener { onRetry(msg.id) }
        }
    }
}
