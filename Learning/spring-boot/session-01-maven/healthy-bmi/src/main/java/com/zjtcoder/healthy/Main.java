package com.zjtcoder.healthy;

import com.zjtcoder.heath.core.BmiCalculator;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) {
        System.out.println("BMI 76kg 1.73m: "
        + new BmiCalculator().getBmi(76, 1.73));
    }


}