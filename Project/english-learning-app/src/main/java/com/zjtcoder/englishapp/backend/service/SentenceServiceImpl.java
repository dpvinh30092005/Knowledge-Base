package com.zjtcoder.englishapp.backend.service;

import com.zjtcoder.englishapp.backend.dao.SentenceDAO;
import com.zjtcoder.englishapp.backend.dao.SentenceDAOImpl;
import com.zjtcoder.englishapp.core.dto.SentenceDTO;
import com.zjtcoder.englishapp.core.model.Sentence;
import com.zjtcoder.englishapp.core.service.SentenceService;

import java.sql.SQLException;
import java.util.List;

// Service implementation that maps between Model and DTO.
public class SentenceServiceImpl implements SentenceService {

    private final SentenceDAO dao;

    public SentenceServiceImpl() {
        this(new SentenceDAOImpl());
    }

    public SentenceServiceImpl(SentenceDAO dao) {
        this.dao = dao;
    }

    @Override
    public List<SentenceDTO> getByVocabularyId(int vocabularyId) {
        try {
            return dao.findByVocabularyId(vocabularyId).stream()
                    .map(this::toDTO)
                    .toList();
        } catch (SQLException ex) {
            throw new RuntimeException(buildSqlMessage(ex), ex);
        } catch (ClassNotFoundException ex) {
            throw new RuntimeException(buildClassNotFoundMessage(ex), ex);
        }
    }

    @Override
    public void addSentence(SentenceDTO dto) {
        Sentence sentence = toModel(dto);
        try {
            dao.insert(sentence);
        } catch (SQLException ex) {
            throw new RuntimeException(buildSqlMessage(ex), ex);
        } catch (ClassNotFoundException ex) {
            throw new RuntimeException(buildClassNotFoundMessage(ex), ex);
        }
    }

    private SentenceDTO toDTO(Sentence sentence) {
        return new SentenceDTO(
                sentence.getVocabularyId(),
                sentence.getContent(),
                sentence.getSource()
        );
    }

    private Sentence toModel(SentenceDTO dto) {
        Sentence sentence = new Sentence();
        sentence.setVocabularyId(dto.getVocabularyId());
        sentence.setContent(dto.getContent());
        sentence.setSource(dto.getSource());
        return sentence;
    }

    private String buildSqlMessage(SQLException ex) {
        return getClass().getSimpleName() + " SQLExeption " + ex.getMessage();
    }

    private String buildClassNotFoundMessage(ClassNotFoundException ex) {
        return getClass().getSimpleName() + " ClassNotFoundException " + ex.getMessage();
    }
}
