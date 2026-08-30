package com.zjtcoder.englishapp.core.model;

import java.time.LocalDateTime;

// Entity used by DAO and persistence layer.
public class Vocabulary {
    private int id;
    private String word;
    private String meaning;
    private LocalDateTime createdAt;

    public Vocabulary() {
    }

    public Vocabulary(int id, String word, String meaning, LocalDateTime createdAt) {
        this.id = id;
        this.word = word;
        this.meaning = meaning;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getMeaning() {
        return meaning;
    }

    public void setMeaning(String meaning) {
        this.meaning = meaning;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
