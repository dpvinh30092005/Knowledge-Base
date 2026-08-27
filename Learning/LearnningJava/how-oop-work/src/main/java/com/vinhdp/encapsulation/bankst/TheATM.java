package com.vinhdp.encapsulation.bankst;

import java.util.ArrayList;
import java.util.List;

public class TheATM {

    private static final int MAX_PIN_ATTEMPTS = 3;

    private final int pinCode;
    private double balance;
    private int numberError;
    private boolean locked = false;
    private final List<String> historyTransactions = new ArrayList<>();

    //Hạn mức MỖI LẦN rút, KHÔNG phải trần số dư -> subclass được phép nâng lên
    protected double withdrawLimit = 5_000_000;

    public TheATM(int pinCode, double balance) {
        this.pinCode = pinCode;
        this.balance = balance;
    }

    public boolean verifyPinCode(int pinCode) {

        if (locked) {
            saveLog("PIN rejected: card is locked");
            return false;
        }

        if (pinCode == this.pinCode) {
            numberError = 0;
            saveLog("PIN verified");
            return true;
        }

        numberError++;
        saveLog("Wrong PIN, attempt " + numberError + "/" + MAX_PIN_ATTEMPTS);

        if (numberError >= MAX_PIN_ATTEMPTS) lock();
        return false;
    }

    public void withDraw(double amount) {
        if (locked) {
            throw new IllegalStateException("Cannot withdraw from a locked account");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        if (amount > withdrawLimit) {
            throw new IllegalArgumentException(
                    "Cannot withdraw more than the limit of " + format(withdrawLimit) + " per transaction");
        }
        if (amount > balance) {
            throw new IllegalArgumentException("Cannot withdraw more than your balance");
        }

        balance = balance - amount;
        saveLog("Withdraw success: " + format(amount));
    }

    public void deposit(double amount) {
        if (locked) {
            throw new IllegalStateException("Cannot deposit into a locked account");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        balance = balance + amount;
        saveLog("Deposit success: " + format(amount));
    }

    public List<String> getHistoryTransactions() {
        return List.copyOf(historyTransactions); //Tạo bản sao chống lộ tham chiếu gốc
    }

    public double getBalance() {
        return balance;
    }

    public double getWithdrawLimit() {
        return withdrawLimit;
    }

    public boolean isLocked() {
        return locked;
    }

    //package-private: chỉ nhân viên ngân hàng CÙNG package mới gọi được
    void lock() {
        locked = true;
        saveLog("Card locked after " + MAX_PIN_ATTEMPTS + " wrong PIN attempts");
    }

    void unlock() {
        locked = false;
        numberError = 0;
        saveLog("Card unlocked by a bank employee");
    }

    protected void saveLog(String message) {
        historyTransactions.add(message);
    }

    protected static String format(double amount) {
        return String.format("%,.0f", amount);
    }
}
