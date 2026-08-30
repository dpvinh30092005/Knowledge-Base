package com.vinhdp.testingtdd.order;

import java.util.Optional;

public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(long orderCode, int amount, String description) {
        return orderRepository.save(new Order(orderCode, amount, description));
    }

    public Optional<Order> findByOrderCode(long orderCode) {
        return orderRepository.findByOrderCode(orderCode);
    }

    public void markPaymentPending(long orderCode) {
        Order order = findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderCode));
        order.markPaymentPending();
    }
}
