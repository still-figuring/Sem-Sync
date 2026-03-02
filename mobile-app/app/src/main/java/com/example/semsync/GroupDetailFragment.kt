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
import androidx.appcompat.app.AlertDialog
import android.widget.EditText
import android.widget.Toast
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.ArrayAdapter
import android.app.TimePickerDialog
import com.google.android.material.tabs.TabLayout
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import java.util.Locale
import java.util.Date

class GroupDetailFragment : Fragment() {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()
    
    // Data
    private var groupId: String? = null
    private var groupName: String? = null
    private var posts = mutableListOf<GroupPost>()
    private var units = mutableListOf<AcademicUnit>()
    
    // Adapters
    private lateinit var postsAdapter: PostsAdapter
    private lateinit var unitsAdapter: UnitsAdapter

    // UI
    private lateinit var tabLayout: TabLayout
    private lateinit var layoutDiscussions: View
    private lateinit var layoutUnits: View
    private lateinit var layoutResources: View
    private lateinit var fabAddUnit: View
    private lateinit var etPostContent: EditText

    private val daysOfWeek = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

    private var isRep = false

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_group_detail, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        arguments?.let {
            groupId = it.getString("groupId")
            groupName = it.getString("groupName")
        }

        initializeViews(view)
        setupTabs()
        setupRecyclerViews()
        
        if (groupId != null) {
            setupGroupInfo()
            checkIfRep()
            fetchPosts()
            fetchUnits()
        }

        // Back button
        view.findViewById<View>(R.id.btn_back_container).setOnClickListener {
            parentFragmentManager.popBackStack()
        }
    }

    private fun initializeViews(view: View) {
        tabLayout = view.findViewById(R.id.tab_layout)
        layoutDiscussions = view.findViewById(R.id.layout_discussions)
        layoutUnits = view.findViewById(R.id.layout_units)
        layoutResources = view.findViewById(R.id.layout_resources)
        fabAddUnit = view.findViewById(R.id.fab_add_unit)
        etPostContent = view.findViewById(R.id.et_post_content)

        // Setup Post Button
        view.findViewById<Button>(R.id.btn_post).setOnClickListener {
            handlePost()
        }

        // Setup Add Unit FAB
        fabAddUnit.setOnClickListener {
            showAddUnitDialog()
        }

        // Add tabs
        tabLayout.addTab(tabLayout.newTab().setText("Updates"))
        tabLayout.addTab(tabLayout.newTab().setText("Schedule"))
        tabLayout.addTab(tabLayout.newTab().setText("Resources"))
    }

    private fun setupTabs() {
        tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> {
                        layoutDiscussions.visibility = View.VISIBLE
                        layoutUnits.visibility = View.GONE
                        layoutResources.visibility = View.GONE
                    }
                    1 -> {
                        layoutDiscussions.visibility = View.GONE
                        layoutUnits.visibility = View.VISIBLE
                        layoutResources.visibility = View.GONE
                    }
                    2 -> {
                        layoutDiscussions.visibility = View.GONE
                        layoutUnits.visibility = View.GONE
                        layoutResources.visibility = View.VISIBLE
                    }
                }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }

    private fun setupRecyclerViews() {
        // Posts
        val recyclerPosts = view?.findViewById<RecyclerView>(R.id.recycler_posts)
        recyclerPosts?.layoutManager = LinearLayoutManager(context)
        postsAdapter = PostsAdapter(posts)
        recyclerPosts?.adapter = postsAdapter

        // Units
        val recyclerUnits = view?.findViewById<RecyclerView>(R.id.recycler_units)
        recyclerUnits?.layoutManager = LinearLayoutManager(context)
        unitsAdapter = UnitsAdapter(units, isRep) { unit ->
            deleteUnit(unit)
        }
        recyclerUnits?.adapter = unitsAdapter
    }

    private fun deleteUnit(unit: AcademicUnit) {
        if (groupId == null || unit.id.isEmpty()) return
        
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Unit")
            .setMessage("Are you sure you want to delete ${unit.name}?")
            .setPositiveButton("Delete") { _, _ ->
                db.collection("groups").document(groupId!!)
                    .collection("units").document(unit.id)
                    .delete()
                    .addOnSuccessListener {
                        Toast.makeText(context, "Unit deleted", Toast.LENGTH_SHORT).show()
                        fetchUnits()
                    }
                    .addOnFailureListener {
                        Toast.makeText(context, "Failed to delete", Toast.LENGTH_SHORT).show()
                    }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun setupGroupInfo() {
        view?.findViewById<TextView>(R.id.text_group_name)?.text = groupName ?: "Loading..."
        
        db.collection("groups").document(groupId!!).get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    val code = document.getString("joinCode") ?: "N/A"
                    val members = document.get("members") as? List<String> ?: emptyList()
                    val course = document.getString("course") ?: "Course Info"
                    
                    view?.findViewById<TextView>(R.id.text_join_code)?.text = code
                    view?.findViewById<TextView>(R.id.text_members_val)?.text = members.size.toString()
                    view?.findViewById<TextView>(R.id.text_group_info)?.text = "$course • ${members.size} Students"
                    
                    // Update header name in case it changed
                    val name = document.getString("name")
                    if (name != null) view?.findViewById<TextView>(R.id.text_group_name)?.text = name
                }
            }
            .addOnFailureListener {
                view?.findViewById<TextView>(R.id.text_join_code)?.text = "ERR"
            }
    }

    private fun checkIfRep() {
        if (groupId == null || auth.currentUser == null) return
        
        db.collection("groups").document(groupId!!)
            .get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    val repId = document.getString("repId")
                    if (repId == auth.currentUser?.uid) {
                        // User is Rep
                        isRep = true
                        view?.findViewById<View>(R.id.badge_rep)?.visibility = View.VISIBLE
                        fabAddUnit.visibility = View.VISIBLE
                        // Re-initialize adapter with isRep = true
                        setupRecyclerViews()
                    }
                }
            }
    }

    private fun handlePost() {
        val content = etPostContent.text.toString().trim()
        if (content.isBlank()) return

        val post = hashMapOf(
            "content" to content,
            "authorId" to auth.currentUser?.uid,
            "authorName" to (auth.currentUser?.displayName ?: "Anonymous"),
            "timestamp" to Timestamp.now(),
            "type" to "announcement"
        )

        db.collection("groups").document(groupId!!)
            .collection("posts")
            .add(post)
            .addOnSuccessListener {
                etPostContent.setText("")
                Toast.makeText(context, "Posted!", Toast.LENGTH_SHORT).show()
                fetchPosts()
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun fetchPosts() {
        if (groupId == null) return
        
        db.collection("groups").document(groupId!!)
            .collection("posts")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { result ->
                posts.clear()
                for (document in result) {
                    val post = document.toObject(GroupPost::class.java)
                    posts.add(post)
                }
                postsAdapter.notifyDataSetChanged()
            }
    }

    private fun fetchUnits() {
        if (groupId == null) return
        
        db.collection("groups").document(groupId!!)
            .collection("units")
            .get()
            .addOnSuccessListener { result ->
                units.clear()
                for (document in result) {
                    val unit = document.toObject(AcademicUnit::class.java)
                    unit.id = document.id
                    units.add(unit)
                }
                unitsAdapter.notifyDataSetChanged()
            }
    }

    private fun showAddUnitDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_unit_to_group, null)
        val etUnitName = dialogView.findViewById<EditText>(R.id.etUnitName)
        val etUnitCode = dialogView.findViewById<EditText>(R.id.etUnitCode)
        val etLecturer = dialogView.findViewById<EditText>(R.id.etLecturerName)
        val etLocation = dialogView.findViewById<EditText>(R.id.etLocation)
        val spinnerDay = dialogView.findViewById<Spinner>(R.id.spinnerDay)
        val btnStartTime = dialogView.findViewById<Button>(R.id.btnStartTime)
        val btnEndTime = dialogView.findViewById<Button>(R.id.btnEndTime)
        val btnSave = dialogView.findViewById<Button>(R.id.btnSave)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancel)

        // Setup Day Spinner
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, daysOfWeek)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerDay.adapter = adapter

        var startTimeStr = "09:00"
        var endTimeStr = "10:00"

        btnStartTime.setOnClickListener {
            TimePickerDialog(context, { _, hourOfDay, minute ->
                startTimeStr = String.format(Locale.getDefault(), "%02d:%02d", hourOfDay, minute)
                btnStartTime.text = "Start: $startTimeStr"
            }, 9, 0, true).show()
        }

        btnEndTime.setOnClickListener {
            TimePickerDialog(context, { _, hourOfDay, minute ->
                endTimeStr = String.format(Locale.getDefault(), "%02d:%02d", hourOfDay, minute)
                btnEndTime.text = "End: $endTimeStr"
            }, 10, 0, true).show()
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        btnCancel.setOnClickListener { dialog.dismiss() }

        btnSave.setOnClickListener {
            val unitName = etUnitName.text.toString()
            val unitCode = etUnitCode.text.toString()
            val lecturer = etLecturer.text.toString()
            val location = etLocation.text.toString()
            
            if (unitName.isBlank()) {
                etUnitName.error = "Required"
                return@setOnClickListener
            }

            val dayString = daysOfWeek[spinnerDay.selectedItemPosition]
            val schedule = UnitSchedule(
                day = dayString,
                startTime = startTimeStr,
                endTime = endTimeStr,
                location = location
            )
            
            val unit = AcademicUnit(
                groupId = groupId!!,
                name = unitName,
                code = unitCode,
                lecturerName = lecturer,
                schedule = listOf(schedule)
            )

            db.collection("groups").document(groupId!!)
                .collection("units")
                .add(unit)
                .addOnSuccessListener { 
                    Toast.makeText(context, "Unit added!", Toast.LENGTH_SHORT).show()
                    fetchUnits() // Refresh list
                    dialog.dismiss() 
                }
        }
        
        dialog.show()
    }
}