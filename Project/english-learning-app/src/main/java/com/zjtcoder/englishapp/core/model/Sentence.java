package com.zjtcoder.englishapp.core.model;

import java.time.LocalDateTime;

// Entity used by DAO and persistence layer.
public class Sentence {
    private int id;
    private int vocabularyId;
    private String content;
    private String source;
    private LocalDateTime createdAt;

    public Sentence() {
    }

    public Sentence(int id, int vocabularyId, String content, String source, LocalDateTime createdAt) {
        this.id = id;
        this.vocabularyId = vocabularyId;
        this.content = content;
        this.source = source;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getVocabularyId() {
        return vocabularyId;
    }

    public void setVocabularyId(int vocabularyId) {
        this.vocabularyId = vocabularyId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
