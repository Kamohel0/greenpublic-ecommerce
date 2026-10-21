package com.greenpublic.ecommerce.config;

import com.greenpublic.ecommerce.jwt.JwtAuthenticationFilter;
import com.greenpublic.ecommerce.service.auth.GoogleOAuth2Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomAuthenticationEntryPoint customAuthEntryPoint;
    private final OAuth2SuccessHandler oauth2SuccessHandler;
    private final GoogleOAuth2Service googleOAuth2Service;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            CustomAuthenticationEntryPoint customAuthEntryPoint,
            OAuth2SuccessHandler oauth2SuccessHandler,
            GoogleOAuth2Service googleOAuth2Service
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.customAuthEntryPoint = customAuthEntryPoint;
        this.oauth2SuccessHandler = oauth2SuccessHandler;
        this.googleOAuth2Service = googleOAuth2Service;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                // 1. Changed to call the method defined in THIS class
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/products/**", "/api/reviews/product/**", "/api/webhook/yoco", "/payment/redirect", "/api/chatbot/**", "/api/checkout/guest", "/api/checkout/guest/**").permitAll()
                        .requestMatchers("/api/auth/**", "/login/**", "/oauth2/**", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(customAuthEntryPoint))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .oidcUserService(googleOAuth2Service::loadUser))
                        .successHandler(oauth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            response.sendRedirect("/api/auth/google/failure?error="
                                    + java.net.URLEncoder.encode(
                                            String.valueOf(exception.getMessage()),
                                            java.nio.charset.StandardCharsets.UTF_8));
                        })
                );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse allowed origins from application.properties
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }
        configuration.setAllowedOrigins(Arrays.asList(origins));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-New-Access-Token", "X-Total-Count", "X-Page-Number", "X-Page-Size"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}