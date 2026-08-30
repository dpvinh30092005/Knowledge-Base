package com.vinhdp.ui.jvm;

import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import com.vinhdp.ui.jvm.VmModel.BytecodeLine;
import com.vinhdp.ui.jvm.VmModel.Snapshot;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Slider;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.util.Duration;

import java.util.List;

/**
 * Khung chung cho các demo "mổ ruột JVM": cột bytecode bên trái, canvas bộ nhớ bên phải,
 * cùng bộ nút Step / Back / Auto play. Mỗi kịch bản chỉ cần cung cấp bytecode và các bước.
 */
public abstract class JvmStepperApp extends DemoApp {

    private final VmCanvas canvas = new VmCanvas();

    private final Label headline = new Label();
    private final Label note = new Label();
    private final Label counter = new Label();
    private final Slider speed = new Slider(300, 2500, 1100);

    private ListView<BytecodeLine> bytecodeList;
    private List<Snapshot> steps;
    private Timeline player;
    private int index;

    /** Các bước mô phỏng, dựng sẵn một lần. */
    protected abstract List<Snapshot> steps();

    /** Danh sách bytecode hiển thị ở cột trái; offset âm nghĩa là dòng tiêu đề method. */
    protected abstract List<BytecodeLine> bytecode();

    protected abstract String bytecodeTitle();

    /** Một câu chốt đặt dưới cột bytecode. */
    protected abstract String bytecodeHint();

    @Override
    protected boolean showLog() {
        return false;
    }

    @Override
    protected double sceneWidth() {
        return 1340;
    }

    @Override
    protected double sceneHeight() {
        return 850;
    }

    @Override
    protected Node buildContent() {
        steps = steps();
        bytecodeList = new ListView<>(FXCollections.observableArrayList(bytecode()));
        bytecodeList.setPrefWidth(292);
        bytecodeList.setFocusTraversable(false);
        bytecodeList.setCellFactory(view -> new ListCell<>() {
            @Override
            protected void updateItem(BytecodeLine item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                    return;
                }
                boolean header = item.offset() < 0;
                boolean current = getIndex() == steps.get(index).bytecodeLine();

                setText(header
                        ? item.opcode()
                        : String.format("%3d: %-14s %-4s %s",
                                item.offset(), item.opcode(), item.operand(),
                                item.comment().isEmpty() ? "" : "// " + item.comment()));

                String base = "-fx-font-family: Consolas; -fx-font-size: 11.5px;";
                if (header) {
                    setStyle(base + "-fx-background-color: #e2e8f0; -fx-text-fill: #0f172a;"
                            + "-fx-font-weight: bold; -fx-padding: 4 0 4 0;");
                } else if (current) {
                    setStyle(base + "-fx-background-color: #fef3c7; -fx-text-fill: #92400e;"
                            + "-fx-font-weight: bold;");
                } else {
                    setStyle(base + "-fx-text-fill: #475569;");
                }
            }
        });

        VBox bytecodeCard = UiKit.card(bytecodeTitle(), bytecodeList, UiKit.muted(bytecodeHint()));
        VBox.setVgrow(bytecodeList, Priority.ALWAYS);
        bytecodeCard.setPrefWidth(320);

        Button resetButton = new Button("Reset");
        resetButton.setOnAction(e -> {
            stopPlayer();
            show(0);
        });

        Button backButton = new Button("< Back");
        backButton.setOnAction(e -> {
            stopPlayer();
            show(Math.max(0, index - 1));
        });

        Button stepButton = UiKit.primary("Step >");
        stepButton.setOnAction(e -> {
            stopPlayer();
            show(Math.min(steps.size() - 1, index + 1));
        });

        Button playButton = UiKit.primary("Auto play");
        playButton.setOnAction(e -> {
            if (player != null && player.getStatus() == Animation.Status.RUNNING) {
                stopPlayer();
                playButton.setText("Auto play");
                return;
            }
            playButton.setText("Pause");
            player = new Timeline(new KeyFrame(Duration.millis(speed.getValue()), ev -> {
                if (index >= steps.size() - 1) {
                    stopPlayer();
                    playButton.setText("Auto play");
                    return;
                }
                show(index + 1);
            }));
            player.setCycleCount(Animation.INDEFINITE);
            player.play();
        });

        speed.setPrefWidth(150);
        speed.setShowTickMarks(true);

        HBox controls = UiKit.row(10, resetButton, backButton, stepButton, playButton,
                new Label("Chậm"), speed, new Label("Nhanh"),
                UiKit.grow(), counter);
        controls.setPadding(new Insets(4, 2, 0, 2));

        headline.setStyle("-fx-font-family: Consolas; -fx-font-size: 13.5px; "
                + "-fx-font-weight: bold; -fx-text-fill: #1f2430;");
        note.setWrapText(true);
        note.setStyle("-fx-font-size: 12.5px; -fx-text-fill: #334155;");
        note.setMinHeight(56);

        VBox explain = UiKit.card(null, headline, note);
        VBox legend = UiKit.card(null, UiKit.row(16, legendItems()));

        VBox stage = new VBox(12, canvas, explain, controls, legend);
        stage.setPadding(new Insets(0, 0, 0, 14));

        HBox body = new HBox(14, bytecodeCard, stage);
        ScrollPane scroller = new ScrollPane(body);
        scroller.setFitToWidth(true);
        scroller.setFitToHeight(true);
        scroller.setStyle("-fx-background-color: transparent; -fx-background: transparent;");
        return scroller;
    }

    /** Kịch bản nào cần chú thích màu khác thì override. */
    protected Node[] legendItems() {
        return new Node[]{
                legendItem("#2563eb", "reference"),
                legendItem("#7c3aed", "klass pointer"),
                legendItem("#dc2626", "vtable tra lên cha"),
                legendItem("#ea580c", "invokespecial"),
                legendItem("#16a34a", "vừa được ghi / method thắng")};
    }

    protected Node legendItem(String color, String text) {
        Label label = new Label(text);
        label.getStyleClass().add("muted");
        return UiKit.row(6, UiKit.dot(color), label);
    }

    @Override
    protected void onReady() {
        show(0);
    }

    private void show(int target) {
        index = target;
        Snapshot state = steps.get(index);
        canvas.render(state);
        headline.setText(state.headline());
        note.setText(state.note());
        counter.setText("Bước " + (index + 1) + " / " + steps.size());
        bytecodeList.scrollTo(Math.max(0, state.bytecodeLine() - 4));
        bytecodeList.refresh();
    }

    private void stopPlayer() {
        if (player != null) {
            player.stop();
        }
    }
}
