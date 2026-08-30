package com.vinhdp.testingtdd.order;

public class Order {
    private final long orderCode;
    private final int amount;
    private final String description;
    private OrderStatus status;

    public Order(long orderCode, int amount, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be greater than 0");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("description is required");
        }

        this.orderCode = orderCode;
        this.amount = amount;
        this.description = description;
        this.status = OrderStatus.CREATED;
    }

    public long getOrderCode() {
        return orderCode;
    }

    public int getAmount() {
        return amount;
    }

    public String getDescription() {
        return description;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void markPaymentPending() {
        this.status = OrderStatus.PAYMENT_PENDING;
    }
}
