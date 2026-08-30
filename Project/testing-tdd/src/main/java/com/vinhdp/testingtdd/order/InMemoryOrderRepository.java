package com.vinhdp.testingtdd.order;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class InMemoryOrderRepository implements OrderRepository {
    private final Map<Long, Order> orders = new HashMap<>();

    @Override
    public Order save(Order order) {
        orders.put(order.getOrderCode(), order);
        return order;
    }

    @Override
    public Optional<Order> findByOrderCode(long orderCode) {
        return Optional.ofNullable(orders.get(orderCode));
    }
}
