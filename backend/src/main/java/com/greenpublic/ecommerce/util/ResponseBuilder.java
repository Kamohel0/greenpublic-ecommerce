package com.greenpublic.ecommerce.util;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ResponseBuilder {
    
    /**
     * Creates a basic success response with message
     */
    public static Map<String, Object> success(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put(ResponseConstants.KEY_SUCCESS, true);
        response.put(ResponseConstants.KEY_MESSAGE, message);
        response.put(ResponseConstants.KEY_TIMESTAMP, LocalDateTime.now());
        return response;
    }
    
    /**
     * Creates a success response with message and additional data
     */
    public static Map<String, Object> success(String message, Map<String, Object> data) {
        Map<String, Object> response = success(message);
        if (data != null && !data.isEmpty()) {
            response.put(ResponseConstants.KEY_DATA, data);
        }
        return response;
    }
    
    /**
     * Creates a success response with message and single key-value pair
     */
    public static Map<String, Object> success(String message, String key, Object value) {
        Map<String, Object> response = success(message);
        response.put(key, value);
        return response;
    }
    
    /**
     * Creates a basic error response
     */
    public static Map<String, Object> error(String errorCode, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put(ResponseConstants.KEY_SUCCESS, false);
        response.put(ResponseConstants.KEY_ERROR_CODE, errorCode);
        response.put(ResponseConstants.KEY_MESSAGE, message);
        response.put(ResponseConstants.KEY_TIMESTAMP, LocalDateTime.now());
        return response;
    }
    
    /**
     * Creates an error response with additional error details
     */
    public static Map<String, Object> error(String errorCode, String message, Map<String, Object> errorDetails) {
        Map<String, Object> response = error(errorCode, message);
        if (errorDetails != null && !errorDetails.isEmpty()) {
            response.put(ResponseConstants.KEY_ERROR, errorDetails);
        }
        return response;
    }
    
    /**
     * Creates a success response for authentication with tokens
     */
    public static Map<String, Object> authSuccess(String message, String accessToken, Map<String, Object> userData) {
        Map<String, Object> response = success(message);
        response.put(ResponseConstants.KEY_ACCESS_TOKEN, accessToken);
        if (userData != null && !userData.isEmpty()) {
            response.put(ResponseConstants.KEY_USER, userData);
        }
        return response;
    }
    
    /**
     * Creates a paginated response
     */
    public static Map<String, Object> paginatedSuccess(String message, 
                                                     Map<String, Object> data, 
                                                     long totalItems, 
                                                     int totalPages, 
                                                     int currentPage) {
        Map<String, Object> response = success(message);
        
        Map<String, Object> paginationInfo = new HashMap<>();
        paginationInfo.put("totalItems", totalItems);
        paginationInfo.put("totalPages", totalPages);
        paginationInfo.put("currentPage", currentPage);
        
        Map<String, Object> responseData = new HashMap<>();
        if (data != null) {
            responseData.putAll(data);
        }
        responseData.put("pagination", paginationInfo);
        
        response.put(ResponseConstants.KEY_DATA, responseData);
        return response;
    }
    
    /**
     * Creates a validation error response
     */
    public static Map<String, Object> validationError(Map<String, String> fieldErrors) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("fieldErrors", fieldErrors);
        
        return error("VALIDATION_ERROR", ResponseConstants.MSG_VALIDATION_ERROR, errorDetails);
    }
    
    /**
     * Creates a response from an exception
     */
    public static Map<String, Object> fromException(String errorCode, Exception exception) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("exception", exception.getClass().getSimpleName());
        errorDetails.put("details", exception.getMessage());
        
        return error(errorCode, exception.getMessage(), errorDetails);
    }
}
