package com.greenpublic.ecommerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload.image-dir:uploads/images}")
    private String uploadDir;

    @Value("${app.upload.public-base:/images}")
    private String publicBasePath;

    @Value("${app.upload.max-image-bytes:5242880}") // 5MB default
    private long maxImageBytes;

    public String storeImage(MultipartFile file) throws IOException {
        validateImage(file);

        String storedFilename = buildStoredFilename(file);
        Path storagePath = ensureStorageDir().resolve(storedFilename);
        Files.copy(file.getInputStream(), storagePath, StandardCopyOption.REPLACE_EXISTING);

        return publicUrl(storedFilename);
    }

    public void deleteImageIfLocal(String oldImageUrl) {
        try {
            if (oldImageUrl == null || !oldImageUrl.startsWith(publicBasePath)) return;
            String filename = oldImageUrl.substring(publicBasePath.length()).replaceFirst("^/+", "");
            Path path = Paths.get(uploadDir, filename).toAbsolutePath().normalize();
            Files.deleteIfExists(path);
        } catch (Exception e) {
            log.warn("Failed to delete old image '{}': {}", oldImageUrl, e.getMessage());
        }
    }

    /* -------------------- Helpers -------------------- */

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Image file is required.");

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/"))
            throw new IllegalArgumentException("Only image files are allowed.");

        if (file.getSize() > maxImageBytes)
            throw new IllegalArgumentException("Image exceeds max size of " + maxImageBytes + " bytes.");
    }

    private String buildStoredFilename(MultipartFile file) {
        String original = sanitizeFilename(Objects.requireNonNull(file.getOriginalFilename(), "filename"));
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            ext = original.substring(dot);
        }
        return UUID.randomUUID() + ext.toLowerCase();
    }

    private String sanitizeFilename(String name) {
        String base = Paths.get(name).getFileName().toString();
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private Path ensureStorageDir() throws IOException {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        return dir;
    }

    private String publicUrl(String storedFilename) {
        String base = publicBasePath.endsWith("/") 
                ? publicBasePath.substring(0, publicBasePath.length() - 1) 
                : publicBasePath;
        return base + "/" + storedFilename;
    }
}
