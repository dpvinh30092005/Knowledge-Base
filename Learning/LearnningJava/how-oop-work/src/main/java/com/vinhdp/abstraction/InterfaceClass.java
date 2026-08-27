package com.vinhdp.abstraction;

public interface InterfaceClass {

    //ALL METHOD DEFAULT IS public abstract...
    void calculatorTotal();

    //Java 8+; có thể có default method và static method
    default String defaultMethod() {
        return "Default Method";
    }

    static String staticMethod() {
        return "Static Method";
    }

}

/*
 * interface là CLASS ABSTRACT CAO NHẤT — ONLY DESCRIBE "hợp đồng" (contract) mà CLASS implements phải tuân theo.
 * Mọi thuộc tính mặc định là public static final (hằng số).
 * Một lớp có thể implements nhiều interface cùng lúc → giải quyết vấn đề đa kế thừa.
 * Từ Java 8 trở đi có thêm default và static method; Java 9 thêm private method.
 * */
