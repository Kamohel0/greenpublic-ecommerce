package com.greenpublic.ecommerce.jwt;

import com.greenpublic.ecommerce.config.CustomUserDetails;
import com.greenpublic.ecommerce.entity.RefreshToken;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.InvalidTokenException;
import com.greenpublic.ecommerce.exception.RateLimitException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.RateLimiterService;
import com.greenpublic.ecommerce.service.auth.RefreshTokenService;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final long SEVEN_DAYS_IN_SECONDS = 7L * 24 * 60 * 60;
    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final String AUTHENTICATION_FAILED = "Authentication failed";

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            UserRepository userRepository,
            RateLimiterService rateLimiterService
    ) {
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {
        try {
            String token = extractAccessToken(request);

            if (token != null) {
                authenticateWithAccessToken(request, token);
            }
        } catch (ExpiredJwtException ex) {
            handleAccessTokenExpired(request, response);
        } catch (Exception ex) {
            log.warn("JWT authentication failed: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        // If our filter already wrote a response (e.g. unauthorized refresh flow),
        // do not continue the filter chain to avoid double-writing to the response
        // which results in "getWriter() has already been called" errors.
        if (response.isCommitted() || response.getStatus() == HttpServletResponse.SC_UNAUTHORIZED) {
            return;
        }

        chain.doFilter(request, response);
    }

    /* ---------------- ACCESS TOKEN FLOW ---------------- */
    private String extractAccessToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private void authenticateWithAccessToken(HttpServletRequest request, String token) {
        String email = jwtService.extractEmail(token);
        Long tokenVersion = jwtService.extractTokenVersion(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(AUTHENTICATION_FAILED));

        if (!tokenVersion.equals(user.getTokenVersion())) {
            log.warn("Token version mismatch for {}", email);
            throw new UserNotFoundException(AUTHENTICATION_FAILED);
        }

        if (!jwtService.isTokenValid(token)) {
            throw new InvalidTokenException(AUTHENTICATION_FAILED);
        }

        setAuthenticationContext(user, request);
        log.debug("Authenticated user: {}", user.getEmail());
    }

    /* ---------------- REFRESH TOKEN FLOW ---------------- */
    private void handleAccessTokenExpired(HttpServletRequest request, HttpServletResponse response) {
        enforceRateLimit(request);

        Optional<String> maybeRefresh = extractRefreshToken(request);

        if (maybeRefresh.isEmpty()) {
            // No refresh token present — do not throw. Signal unauthorized so the
            // client can perform an explicit refresh flow instead of causing a 500.
            log.debug("No refresh token cookie present for expired access token");
            sendUnauthorized(response);
            return;
        }

        String refreshToken = maybeRefresh.get();

        try {
            RefreshToken consumed = refreshTokenService.consumeAndVerifyToken(refreshToken)
                    .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

            issueNewTokens(request, response, consumed.getUser());
        } catch (Exception e) {

            log.warn("Refresh token failed: {}", e.getMessage());
            sendUnauthorized(response);
        }
    }

    private void enforceRateLimit(HttpServletRequest request) {
        String key = "refresh:" + request.getRemoteAddr();
        if (!rateLimiterService.tryConsume(key, 20, Duration.ofMinutes(1))) {
            throw new RateLimitException("Too many refresh attempts");
        }
    }

    private Optional<String> extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private void issueNewTokens(HttpServletRequest request, HttpServletResponse response, User user) {
        String newAccess = jwtService.generateAccessToken(user, user.getTokenVersion());
        RefreshToken newRefresh = refreshTokenService.createRefreshToken(user);

        boolean secureFlag = request.isSecure();
        String sameSite = secureFlag ? "None" : "Strict";

        setAuthResponseHeaders(response, newAccess, newRefresh.getToken(), secureFlag, sameSite);
        setAuthenticationContext(user, request);

        log.info("Refreshed tokens for {}", user.getEmail());
    }

    /* ---------------- UTILITIES ---------------- */
    private void setAuthenticationContext(User user, HttpServletRequest request) {
        UserDetails details = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth
                = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());

        if (request != null) {
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        }

        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void setAuthResponseHeaders(HttpServletResponse response, String access, String refresh, boolean secureFlag, String sameSite) {
        response.setHeader("X-New-Access-Token", access);

        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refresh)
                .httpOnly(true)
                .secure(secureFlag)
                .path("/")
                .maxAge(SEVEN_DAYS_IN_SECONDS)
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void sendUnauthorized(HttpServletResponse response) {
        try {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(AUTHENTICATION_FAILED);
        } catch (IOException e) {

            log.error("Failed to write unauthorized response", e);

        }
    }
}
