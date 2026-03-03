package com.example.semsync

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import java.util.Calendar

class HomeViewModel : ViewModel() {
    private val userRepository = UserRepository()
    private val taskRepository = TaskRepository()

    private val _greetingText = MutableLiveData<String>()
    val greetingText: LiveData<String> get() = _greetingText

    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> get() = _userName

    private val _dueSoonSummary = MutableLiveData<String>()
    val dueSoonSummary: LiveData<String> get() = _dueSoonSummary

    private val _upcomingTaskCount = MutableLiveData<Int>()
    val upcomingTaskCount: LiveData<Int> get() = _upcomingTaskCount

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> get() = _isLoading

    init {
        fetchUserData()
        fetchUpcomingTasks()
    }

    private fun fetchUserData() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val user = userRepository.getCurrentUser()
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

    private fun fetchUpcomingTasks() {
        viewModelScope.launch {
            try {
                val upcomingTasks = taskRepository.getUpcomingTasks()
                _upcomingTaskCount.value = upcomingTasks.size
                _dueSoonSummary.value = generateDueSoonSummary(upcomingTasks)
            } catch (e: Exception) {
                e.printStackTrace()
                _upcomingTaskCount.value = 0
                _dueSoonSummary.value = "No upcoming tasks"
            }
        }
    }

    private fun generateDueSoonSummary(tasks: List<Task>): String {
        return when {
            tasks.isEmpty() -> "No upcoming tasks"
            tasks.size == 1 -> "1 task due soon"
            else -> "${tasks.size} tasks due soon"
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
