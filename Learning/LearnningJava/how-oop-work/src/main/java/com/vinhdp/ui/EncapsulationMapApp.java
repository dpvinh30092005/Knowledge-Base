package com.vinhdp.ui;

import com.vinhdp.ui.access.AccessModel;
import com.vinhdp.ui.access.AccessModel.Member;
import com.vinhdp.ui.access.AccessModel.Verdict;
import com.vinhdp.ui.access.AccessModel.Viewer;
import com.vinhdp.ui.access.PackageCanvas;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

public class EncapsulationMapApp extends DemoApp {

    private final PackageCanvas canvas = new PackageCanvas();
    private final VBox memberRows = new VBox(2);
    private final Label viewerRole = new Label();
    private final Label viewerPackage = new Label();
    private final Label scoreValue = new Label();
    private final Label snippet = new Label();
    private final Label snippetTitle = new Label();
    private final ComboBox<String> viewerPicker = new ComboBox<>();

    private Viewer viewer = AccessModel.VIEWERS.get(3);

    @Override
    protected String title() {
        return "Encapsulation — bản đồ package và tầm với";
    }

    @Override
    protected String subtitle() {
        return "Cùng một class TheATM, nhưng mỗi nơi nhìn vào lại thấy một phần khác nhau. "
                + "Package và kế thừa quyết định ai chạm được tới đâu.";
    }

    @Override
    protected boolean showLog() {
        return false;
    }

    @Override
    protected double sceneWidth() {
        return 1320;
    }

    @Override
    protected double sceneHeight() {
        return 840;
    }

    @Override
    protected Node buildContent() {

        canvas.setOnSelect(this::selectByName);

        viewerPicker.setItems(FXCollections.observableArrayList(
                AccessModel.VIEWERS.stream().map(Viewer::name).toList()));
        viewerPicker.setPrefWidth(200);
        viewerPicker.setOnAction(e -> selectByName(viewerPicker.getValue()));

        viewerRole.setWrapText(true);
        viewerRole.setStyle("-fx-font-size: 12.5px; -fx-text-fill: #334155;");
        viewerPackage.getStyleClass().add("code");

        VBox viewerCard = UiKit.card("Ai đang nhìn vào TheATM",
                UiKit.row(12, viewerPicker, viewerPackage,
                        UiKit.grow(), UiKit.metric("Chạm được", scoreValue)),
                viewerRole);

        VBox diagramCard = UiKit.card(null, canvas);

        snippetTitle.setStyle("-fx-font-size: 12px; -fx-text-fill: #64748b;");
        snippet.setStyle("-fx-font-family: Consolas; -fx-font-size: 12.5px; "
                + "-fx-text-fill: #1f2430;");
        VBox snippetCard = UiKit.card(null, snippetTitle, snippet);

        VBox left = new VBox(12, diagramCard, viewerCard, snippetCard);

        // --- cột phải: danh sách member ---
        ScrollPane scroller = new ScrollPane(memberRows);
        scroller.setFitToWidth(true);
        scroller.setPrefHeight(560);
        scroller.setStyle("-fx-background-color: transparent; -fx-background: transparent;");

        VBox memberCard = UiKit.card("TheATM — 19 member (theo javap -p)",
                scroller,
                UiKit.muted("Bấm vào một dòng để xem đoạn code tương ứng compile được hay không."));
        memberCard.setPrefWidth(560);
        VBox.setVgrow(scroller, Priority.ALWAYS);

        VBox legend = UiKit.card(null, UiKit.row(18,
                legendDot("#dc2626", "private"),
                legendDot("#d97706", "package-private"),
                legendDot("#7c3aed", "protected"),
                legendDot("#16a34a", "public")));

        VBox right = new VBox(12, memberCard, legend);
        VBox.setVgrow(memberCard, Priority.ALWAYS);

        HBox body = new HBox(14, left, right);
        HBox.setHgrow(right, Priority.ALWAYS);

        ScrollPane page = new ScrollPane(body);
        page.setFitToWidth(true);
        page.setFitToHeight(true);
        page.setStyle("-fx-background-color: transparent; -fx-background: transparent;");
        return page;
    }

    private Node legendDot(String color, String text) {
        Label label = new Label(text);
        label.getStyleClass().add("muted");
        return UiKit.row(6, UiKit.dot(color), label);
    }

    @Override
    protected void onReady() {
        selectByName("Main");
    }

    private void selectByName(String name) {
        AccessModel.VIEWERS.stream()
                .filter(candidate -> candidate.name().equals(name))
                .findFirst()
                .ifPresent(found -> {
                    viewer = found;
                    canvas.select(name);
                    if (!name.equals(viewerPicker.getValue())) {
                        viewerPicker.setValue(name);
                    }
                    refresh();
                });
    }

    private void refresh() {
        viewerPackage.setText(viewer.packageName());
        viewerRole.setText(viewer.role());

        long reachable = AccessModel.MEMBERS.stream()
                .filter(member -> AccessModel.check(member, viewer) != Verdict.NO)
                .count();
        scoreValue.setText(reachable + " / " + AccessModel.MEMBERS.size());

        memberRows.getChildren().clear();
        for (Member member : AccessModel.MEMBERS) {
            memberRows.getChildren().add(memberRow(member));
        }

        showSnippet(AccessModel.MEMBERS.get(2)); // balance — ví dụ kinh điển
    }

    private Node memberRow(Member member) {
        Verdict verdict = AccessModel.check(member, viewer);

        Label level = new Label(member.level().label);
        level.setMinWidth(128);
        level.setStyle("-fx-font-family: Consolas; -fx-font-size: 11.5px; -fx-font-weight: bold;"
                + "-fx-text-fill: " + member.level().color + ";");

        Label signature = new Label(member.signature());
        signature.setStyle("-fx-font-family: Consolas; -fx-font-size: 12px; "
                + "-fx-text-fill: " + (verdict == Verdict.NO ? "#94a3b8" : "#1f2430") + ";");

        Label mark = new Label(verdict.label);
        mark.setMinWidth(104);
        mark.setStyle("-fx-font-size: 11px; -fx-font-weight: bold; -fx-padding: 2 8 2 8;"
                + "-fx-background-radius: 10; -fx-text-fill: " + verdict.color + ";"
                + "-fx-background-color: " + verdict.fill + ";");

        HBox row = UiKit.row(10, mark, level, signature);
        row.setPadding(new Insets(2, 8, 2, 8));
        row.setStyle("-fx-background-radius: 6; -fx-background-color: "
                + (verdict == Verdict.NO ? "#fafafa" : "white") + ";"
                + "-fx-border-color: #eef1f5; -fx-border-radius: 6;");
        row.setOnMouseClicked(e -> showSnippet(member));
        row.setCursor(javafx.scene.Cursor.HAND);
        return row;
    }

    private void showSnippet(Member member) {
        snippetTitle.setText(viewer.name() + " -> " + member.signature()
                + "   ·   " + AccessModel.reason(member, viewer));
        snippet.setText(AccessModel.snippet(member, viewer));
    }

    public static void main(String[] args) {
        launch(args);
    }
}
