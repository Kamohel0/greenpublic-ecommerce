package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// import java.util.Optional;
//
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@Profile("dev")
public class DevController {

    private final UserRepository userRepository;

    public DevController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Return minimal debug info for a user (for local testing only)
    @GetMapping("/user-token")
    public ResponseEntity<?> getUserToken(@RequestParam String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .map(user -> {
                    Map<String, Object> res = new HashMap<>();
                    res.put("email", user.getEmail());
                    res.put("isActive", user.isActive());
                    res.put("verificationToken", user.getEmailVerificationToken());
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
