package com.greenpublic.ecommerce.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.greenpublic.ecommerce.config.NgrokConfig;

import jakarta.annotation.PostConstruct;

@Service
public class YocoWebhookService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final NgrokService ngrokService;
    private final NgrokConfig ngrokConfig;

    @Value("${yoco.api.secret-key}")
    private String secretKey;

    private static final String BASE_URL = "https://payments.yoco.com/api/webhooks";

    public YocoWebhookService(NgrokService ngrokService, NgrokConfig ngrokConfig) {
        this.ngrokService = ngrokService;
        this.ngrokConfig = ngrokConfig;
    }

    //@PostConstruct
    public void init() {
        try {
            syncWebhook();
        } catch (Exception e) {
            System.err.println("⚠️ Webhook sync failed during startup (expected in dev): " + e.getMessage());
        }
    }

    public void syncWebhook() {
        try {
            String webhookUrl = ngrokService.getNgrokUrl() + "/api/webhook/yoco";
            if (webhookUrl == null) {
                System.err.println("⚠️ Ngrok URL not found, skipping webhook registration.");
                return;
            }

            // Store dynamically in memory
            ngrokConfig.setCurrentUrl(webhookUrl);

            JSONArray webhooks = listWebhooks();
            boolean foundMatch = false;

            for (int i = 0; i < webhooks.length(); i++) {
                JSONObject wh = webhooks.getJSONObject(i);
                String id = wh.getString("id");
                String url = wh.getString("url");

                if (url.equals(webhookUrl)) {
                    foundMatch = true;
                    System.out.println("Webhook already registered: " + url);
                     System.out.println("Webhook registered: " + webhooks.toString(2));
                } else {
                    deleteWebhook(id);
                }
            }

            if (!foundMatch) {
                registerWebhook(webhookUrl);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private JSONArray listWebhooks() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + secretKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(BASE_URL, HttpMethod.GET, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            JSONObject jsonResponse = new JSONObject(response.getBody());
            // Corrected key: use "subscriptions" instead of "webhooks"
            return jsonResponse.optJSONArray("subscriptions") != null
                    ? jsonResponse.getJSONArray("subscriptions")
                    : new JSONArray();
        } else {
            throw new RuntimeException("Failed to list webhooks: " + response.getStatusCode());
        }
    }

    private void deleteWebhook(String id) {
        String url = BASE_URL + "/" + id;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + secretKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            System.out.println("Deleted old webhook: " + id);
        } else {
            System.out.println("Failed to delete webhook " + id + ": " + response.getStatusCode());
        }
    }

    private void registerWebhook(String webhookUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + secretKey);

        JSONObject body = new JSONObject();
        body.put("name", "order-status-webhook");
        body.put("url", webhookUrl);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        ResponseEntity<String> response = restTemplate.exchange(BASE_URL, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            JSONObject jsonResponse = new JSONObject(response.getBody());
            System.out.println("Webhook registered: " + jsonResponse.toString(2));
        } else {
            System.out.println("Failed to register webhook: " + response.getStatusCode());
        }
    }
}
