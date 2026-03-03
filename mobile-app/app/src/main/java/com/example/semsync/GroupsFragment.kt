package com.example.semsync

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.navigation.fragment.findNavController
import com.example.semsync.databinding.FragmentGroupsBinding
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import com.google.firebase.messaging.FirebaseMessaging

class GroupsFragment : Fragment() {

    private var _binding: FragmentGroupsBinding? = null
    private val binding get() = _binding!!
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    private val groups = mutableListOf<AcademicGroup>()
    private lateinit var adapter: GroupsAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentGroupsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize RecyclerView
        val recyclerView = view.findViewById<RecyclerView>(R.id.recycler_view_groups)
        recyclerView.layoutManager = LinearLayoutManager(context)
        adapter = GroupsAdapter(groups) { group ->
            val bundle = Bundle()
            bundle.putString("groupId", group.id)
            bundle.putString("groupName", group.name)
            findNavController().navigate(R.id.navigation_group_detail, bundle)
        }
        recyclerView.adapter = adapter

        // Join Groups FAB
        view.findViewById<ExtendedFloatingActionButton>(R.id.fab_join_group).setOnClickListener {
            showJoinGroupDialog()
        }

        fetchUserGroups()
    }

    private fun fetchUserGroups() {
        val userId = auth.currentUser?.uid ?: return
        
        db.collection("groups")
            .whereArrayContains("members", userId)
            .addSnapshotListener { value, error ->
                if (error != null) {
                    Log.e("GroupsFragment", "Listen failed.", error)
                    return@addSnapshotListener
                }

                groups.clear()
                for (doc in value!!) {
                    val group = doc.toObject(AcademicGroup::class.java).copy(id = doc.id)
                    groups.add(group)
                }
                adapter.notifyDataSetChanged()
            }
    }

    private fun showJoinGroupDialog() {
        val input = EditText(context)
        input.hint = "Enter Group Join Code"
        
        AlertDialog.Builder(requireContext())
            .setTitle("Join Group")
            .setView(input)
            .setPositiveButton("Join") { _, _ ->
                val code = input.text.toString().trim()
                if (code.isNotEmpty()) {
                    joinGroup(code)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun joinGroup(joinCode: String) {
        val userId = auth.currentUser?.uid ?: return

        db.collection("groups")
            .whereEqualTo("joinCode", joinCode)
            .get()
            .addOnSuccessListener { documents ->
                if (documents.isEmpty()) {
                    Toast.makeText(context, "Invalid join code", Toast.LENGTH_SHORT).show()
                } else {
                    val groupDoc = documents.documents[0]
                    // Update group to add user to members
                    groupDoc.reference.update("members", FieldValue.arrayUnion(userId))
                        .addOnSuccessListener {
                            // Subscribe to group notifications
                            FirebaseMessaging.getInstance().subscribeToTopic("group_${groupDoc.id}")
                                .addOnCompleteListener { task ->
                                    val msg = if (task.isSuccessful) "Subscribed to notifications" else "Subscribe failed"
                                    Log.d("GroupsFragment", msg)
                                }
                            
                            Toast.makeText(context, "Joined ${groupDoc.getString("name")}!", Toast.LENGTH_SHORT).show()
                        }
                        .addOnFailureListener {
                            Toast.makeText(context, "Failed to join group", Toast.LENGTH_SHORT).show()
                        }
                }
            }
            .addOnFailureListener {
                Toast.makeText(context, "Error finding group", Toast.LENGTH_SHORT).show()
            }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}