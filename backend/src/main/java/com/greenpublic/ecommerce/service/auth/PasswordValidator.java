package com.greenpublic.ecommerce.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.greenpublic.ecommerce.exception.WeakPasswordException;

import java.util.Set;

@Component
public class PasswordValidator {

    private final int minLength;
    private final Set<String> commonPasswords;

    public PasswordValidator(
            @Value("${app.security.password.min-length:8}") int minLength,
            @Value("${app.security.password.common:password,123456,123456789,qwerty,letmein,welcome,admin}")
            String commonPasswordsCsv) {

        this.minLength = minLength;
        this.commonPasswords = Set.of(commonPasswordsCsv.toLowerCase().split(","));
    }

    public void validatePasswordStrength(String password) {
        if (password == null || password.length() < minLength) {
            throw new WeakPasswordException("Password must be at least " + minLength + " characters long");
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char ch : password.toCharArray()) {
            if (Character.isUpperCase(ch)) hasUpper = true;
            else if (Character.isLowerCase(ch)) hasLower = true;
            else if (Character.isDigit(ch)) hasDigit = true;
            else hasSpecial = true; // any non-letter/digit counts as special
        }

          if (!hasUpper) {
            throw new WeakPasswordException("Password must contain at least one uppercase letter");
        }
        if (!hasLower) {
            throw new WeakPasswordException("Password must contain at least one lowercase letter");
        }
        if (!hasDigit) {
            throw new WeakPasswordException("Password must contain at least one number");
        }
        if (!hasSpecial) {
            throw new WeakPasswordException("Password must contain at least one special character");
        }

        String normalized = password.toLowerCase();
        if (commonPasswords.contains(normalized)) {
            throw new WeakPasswordException("Password is too common and easily guessable");
        }
    }
}
