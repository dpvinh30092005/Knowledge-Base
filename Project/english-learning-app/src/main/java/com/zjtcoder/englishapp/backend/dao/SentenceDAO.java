package com.zjtcoder.englishapp.backend.dao;

import com.zjtcoder.englishapp.core.model.Sentence;

import java.sql.SQLException;
import java.util.List;

// DAO contract for persistence operations using entities only.
public interface SentenceDAO {
    List<Sentence> findByVocabularyId(int vocabularyId) throws SQLException, ClassNotFoundException;
    void insert(Sentence sentence) throws SQLException, ClassNotFoundException;
}
