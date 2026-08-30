package com.vinhdp.testingtdd.payos;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

public class DummyPayOsHttpClient implements PayOsHttpClient {
    public static final String SUCCESS = "SUCCESS";

    private final Set<Long> createdOrderCodes = new HashSet<>();
    private String expectedSignature;
    private BigDecimal availableBalance = new BigDecimal("999999999");
    private boolean vietQrProCreateOrderFails;
    private boolean paymentGatewayMissing;
    private boolean paymentGatewayPaused;
    private boolean bankInfoMissing;
    private boolean serviceAccountInactive;
    private boolean paymentGatewayOrganizationMissing;
    private boolean partnerCoreInvalid;
    private boolean subscriptionMissing;

    public DummyPayOsHttpClient() {
    }

    public DummyPayOsHttpClient(String resultCode) {
        if (!SUCCESS.equals(resultCode)) {
            throw new PayOsPaymentException(resultCode);
        }
    }

    public void expectSignature(String expectedSignature) {
        this.expectedSignature = expectedSignature;
    }

    public void setAvailableBalance(BigDecimal availableBalance) {
        this.availableBalance = availableBalance;
    }

    public void failVietQrProCreateOrder() {
        this.vietQrProCreateOrderFails = true;
    }

    public void markPaymentGatewayMissing() {
        this.paymentGatewayMissing = true;
    }

    public void pausePaymentGateway() {
        this.paymentGatewayPaused = true;
    }

    public void markBankInfoMissing() {
        this.bankInfoMissing = true;
    }

    public void deactivateServiceAccount() {
        this.serviceAccountInactive = true;
    }

    public void markPaymentGatewayOrganizationMissing() {
        this.paymentGatewayOrganizationMissing = true;
    }

    public void invalidatePartnerCore() {
        this.partnerCoreInvalid = true;
    }

    public void markSubscriptionMissing() {
        this.subscriptionMissing = true;
    }

    @Override
    public PayOsCreatePaymentResponse createPaymentLink(PayOsCreatePaymentRequest request) {
        validateRequest(request);
        validatePaymentGatewayState();

        if (availableBalance.compareTo(request.amount()) < 0) {
            throw new PayOsPaymentException("BALANCE_NOT_ENOUGH");
        }
        if (createdOrderCodes.contains(request.orderCode())) {
            throw new PayOsPaymentException("ORDER_FOUND");
        }
        if (vietQrProCreateOrderFails) {
            throw new PayOsPaymentException("VIETQR_PRO_CREATE_ORDER_FAIL");
        }

        createdOrderCodes.add(request.orderCode());
        return new PayOsCreatePaymentResponse(
                request.orderCode(),
                request.amount().intValueExact(),
                "dummy-payment-link-" + request.orderCode(),
                "https://pay.payos.vn/web/dummy-payment-link-" + request.orderCode()
        );
    }

    private void validateRequest(PayOsCreatePaymentRequest request) {
        if (request.description() == null || request.description().isBlank()
                || request.cancelUrl() == null || !request.cancelUrl().startsWith("http")
                || request.returnUrl() == null || !request.returnUrl().startsWith("http")
                || request.signature() == null || request.signature().isBlank()) {
            throw new PayOsPaymentException("INVALID_PARAM");
        }
        if (!"PAYMENT_LINK".equals(request.contextType())) {
            throw new PayOsPaymentException("INVALID_CONTEXT_TYPE");
        }
        if (expectedSignature != null && !expectedSignature.equals(request.signature())) {
            throw new PayOsPaymentException("PAYMENT_REQUEST_DATA_SIGNATURE_INCORRECT");
        }
        if (request.amount().scale() > 1) {
            throw new PayOsPaymentException("DECIMAL_PART_TOO_LONG");
        }
        if (request.amount().stripTrailingZeros().scale() > 0) {
            throw new PayOsPaymentException("AMOUNT_NOT_INTEGER");
        }
    }

    private void validatePaymentGatewayState() {
        if (paymentGatewayMissing) {
            throw new PayOsPaymentException("PAYMENT_GATEWAY_NOT_FOUND");
        }
        if (paymentGatewayPaused) {
            throw new PayOsPaymentException("PAYMENT_GATEWAY_PAUSED");
        }
        if (bankInfoMissing) {
            throw new PayOsPaymentException("BANK_INFO_NOT_FOUND");
        }
        if (serviceAccountInactive) {
            throw new PayOsPaymentException("FI_SERVICE_ACCOUNT_STATE_INACTIVE");
        }
        if (paymentGatewayOrganizationMissing) {
            throw new PayOsPaymentException("PAYMENT_GATEWAY_ORGANIZATION_NOT_FOUND");
        }
        if (partnerCoreInvalid) {
            throw new PayOsPaymentException("INVALID_PARTNER_CORE");
        }
        if (subscriptionMissing) {
            throw new PayOsPaymentException("SUBCRIPTION_NOT_FOUND");
        }
    }
}
