package com.zjtcoder.englishapp.ui;

import com.zjtcoder.englishapp.backend.service.VocabularyServiceImpl;
import com.zjtcoder.englishapp.backend.service.SentenceServiceImpl;
import com.zjtcoder.englishapp.core.service.SentenceService;
import com.zjtcoder.englishapp.core.service.VocabularyService;
import com.zjtcoder.englishapp.ui.controller.MainController;
import com.zjtcoder.englishapp.ui.viewmodel.MainViewModel;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

// App entry point that wires JavaFX to the UI layer.
public class App extends Application {
    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(App.class.getResource("/fxml/MainView.fxml"));

        VocabularyService service = new VocabularyServiceImpl();
        SentenceService sentenceService = new SentenceServiceImpl();
        MainViewModel viewModel = new MainViewModel(service, sentenceService);
        fxmlLoader.setControllerFactory(type -> {
            if (type == MainController.class) {
                return new MainController(viewModel);
            }
            try {
                return type.getDeclaredConstructor().newInstance();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        Scene scene = new Scene(fxmlLoader.load(), 800, 600);
        var stylesheet = App.class.getResource("/css/app.css");
        if (stylesheet == null) {
            throw new IllegalStateException("Missing stylesheet: /css/app.css");
        }
        scene.getStylesheets().add(stylesheet.toExternalForm());
        stage.setTitle("English Learning App");
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
