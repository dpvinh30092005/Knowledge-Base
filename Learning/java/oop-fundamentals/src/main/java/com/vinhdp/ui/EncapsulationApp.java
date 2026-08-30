package com.vinhdp.ui;

import com.vinhdp.encapsulation.bankst.BankEmployee;
import com.vinhdp.encapsulation.bankst.TheATM;
import com.vinhdp.encapsulation.bankst.vip.TheATMVIP;
import com.vinhdp.ui.common.DemoApp;
import com.vinhdp.ui.common.UiKit;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;

public class EncapsulationApp extends DemoApp {

    private final TheATM standard = new TheATM(1234, 2_000_000);
    private final TheATMVIP vip = new TheATMVIP(8386, 10_000_000);

    private TheATM active = standard;

    private final Label balanceValue = new Label();
    private final Label limitValue = new Label();
    private final Label statusValue = new Label();
    private final Label typeValue = new Label();
    private final Circle statusDot = UiKit.dot("#16a34a");

    private final ObservableList<String> history = FXCollections.observableArrayList();

    @Override
    protected String title() {
        return "Encapsulation";
    }

    @Override
    protected String subtitle() {
        return "State stays private; the only way in is through methods that validate first. "
                + "Standard PIN 1234, VIP PIN 8386.";
    }

    @Override
    protected Node buildContent() {

        ComboBox<String> accountPicker = new ComboBox<>(FXCollections.observableArrayList(
                "TheATM - standard account", "TheATMVIP - vip account"));
        accountPicker.getSelectionModel().selectFirst();
        accountPicker.setPrefWidth(260);
        accountPicker.setOnAction(e -> {
            active = accountPicker.getSelectionModel().getSelectedIndex() == 0 ? standard : vip;
            log.divider("Switched to " + active.getClass().getSimpleName());
            refresh();
        });

        HBox metrics = UiKit.row(28,
                UiKit.metric("Balance", balanceValue),
                UiKit.metric("Withdraw limit / transaction", limitValue),
                UiKit.metric("Runtime type", typeValue),
                UiKit.metric("Card status", statusValue));

        VBox accountCard = UiKit.card("Account",
                accountPicker,
                UiKit.row(8, statusDot,
                        UiKit.muted("The limit differs because TheATMVIP raised the protected field.")),
                metrics);

        // --- PIN ---
        TextField pinField = UiKit.field("PIN", "1234", 120);
        Button verifyButton = UiKit.primary("verifyPinCode(pin)");
        verifyButton.setOnAction(e -> {
            Integer pin = readInt(pinField.getText());
            if (pin == null) {
                return;
            }
            log.call(name() + ".verifyPinCode(" + pin + ")");
            boolean accepted = active.verifyPinCode(pin);
            if (accepted) {
                log.ok("returned true");
            } else {
                log.error("returned false" + (active.isLocked() ? " - card is now locked" : ""));
            }
            refresh();
        });

        Button unlockButton = UiKit.danger("BankEmployee unlocks card");
        unlockButton.setOnAction(e -> {
            log.call("new BankEmployee().troubleShootAccount(atm)");
            new BankEmployee().troubleShootAccount(active);
            log.ok("unlock() is package-private, only bankst classes can call it");
            refresh();
        });

        VBox pinCard = UiKit.card("PIN check",
                UiKit.row(10, new Label("PIN"), pinField, verifyButton),
                UiKit.muted("Three wrong attempts lock the card. numberError is private, "
                        + "so the UI cannot reset it."),
                unlockButton);

        // --- Transactions ---
        TextField amountField = UiKit.field("Amount", "100000", 160);

        Button withdrawButton = UiKit.primary("withDraw(amount)");
        withdrawButton.setOnAction(e -> runMoneyCall(amountField, true));

        Button depositButton = UiKit.primary("deposit(amount)");
        depositButton.setOnAction(e -> runMoneyCall(amountField, false));

        VBox txCard = UiKit.card("Transactions",
                UiKit.row(10, new Label("Amount"), amountField, withdrawButton, depositButton),
                UiKit.muted("Try a negative amount, or more than the limit. The guard clauses reject it "
                        + "before the balance is ever touched."));

        // --- What private blocks ---
        VBox blockedCard = UiKit.card("What private blocks at compile time",
                UiKit.code("atm.balance = 999_999_999;   // private field - will not compile"),
                UiKit.code("atm.numberError = 0;         // private field - will not compile"),
                UiKit.code("atm.lock();                  // package-private - will not compile here"),
                UiKit.muted("This UI lives in com.vinhdp.ui, so it can only reach the public methods. "
                        + "That is the whole point: the object protects its own invariants."));

        // --- History ---
        ListView<String> historyList = new ListView<>(history);
        historyList.setPrefHeight(140);
        VBox historyCard = UiKit.card("atm.getHistoryTransactions()", historyList,
                UiKit.muted("The getter returns List.copyOf(...), a copy, so clearing this list "
                        + "cannot corrupt the log the object keeps."));
        VBox.setVgrow(historyList, Priority.ALWAYS);

        VBox content = new VBox(14, accountCard, pinCard, txCard, blockedCard, historyCard);
        content.setPadding(new Insets(18));
        return content;
    }

    @Override
    protected void onReady() {
        log.note("Standard limit 5,000,000 - VIP limit 50,000,000 "
                + "(protected field raised by the subclass)");
        refresh();
    }

    private void runMoneyCall(TextField amountField, boolean withdraw) {
        Double amount = readDouble(amountField.getText());
        if (amount == null) {
            return;
        }
        String call = withdraw ? ".withDraw(" : ".deposit(";
        log.call(name() + call + money(amount) + ")");
        try {
            if (withdraw) {
                active.withDraw(amount);
            } else {
                active.deposit(amount);
            }
            log.ok("balance is now " + money(active.getBalance()));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            log.error(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }
        refresh();
    }

    private void refresh() {
        balanceValue.setText(money(active.getBalance()));
        limitValue.setText(money(active.getWithdrawLimit()));
        typeValue.setText(active.getClass().getSimpleName());
        statusValue.setText(active.isLocked() ? "LOCKED" : "Active");
        statusDot.setStyle("-fx-fill: " + (active.isLocked() ? "#dc2626" : "#16a34a") + ";");
        history.setAll(active.getHistoryTransactions());
    }

    private String name() {
        return active == vip ? "vip" : "atm";
    }

    private Integer readInt(String raw) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            log.error("PIN must be a whole number");
            return null;
        }
    }

    private Double readDouble(String raw) {
        try {
            return Double.parseDouble(raw.trim().replace(",", "").replace("_", ""));
        } catch (NumberFormatException ex) {
            log.error("Amount must be a number");
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
