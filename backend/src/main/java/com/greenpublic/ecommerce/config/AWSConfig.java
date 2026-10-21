package com.greenpublic.ecommerce.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import lombok.extern.slf4j.Slf4j;

/**
 * AWS Service Configuration.
 * Configures the AWS S3 client and CloudFront URL helper.
 */
@Configuration
@EnableConfigurationProperties(AwsProperties.class)
@Slf4j
public class AWSConfig {

    @Value("${cloud.aws.region.static}")
    private String region;

    /**
     * Configure Amazon S3 client.
     * Uses default credentials provider chain (IAM role, environment variables, credentials file).
     * 
     * @return Configured S3Client
     */
    @Bean
    public S3Client s3Client() {
        log.info("Configuring AWS S3 client for region: {}", region);
        
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.builder().build())
                .build();
    }

    /**
     * Configure CloudFront URL signer utility.
     * Generates URLs for CloudFront distributions.
     * 
     * @return CloudFrontUrlSignerUtil bean
     */
    @Bean
    public CloudFrontUrlSignerUtil cloudFrontUrlSignerUtil() {
        log.info("Configuring CloudFront URL signer utility");
        return new CloudFrontUrlSignerUtil();
    }
}
