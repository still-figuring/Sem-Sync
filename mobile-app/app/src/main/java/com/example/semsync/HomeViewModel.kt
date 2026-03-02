package com.example.semsync

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import java.util.Calendar

class HomeViewModel : ViewModel() {
    private val repository = UserRepository()

    private val _greetingText = MutableLiveData<String>()
    val greetingText: LiveData<String> get() = _greetingText

    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> get() = _userName

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> get() = _isLoading

    init {
        fetchUserData()
    }

    private fun fetchUserData() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val user = repository.getCurrentUser()
                if (user != null) {
                    _userName.value = user.displayName
                    _greetingText.value = getTimeBasedGreeting(user.displayName)
                } else {
                    _userName.value = "Student"
                    _greetingText.value = getTimeBasedGreeting("Student")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _userName.value = "Student"
                _greetingText.value = getTimeBasedGreeting("Student")
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun getTimeBasedGreeting(name: String): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when {
            hour < 12 -> "Good morning, $name"
            hour < 17 -> "Good afternoon, $name"
            else -> "Good evening, $name"
        }
    }
}
