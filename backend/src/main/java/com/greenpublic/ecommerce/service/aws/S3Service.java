package com.greenpublic.ecommerce.service.aws;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.greenpublic.ecommerce.config.CloudFrontUrlSignerUtil;
import com.greenpublic.ecommerce.exception.FileUploadException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Service for managing AWS S3 operations.
 * Handles image uploads, deletion, and CloudFront URL generation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final CloudFrontUrlSignerUtil cloudFrontUrlSigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;

    @Value("${app.s3.product-images-path:images/products/}")
    private String productImagesPath;

    @Value("${app.s3.max-file-size:5242880}")
    private long maxFileSize; // Default 5MB

    @Value("${app.s3.allowed-image-types:image/jpeg,image/png,image/webp,image/gif}")
    private String allowedImageTypes;

    /**
     * Upload product image to S3.
     * Generates unique filename and returns CloudFront URL.
     * 
     * @param file The image file to upload
     * @param productId The product ID (for organizing files)
     * @param imageType Optional image type (e.g., "thumbnail", "main", "gallery")
     * @return CloudFront URL for the uploaded image
     * @throws FileUploadException if upload fails
     */
    public String uploadProductImage(MultipartFile file, Long productId, String imageType) {
        validateFile(file);

        String fileName = generateFileName(file, productId, imageType);
        String s3Key = productImagesPath + fileName;

        try {
            // Prepare metadata
            Map<String, String> userMetadata = new HashMap<>();
            userMetadata.put("product-id", productId.toString());
            if (imageType != null) {
                userMetadata.put("image-type", imageType);
            }

            // Upload to S3
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .cacheControl("max-age=31536000") // 1 year cache
                    .metadata(userMetadata)
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Product image uploaded to S3 - Bucket: {}, Key: {}, Product: {}", 
                    bucketName, s3Key, productId);

            // Generate and return CloudFront URL
            String cloudFrontUrl = cloudFrontUrlSigner.generateSignedUrl(s3Key);
            log.debug("Generated CloudFront URL for product image: {}", productId);

            return cloudFrontUrl;

        } catch (IOException e) {
            log.error("IO error uploading product image for product {}", productId, e);
            throw new FileUploadException("Failed to read file: " + e.getMessage(), e);
        } catch (S3Exception e) {
            log.error("AWS S3 error uploading product image for product {}: {}", 
                    productId, e.awsErrorDetails().errorMessage(), e);
            throw new FileUploadException("S3 upload failed: " + e.awsErrorDetails().errorMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error uploading product image for product {}", productId, e);
            throw new FileUploadException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    /**
     * Upload product gallery images in bulk.
     * 
     * @param files Array of image files
     * @param productId The product ID
     * @return Array of CloudFront URLs
     * @throws FileUploadException if any upload fails
     */
    public String[] uploadProductGalleryImages(MultipartFile[] files, Long productId) {
        String[] cloudFrontUrls = new String[files.length];

        for (int i = 0; i < files.length; i++) {
            try {
                cloudFrontUrls[i] = uploadProductImage(files[i], productId, "gallery-" + i);
            } catch (FileUploadException e) {
                log.error("Failed to upload gallery image {} for product {}", i, productId, e);
                throw e; // Fail on first error (transaction rollback)
            }
        }

        log.info("Uploaded {} gallery images for product {}", files.length, productId);
        return cloudFrontUrls;
    }

    /**
     * Delete product image from S3.
     * 
     * @param s3Key The S3 object key
     * @return true if deletion successful
     */
    public boolean deleteProductImage(String s3Key) {
        try {
            s3Client.deleteObject(b -> b.bucket(bucketName).key(s3Key));
            log.info("Deleted product image from S3 - Bucket: {}, Key: {}", bucketName, s3Key);
            return true;
        } catch (S3Exception e) {
            log.error("Failed to delete product image from S3: {} - Key: {}", e.awsErrorDetails().errorMessage(), s3Key);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error deleting product image - Key: {}", s3Key, e);
            return false;
        }
    }

    /**
     * Check if file exists in S3.
     * 
     * @param s3Key The S3 object key
     * @return true if file exists
     */
    public boolean fileExists(String s3Key) {
        try {
            s3Client.headObject(b -> b.bucket(bucketName).key(s3Key));
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            log.error("Error checking file existence - Key: {}", s3Key, e);
            return false;
        } catch (Exception e) {
            log.error("Error checking file existence - Key: {}", s3Key, e);
            return false;
        }
    }

    /**
     * Get signed URL for temporary access.
     * 
     * @param s3Key The S3 object key
     * @param expirationMinutes URL expiration time in minutes
     * @return Signed CloudFront URL
     */
    public String getSignedUrl(String s3Key, long expirationMinutes) {
        return cloudFrontUrlSigner.generateSignedUrlWithExpiration(s3Key, expirationMinutes);
    }

    /**
     * Get public URL (unsigned) for the image.
     * Only works if CloudFront distribution is public.
     * 
     * @param s3Key The S3 object key
     * @return CloudFront URL without signature
     */
    public String getPublicUrl(String s3Key) {
        return cloudFrontUrlSigner.getUnsignedUrl(s3Key);
    }

    /**
     * Validate uploaded file.
     * Checks size, MIME type, and emptiness.
     * 
     * @param file File to validate
     * @throws FileUploadException if validation fails
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("File is empty or not provided");
        }

        if (file.getSize() > maxFileSize) {
            throw new FileUploadException("File size exceeds maximum allowed size of " + 
                    (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedImageType(contentType)) {
            throw new FileUploadException("Only image files are allowed (JPEG, PNG, WebP, GIF)");
        }

        // Additional filename validation
        String filename = file.getOriginalFilename();
        if (filename == null || filename.contains("..") || filename.contains("/")) {
            throw new FileUploadException("Invalid filename");
        }
    }

    /**
     * Check if content type is in allowed list.
     * 
     * @param contentType MIME type
     * @return true if allowed
     */
    private boolean isAllowedImageType(String contentType) {
        String[] allowedTypes = allowedImageTypes.split(",");
        for (String allowed : allowedTypes) {
            if (contentType.equalsIgnoreCase(allowed.trim())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate unique filename for uploaded file.
     * Format: product-{productId}-{imageType}-{timestamp}-{uuid}.{extension}
     * 
     * @param file The uploaded file
     * @param productId The product ID
     * @param imageType Optional image type
     * @return Generated filename
     */
    private String generateFileName(MultipartFile file, Long productId, String imageType) {
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        
        String typePart = (imageType != null && !imageType.isEmpty()) ? 
            imageType + "-" : "";
        
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);

        return String.format("product-%d-%s%s-%s.%s", 
                productId, typePart, timestamp, uuid, extension);
    }

    /**
     * Extract file extension from filename.
     * 
     * @param filename The original filename
     * @return File extension (lowercase)
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg"; // Default extension
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Get S3 object metadata.
     * 
     * @param s3Key The S3 object key
     * @return HeadObjectResponse or null if not found
     */
    public HeadObjectResponse getObjectMetadata(String s3Key) {
        try {
            return s3Client.headObject(b -> b.bucket(bucketName).key(s3Key));
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                log.debug("Object not found in S3 - Key: {}", s3Key);
                return null;
            }
            log.error("Error getting object metadata - Key: {}: {}", s3Key, e.awsErrorDetails().errorMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error getting object metadata - Key: {}", s3Key, e);
            return null;
        }
    }
}
