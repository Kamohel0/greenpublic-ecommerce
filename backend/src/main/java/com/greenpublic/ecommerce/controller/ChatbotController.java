package com.greenpublic.ecommerce.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.greenpublic.ecommerce.dto.ChatMessage;
import com.greenpublic.ecommerce.service.ChatbotService;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatMessage> handleChatMessage(@RequestBody ChatMessage message) {
        ChatMessage response = chatbotService.processMessage(message.getContent());
        return ResponseEntity.ok(response);
    }
}
