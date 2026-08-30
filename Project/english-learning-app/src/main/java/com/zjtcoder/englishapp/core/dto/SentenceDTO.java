package com.zjtcoder.englishapp.core.dto;

// DTO used by UI/ViewModel and service boundaries.
public class SentenceDTO {
    private final int vocabularyId;
    private final String content;
    private final String source;

    public SentenceDTO(int vocabularyId, String content, String source) {
        this.vocabularyId = vocabularyId;
        this.content = content;
        this.source = source;
    }

    public int getVocabularyId() {
        return vocabularyId;
    }

    public String getContent() {
        return content;
    }

    public String getSource() {
        return source;
    }
}
