package com.zjtcoder.englishapp.backend.dao;

import com.zjtcoder.englishapp.backend.db.DBConnection;
import com.zjtcoder.englishapp.core.model.Sentence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

// JDBC-backed DAO using PreparedStatement and entity mapping only.
public class SentenceDAOImpl implements SentenceDAO {

    @Override
    public List<Sentence> findByVocabularyId(int vocabularyId) throws SQLException, ClassNotFoundException {
        List<Sentence> list = new ArrayList<>();
        String sql = "SELECT id, vocabulary_id, content, source, created_at FROM sentences WHERE vocabulary_id = ? ORDER BY id";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, vocabularyId);
            rs = ps.executeQuery();
            while (rs.next()) {
                Sentence s = new Sentence();
                s.setId(rs.getInt("id"));
                s.setVocabularyId(rs.getInt("vocabulary_id"));
                s.setContent(rs.getString("content"));
                s.setSource(rs.getString("source"));
                Timestamp created = rs.getTimestamp("created_at");
                if (created != null) {
                    s.setCreatedAt(created.toLocalDateTime());
                }
                list.add(s);
            }
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }

        return list;
    }

    @Override
    public void insert(Sentence sentence) throws SQLException, ClassNotFoundException {
        String sql = "INSERT INTO sentences (vocabulary_id, content, source) VALUES (?, ?, ?)";
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            conn = DBConnection.getConnection();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, sentence.getVocabularyId());
            ps.setString(2, sentence.getContent());
            ps.setString(3, sentence.getSource());
            ps.executeUpdate();
        } finally {
            if (ps != null) {
                ps.close();
            }
            if (conn != null) {
                conn.close();
            }
        }
    }
}
