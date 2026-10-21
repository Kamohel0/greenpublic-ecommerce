package com.greenpublic.ecommerce.jwt;

import java.security.SecureRandom;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;


import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.greenpublic.ecommerce.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.IncorrectClaimException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.issuer:ecommerce-api}")
    private String issuer;

    @Value("${jwt.audience:frontend}")
    private String audience;

    @Value("${jwt.accessExpirationMs:900000}")
    private long accessExpirationMs;

    @Value("${jwt.refreshExpirationMs:604800000}")
    private long refreshExpirationMs;

    @Value("${jwt.clockSkewSec:30}")
    private long clockSkewSec;

    @PostConstruct
    public void validateConfig() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("jwt.secret must be configured in production");
        }
        
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 256-bit (32 bytes when base64 decoded)");
        }
        
        log.info("JWT service initialized with issuer: {}, audience: {}", issuer, audience);
    }

    public String generateAccessToken(User user, long tokenVersion) {
        return buildToken(user, tokenVersion, accessExpirationMs);
    }

    public String generateAccessToken(User user) {
        return buildToken(user, 0L, accessExpirationMs);
    }

    public String generateRefreshToken(User user, long tokenVersion) {
        return buildToken(user, tokenVersion, refreshExpirationMs);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, 0L, refreshExpirationMs);
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT expired: {}", e.getMessage());
            return false;
        } catch (IncorrectClaimException e) {
            log.warn("JWT claim mismatch (iss/aud): {}", e.getMessage());
            return false;
        } catch (SecurityException e) {
            log.warn("JWT signature invalid: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException | UnsupportedJwtException e) {
            log.warn("JWT malformed/unsupported: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("JWT invalid: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error validating JWT", e);
            return false;
        }
    }

    public boolean isExpired(String token) {
        try {
            Date exp = extractClaim(token, Claims::getExpiration);
            return exp.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }
    

    public Long extractTokenVersion(String token) {
        return extractClaim(token, c -> {
            Object v = c.get("ver");
            if (v instanceof Number number) {
                return number.longValue();
            }
            return 0L;
        });
    }


    public String extractRole(String token) {
        return extractClaim(token, c -> {
            Object r = c.get("role");
            return r != null ? r.toString() : null;
        });
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = parseClaims(token).getPayload();
        return resolver.apply(claims);
    }

    private String buildToken(User user, long tokenVersion, long ttlMs) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + ttlMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(now)
                .expiration(exp)
                .claim("role", user.getRole())
                .claim("ver", tokenVersion)
                .signWith(getSigningKey())
                .compact();
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(issuer)
                .requireAudience(audience)
                .clockSkewSeconds(clockSkewSec)
                .build()
                .parseSignedClaims(token);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        if (keyBytes.length < 32) {
            log.warn("jwt.secret is < 256-bit; padding defensively");
            keyBytes = padToLength(keyBytes, 32);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private static byte[] padToLength(byte[] input, int len) {
        if (input.length >= len) return input;
        byte[] out = new byte[len];
        System.arraycopy(input, 0, out, 0, input.length);
        byte[] fill = new byte[len - input.length];
        new SecureRandom().nextBytes(fill);
        System.arraycopy(fill, 0, out, input.length, fill.length);
        return out;
    }
}