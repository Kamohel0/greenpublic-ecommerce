package com.greenpublic.ecommerce.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class PasswordResetRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    public PasswordResetRequestDTO() {}
    
    public PasswordResetRequestDTO(String email) {
        this.email = email;
    }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
