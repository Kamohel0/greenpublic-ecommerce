package com.greenpublic.ecommerce.config;

import com.greenpublic.ecommerce.dto.auth.LoginResponseDTO;
import com.greenpublic.ecommerce.service.auth.GoogleOAuth2Service;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Handles successful Google OAuth2 login in a stateless, production-ready way.
 * Issues access + refresh tokens without using HttpSession.
 */
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

     @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final long SEVEN_DAYS_IN_SECONDS = 7L * 24 * 60 * 60;

    private final GoogleOAuth2Service googleOAuth2Service;

    public OAuth2SuccessHandler(GoogleOAuth2Service googleOAuth2Service) {
        this.googleOAuth2Service = googleOAuth2Service;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid user type\"}");
            return;
        }

        // Handle login and issue tokens
        String email = oidcUser.getEmail();
        LoginResponseDTO loginResponse = googleOAuth2Service.handleGoogleLogin(email);

   ResponseCookie cookie = ResponseCookie.from("refreshToken", loginResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // false for local testing
                .path("/")
                .maxAge(SEVEN_DAYS_IN_SECONDS)
                .sameSite("Strict")
                .build();

response.addHeader("Set-Cookie", cookie.toString());

        
       String redirectUrl = frontendUrl + "/login-redirect?" +
    "accessToken=" + loginResponse.getAccessToken() +
    "&name=" + URLEncoder.encode((String) loginResponse.getUser().get("name"), StandardCharsets.UTF_8.name()) +
    "&email=" + URLEncoder.encode((String) loginResponse.getUser().get("email"), StandardCharsets.UTF_8.name());

response.sendRedirect(redirectUrl);

    }
}
