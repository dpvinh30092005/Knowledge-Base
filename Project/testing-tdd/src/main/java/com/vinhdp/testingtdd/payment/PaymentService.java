package com.vinhdp.testingtdd.payment;

import com.vinhdp.testingtdd.order.Order;
import com.vinhdp.testingtdd.order.OrderService;
import com.vinhdp.testingtdd.payos.PayOsGateway;

public class PaymentService {
    private final OrderService orderService;
    private final PayOsGateway payOsGateway;

    public PaymentService(OrderService orderService, PayOsGateway payOsGateway) {
        this.orderService = orderService;
        this.payOsGateway = payOsGateway;
    }

    public PaymentLink createPaymentForOrder(long orderCode) {
        Order order = orderService.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderCode));

        PaymentLink paymentLink = payOsGateway.createPaymentLink(order);
        orderService.markPaymentPending(orderCode);
        return paymentLink;
    }
}
