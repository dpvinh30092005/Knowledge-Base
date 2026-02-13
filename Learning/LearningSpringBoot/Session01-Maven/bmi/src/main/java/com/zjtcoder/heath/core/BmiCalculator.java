package com.zjtcoder.heath.core;

public class BmiCalculator {
    //static calculator block body follow height and weight
    // bmi = weight (kg) / height (m) ^ 2

    public double getBmi(double weight, double height) {
        return weight / (height * height);
    }

}
