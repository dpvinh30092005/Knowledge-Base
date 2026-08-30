package com.vinhdp.testingtdd.payos;

public record PayOsCreatePaymentResponse(
        long orderCode,
        int amount,
        String paymentLinkId,
        String checkoutUrl
) {
}
