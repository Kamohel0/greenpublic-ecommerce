package com.greenpublic.ecommerce.service;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class YocoWebhookServiceProduction {

    private static final Logger log = LoggerFactory.getLogger(YocoWebhookServiceProduction.class);

    @Value("${yoco.api.secret-key}")
    private String secretKey;

    @Value("${yoco.webhook.url}")
    private String webhookUrl; // e.g., https://your-backend.com/api/webhook/yoco

    private final RestTemplate restTemplate = new RestTemplate();

    public void registerWebhook() {
        String url = "https://payments.yoco.com/api/webhooks";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + secretKey);

        JSONObject body = new JSONObject();
        body.put("name", "order-status-webhook");
        body.put("url", webhookUrl);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JSONObject jsonResponse = new JSONObject(response.getBody());
                log.info("Webhook registered: {}", jsonResponse.toString(2));
            } else {
                log.warn("Failed to register webhook: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Webhook registration failed", e);
        }
    }
}
