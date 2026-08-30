package com.zjtcoder.englishapp.ui.controller;

import com.zjtcoder.englishapp.ui.viewmodel.MainViewModel;
import com.zjtcoder.englishapp.core.dto.VocabularyDTO;
import javafx.fxml.FXML;
import javafx.scene.control.ListView;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;

public class MainController {

    @FXML
    private TextField inputWord;

    @FXML
    private TextArea inputSentence;

    @FXML
    private ListView<VocabularyDTO> wordList;

    @FXML
    private ListView<String> sentenceList;

    private final MainViewModel viewModel;

    public MainController(MainViewModel viewModel) {
        this.viewModel = viewModel;
    }

    @FXML
    public void initialize() {
        inputWord.textProperty().bindBidirectional(viewModel.inputWordProperty());
        inputSentence.textProperty().bindBidirectional(viewModel.inputSentenceProperty());
        wordList.setItems(viewModel.getWords());
        sentenceList.setItems(viewModel.getSentences());
        wordList.setCellFactory(list -> new javafx.scene.control.ListCell<>() {
            @Override
            protected void updateItem(VocabularyDTO item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.getWord());
            }
        });
        wordList.getSelectionModel().selectedItemProperty().addListener((obs, oldValue, newValue) ->
                viewModel.loadSentences(newValue)
        );
        viewModel.loadWords();
    }

    @FXML
    private void onAddWord() {
        viewModel.addWord();
    }
}
