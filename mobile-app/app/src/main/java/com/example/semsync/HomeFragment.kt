package com.example.semsync

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.example.semsync.databinding.FragmentHomeBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Display greeting with hardcoded user name
        binding.textGreeting.text = "Good morning, Alex"
        binding.textSubGreeting.text = "Here's your next class"
        
        // Hardcoded next class data (will be replaced with real Firestore data from Member 6)
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