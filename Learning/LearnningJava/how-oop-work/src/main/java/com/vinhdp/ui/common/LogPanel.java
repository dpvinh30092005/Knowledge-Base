package com.vinhdp.ui.common;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

/**
 * Console thu nhỏ nằm ngay trong app: mỗi lần bấm nút thì ghi lại
 * đã gọi method nào và kết quả ra sao.
 */
public class LogPanel extends VBox {

    public enum Level {
        CALL("#93c5fd"),
        OK("#86efac"),
        ERROR("#fca5a5"),
        NOTE("#fcd34d"),
        INFO("#94a3b8");

        final String color;

        Level(String color) {
            this.color = color;
        }
    }

    private record Entry(Level level, String message) {
    }

    private final ObservableList<Entry> entries = FXCollections.observableArrayList();
    private final ListView<Entry> listView = new ListView<>(entries);

    public LogPanel() {
        getStyleClass().add("log-panel");
        setPrefWidth(430);
        setMinWidth(300);

        Label title = new Label("Call log");
        title.getStyleClass().add("log-title");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Button clear = new Button("Clear");
        clear.setOnAction(e -> entries.clear());

        HBox header = new HBox(8, title, spacer, clear);
        header.setAlignment(Pos.CENTER_LEFT);
        header.setPadding(new Insets(14, 12, 10, 14));

        listView.getStyleClass().add("log-list");
        listView.setCellFactory(v -> new ListCell<>() {
            @Override
            protected void updateItem(Entry item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                    return;
                }
                setText(item.message());
                setStyle("-fx-text-fill: " + item.level().color + ";");
                setWrapText(true);
            }
        });
        VBox.setVgrow(listView, Priority.ALWAYS);

        getChildren().addAll(header, listView);
    }

    public void call(String message) {
        append(Level.CALL, "> " + message);
    }

    public void ok(String message) {
        append(Level.OK, "  " + message);
    }

    public void error(String message) {
        append(Level.ERROR, "  x " + message);
    }

    public void note(String message) {
        append(Level.NOTE, "  # " + message);
    }

    public void info(String message) {
        append(Level.INFO, "  " + message);
    }

    public void divider(String title) {
        append(Level.INFO, "");
        append(Level.INFO, "--- " + title + " ---");
    }

    private void append(Level level, String message) {
        entries.add(new Entry(level, message));
        listView.scrollTo(entries.size() - 1);
    }
}
