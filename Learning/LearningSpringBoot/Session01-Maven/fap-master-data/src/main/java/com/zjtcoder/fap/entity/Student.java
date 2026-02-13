package com.zjtcoder.fap.entity;

import lombok.*;

@NoArgsConstructor // default constructor
@AllArgsConstructor // full constructor
@Getter
@Setter
@ToString
public class Student {
    private String id;
    private String name;
    private int yob;
    private double gpa;

    // ĐOẠN CODE BOILER PLATE NHÀM CHÁN: 2 CTOR, GET/SET, TOSTRING

    // TA DÙNG 1 THƯ VIỆN TRÊN MẠNG GIÚP TA GENERATE 1 CÁCH TỰ ĐỘNG
    // -> LOMBOK DEPENDENCY
    // HÀNG TRÊN MẠNG KHÔNG PHẢI HÀNG CHÍNH HÃNG JDK
    // C# THÌ CÓ HÀNG CHÍNH HÃNG -> GỌI LÀ KĨ THUẬT PROPERTY CÓ SẴN TRONG .NET SDK

    // TA ĐI TẢI THƯ VIỆN LOMBOK QUA FILE POM.XML



}
