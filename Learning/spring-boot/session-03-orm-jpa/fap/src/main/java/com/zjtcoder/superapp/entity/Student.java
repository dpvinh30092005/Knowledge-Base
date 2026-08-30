package com.zjtcoder.superapp.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
//import org.hibernate.annotations.Nationalized;


//CLASS NÀY SẼ ĐC KHAI BÁO
//ÁNH XẠ/BIẾN ĐỔI MAPPING THÀNH TABLE TƯƠNG ỨNG
@Entity
@Table(name = "Student") // Nếu không có khai báo này thì mặc định lấy tên class thành tên table!!!

public class Student {
    @Id
    @Column(name = "Id", columnDefinition = "CHAR(8)") //Nếu không có khai báo này thì mặc định lấy tên biến tên field làm tên cột

    private String id; //camelCase, id tự nhập

    @Column(name = "Name", nullable = false, length = 50, columnDefinition = "NVARCHAR(50)")
    //@Nationalized //Thiếu khai báo này thì String sẽ thành varchar và không lưu được tiếng Việt có dấu
    //Dùng Nationalized này sẽ mất tính Khả chuyển hay expand khi chơi với nhiêù nhà cung cấp

    private String name;

    @Column(name ="Yob", nullable = false)
    private int yob;

    @Column(name = "Gpa")
    private double gpa;

    //Bắt buộc 2 constructor
    //GET/SET/TOSTRING() dùng Lombok hoặc BOILER-PLATE

    public Student () {

    }

    public Student(String id, String name, int yob, double gpa) {
        this.id = id;
        this.name = name;
        this.yob = yob;
        this.gpa = gpa;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getYob() {
        return yob;
    }

    public void setYob(int yob) {
        this.yob = yob;
    }

    public double getGpa() {
        return gpa;
    }

    public void setGpa(double gpa) {
        this.gpa = gpa;
    }

    @Override
    public String toString() {
        return "Student{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", yob=" + yob +
                ", gpa=" + gpa +
                '}';
    }
}
