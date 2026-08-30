package com.vinhdp.polymorphism;

public class Overloading_Static_Compiletime {

    public static class Calculator {

        public int sum (int a, int b) {
            return a + b;
        }

        public double sum (double a, double b) {
            return a + b;
        }

        public int sum (int a, int b, int c) {
            return a + b + c;
        }

        public String sum (String a, String b) {
            return a + b;
        }
    }

    public static void main(String[] args) {

        Calculator calculator = new Calculator();

        System.out.println(calculator.sum(1, 2, 3));
        System.out.println(calculator.sum(1,2));
        System.out.println(calculator.sum(2.3, 3.5));
        System.out.println(calculator.sum("Hello", "World"));

    }

    // !!!!!!!!!! CHỈ KHÁC KIỂU TRẢ VỀ THÌ CHƯA ĐƯỢC XEM LÀ OVERLOADING
    //    public int sum (int a, int b) { return a + b;}
    // public double sum (int a, int b) { return a + b;}

}
