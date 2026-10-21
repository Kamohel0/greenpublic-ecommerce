package com.greenpublic.ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> buildErrorResponse(HttpStatus status, String error, Object details) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", error);
        response.put("message", details); // always "details", consistent
        return response;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildErrorResponse(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to perform this action"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest()
                .body(buildErrorResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage()));
    }

     @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage()));
    }

    @ExceptionHandler(ProductNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleProductNotFound(ProductNotFoundException ex) {
    
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(buildErrorResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage()));
}


    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex.getMessage()));
    }

    // Validation errors
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<Map<String, Object>> handleValidationErrors(Exception ex) {
        Map<String, String> errors = new HashMap<>();
        if (ex instanceof MethodArgumentNotValidException manv) {
            manv.getBindingResult().getAllErrors().forEach(err -> {
                String field = ((FieldError) err).getField();
                errors.put(field, err.getDefaultMessage());
            });
        } else if (ex instanceof BindException be) {
            be.getBindingResult().getAllErrors().forEach(err -> {
                String field = ((FieldError) err).getField();
                errors.put(field, err.getDefaultMessage());
            });
        }
        return ResponseEntity.badRequest()
                .body(buildErrorResponse(HttpStatus.BAD_REQUEST, "Validation Failed", errors));
    }

    // Validation errors outside Bean Validation (manual checks)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid Argument", ex.getMessage()));
    }

    // IO exceptions (file storage)
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, Object>> handleIOException(IOException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "File Storage Error", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateEmailException.class)
public ResponseEntity<Map<String, Object>> handleDuplicateEmailException(DuplicateEmailException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(buildErrorResponse(HttpStatus.CONFLICT, "Conflict", ex.getMessage()));
}

@ExceptionHandler(RateLimitException.class)
public ResponseEntity<Map<String, Object>> handleRateLimitException(RateLimitException ex) {
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", ex.getMessage()));
}

@ExceptionHandler(InvalidTokenException.class)
public ResponseEntity<Map<String, Object>> handleInvalidTokenException(InvalidTokenException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid Token", ex.getMessage()));
}
}
