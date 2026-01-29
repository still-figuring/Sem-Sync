package com.example.semsync

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
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

        // Hardcoded UI for the Next Class card (replace with real data later)
        binding.textGreeting.text = "Good morning, Alex"
        binding.textSubGreeting.text = "Here's your next class"

        val root = binding.root
        val code = root.findViewById<TextView>(R.id.textCourseCode)
        val title = root.findViewById<TextView>(R.id.textCourseTitle)
        val time = root.findViewById<TextView>(R.id.textTimeRange)
        val location = root.findViewById<TextView>(R.id.textLocation)

        code.text = "ICS 2200"
        title.text = "Introduction to Software"
        time.text = "08:00 - 10:00"
        location.text = "Lab 1"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}