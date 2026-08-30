package com.zjtcoder.englishapp.core.service;

import com.zjtcoder.englishapp.core.dto.VocabularyDTO;

import java.util.List;

// Core interface for vocabulary-related use cases.
public interface VocabularyService {
    List<VocabularyDTO> getAllWords();
    void addWordWithSentence(String word, String sentence);
}
