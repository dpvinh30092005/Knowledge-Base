package com.zjtcoder.englishapp.backend.dao;

import com.zjtcoder.englishapp.backend.db.DBConnection;
import com.zjtcoder.englishapp.core.model.Vocabulary;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

// JDBC-backed DAO using PreparedStatement and entity mapping only.
public class VocabularyDAOImpl implements VocabularyDAO {

    @Override
    public List<Vocabulary> findAll() throws SQLException, ClassNotFoundException {
        List<Vocabulary> list = new ArrayList<>();
        String sql = "SELECT id, word, meaning, created_at FROM vocabularies ORDER BY id";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();
            while (rs.next()) {
                Vocabulary v = new Vocabulary();
                v.setId(rs.getInt("id"));
                v.setWord(rs.getString("word"));
                v.setMeaning(rs.getString("meaning"));
                Timestamp created = rs.getTimestamp("created_at");
                if (created != null) {
                    v.setCreatedAt(created.toLocalDateTime());
                }
                list.add(v);
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
    public void insert(Vocabulary vocabulary) throws SQLException, ClassNotFoundException {
        insertAndReturnId(vocabulary);
    }

    @Override
    public int insertAndReturnId(Vocabulary vocabulary) throws SQLException, ClassNotFoundException {
        String sql = "INSERT INTO vocabularies (word, meaning) VALUES (?, ?)";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        int generatedId = 0;

        try {
            conn = DBConnection.getConnection();
            ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, vocabulary.getWord());
            ps.setString(2, vocabulary.getMeaning());
            ps.executeUpdate();
            rs = ps.getGeneratedKeys();
            if (rs.next()) {
                generatedId = rs.getInt(1);
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

        return generatedId;
    }
}
