package com.demo.chatwithdocs.dto;

import java.util.List;

/**
 * A chat turn. {@code question} is the current user message; {@code history} is
 * the prior conversation (oldest first) so follow-up questions using pronouns
 * like "it" or "that" keep their context. History is optional (may be null).
 */
public record ChatRequest(String question, List<Turn> history) {

    public record Turn(String role, String content) {
    }
}
