package com.greenpublic.ecommerce.dto.audit;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for audit log information.
 * Used for compliance and debugging audit trails.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {

    private Long id;

    private String action;

    private String entityType;

    private Long entityId;

    private String oldValue;

    private String newValue;

    private Long performedByUserId;

    private String performedByUserEmail;

    private String performedByIp;

    private String description;

    private LocalDateTime createdAt;

    private String metadata;

    /**
     * Search filter DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditSearchDTO {
        private String action;
        private String entityType;
        private Long entityId;
        private Long userId;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        @Builder.Default
        private int page = 0;
        @Builder.Default
        private int size = 20;
    }
}
