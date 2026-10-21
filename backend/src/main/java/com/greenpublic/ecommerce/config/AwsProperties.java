package com.greenpublic.ecommerce.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * AWS configuration properties.
 * Binds to application.properties/yaml with prefix "cloud.aws".
 */
@ConfigurationProperties(prefix = "cloud.aws")
@Component
@Data
public class AwsProperties {

    private Region region = new Region();
    private S3 s3 = new S3();
    private CloudFront cloudFront = new CloudFront();
    private CloudWatch cloudWatch = new CloudWatch();

    @Data
    public static class Region {
        /**
         * AWS region for services.
         * Example: us-east-1, eu-west-1, af-south-1 (Cape Town)
         */
        private String static_;

        /**
         * Get region name.
         */
        public String getStatic() {
            return static_;
        }

        public void setStatic(String static_) {
            this.static_ = static_;
        }
    }

    @Data
    public static class S3 {
        /**
         * S3 bucket name for product images.
         */
        private String bucket;

        /**
         * S3 bucket region.
         */
        private String region;

        /**
         * Enable S3 acceleration (for faster uploads).
         */
        private Boolean accelerationEnabled = false;
    }

    @Data
    public static class CloudFront {
        /**
         * CloudFront distribution domain.
         * Example: d123456.cloudfront.net
         */
        private String distributionDomain;

        /**
         * CloudFront key pair ID for URL signing.
         */
        private String keyPairId;

        /**
         * Path to CloudFront private key file.
         * Used for signing URLs.
         */
        private String privateKeyPath;

        /**
         * URL expiration time in minutes (default 1 hour).
         */
        private Long urlExpirationMinutes = 60L;
    }

    @Data
    public static class CloudWatch {
        /**
         * Enable CloudWatch metrics.
         */
        private Boolean metricsEnabled = true;

        /**
         * CloudWatch namespace for application metrics.
         * Example: GreenPublic/Ecommerce
         */
        private String namespace = "GreenPublic/Ecommerce";

        /**
         * Metric batch size before sending to CloudWatch.
         */
        private Integer batchSize = 20;
    }
}
