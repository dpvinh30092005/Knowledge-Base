package com.vinhdp.encapsulation;

import com.vinhdp.encapsulation.bankst.BankEmployee;
import com.vinhdp.encapsulation.bankst.TheATM;
import com.vinhdp.encapsulation.bankst.vip.TheATMVIP;

public class Main {

    public static void main(String[] args) {

        TheATMVIP theATMVIP = new TheATMVIP(8386, 10_000_000);
        TheATM theATM = new TheATM(1234, 2_000_000);

        //Sai PIN 3 lần -> thẻ tự khoá
        theATM.verifyPinCode(123);
        theATM.verifyPinCode(124);
        theATM.verifyPinCode(125);

        try {
            theATM.withDraw(100_000);
        } catch (IllegalStateException e) {
            System.out.println("[normal] " + e.getMessage());
        }

        //Chỉ nhân viên ngân hàng (cùng package) mới mở khoá được
        new BankEmployee().troubleShootAccount(theATM);

        theATM.verifyPinCode(1234);
        theATM.withDraw(100_000);
        theATM.deposit(1_000_000);
        System.out.println("Balance: " + String.format("%,.0f", theATM.getBalance()));
        System.out.println("History: " + theATM.getHistoryTransactions());

        //Cùng một lệnh rút, khác hạn mức -> khác kết quả
        System.out.println();
        theATM.verifyPinCode(1234);
        try {
            theATM.withDraw(20_000_000); //limit 5tr -> bị chặn
        } catch (IllegalStateException | IllegalArgumentException e) {
            System.out.println("[normal] " + e.getMessage());
        }

        theATMVIP.verifyPinCode(8386);
        try {
            theATMVIP.withDraw(20_000_000); //limit 50tr -> chỉ vướng số dư
        } catch (IllegalStateException | IllegalArgumentException e) {
            System.out.println("[vip]    " + e.getMessage());
        }

        theATMVIP.withDraw(8_000_000);
        System.out.println("Balance VIP: " + String.format("%,.0f", theATMVIP.getBalance()));
        System.out.println("History VIP: " + theATMVIP.getHistoryTransactions());
    }

}
