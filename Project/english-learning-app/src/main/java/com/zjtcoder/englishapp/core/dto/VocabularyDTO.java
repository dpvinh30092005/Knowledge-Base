package com.zjtcoder.englishapp.core.dto;

import java.util.List;

// DTO used by UI/ViewModel and service boundaries.
public class VocabularyDTO {
    private final int id;
    private final String word;
    private final String meaning;
    private final List<String> sentences;

    public VocabularyDTO(int id, String word, String meaning, List<String> sentences) {
        this.id = id;
        this.word = word;
        this.meaning = meaning;
        this.sentences = sentences == null ? List.of() : List.copyOf(sentences);
    }

    public int getId() {
        return id;
    }

    public String getWord() {
        return word;
    }

    public String getMeaning() {
        return meaning;
    }

    public List<String> getSentences() {
        return sentences;
    }
}
