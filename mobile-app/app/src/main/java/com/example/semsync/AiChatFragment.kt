package com.example.semsync

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.example.semsync.databinding.FragmentAiChatBinding
import com.example.semsync.ui.aichat.AiChatViewModel
import kotlinx.coroutines.launch

class AiChatFragment : Fragment() {

    private var _binding: FragmentAiChatBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AiChatViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAiChatBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.sendButton.setOnClickListener {
            val prompt = binding.promptInput.text.toString()
            viewModel.sendPrompt(prompt)
        }

        lifecycleScope.launch {
            viewModel.aiResponse.collect {
                binding.responseText.text = it
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}