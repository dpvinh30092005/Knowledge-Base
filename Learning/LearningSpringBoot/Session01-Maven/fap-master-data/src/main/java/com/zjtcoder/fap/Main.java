package com.zjtcoder.fap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zjtcoder.fap.entity.*;

public class Main {
    public static void main(String[] args) {
        //B1. Create subject
        Subject swt = new Subject("SWT301", "SOFTWARE TESTING", 3, 45);
        Subject hsf = new Subject("HSF302", "HIBERNATE SPRING FRAMEWORK", 3, 45);
        System.out.println("SWT INFO: " + swt.toString());
        System.out.println("HSF INFO: " + hsf);

        //Create info cv
        Student Lo_Van_Lum = new Student("SE1111", "Lo_Van_Lum", 24, 3.9);
        Student Nguyen_Van_Lu = new Student("SE1111", "Nguyen_Van_Lu", 24, 3.2);
        System.out.println(Nguyen_Van_Lu);
        System.out.println(Lo_Van_Lum);

        //JSON - from Object to JSON

        //1. Khai báo biến String để hứng - Tạo Object để quản lý JSON từ thư viện
        ObjectMapper mapper = new ObjectMapper(); // Nhiệm vụ ánh xạ qua lại
        //B1.1 Write 1 object thành chuỗi
        try {
            String lumJson = mapper.writeValueAsString(Lo_Van_Lum);
            System.out.println(lumJson);

        }catch (JsonProcessingException ex) {
            ex.getMessage();
        }

        // FE -> BE ( Từ JSON thành Object )
        // để từ Object xuống DB


        try {
            String vinhJson = """
                    {"id":"SE2","name":"Phuoc_Vinh","yob":2005,"gpa":3.9}""";
            // String vinhJson = """;
            // Có sao lưu vậy, bắt đầu từ JDK 15
            Student vinh = mapper.readValue(vinhJson, Student.class);
            System.out.println(vinh.toString());
            // đưa chuỗi convert thành Object thuộc class nào !!!!
        }catch (JsonProcessingException ex) {
            ex.getMessage();
        }

    }
}