package com.greenpublic.ecommerce.config;

import org.springframework.stereotype.Component;

@Component
public class NgrokConfig {

    private String currentUrl;

    public String getCurrentUrl() {
        return currentUrl;
    }

    public void setCurrentUrl(String currentUrl) {
        this.currentUrl = currentUrl;
    }
}
