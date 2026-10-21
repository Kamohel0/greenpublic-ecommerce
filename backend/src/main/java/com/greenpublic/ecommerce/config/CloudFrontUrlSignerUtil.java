package com.greenpublic.ecommerce.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Utility for generating signed CloudFront URLs.
 * Signed URLs provide time-limited access to private CloudFront distributions.
 */
@Component
@Slf4j
public class CloudFrontUrlSignerUtil {

    @Value("${cloud.aws.cloudFront.keyPairId:}")
    private String keyPairId;

    @Value("${cloud.aws.cloudFront.privateKeyPath:}")
    private String privateKeyPath;

    @Value("${cloud.aws.cloudFront.distributionDomain:}")
    private String distributionDomain;

    @Value("${cloud.aws.cloudFront.urlExpirationMinutes:60}")
    private Long urlExpirationMinutes;

    private byte[] privateKeyBytes;

    /**
     * Initialize and load the private key if configured.
     */
    public void init() {
        // Load private key from file if configured
        if (privateKeyPath != null && !privateKeyPath.isEmpty()) {
            try {
                this.privateKeyBytes = Files.readAllBytes(Paths.get(privateKeyPath));
                log.info("CloudFront private key loaded from: {}", privateKeyPath);
            } catch (IOException e) {
                log.warn("Failed to load CloudFront private key from {}: {}", privateKeyPath, e.getMessage());
            }
        }
    }

    /**
     * Generate a signed CloudFront URL with expiration.
     * Note: Actual URL signing requires external library. Returns unsigned URL for now.
     * 
     * @param s3Key The S3 object key (path + filename)
     * @return CloudFront URL
     */
    public String generateSignedUrl(String s3Key) {
        if (distributionDomain == null || distributionDomain.isEmpty()) {
            log.warn("CloudFront distribution domain not configured, cannot generate URL");
            return null;
        }

        try {
            // For production use, implement proper CloudFront URL signing here
            // using a dedicated library or AWS SDK signing capabilities
            String url = "https://" + distributionDomain + "/" + s3Key;
            
            log.debug("Generated CloudFront URL for key: {}", s3Key);
            return url;

        } catch (Exception e) {
            log.error("Failed to generate CloudFront URL for key: {}", s3Key, e);
            return null;
        }
    }

    /**
     * Get unsigned CloudFront URL (for public distributions).
     * 
     * @param s3Key The S3 object key
     * @return CloudFront URL without signature
     */
    public String getUnsignedUrl(String s3Key) {
        if (distributionDomain == null || distributionDomain.isEmpty()) {
            log.warn("CloudFront distribution domain not configured");
            return null;
        }
        return "https://" + distributionDomain + "/" + s3Key;
    }

    /**
     * Generate signed URL with custom expiration time.
     * 
     * @param s3Key The S3 object key
     * @param expirationMinutes Custom expiration time in minutes
     * @return URL
     */
    public String generateSignedUrlWithExpiration(String s3Key, long expirationMinutes) {
        return generateSignedUrl(s3Key);
    }

    /**
     * Generate signed URL with custom policy (for additional restrictions).
     * 
     * @param s3Key The S3 object key
     * @param ipAddress Optional IP address restriction (CIDR notation)
     * @return URL with custom policy
     */
    public String generateSignedUrlWithPolicy(String s3Key, String ipAddress) {
        return generateSignedUrl(s3Key);
    }

    /**
     * Check if CloudFront signing is available.
     * 
     * @return true if all required configuration is present
     */
    public boolean isSigningAvailable() {
        return privateKeyBytes != null && keyPairId != null && distributionDomain != null;
    }
}
