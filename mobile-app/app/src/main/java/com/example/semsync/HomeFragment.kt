package com.example.semsync

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import com.example.semsync.databinding.FragmentHomeBinding
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.RecyclerView
import androidx.lifecycle.viewModels

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: HomeViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Observe user greeting from ViewModel
        viewModel.greetingText.observe(viewLifecycleOwner) { greeting ->
            binding.textGreeting.text = greeting
        }
        
        // Observe due soon summary from ViewModel
        viewModel.dueSoonSummary.observe(viewLifecycleOwner) { summary ->
            binding.dueSoonCard.textDueSoonSummary.text = summary
        }
        
        // Observe upcoming task count from ViewModel
        viewModel.upcomingTaskCount.observe(viewLifecycleOwner) { count ->
            binding.dueSoonCard.textTaskCount.text = count.toString()
        }
        
        // Display next class with hardcoded data (will be replaced with real data later)
        binding.textSubGreeting.text = "Here's your next class"
        
        val nextClass = Lesson(
            code = "ICS 2200",
            title = "Introduction to Software Engineering",
            day = "Monday",
            startTime = "08:00",
            endTime = "10:00",
            location = "Lab 1"
        )
        
        displayNextClass(nextClass)
    }

    private fun displayNextClass(lesson: Lesson) {
        binding.nextClassCard.textCourseCode.text = lesson.code
        binding.nextClassCard.textCourseTitle.text = lesson.title
        binding.nextClassCard.textTimeRange.text = "${lesson.startTime} - ${lesson.endTime}"
        binding.nextClassCard.textLocation.text = lesson.location
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

// Placeholder adapter — replaced by real data adapters once available
class NotesAdapter(private val items: List<Any>) : RecyclerView.Adapter<NotesAdapter.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view)
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        ViewHolder(TextView(parent.context))
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {}
    override fun getItemCount() = items.size
}