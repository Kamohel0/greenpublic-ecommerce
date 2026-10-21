package com.greenpublic.ecommerce.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class PasswordResetConfirmDTO {
    @NotBlank(message = "Token is required")
    private String token;
    
    @NotBlank(message = "New password is required")
    private String newPassword;
    
    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
    
    public PasswordResetConfirmDTO() {}
    
    public PasswordResetConfirmDTO(String token, String newPassword, String confirmPassword) {
        this.token = token;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }
    
    // Getters and setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}