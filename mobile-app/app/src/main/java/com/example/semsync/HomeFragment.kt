package com.example.semsync

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.example.semsync.databinding.FragmentHomeBinding
import com.google.firebase.auth.FirebaseAuth
import java.util.Calendar

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val user = FirebaseAuth.getInstance().currentUser
        val name = user?.displayName ?: "Student"
        
        binding.tvUserName.text = name.split(" ")[0] // First name only
        binding.tvGreeting.text = getGreeting()
    }

    private fun getGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 0..11 -> "Good Morning,"
            in 12..16 -> "Good Afternoon,"
            else -> "Good Evening,"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}