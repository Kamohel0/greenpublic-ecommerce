package com.greenpublic.ecommerce.config;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.greenpublic.ecommerce.entity.User;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Example: convert user role to a GrantedAuthority list
        return List.of(() -> "ROLE_" + user.getRole());
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // customize if needed
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // customize if needed
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // customize if needed
    }

    @Override
    public boolean isEnabled() {
        return true; // customize if needed
    }

    // Optional: expose the wrapped User entity if needed
    public User getUser() {
        return user;
    }
}
