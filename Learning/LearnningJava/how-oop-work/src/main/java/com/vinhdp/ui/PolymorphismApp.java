package com.vinhdp.ui;

import com.vinhdp.polymorphism.Overloading_Static_Compiletime.Calculator;
import com.vinhdp.polymorphism.Overriding_Dynamic_Runtime.Animal;
import com.vinhdp.polymorphism.Overriding_Dynamic_Runtime.Cat;
import com.vinhdp.polymorphism.Overriding_Dynamic_Runtime.Dog;
import com.vinhdp.polymorphism.Overriding_Dynamic_Runtime.Fish;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

public class PolymorphismApp extends DemoApp {

    private final Calculator calculator = new Calculator();

    private Animal current = new Cat();
    private final Label declaredValue = new Label("Animal");
    private final Label runtimeValue = new Label("Cat");
    private final Label resolvedValue = new Label("-");

    @Override
    protected String title() {
        return "Polymorphism";
    }

    @Override
    protected String subtitle() {
        return "Overloading is decided by the compiler from the argument types. "
                + "Overriding is decided at runtime from the object's real class.";
    }

    @Override
    protected Node buildContent() {
        TabPane tabs = new TabPane();
        tabs.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        tabs.getTabs().addAll(
                new Tab("Overriding - runtime", overridingTab()),
                new Tab("Overloading - compile time", overloadingTab()),
                new Tab("Upcast / downcast", castingTab()));
        return new VBox(tabs);
    }

    // ------------------------------------------------------------------ tab 1
    private Node overridingTab() {
        ComboBox<String> picker = new ComboBox<>(
                FXCollections.observableArrayList("new Cat()", "new Dog()", "new Fish()"));
        picker.getSelectionModel().selectFirst();
        picker.setPrefWidth(180);
        picker.setOnAction(e -> {
            current = switch (picker.getSelectionModel().getSelectedIndex()) {
                case 1 -> new Dog();
                case 2 -> new Fish();
                default -> new Cat();
            };
            resolvedValue.setText("-");
            log.divider("Animal animal = " + picker.getValue() + ";");
            log.info("declared type stays Animal, runtime type is now "
                    + current.getClass().getSimpleName());
            refreshTypes();
        });

        Button barkButton = UiKit.primary("animal.bark()");
        barkButton.setOnAction(e -> {
            log.call("animal.bark()   // declared Animal, actual "
                    + current.getClass().getSimpleName());
            String printed = String.join(" ", capture(current::bark));
            String owner = declaringClassOf(current.getClass());
            resolvedValue.setText(owner + ".bark()");
            log.ok("printed: " + printed);
            log.note("dispatched to " + owner + ".bark()"
                    + (owner.equals("Animal")
                            ? " because this subclass never overrode it"
                            : " - dynamic method dispatch"));
        });

        VBox typeCard = UiKit.card("One variable, three objects",
                UiKit.code("Animal animal = new Cat();   // upcasting"),
                UiKit.row(10, picker, barkButton),
                UiKit.row(30,
                        UiKit.metric("Declared type (compile time)", declaredValue),
                        UiKit.metric("Runtime type (real object)", runtimeValue),
                        UiKit.metric("Method actually run", resolvedValue)));

        VBox explainCard = UiKit.card("Why Fish behaves differently",
                UiKit.code("class Fish extends Animal { }   // no bark() of its own"),
                UiKit.muted("Fish inherits bark() unchanged, so there is nothing to dispatch to "
                        + "and Animal.bark() runs. Overriding only shows up when the subclass "
                        + "actually redefines the method."));

        VBox box = new VBox(14, typeCard, explainCard);
        box.setPadding(new Insets(18));
        return box;
    }

    // ------------------------------------------------------------------ tab 2
    private Node overloadingTab() {
        TextField aField = UiKit.field("a", "1", 100);
        TextField bField = UiKit.field("b", "2", 100);
        TextField cField = UiKit.field("c", "3", 100);

        Button intTwo = UiKit.primary("sum(int, int)");
        intTwo.setOnAction(e -> {
            Integer a = readInt(aField.getText());
            Integer b = readInt(bField.getText());
            if (a == null || b == null) {
                return;
            }
            log.call("calculator.sum(" + a + ", " + b + ")");
            log.ok("int sum(int, int) -> " + calculator.sum(a, b));
        });

        Button intThree = UiKit.primary("sum(int, int, int)");
        intThree.setOnAction(e -> {
            Integer a = readInt(aField.getText());
            Integer b = readInt(bField.getText());
            Integer c = readInt(cField.getText());
            if (a == null || b == null || c == null) {
                return;
            }
            log.call("calculator.sum(" + a + ", " + b + ", " + c + ")");
            log.ok("int sum(int, int, int) -> " + calculator.sum(a, b, c));
        });

        Button doubleTwo = UiKit.primary("sum(double, double)");
        doubleTwo.setOnAction(e -> {
            Double a = readDouble(aField.getText());
            Double b = readDouble(bField.getText());
            if (a == null || b == null) {
                return;
            }
            log.call("calculator.sum(" + a + ", " + b + ")");
            log.ok("double sum(double, double) -> " + calculator.sum(a, b));
        });

        Button stringTwo = UiKit.primary("sum(String, String)");
        stringTwo.setOnAction(e -> {
            log.call("calculator.sum(\"" + aField.getText() + "\", \"" + bField.getText() + "\")");
            log.ok("String sum(String, String) -> "
                    + calculator.sum(aField.getText(), bField.getText()));
        });

        VBox card = UiKit.card("Same name, four signatures",
                UiKit.row(10, new Label("a"), aField, new Label("b"), bField,
                        new Label("c"), cField),
                UiKit.row(10, intTwo, intThree, doubleTwo, stringTwo),
                UiKit.muted("Nothing is decided at runtime here. javac already picked the method "
                        + "from the argument types before the program ever started."));

        VBox rule = UiKit.card("The rule that trips people up",
                UiKit.code("int    sum(int a, int b)"),
                UiKit.code("double sum(int a, int b)   // will not compile"),
                UiKit.muted("A different return type alone is not overloading. The parameter list "
                        + "has to differ in number, type or order."));

        VBox box = new VBox(14, card, rule);
        box.setPadding(new Insets(18));
        return box;
    }

    // ------------------------------------------------------------------ tab 3
    private Node castingTab() {
        Label state = new Label("Animal animal = new Dog();");
        state.getStyleClass().add("code");

        Animal[] holder = {new Dog()};

        ComboBox<String> picker = new ComboBox<>(
                FXCollections.observableArrayList("new Dog()", "new Cat()"));
        picker.getSelectionModel().selectFirst();
        picker.setOnAction(e -> {
            holder[0] = picker.getSelectionModel().getSelectedIndex() == 0 ? new Dog() : new Cat();
            state.setText("Animal animal = " + picker.getValue() + ";");
            log.divider("Animal animal = " + picker.getValue() + ";");
        });

        Button upcastButton = UiKit.primary("animal.bark()  // allowed after upcast");
        upcastButton.setOnAction(e -> {
            log.call("animal.bark()");
            log.ok("printed: " + String.join(" ", capture(holder[0]::bark)));
            log.note("bark() exists on Animal, so the compiler allows it");
        });

        Button blockedButton = new Button("animal.sleep()  // will not compile");
        blockedButton.setDisable(true);

        Button safeButton = UiKit.primary("if (animal instanceof Dog d) d.sleep()");
        safeButton.setOnAction(e -> {
            log.call("animal instanceof Dog");
            if (holder[0] instanceof Dog dog) {
                log.ok("true - safe to downcast");
                log.ok("printed: " + String.join(" ", capture(dog::sleep)));
            } else {
                log.error("false - skipped the cast, no exception thrown");
            }
        });

        Button forceButton = UiKit.danger("(Dog) animal  // no check");
        forceButton.setOnAction(e -> {
            log.call("Dog dog = (Dog) animal;");
            try {
                Dog dog = (Dog) holder[0];
                log.ok("printed: " + String.join(" ", capture(dog::sleep)));
            } catch (ClassCastException ex) {
                log.error("ClassCastException at runtime: " + ex.getMessage());
                log.note("The compiler accepted this line. Only the JVM could catch it.");
            }
        });

        VBox card = UiKit.card("Casting up is free, casting down is a promise",
                UiKit.row(10, picker, state),
                UiKit.row(10, upcastButton, blockedButton),
                UiKit.row(10, safeButton, forceButton),
                UiKit.muted("Pick new Cat(), then press the red button: the cast compiles fine "
                        + "and blows up at runtime. That is why instanceof comes first."));

        VBox box = new VBox(14, card);
        box.setPadding(new Insets(18));
        return box;
    }

    // ------------------------------------------------------------------ utils
    @Override
    protected void onReady() {
        refreshTypes();
        log.note("Tab 1 changes behaviour at runtime. Tab 2 is already settled at compile time.");
    }

    private void refreshTypes() {
        declaredValue.setText("Animal");
        runtimeValue.setText(current.getClass().getSimpleName());
    }

    /** Class nào thật sự sở hữu bản bark() được chạy. */
    private static String declaringClassOf(Class<?> type) {
        try {
            return type.getMethod("bark").getDeclaringClass().getSimpleName();
        } catch (NoSuchMethodException ex) {
            return type.getSimpleName();
        }
    }

    private java.util.List<String> capture(Runnable action) {
        PrintStream original = System.out;
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (PrintStream stream = new PrintStream(buffer, true, StandardCharsets.UTF_8)) {
            System.setOut(stream);
            action.run();
        } finally {
            System.setOut(original);
        }
        return buffer.toString(StandardCharsets.UTF_8).lines().toList();
    }

    private Integer readInt(String raw) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            log.error("\"" + raw + "\" is not an int - that overload cannot be called");
            return null;
        }
    }

    private Double readDouble(String raw) {
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException ex) {
            log.error("\"" + raw + "\" is not a double");
            return null;
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}
