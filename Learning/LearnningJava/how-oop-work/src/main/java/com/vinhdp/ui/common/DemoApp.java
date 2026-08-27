package com.vinhdp.ui.common;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

/**
 * Khung chung cho cả 4 demo: header + vùng nội dung + panel log bên phải.
 * Mỗi khái niệm OOP vẫn là một app riêng, chỉ dùng chung phần khung này.
 */
public abstract class DemoApp extends Application {

    protected final LogPanel log = new LogPanel();

    /** Tên khái niệm, hiện ở thanh tiêu đề. */
    protected abstract String title();

    /** Một câu mô tả demo này chứng minh điều gì. */
    protected abstract String subtitle();

    /** Nội dung tương tác của riêng từng demo. */
    protected abstract Node buildContent();

    @Override
    public void start(Stage stage) {
        Label titleLabel = new Label(title());
        titleLabel.getStyleClass().add("header-title");

        Label subtitleLabel = new Label(subtitle());
        subtitleLabel.getStyleClass().add("header-subtitle");
        subtitleLabel.setWrapText(true);

        VBox header = new VBox(4, titleLabel, subtitleLabel);
        header.getStyleClass().add("header");

        Node content = buildContent();
        if (content instanceof javafx.scene.layout.Region region) {
            region.setPadding(new Insets(18));
        }
        HBox.setHgrow(content, Priority.ALWAYS);

        HBox body = showLog() ? new HBox(content, log) : new HBox(content);

        BorderPane root = new BorderPane();
        root.setTop(header);
        root.setCenter(body);

        Scene scene = new Scene(root, sceneWidth(), sceneHeight());
        scene.getStylesheets().add(
                DemoApp.class.getResource("/css/demo.css").toExternalForm());

        stage.setTitle("OOP — " + title());
        stage.setScene(scene);
        stage.show();

        onReady();
    }

    /** Gọi sau khi cửa sổ hiện ra — thường dùng để ghi vài dòng log mở đầu. */
    protected void onReady() {
    }

    /** Demo nào tự lo phần diễn giải thì tắt panel log đi cho rộng chỗ. */
    protected boolean showLog() {
        return true;
    }

    protected double sceneWidth() {
        return 1180;
    }

    protected double sceneHeight() {
        return 720;
    }
}
