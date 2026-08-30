package com.vinhdp.testingtdd.payos;

import java.math.BigDecimal;

public record PayOsCreatePaymentRequest(
        long orderCode,
        BigDecimal amount,
        String description,
        String cancelUrl,
        String returnUrl,
        String signature,
        String contextType
) {
    public PayOsCreatePaymentRequest(
            long orderCode,
            BigDecimal amount,
            String description,
            String cancelUrl,
            String returnUrl,
            String signature
    ) {
        this(orderCode, amount, description, cancelUrl, returnUrl, signature, "PAYMENT_LINK");
    }
}
