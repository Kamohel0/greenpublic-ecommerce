package com.greenpublic.ecommerce.service;

import com.greenpublic.ecommerce.entity.PaymentTransaction;
import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.enums.TransactionStatus;
import com.greenpublic.ecommerce.entity.enums.PaymentMethod;
import com.greenpublic.ecommerce.repository.PaymentTransactionRepository;
import com.greenpublic.ecommerce.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service to log Yoco payment events to payment_transactions table.
 * Called from webhook endpoint when Yoco sends payment notifications.
 */
@Service
public class PaymentTransactionLoggingService {

    private static final Logger log = LoggerFactory.getLogger(PaymentTransactionLoggingService.class);

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;

    public PaymentTransactionLoggingService(PaymentTransactionRepository paymentTransactionRepository,
                                            OrderRepository orderRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Log a successful Yoco charge to payment_transactions.
     */
    public PaymentTransaction logSuccessfulCharge(Long orderId, String yocoTransactionId,
                                                  BigDecimal amount, String paymentMethod,
                                                  String cardLast4) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            log.warn("Order {} not found for payment logging", orderId);
            return null;
        }

        Order order = orderOpt.get();

        PaymentTransaction txn = PaymentTransaction.builder()
                .order(order)
                .transactionId(yocoTransactionId)
                .amount(amount)
                .status(TransactionStatus.SUCCESS)
                .paymentMethod(PaymentMethod.YOCO)
                .cardLast4(cardLast4)
                .currency("ZAR")
                .processedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(txn);
        log.info("Logged successful payment: transaction_id={}, order_id={}, amount={}", 
                 yocoTransactionId, orderId, amount);
        return saved;
    }

    /**
     * Log a failed Yoco charge to payment_transactions.
     */
    public PaymentTransaction logFailedCharge(Long orderId, String yocoTransactionId,
                                              BigDecimal amount, String errorCode,
                                              String errorMessage, String paymentMethod,
                                              String cardLast4) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            log.warn("Order {} not found for failed payment logging", orderId);
            return null;
        }

        Order order = orderOpt.get();

        PaymentTransaction txn = PaymentTransaction.builder()
                .order(order)
                .transactionId(yocoTransactionId)
                .amount(amount)
                .status(TransactionStatus.FAILED)
                .paymentMethod(PaymentMethod.YOCO)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .cardLast4(cardLast4)
                .currency("ZAR")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(txn);
        log.warn("Logged failed payment: transaction_id={}, order_id={}, error={}", 
                 yocoTransactionId, orderId, errorCode);
        return saved;
    }

    /**
     * Log a refund to payment_transactions.
     */
    public PaymentTransaction logRefund(Long orderId, String refundId, BigDecimal amount) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            log.warn("Order {} not found for refund logging", orderId);
            return null;
        }

        Order order = orderOpt.get();

        PaymentTransaction txn = PaymentTransaction.builder()
                .order(order)
                .transactionId(refundId)
                .amount(amount.negate()) // negative to indicate refund
                .status(TransactionStatus.REFUNDED)
                .paymentMethod(PaymentMethod.YOCO)
                .currency("ZAR")
                .refundedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(txn);
        log.info("Logged refund: refund_id={}, order_id={}, amount={}", 
                 refundId, orderId, amount);
        return saved;
    }
}
