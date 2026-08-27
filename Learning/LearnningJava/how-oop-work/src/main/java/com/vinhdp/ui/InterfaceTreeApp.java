package com.vinhdp.ui;

import com.vinhdp.abstraction.multi.EmailAlert;
import com.vinhdp.abstraction.multi.LegacyAlert;
import com.vinhdp.abstraction.multi.MultiAlert;
import com.vinhdp.abstraction.multi.Notifier;
import com.vinhdp.abstraction.multi.PlainAlert;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import com.vinhdp.ui.multi.DefaultMethodModel;
import com.vinhdp.ui.multi.DefaultMethodModel.Scenario;
import com.vinhdp.ui.multi.DefaultMethodModel.Step;
import com.vinhdp.ui.multi.TypeGraphCanvas;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Cây interface đa kế thừa: khi nhiều default method cùng tên rơi vào một class,
 * Java chọn bản nào và chọn theo luật gì.
 */
public class InterfaceTreeApp extends DemoApp {

    private final TypeGraphCanvas canvas = new TypeGraphCanvas();

    private final Label declaration = new Label();
    private final Label ruleBadge = new Label();
    private final Label headline = new Label();
    private final Label note = new Label();
    private final Label counter = new Label();
    private final Label codeBlock = new Label();
    private final Label liveResult = new Label();
    private final Button stepButton = UiKit.primary("Bước tiếp >");
    private final Button backButton = new Button("< Lùi");

    private final Map<String, ToggleButton> tabButtons = new HashMap<>();

    private Scenario scenario = DefaultMethodModel.SCENARIOS.get(0);
    private int stepIndex;

    @Override
    protected String title() {
        return "Đa kế thừa interface — default method tranh nhau";
    }

    @Override
    protected String subtitle() {
        return "Java cho implements nhiều interface cùng lúc. Khi hai interface cùng có "
                + "default method trùng tên, ai thắng? Có đúng ba luật, và một trường hợp "
                + "compiler chịu thua.";
    }

    @Override
    protected boolean showLog() {
        return false;
    }

    @Override
    protected double sceneWidth() {
        return 1280;
    }

    @Override
    protected double sceneHeight() {
        return 840;
    }

    @Override
    protected Node buildContent() {

        // --- chọn kịch bản ---
        ToggleGroup group = new ToggleGroup();
        HBox tabs = new HBox(8);
        for (Scenario candidate : DefaultMethodModel.SCENARIOS) {
            ToggleButton button = new ToggleButton(candidate.className());
            button.setToggleGroup(group);
            button.setSelected(candidate == scenario);
            button.setOnAction(e -> select(candidate));
            tabButtons.put(candidate.className(), button);
            tabs.getChildren().add(button);
        }

        declaration.getStyleClass().add("code");
        ruleBadge.getStyleClass().addAll("badge", "warn");

        VBox pickerCard = UiKit.card("Bốn tình huống",
                tabs,
                UiKit.row(10, declaration, UiKit.grow(), ruleBadge));

        // --- sơ đồ ---
        VBox graphCard = UiKit.card(null, canvas);

        // --- giải thích từng bước ---
        headline.setStyle("-fx-font-family: Consolas; -fx-font-size: 13.5px; "
                + "-fx-font-weight: bold; -fx-text-fill: #1f2430;");
        note.setWrapText(true);
        note.setStyle("-fx-font-size: 12.5px; -fx-text-fill: #334155;");
        note.setMinHeight(72);

        backButton.setOnAction(e -> showStep(stepIndex - 1));
        stepButton.setOnAction(e -> showStep(stepIndex + 1));

        VBox explainCard = UiKit.card(null,
                headline, note,
                UiKit.row(10, backButton, stepButton, UiKit.grow(), counter));

        VBox left = new VBox(12, pickerCard, graphCard, explainCard);
        left.setPrefWidth(700);

        // --- cột phải ---
        codeBlock.setStyle("-fx-font-family: Consolas; -fx-font-size: 12px; "
                + "-fx-text-fill: #1f2430;");
        VBox codeCard = UiKit.card("Code thật trong com.vinhdp.abstraction.multi", codeBlock);

        liveResult.setStyle("-fx-font-family: Consolas; -fx-font-size: 12.5px; "
                + "-fx-text-fill: #166534;");
        VBox runCard = UiKit.card("Gọi thật ngay lúc này", liveResult,
                UiKit.muted("Dòng trên không phải chữ tôi gõ sẵn — app gọi thẳng object thật "
                        + "và in ra giá trị trả về."));

        VBox rulesCard = UiKit.card("Ba luật, theo đúng thứ tự áp dụng",
                rule("1", "Class thắng interface",
                        "Method thật của class cha luôn hạ mọi default method."),
                rule("2", "Interface cụ thể hơn thắng",
                        "Nếu I2 extends I1 thì bản của I2 thắng bản của I1."),
                rule("3", "Còn lại là lỗi biên dịch",
                        "Hai interface không họ hàng — bạn phải tự override."),
                UiKit.muted("Đây là chỗ Java khác C++: không có luật ngầm nào chọn hộ bạn "
                        + "khi hai nhánh ngang hàng."));

        VBox errorCard = UiKit.card("Nguyên văn javac khi không override",
                codeLine("error: types EmailNotifier and SmsNotifier are incompatible;"),
                codeLine("  class BrokenAlert inherits unrelated defaults for send()"),
                codeLine("  from types EmailNotifier and SmsNotifier"));

        VBox right = new VBox(12, codeCard, runCard, rulesCard, errorCard);
        HBox.setHgrow(right, Priority.ALWAYS);

        HBox body = new HBox(14, left, right);
        body.setPadding(new Insets(2));
        return body;
    }

    private Node rule(String number, String title, String detail) {
        Label index = new Label(number);
        index.setStyle("-fx-background-color: #1f2430; -fx-text-fill: white; "
                + "-fx-background-radius: 12; -fx-padding: 1 7 1 7; -fx-font-size: 11px;"
                + "-fx-font-weight: bold;");
        Label name = new Label(title);
        name.setStyle("-fx-font-weight: bold; -fx-font-size: 12.5px;");
        Label body = UiKit.muted(detail);
        VBox text = new VBox(1, name, body);
        return UiKit.row(8, index, text);
    }

    private Label codeLine(String text) {
        Label label = new Label(text);
        label.setStyle("-fx-font-family: Consolas; -fx-font-size: 11.5px; "
                + "-fx-text-fill: #b91c1c;");
        return label;
    }

    @Override
    protected void onReady() {
        select(DefaultMethodModel.SCENARIOS.get(0));
    }

    private void select(Scenario chosen) {
        this.scenario = chosen;
        //Đổi kịch bản từ đâu cũng được, nút luôn khớp với sơ đồ đang hiện
        ToggleButton button = tabButtons.get(chosen.className());
        if (button != null) {
            button.setSelected(true);
        }
        declaration.setText(chosen.declaration());
        ruleBadge.setText(chosen.rule());
        codeBlock.setText(DefaultMethodModel.code(chosen));
        liveResult.setText(callForReal(chosen.className()));
        showStep(0);
    }

    private void showStep(int target) {
        List<Step> steps = scenario.steps();
        stepIndex = Math.max(0, Math.min(steps.size() - 1, target));
        Step step = steps.get(stepIndex);

        canvas.render(scenario, step);
        headline.setText(step.headline());
        note.setText(step.note());
        counter.setText((stepIndex + 1) + " / " + steps.size());
        backButton.setDisable(stepIndex == 0);
        stepButton.setDisable(stepIndex == steps.size() - 1);
    }

    /** Gọi thẳng các class thật trong package multi thay vì hiện chuỗi chép sẵn. */
    private String callForReal(String className) {
        //Cả bốn đều là Notifier: MultiAlert với tới qua EmailNotifier extends Notifier
        Notifier notifier = switch (className) {
            case "EmailAlert" -> new EmailAlert();
            case "LegacyAlert" -> new LegacyAlert();
            case "MultiAlert" -> new MultiAlert();
            default -> new PlainAlert();
        };
        return "new " + className + "().send()\n  -> \"" + notifier.send() + "\"";
    }

    public static void main(String[] args) {
        launch(args);
    }
}
