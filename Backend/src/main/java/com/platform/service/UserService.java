package com.platform.service;

import com.platform.dto.UserResponse;
import com.platform.exception.ResourceNotFoundException;
import com.platform.model.User;
import com.platform.repository.UserRepository;
import com.platform.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));
        return UserResponse.fromUser(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromUser(user);
    }
}
