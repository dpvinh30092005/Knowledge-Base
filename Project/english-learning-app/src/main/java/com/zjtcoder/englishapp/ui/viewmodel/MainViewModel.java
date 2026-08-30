package com.zjtcoder.englishapp.ui.viewmodel;

import com.zjtcoder.englishapp.core.dto.VocabularyDTO;
import com.zjtcoder.englishapp.core.dto.SentenceDTO;
import com.zjtcoder.englishapp.core.service.SentenceService;
import com.zjtcoder.englishapp.core.service.VocabularyService;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

import java.util.List;

// ViewModel exposing JavaFX properties for UI binding.
public class MainViewModel {

    private final VocabularyService vocabularyService;
    private final SentenceService sentenceService;
    private final ObservableList<VocabularyDTO> words = FXCollections.observableArrayList();
    private final ObservableList<String> sentences = FXCollections.observableArrayList();
    private final StringProperty inputWord = new SimpleStringProperty("");
    private final StringProperty inputSentence = new SimpleStringProperty("");

    public MainViewModel(VocabularyService vocabularyService, SentenceService sentenceService) {
        this.vocabularyService = vocabularyService;
        this.sentenceService = sentenceService;
    }

    public ObservableList<VocabularyDTO> getWords() {
        return words;
    }

    public ObservableList<String> getSentences() {
        return sentences;
    }

    public StringProperty inputWordProperty() {
        return inputWord;
    }

    public StringProperty inputSentenceProperty() {
        return inputSentence;
    }

    public void loadWords() {
        List<VocabularyDTO> dtos = vocabularyService.getAllWords();
        words.setAll(dtos);
    }

    public void addWord() {
        String word = inputWord.get();
        String sentence = inputSentence.get();
        if (word == null || word.isBlank() || sentence == null || sentence.isBlank()) {
            return;
        }

        vocabularyService.addWordWithSentence(word.trim(), sentence.trim());
        inputWord.set("");
        inputSentence.set("");
        loadWords();
    }

    public void loadSentences(VocabularyDTO selected) {
        if (selected == null) {
            sentences.clear();
            return;
        }

        List<SentenceDTO> dtos = sentenceService.getByVocabularyId(selected.getId());
        sentences.setAll(dtos.stream().map(SentenceDTO::getContent).toList());
    }
}
