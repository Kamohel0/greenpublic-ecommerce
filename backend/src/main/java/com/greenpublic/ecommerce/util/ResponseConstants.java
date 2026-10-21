package com.greenpublic.ecommerce.util;



public class ResponseConstants {
    // Common response keys
    public static final String KEY_SUCCESS = "success";
    public static final String KEY_MESSAGE = "message";
    public static final String KEY_TIMESTAMP = "timestamp";
    public static final String KEY_ACCESS_TOKEN = "accessToken";
    public static final String KEY_REFRESH_TOKEN = "refreshToken";
    public static final String KEY_USER = "user";
    public static final String KEY_DATA = "data";
    public static final String KEY_ERROR = "error";
    public static final String KEY_ERROR_CODE = "errorCode";
    
    // Common success messages
    public static final String MSG_REGISTRATION_SUCCESS = "Registration successful. Please check your email for verification.";
    public static final String MSG_EMAIL_VERIFIED = "Email verified successfully. You can now login to your account.";
    public static final String MSG_LOGIN_SUCCESS = "Login successful";
    public static final String MSG_LOGOUT_SUCCESS = "Logout successful";
    public static final String MSG_TOKEN_REFRESHED = "Token refreshed successfully";
    public static final String MSG_PASSWORD_RESET_SENT = "Password reset email sent successfully";
    public static final String MSG_PASSWORD_RESET = "Password reset successfully";
    public static final String MSG_OPERATION_SUCCESS = "Operation completed successfully";
    
    // Common error messages
    public static final String MSG_INVALID_CREDENTIALS = "Invalid credentials";
    public static final String MSG_UNAUTHORIZED = "Unauthorized access";
    public static final String MSG_INTERNAL_ERROR = "An internal server error occurred";
    public static final String MSG_NOT_FOUND = "Resource not found";
    public static final String MSG_VALIDATION_ERROR = "Validation failed";
    
    private ResponseConstants() {
        // Utility class - prevent instantiation
    }
}