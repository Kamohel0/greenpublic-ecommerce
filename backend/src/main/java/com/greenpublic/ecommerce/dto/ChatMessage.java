package com.greenpublic.ecommerce.dto;

import java.time.LocalDateTime;

public class ChatMessage {
    private String content;
    private LocalDateTime timestamp;
    private Boolean isBot;

    public ChatMessage() {}

    public ChatMessage(String content, LocalDateTime timestamp, Boolean isBot) {
        this.content = content;
        this.timestamp = timestamp;
        this.isBot = isBot;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Boolean getIsBot() {
        return isBot;
    }

    public void setIsBot(Boolean isBot) {
        this.isBot = isBot;
    }
}
