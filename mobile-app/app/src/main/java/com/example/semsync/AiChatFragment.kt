package com.example.semsync

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.semsync.databinding.FragmentAiChatBinding
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AiChatFragment : Fragment() {

    private var _binding: FragmentAiChatBinding? = null
    private val binding get() = _binding!!
    
    // Simple data model for the list
    data class ChatMessage(val text: String, val isUser: Boolean)
    private val messages = mutableListOf<ChatMessage>()
    private lateinit var adapter: ChatAdapter
    
    // Network Client
    private val client = OkHttpClient()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAiChatBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup Recycler
        adapter = ChatAdapter(messages)
        binding.rvChat.layoutManager = LinearLayoutManager(requireContext()).apply {
            stackFromEnd = true // Start from bottom like WhatsApp
        }
        binding.rvChat.adapter = adapter

        // Add Welcome Message
        if (messages.isEmpty()) {
            addMessage("Hello! I'm SemSync AI. How can I help with your studies today?", false)
        }

        binding.btnSend.setOnClickListener {
            val text = binding.etMessage.text.toString().trim()
            if (text.isNotEmpty()) {
                sendMessage(text)
                binding.etMessage.text.clear()
            }
        }
    }

    private fun addMessage(text: String, isUser: Boolean) {
        messages.add(ChatMessage(text, isUser))
        adapter.notifyItemInserted(messages.size - 1)
        binding.rvChat.scrollToPosition(messages.size - 1)
    }

    private fun sendMessage(query: String) {
        addMessage(query, true) // Show user message
        binding.progressBar.visibility = View.VISIBLE // Show loading
        
        // Launch network request in background
        lifecycleScope.launch(Dispatchers.IO) {
            val responseText = try {
                callCloudFunction(query)
            } catch (e: Exception) {
                "Error: ${e.localizedMessage}"
            }
            
            // Switch back to Main Thread to update UI
            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = View.GONE
                addMessage(responseText, false)
            }
        }
    }

    private fun callCloudFunction(query: String): String {
        // IMPORTANT: Use 10.0.2.2 for Android Emulator to reach localhost
        // If testing on REAL PHONE, use your computer's IP (e.g. 192.168.1.5)
        // OR the deployed URL: https://us-central1-semsync-bf92d.cloudfunctions.net/chat
        // TODO: CHANGE THIS TO YOUR PRODUCTION URL FOR DEMO IF NOT USING EMULATOR
        val url = "http://10.0.2.2:5001/semsync-bf92d/us-central1/chat"
        
        val json = JSONObject()
        json.put("message", query)
        
        val body = json.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url(url).post(body).build()
        
        val response = client.newCall(request).execute()
        return if (response.isSuccessful) {
            val resBody = response.body?.string() ?: "{}"
            JSONObject(resBody).optString("response", "No response text")
        } else {
            "Server Error: ${response.code}"
        }
    }

    // --- Inner Adapter Class for Simplicity ---
    inner class ChatAdapter(private val list: List<ChatMessage>) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
        
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
            val textView = TextView(parent.context).apply {
                textSize = 16f
                setPadding(32, 24, 32, 24)
                layoutParams = ViewGroup.MarginLayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 8, 0, 8)
                }
            }
            return object : RecyclerView.ViewHolder(textView) {}
        }

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            val msg = list[position]
            val tv = holder.itemView as TextView
            tv.text = msg.text
            
            // Basic styling for User vs Bot
            if (msg.isUser) {
                tv.setBackgroundResource(android.R.drawable.dialog_holo_light_frame) // Simple placeholder
                tv.setTextAppearance(androidx.appcompat.R.style.TextAppearance_AppCompat_Body1)
                tv.setTextColor(0xFF000000.toInt())
                tv.setBackgroundColor(0xFFE0E0E0.toInt()) // Light Gray
                (tv.layoutParams as ViewGroup.MarginLayoutParams).leftMargin = 100
                (tv.layoutParams as ViewGroup.MarginLayoutParams).rightMargin = 0
            } else {
                tv.setTextAppearance(androidx.appcompat.R.style.TextAppearance_AppCompat_Body1)
                tv.setTextColor(0xFF000000.toInt())
                tv.setBackgroundColor(0xFFF0F8FF.toInt()) // Alice Blue
                (tv.layoutParams as ViewGroup.MarginLayoutParams).rightMargin = 100
                (tv.layoutParams as ViewGroup.MarginLayoutParams).leftMargin = 0
            }
        }

        override fun getItemCount() = list.size
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}