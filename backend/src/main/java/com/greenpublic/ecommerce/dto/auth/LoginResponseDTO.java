package com.greenpublic.ecommerce.dto.auth;

import java.util.Map;

// Create a response DTO
public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private Map<String, Object> user;
    
    // Constructors, getters, and setters
    public LoginResponseDTO(String accessToken, String refreshToken, Map<String, Object> user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }
    
    // Getters and setters
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public Map<String, Object> getUser() { return user; }
}
