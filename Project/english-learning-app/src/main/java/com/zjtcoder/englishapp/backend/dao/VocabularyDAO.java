package com.zjtcoder.englishapp.backend.dao;

import com.zjtcoder.englishapp.core.model.Vocabulary;

import java.sql.SQLException;
import java.util.List;

// DAO contract for persistence operations using entities only.
public interface VocabularyDAO {
    List<Vocabulary> findAll() throws SQLException, ClassNotFoundException;
    void insert(Vocabulary vocabulary) throws SQLException, ClassNotFoundException;
    int insertAndReturnId(Vocabulary vocabulary) throws SQLException, ClassNotFoundException;
}
