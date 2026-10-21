package com.greenpublic.ecommerce.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.greenpublic.ecommerce.entity.RefreshToken;
import com.greenpublic.ecommerce.entity.User;

import jakarta.transaction.Transactional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    boolean existsByToken(String token);
     @Transactional
    int deleteByUser(User user);
    /** Deletes all tokens that expired before the given instant and returns the count */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken t WHERE t.expiryDate < :instant")
    int deleteAllExpiredSince(Instant instant);
   
    
}