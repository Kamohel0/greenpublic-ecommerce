package com.greenpublic.ecommerce.service.notifications;

import java.util.Map;

public interface NotificationService {
    void send(String to, String subject, String message); // simple text
    void sendTemplate(String to, String subject, String templateName, Map<String, Object> variables);
}

