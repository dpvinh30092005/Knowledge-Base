package com.vinhdp.testingtdd.payos;

import com.vinhdp.testingtdd.order.Order;
import com.vinhdp.testingtdd.payment.PaymentLink;

public interface PayOsGateway {
    PaymentLink createPaymentLink(Order order);
}
