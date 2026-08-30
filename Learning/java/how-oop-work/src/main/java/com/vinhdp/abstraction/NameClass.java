package com.vinhdp.abstraction;

public abstract class NameClass {

    //CÓ THỂ CÓ CÁC THUỘC TÍNH THƯỜNG.
    //CÓ THỂ CÓ CONSTRUCTOR.
    //CÓ THỂ CÓ CÁC METHOD
    //CÓ METHOD ABSTRACT (CHỈ KHAI BÁO)

    //Abstract Method
    public abstract void describe();

    //Concrete Method
    public void calculatorTotal() {

    }

    /**
     * Không thể khởi tạo object trực tiếp thông qua toán tử new -> error compile
     * CÓ thể có cả method abstract lẫn method đã cài đặt sẵn (Concrete Method)
     * CÓ THỂ có đầy đủ thuộc tính (include private modify)
     * Lớp con extends class Abstract MUST HAVE ALL METHOD Abstract (trừ khi lớp con cũng là abstract)
     * 1 Class chỉ được extends 1 abstract class
     */


}
