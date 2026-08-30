package com.demo.chatwithdocs.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Fails fast at startup with a clear message when the OpenAI API key is missing.
 * Without this, the app starts fine and only reveals the problem as a confusing
 * HTTP 401 on the first embedding or chat call.
 */
@Configuration
public class OpenAiKeyValidator {

    // Empty default so an unset variable reaches this check instead of throwing
    // an opaque placeholder-resolution error during bean creation.
    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @PostConstruct
    void validate() {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("${")) {
            throw new IllegalStateException("""

                    OPENAI_API_KEY is not set.

                    Set it in the same terminal that runs the app, then restart:
                        PowerShell:  $env:OPENAI_API_KEY = "sk-..."
                        bash/zsh:    export OPENAI_API_KEY="sk-..."

                    Get a key at https://platform.openai.com/api-keys
                    """);
        }
    }
}
