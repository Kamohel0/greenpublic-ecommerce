package com.greenpublic.ecommerce.service.notifications;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailNotificationService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Override
    public void send(String to, String subject, String message) {
        // basic plain-text email
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(message, false);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send plain-text notification email to {}", to, e);
        }
    }

    @Override
    public void sendTemplate(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(templateName, context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send template notification email to {} with template {}", to, templateName, e);
        }
    }
}
