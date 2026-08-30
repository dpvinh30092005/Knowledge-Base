package com.zjtcoder.englishapp.core.service;

import com.zjtcoder.englishapp.core.dto.SentenceDTO;

import java.util.List;

// Core interface for sentence-related use cases.
public interface SentenceService {
    List<SentenceDTO> getByVocabularyId(int vocabularyId);
    void addSentence(SentenceDTO dto);
}
