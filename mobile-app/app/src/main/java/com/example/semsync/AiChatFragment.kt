package com.example.semsync

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.ImageButton
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.launch

/**
 * AiChatFragment — the View layer. Pure UI, zero business logic.
 *
 * Lifecycle safety:
 *   - State is collected inside repeatOnLifecycle(STARTED) so collection
 *     automatically pauses when the fragment is backgrounded and resumes
 *     when it returns to the foreground. This prevents processing UI updates
 *     against a detached view.
 *
 * Configuration-change resilience:
 *   - The ViewModel (via viewModels delegate) survives rotation.
 *   - Messages are re-submitted to the adapter on every emission, so the list
 *     is always up-to-date after rotation without any manual save/restore.
 *
 * Coupling:
 *   - This class depends on AiChatViewModel and ChatAdapter only.
 *   - GeminiRepository is invisible to this layer.
 */
class AiChatFragment : Fragment() {

    // viewModels() scopes the ViewModel to THIS fragment's lifecycle.
    // It survives rotation but is cleared when the fragment is destroyed.
    private val viewModel: AiChatViewModel by viewModels()

    private lateinit var adapter: ChatAdapter
    private lateinit var rvMessages: RecyclerView
    private lateinit var etInput: TextInputEditText
    private lateinit var btnSend: ImageButton

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View = inflater.inflate(R.layout.fragment_ai_chat, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        bindViews(view)
        setupRecyclerView()
        setupInputHandling()
        observeState()
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    private fun bindViews(view: View) {
        rvMessages = view.findViewById(R.id.rvMessages)
        etInput    = view.findViewById(R.id.etInput)
        btnSend    = view.findViewById(R.id.btnSend)
    }

    private fun setupRecyclerView() {
        adapter = ChatAdapter(onRetry = viewModel::retryMessage)

        val layoutManager = LinearLayoutManager(requireContext()).apply {
            stackFromEnd = true  // new messages appear at the bottom
        }

        rvMessages.apply {
            this.adapter       = this@AiChatFragment.adapter
            this.layoutManager = layoutManager
            // Prevent flicker when items change
            itemAnimator?.changeDuration = 0
        }
    }

    private fun setupInputHandling() {
        // Disable send button when input is empty
        etInput.doAfterTextChanged { text ->
            btnSend.isEnabled = !text.isNullOrBlank()
        }
        btnSend.isEnabled = false

        // Support "Done" / "Send" action on soft keyboard
        etInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                dispatchSend(); true
            } else false
        }

        btnSend.setOnClickListener { dispatchSend() }
    }

    private fun observeState() {
        // repeatOnLifecycle ensures we stop collecting when the fragment is
        // not visible — safe against NPEs on detached views.
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is ChatUiState.Idle        -> { /* nothing to render yet */ }
                        is ChatUiState.Updated     -> renderUpdated(state)
                        is ChatUiState.FatalError  -> renderFatalError(state.message)
                    }
                }
            }
        }
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    private fun renderUpdated(state: ChatUiState.Updated) {
        adapter.submitList(state.messages) {
            // Scroll to bottom AFTER the list has been laid out with new items
            if (state.messages.isNotEmpty()) {
                rvMessages.smoothScrollToPosition(state.messages.size - 1)
            }
        }
        // Lock input while the bot is thinking
        btnSend.isEnabled = !state.isSending && !etInput.text.isNullOrBlank()
        etInput.isEnabled = !state.isSending
    }

    private fun renderFatalError(message: String) {
        // For the hackathon: just show a Snackbar.
        com.google.android.material.snackbar.Snackbar
            .make(requireView(), message, com.google.android.material.snackbar.Snackbar.LENGTH_LONG)
            .show()
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    private fun dispatchSend() {
        val text = etInput.text?.toString() ?: return
        viewModel.sendMessage(text)
        etInput.text?.clear()
    }
}
