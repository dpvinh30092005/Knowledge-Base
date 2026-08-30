package com.vinhdp.encapsulation.bankst.vip;

import com.vinhdp.encapsulation.bankst.TheATM;

//Package KHÁC "bankst" -> chỉ với được tới public/protected thông qua kế thừa
public class TheATMVIP extends TheATM {

    public TheATMVIP(int pinCode, double balance) {
        super(pinCode, balance);
        this.withdrawLimit = 50_000_000; // --> OK! - protected, đây là subclass
    }

    @Override
    protected void saveLog(String message) {
        super.saveLog("[VIP]: " + message);
    }

}
