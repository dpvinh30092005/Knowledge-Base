package com.vinhdp.testingtdd.order;

import java.util.Optional;

public interface OrderRepository {
    Order save(Order order);

    Optional<Order> findByOrderCode(long orderCode);
}
