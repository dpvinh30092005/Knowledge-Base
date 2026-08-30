package com.vinhdp.testingtdd.payos;

public class PayOsPaymentException extends RuntimeException {
    private final String resultCode;
    private final String businessMessage;
    private final boolean retryable;

    public PayOsPaymentException(String resultCode) {
        super("payOS payment failed: " + resultCode);
        this.resultCode = resultCode;
        this.businessMessage = resolveBusinessMessage(resultCode);
        this.retryable = resolveRetryable(resultCode);
    }

    public String getResultCode() {
        return resultCode;
    }

    public String getBusinessMessage() {
        return businessMessage;
    }

    public boolean isRetryable() {
        return retryable;
    }

    private static String resolveBusinessMessage(String resultCode) {
        return switch (resultCode) {
            case "AMOUNT_NOT_INTEGER" -> "Amount must be an integer";
            case "DECIMAL_PART_TOO_LONG" -> "Amount decimal part is too long";
            case "ORDER_FOUND" -> "Order already exists in payOS";
            case "VIETQR_PRO_CREATE_ORDER_FAIL" -> "payOS could not create VietQR Pro order";
            case "PAYMENT_GATEWAY_NOT_FOUND" -> "Payment gateway was not found";
            case "PAYMENT_GATEWAY_PAUSED" -> "Payment gateway is paused";
            case "BANK_INFO_NOT_FOUND" -> "Bank information was not found";
            case "FI_SERVICE_ACCOUNT_STATE_INACTIVE" -> "Financial service account is inactive";
            case "PAYMENT_GATEWAY_ORGANIZATION_NOT_FOUND" -> "Payment gateway organization was not found";
            case "INVALID_PARTNER_CORE" -> "Partner core is invalid";
            case "INVALID_CONTEXT_TYPE" -> "Context type is invalid";
            case "INVALID_PARAM" -> "Payment request contains invalid parameters";
            case "PAYMENT_REQUEST_DATA_SIGNATURE_INCORRECT" -> "Payment request signature is incorrect";
            case "SUBCRIPTION_NOT_FOUND" -> "Subscription was not found";
            case "BALANCE_NOT_ENOUGH" -> "Balance is not enough";
            default -> "Unknown payOS payment failure";
        };
    }

    private static boolean resolveRetryable(String resultCode) {
        return switch (resultCode) {
            case "VIETQR_PRO_CREATE_ORDER_FAIL", "PAYMENT_GATEWAY_PAUSED" -> true;
            default -> false;
        };
    }
}
