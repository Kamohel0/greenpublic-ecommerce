package com.greenpublic.ecommerce.util;

import io.github.cdimascio.dotenv.Dotenv;

public class EnvLoader {
    private static Dotenv dotenv;
    
    static {
        dotenv = Dotenv.configure()
            .directory("./")
            .ignoreIfMalformed()
            .ignoreIfMissing()
            .load();
    }
    
    public static String get(String key) {
        return dotenv.get(key);
    }
    
    public static String get(String key, String defaultValue) {
        String value = dotenv.get(key);
        return value != null ? value : defaultValue;
    }
}