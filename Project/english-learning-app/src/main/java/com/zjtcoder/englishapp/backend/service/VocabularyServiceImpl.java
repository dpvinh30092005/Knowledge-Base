package com.zjtcoder.englishapp.backend.service;

import com.zjtcoder.englishapp.backend.dao.SentenceDAO;
import com.zjtcoder.englishapp.backend.dao.SentenceDAOImpl;
import com.zjtcoder.englishapp.backend.dao.VocabularyDAO;
import com.zjtcoder.englishapp.backend.dao.VocabularyDAOImpl;
import com.zjtcoder.englishapp.core.dto.VocabularyDTO;
import com.zjtcoder.englishapp.core.model.Sentence;
import com.zjtcoder.englishapp.core.model.Vocabulary;
import com.zjtcoder.englishapp.core.service.VocabularyService;

import java.sql.SQLException;
import java.util.List;

// Service implementation that maps between Model and DTO.
public class VocabularyServiceImpl implements VocabularyService {

    private final VocabularyDAO dao;
    private final SentenceDAO sentenceDao;

    public VocabularyServiceImpl() {
        this(new VocabularyDAOImpl(), new SentenceDAOImpl());
    }

    public VocabularyServiceImpl(VocabularyDAO dao, SentenceDAO sentenceDao) {
        this.dao = dao;
        this.sentenceDao = sentenceDao;
    }

    @Override
    public List<VocabularyDTO> getAllWords() {
        try {
            return dao.findAll().stream()
                    .map(this::toDTO)
                    .toList();
        } catch (SQLException ex) {
            throw new RuntimeException(buildSqlMessage(ex), ex);
        } catch (ClassNotFoundException ex) {
            throw new RuntimeException(buildClassNotFoundMessage(ex), ex);
        }
    }

    @Override
    public void addWordWithSentence(String word, String sentence) {
        Vocabulary v = new Vocabulary();
        v.setWord(word);
        v.setMeaning("");
        try {
            int vocabularyId = dao.insertAndReturnId(v);
            if (vocabularyId <= 0) {
                throw new SQLException("No vocabulary id generated.");
            }
            Sentence s = new Sentence();
            s.setVocabularyId(vocabularyId);
            s.setContent(sentence);
            s.setSource("manual");
            sentenceDao.insert(s);
        } catch (SQLException ex) {
            throw new RuntimeException(buildSqlMessage(ex), ex);
        } catch (ClassNotFoundException ex) {
            throw new RuntimeException(buildClassNotFoundMessage(ex), ex);
        }
    }

    private VocabularyDTO toDTO(Vocabulary v) {
        return new VocabularyDTO(
                v.getId(),
                v.getWord(),
                v.getMeaning(),
                List.of()
        );
    }

    private Vocabulary toModel(VocabularyDTO dto) {
        Vocabulary v = new Vocabulary();
        v.setWord(dto.getWord());
        v.setMeaning(dto.getMeaning());
        return v;
    }

    private String buildSqlMessage(SQLException ex) {
        return getClass().getSimpleName() + " SQLExeption " + ex.getMessage();
    }

    private String buildClassNotFoundMessage(ClassNotFoundException ex) {
        return getClass().getSimpleName() + " ClassNotFoundException " + ex.getMessage();
    }
}
