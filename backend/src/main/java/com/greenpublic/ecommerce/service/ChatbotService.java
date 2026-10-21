package com.greenpublic.ecommerce.service;

import org.springframework.stereotype.Service;
import com.greenpublic.ecommerce.dto.ChatMessage;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ChatbotService {

    private static final Map<String, String> FAQ = new HashMap<>();

    static {
        FAQ.put("hello", "Hello! Welcome to GreenPublic. How can I help you today?");
        FAQ.put("hi", "Hi there! How can I assist you?");
        FAQ.put("help", "I can help you with:\n- Product information\n- Order status\n- Shipping details\n- Returns & refunds\n- General questions about our store");
        FAQ.put("product", "We have a wide range of eco-friendly and sustainable products. You can browse our products on the home page or search for specific items.");
        FAQ.put("order", "To check your order status, please log in to your account and visit your profile page to view your order history and tracking information.");
        FAQ.put("shipping", "We offer fast and reliable shipping. Orders typically arrive within 5-7 business days. Free shipping is available on orders over $50.");
        FAQ.put("return", "We offer a 30-day return policy. If you're not satisfied with your purchase, please contact us for a return authorization.");
        FAQ.put("payment", "We accept all major credit cards, debit cards, and digital payment methods for a secure checkout experience.");
        FAQ.put("discount", "Check out our Deals section for current promotions and discounts on selected items!");
        FAQ.put("account", "You can create an account by clicking the Login/Signup button in our navigation menu. This helps you track orders and save your preferences.");
        FAQ.put("contact", "Feel free to reach out to us via email or contact form on our website. We typically respond within 24 hours.");
        FAQ.put("size", "Product sizing information is available on each product detail page. If you need help choosing a size, please don't hesitate to ask!");
    }

    public ChatMessage processMessage(String userMessage) {
        String normalizedMessage = userMessage.toLowerCase().trim();
        String response = getResponse(normalizedMessage);

        ChatMessage responseMessage = new ChatMessage();
        responseMessage.setContent(response);
        responseMessage.setTimestamp(LocalDateTime.now());
        responseMessage.setIsBot(true);

        return responseMessage;
    }

    private String getResponse(String message) {
        // Check for exact or partial matches
        for (Map.Entry<String, String> entry : FAQ.entrySet()) {
            if (message.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Default response for unrecognized queries
        return "I'm not sure how to help with that. Could you try asking about:\n" +
               "- Products\n" +
               "- Orders\n" +
               "- Shipping\n" +
               "- Returns\n" +
               "- Payment\n" +
               "- Account issues\n\n" +
               "Type 'help' to see all available topics.";
    }
}
