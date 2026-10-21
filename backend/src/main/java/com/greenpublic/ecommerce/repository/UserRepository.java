package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.greenpublic.ecommerce.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

     // Find user by email verification token
    Optional<User> findByEmailVerificationToken(String token);

    // Count active users
    long countByIsActive(boolean isActive);

    // Count users with pending verification (inactive but have verification token)
    long countByIsActiveFalseAndEmailVerificationTokenIsNotNull();

    

    // Count users by role
    long countByRole(User.Role role);

    // Find users that need verification email resend (expired tokens)
    @Query("SELECT u FROM User u WHERE u.isActive = false AND u.emailVerificationToken IS NOT NULL AND u.emailVerificationExpiry < CURRENT_TIMESTAMP")
    List<User> findUsersWithExpiredVerificationTokens();

    // Bulk update to clear expired verification tokens
    @Modifying
    @Query("UPDATE User u SET u.emailVerificationToken = NULL, u.emailVerificationExpiry = NULL WHERE u.isActive = false AND u.emailVerificationExpiry < CURRENT_TIMESTAMP")
    int clearExpiredVerificationTokens();

    // Find users who haven't logged in for a long time (for cleanup or notifications)
    @Query("SELECT u FROM User u WHERE u.lastLogin < :cutoffDate AND u.isActive = true")
    List<User> findInactiveUsersSince(@Param("cutoffDate") LocalDateTime cutoffDate);

   
    
    // Find old unverified users (created before cutoff date)
    @Query("SELECT u FROM User u WHERE u.isActive = false AND u.createdAt < :cutoffDate")
    List<User> findOldUnverifiedUsers(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find users needing verification reminder (created more than 12 hours ago, no recent reminder)
    @Query("SELECT u FROM User u WHERE u.isActive = false AND u.emailVerificationToken IS NOT NULL AND u.createdAt < :cutoffDate AND (u.lastReminderSent IS NULL OR u.lastReminderSent < u.createdAt)")
    List<User> findUsersNeedingVerificationReminder(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Count expired verification tokens
    long countByIsActiveFalseAndEmailVerificationExpiryBefore(LocalDateTime date);
    
   
    
    // Delete old unverified users
    @Modifying
    @Query("DELETE FROM User u WHERE u.isActive = false AND u.createdAt < :cutoffDate")
    int deleteOldUnverifiedUsers(@Param("cutoffDate") LocalDateTime cutoffDate);
}

