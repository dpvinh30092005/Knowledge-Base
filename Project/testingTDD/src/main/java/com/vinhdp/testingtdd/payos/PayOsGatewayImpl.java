package com.vinhdp.testingtdd.payos;

import com.vinhdp.testingtdd.order.Order;
import com.vinhdp.testingtdd.payment.PaymentLink;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

public class PayOsGatewayImpl implements PayOsGateway {
    private final PayOsHttpClient payOsHttpClient;
    private final String checksumKey;
    private final String cancelUrl;
    private final String returnUrl;

    public PayOsGatewayImpl(PayOsHttpClient payOsHttpClient, String checksumKey, String cancelUrl, String returnUrl) {
        this.payOsHttpClient = payOsHttpClient;
        this.checksumKey = checksumKey;
        this.cancelUrl = cancelUrl;
        this.returnUrl = returnUrl;
    }

    @Override
    public PaymentLink createPaymentLink(Order order) {
        PayOsCreatePaymentRequest request = new PayOsCreatePaymentRequest(
                order.getOrderCode(),
                BigDecimal.valueOf(order.getAmount()),
                order.getDescription(),
                cancelUrl,
                returnUrl,
                createSignature(order)
        );

        PayOsCreatePaymentResponse response = payOsHttpClient.createPaymentLink(request);
        return new PaymentLink(
                response.orderCode(),
                response.amount(),
                response.paymentLinkId(),
                response.checkoutUrl()
        );
    }

    private String createSignature(Order order) {
        String data = "amount=" + order.getAmount()
                + "&cancelUrl=" + cancelUrl
                + "&description=" + order.getDescription()
                + "&orderCode=" + order.getOrderCode()
                + "&returnUrl=" + returnUrl;

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create payOS request signature", exception);
        }
    }
}
