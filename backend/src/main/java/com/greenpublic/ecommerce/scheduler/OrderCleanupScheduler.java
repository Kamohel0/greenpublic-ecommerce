package com.greenpublic.ecommerce.scheduler;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.service.orders.OrderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCleanupScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${orders.cleanup.pageSize:500}")
    private int pageSize;

    @Value("${orders.cleanup.enabled:true}")
    private boolean enabled;

    /**
     * Scans expired PENDING orders and releases reservations in chunks.
     * - Paged IDs → low memory usage
     * - One service call per chunk → single transaction per chunk
     */
    @Scheduled(
        fixedDelayString = "${orders.cleanup.fixedDelay:60000}",
        initialDelayString = "${orders.cleanup.initialDelay:15000}"
    )
    public void releaseExpiredReservations() {
        if (!enabled) {
            log.debug("Order cleanup disabled.");
            return;
        }

        final LocalDateTime cutoff = LocalDateTime.now();

        int page = 0;
        int totalReleased = 0;

        while (true) {
            Page<Long> idPage = orderRepository.findExpiredReservationIds(
                    Order.OrderStatus.PENDING, cutoff,
                    PageRequest.of(page, pageSize, Sort.by(Sort.Direction.ASC, "id"))
            );

            List<Long> ids = idPage.getContent();
            if (ids.isEmpty()) break;

            try {
                orderService.releaseReservationsBulk(ids);
                totalReleased += ids.size();
            } catch (Exception e) {
                log.error("Failed to release reservations for chunk ({} ids): {}", ids.size(), e.getMessage(), e);
                // continue to next page; you could also break/alert depending on policy
            }

            if (!idPage.hasNext()) break;
            page++;
        }

        if (totalReleased > 0) {
            log.info("Reservation cleanup completed. Released {} orders.", totalReleased);
        } else {
            log.debug("Reservation cleanup: nothing to release.");
        }
    }
}
