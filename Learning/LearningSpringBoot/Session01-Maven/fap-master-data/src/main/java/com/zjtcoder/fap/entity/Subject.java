package com.zjtcoder.fap.entity;

// Class used to save info subject


public class Subject {

    private String idSubject;
    private String nameSubject;
    private int credit;
    private double hours;

    //Khi chơi với table, class này sẽ mapping thành table
    // New subject ("","", , );
    // Tương ứng vói từng dòng trong table
    // CLASS ------ TABLE
    // NEW   ------ INSERT INTO

    // BẮT BUỘC CLASS PHẢI CÓ NHỮNG THỨ SAU KHI CHƠI VỚI DATABASE
    /*
    * - DEFAULT CONSTRUCTOR
    * - CONSTRUCTOR FULL PROPERTIES
    * - GETTER/SETTER
    * - TO STRING (optional)
    * */

    // RIGHT CLICK -> GENERATE -> MỤC TƯƠNG ỨNG

    // TOÀN BỘ ĐOẠN CODE NÀY RẤT QUAN TRỌNG VÌ GIÚP TA TẠO RA OBJECT
    // 1 CÁCH LINH HOẠT (TẠO - NEW, CHỈNH SỬA - SET, HỎI INFO - GET, SHOW INFO - TOSTRING)
    // NHƯNG NHÀM CHÁN, KHÔNG TƯ DUY GÌ THÊM
    // ĐOẠN CODE NHÀM CHÁN, NHƯNG VẪN PHẢI LÀM, KHÔNG THỂ THIẾU -> GỌI LÀ BOILER PLATE!!!


    public Subject() {
    }

    public Subject(String idSubject, String nameSubject, int credit, double hours) {
        this.idSubject = idSubject;
        this.nameSubject = nameSubject;
        this.credit = credit;
        this.hours = hours;
    }

    public String getIdSubject() {
        return idSubject;
    }

    public void setIdSubject(String idSubject) {
        this.idSubject = idSubject;
    }

    public String getNameSubject() {
        return nameSubject;
    }

    public void setNameSubject(String nameSubject) {
        this.nameSubject = nameSubject;
    }

    public int getCredit() {
        return credit;
    }

    public void setCredit(int credit) {
        this.credit = credit;
    }

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    @Override
    public String toString() {
        return "Subject{" +
                "idSubject='" + idSubject + '\'' +
                ", nameSubject='" + nameSubject + '\'' +
                ", credit=" + credit +
                ", hours=" + hours +
                '}';
    }
}
