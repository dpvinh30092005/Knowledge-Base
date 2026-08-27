package com.vinhdp.ui;

import com.vinhdp.inheritance.Employee;
import com.vinhdp.inheritance.Manager;
import com.vinhdp.inheritance.SalesStaff;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

public class InheritanceApp extends DemoApp {

    private static final String TYPE_EMPLOYEE = "Employee";
    private static final String TYPE_SALES = "SalesStaff";
    private static final String TYPE_MANAGER = "Manager";

    private final ObservableList<Employee> staff = FXCollections.observableArrayList();
    private final TableView<Employee> table = new TableView<>(staff);

    private final Label headcountValue = new Label();
    private final Label payrollValue = new Label();

    private final TextField idField = UiKit.field("ID", "EM4", 90);
    private final TextField nameField = UiKit.field("Full name", "Nguyen Van A", 190);
    private final TextField salaryField = UiKit.field("Base salary", "9000000", 130);
    private final TextField extraOneField = UiKit.field("", "50000000", 130);
    private final TextField extraTwoField = UiKit.field("", "0.15", 90);
    private final Label extraOneLabel = new Label();
    private final Label extraTwoLabel = new Label();

    @Override
    protected String title() {
        return "Inheritance";
    }

    @Override
    protected String subtitle() {
        return "One Employee[] holds three different classes. Every row calls the same "
                + "calculateSalary(), and each subclass answers differently.";
    }

    @Override
    protected Node buildContent() {

        buildTable();

        ComboBox<String> typePicker = new ComboBox<>(
                FXCollections.observableArrayList(TYPE_EMPLOYEE, TYPE_SALES, TYPE_MANAGER));
        typePicker.getSelectionModel().select(TYPE_SALES);
        typePicker.setPrefWidth(150);
        typePicker.setOnAction(e -> applyTypeLabels(typePicker.getValue()));
        applyTypeLabels(TYPE_SALES);

        Button addButton = UiKit.primary("new " + TYPE_SALES + "(...)");
        typePicker.valueProperty().addListener(
                (obs, old, value) -> addButton.setText("new " + value + "(...)"));
        addButton.setOnAction(e -> addEmployee(typePicker.getValue()));

        VBox addCard = UiKit.card("Hire someone",
                UiKit.row(10, new Label("Type"), typePicker,
                        new Label("ID"), idField,
                        new Label("Name"), nameField),
                UiKit.row(10, new Label("Base salary"), salaryField,
                        extraOneLabel, extraOneField,
                        extraTwoLabel, extraTwoField,
                        UiKit.grow(), addButton),
                UiKit.muted("Every subclass constructor calls super(id, fullName, salary) first, "
                        + "then fills in the fields it added."));

        HBox metrics = UiKit.row(30,
                UiKit.metric("Headcount", headcountValue),
                UiKit.metric("Total payroll (sum of calculateSalary())", payrollValue));

        Button showDetailsButton = UiKit.primary("selected.showDetails()");
        showDetailsButton.setOnAction(e -> {
            Employee selected = table.getSelectionModel().getSelectedItem();
            if (selected == null) {
                log.error("Select a row first");
                return;
            }
            log.call("Employee ref = " + selected.getClass().getSimpleName() + "; ref.showDetails();");
            for (String line : capture(selected::showDetails)) {
                log.info(line);
            }
            log.note("showDetails() is declared once in Employee, but it calls calculateSalary() "
                    + "and getPosition(), which the subclass overrode.");
        });

        Button loopButton = UiKit.primary("for (Employee e : staff) e.calculateSalary()");
        loopButton.setOnAction(e -> {
            log.divider("Same loop, one type, three behaviours");
            for (Employee employee : staff) {
                log.call(employee.getId() + " -> " + employee.getClass().getSimpleName()
                        + ".calculateSalary()");
                log.ok(money(employee.calculateSalary()) + "   (" + employee.describeSalary() + ")");
            }
            refresh();
        });

        Button removeButton = UiKit.danger("Remove selected");
        removeButton.setOnAction(e -> {
            Employee selected = table.getSelectionModel().getSelectedItem();
            if (selected == null) {
                log.error("Select a row first");
                return;
            }
            staff.remove(selected);
            log.info("Removed " + selected.getId());
            refresh();
        });

        VBox tableCard = UiKit.card("Employee[] staff", metrics, table,
                UiKit.row(10, showDetailsButton, loopButton, UiKit.grow(), removeButton));
        VBox.setVgrow(table, Priority.ALWAYS);
        VBox.setVgrow(tableCard, Priority.ALWAYS);

        VBox hierarchyCard = UiKit.card("Class hierarchy",
                UiKit.code("Employee                       calculateSalary() -> salary"),
                UiKit.code("  +-- SalesStaff               + sales * commissionRate"),
                UiKit.code("  +-- Manager                  + allowance + staff * 500,000"),
                UiKit.muted("Both subclasses call super.calculateSalary() and add to it, "
                        + "instead of copying the base formula."));

        VBox content = new VBox(14, addCard, tableCard, hierarchyCard);
        content.setPadding(new Insets(18));
        return content;
    }

    private void buildTable() {
        TableColumn<Employee, String> idColumn = column("ID", 70,
                employee -> employee.getId());
        TableColumn<Employee, String> nameColumn = column("Full name", 170,
                employee -> employee.getFullName());
        TableColumn<Employee, String> classColumn = column("Runtime class", 120,
                employee -> employee.getClass().getSimpleName());
        TableColumn<Employee, String> positionColumn = column("getPosition()", 110,
                employee -> employee.getPosition());
        TableColumn<Employee, String> baseColumn = column("Base salary", 110,
                employee -> money(employee.getSalary()));
        TableColumn<Employee, String> totalColumn = column("calculateSalary()", 130,
                employee -> money(employee.calculateSalary()));
        TableColumn<Employee, String> detailColumn = column("describeSalary()", 330,
                employee -> employee.describeSalary());

        table.getColumns().setAll(java.util.List.of(
                idColumn, nameColumn, classColumn, positionColumn,
                baseColumn, totalColumn, detailColumn));
        table.setPrefHeight(260);
        table.setPlaceholder(new Label("No employees yet - hire someone above"));
    }

    private TableColumn<Employee, String> column(String title, double width,
                                                 java.util.function.Function<Employee, String> value) {
        TableColumn<Employee, String> col = new TableColumn<>(title);
        col.setPrefWidth(width);
        col.setCellValueFactory(data -> new SimpleStringProperty(value.apply(data.getValue())));
        return col;
    }

    private void applyTypeLabels(String type) {
        switch (type) {
            case TYPE_SALES -> {
                extraOneLabel.setText("Sales");
                extraTwoLabel.setText("Commission rate");
                setExtrasVisible(true, true);
            }
            case TYPE_MANAGER -> {
                extraOneLabel.setText("Position allowance");
                extraTwoLabel.setText("Staff managed");
                setExtrasVisible(true, true);
            }
            default -> {
                extraOneLabel.setText("");
                extraTwoLabel.setText("");
                setExtrasVisible(false, false);
            }
        }
    }

    private void setExtrasVisible(boolean one, boolean two) {
        extraOneField.setVisible(one);
        extraOneField.setManaged(one);
        extraOneLabel.setVisible(one);
        extraOneLabel.setManaged(one);
        extraTwoField.setVisible(two);
        extraTwoField.setManaged(two);
        extraTwoLabel.setVisible(two);
        extraTwoLabel.setManaged(two);
    }

    private void addEmployee(String type) {
        String id = idField.getText().trim();
        String name = nameField.getText().trim();
        Double salary = readDouble(salaryField.getText(), "Base salary");
        if (id.isEmpty() || name.isEmpty() || salary == null) {
            log.error("ID, name and base salary are required");
            return;
        }

        Employee created;
        switch (type) {
            case TYPE_SALES -> {
                Double sales = readDouble(extraOneField.getText(), "Sales");
                Double rate = readDouble(extraTwoField.getText(), "Commission rate");
                if (sales == null || rate == null) {
                    return;
                }
                created = new SalesStaff(id, name, salary, sales, rate);
                log.call("new SalesStaff(\"" + id + "\", \"" + name + "\", " + money(salary)
                        + ", " + money(sales) + ", " + rate + ")");
            }
            case TYPE_MANAGER -> {
                Double allowance = readDouble(extraOneField.getText(), "Position allowance");
                Double headcount = readDouble(extraTwoField.getText(), "Staff managed");
                if (allowance == null || headcount == null) {
                    return;
                }
                created = new Manager(id, name, salary, allowance, headcount.intValue());
                log.call("new Manager(\"" + id + "\", \"" + name + "\", " + money(salary)
                        + ", " + money(allowance) + ", " + headcount.intValue() + ")");
            }
            default -> {
                created = new Employee(id, name, salary);
                log.call("new Employee(\"" + id + "\", \"" + name + "\", " + money(salary) + ")");
            }
        }

        staff.add(created);
        log.ok("stored in Employee[] as " + created.getClass().getSimpleName()
                + ", calculateSalary() = " + money(created.calculateSalary()));
        refresh();
    }

    @Override
    protected void onReady() {
        staff.addAll(
                new Employee("EM1", "Dang Phuoc Vinh", 8_000_000),
                new SalesStaff("EM2", "Dang Van D", 10_000_000, 100_000_000, 0.2),
                new Manager("EM3", "Le Thi B", 15_000_000, 5_000_000, 8));
        log.note("Three objects, one declared type. Press the loop button to see them diverge.");
        refresh();
    }

    private void refresh() {
        table.refresh();
        headcountValue.setText(String.valueOf(staff.size()));
        payrollValue.setText(money(staff.stream().mapToDouble(Employee::calculateSalary).sum()));
    }

    /** Bắt lại System.out để hiện đúng output thật của showDetails() trong panel log. */
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

    private Double readDouble(String raw, String label) {
        try {
            return Double.parseDouble(raw.trim().replace(",", "").replace("_", ""));
        } catch (NumberFormatException ex) {
            log.error(label + " must be a number");
            return null;
        }
    }

    private static String money(double amount) {
        return String.format("%,.0f", amount);
    }

    public static void main(String[] args) {
        launch(args);
    }
}
