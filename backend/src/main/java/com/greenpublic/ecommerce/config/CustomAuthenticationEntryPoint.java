package com.greenpublic.ecommerce.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)
            throws IOException, ServletException {

        String authHeader = request.getHeader("Authorization");

        // If no Authorization header is present, return 401
        if (authHeader == null || authHeader.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authorization token is missing");
        } else {
            // If token is present but invalid or expired, return 403 (or your preferred response)
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or expired token");
        }
    }
}

