package com.example.semsync

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.semsync.databinding.FragmentNotebookBinding
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.Locale

data class UserNote(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val lastModified: Long = 0,
    val createdAt: Any? = null
)

class NotebookFragment : Fragment() {

    private var _binding: FragmentNotebookBinding? = null
    private val binding get() = _binding!!
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val notes = mutableListOf<UserNote>()
    private lateinit var adapter: NotesAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNotebookBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val recyclerView = view.findViewById<RecyclerView>(R.id.recycler_view_notes)
        recyclerView.layoutManager = LinearLayoutManager(context)
        adapter = NotesAdapter(notes)
        recyclerView.adapter = adapter

        fetchNotes()
    }

    private fun fetchNotes() {
        val userId = auth.currentUser?.uid ?: return

        db.collection("users").document(userId).collection("notes")
            .orderBy("lastModified", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { value, error ->
                if (error != null) {
                    Log.e("NotebookFragment", "Listen failed.", error)
                    return@addSnapshotListener
                }

                notes.clear()
                for (doc in value!!) {
                    val note = doc.toObject(UserNote::class.java).copy(id = doc.id)
                    notes.add(note)
                }
                adapter.notifyDataSetChanged()
            }
    }

    inner class NotesAdapter(private val notes: List<UserNote>) :
        RecyclerView.Adapter<NotesAdapter.NoteViewHolder>() {

        inner class NoteViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val title: TextView = itemView.findViewById(R.id.text_note_title)
            val snippet: TextView = itemView.findViewById(R.id.text_note_snippet)
            val date: TextView = itemView.findViewById(R.id.text_note_date)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NoteViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_note, parent, false)
            return NoteViewHolder(view)
        }

        override fun onBindViewHolder(holder: NoteViewHolder, position: Int) {
            val note = notes[position]
            holder.title.text = note.title
            holder.snippet.text = note.content
            
            val date = java.util.Date(note.lastModified)
            val format = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            holder.date.text = format.format(date)
        }

        override fun getItemCount() = notes.size
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}