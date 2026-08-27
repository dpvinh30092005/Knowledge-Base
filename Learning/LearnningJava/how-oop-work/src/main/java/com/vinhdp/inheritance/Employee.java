package com.vinhdp.inheritance;

public class Employee {

    protected String id; //protected cho inheritance
    protected String fullName;
    protected double salary;

    public Employee(String id, String fullName, double salary) {
        this.id = id;
        this.fullName = fullName;
        this.salary = salary;
    }

    //Method chung subclass có thể override
    public double calculateSalary() {
        return salary;
    }

    public void showDetails() {
        System.out.println("==================== " + id + " -- " + fullName + " ====================");
        System.out.println("Position    : " + getPosition());
        System.out.println("Base salary : " + String.format("%,.0f", salary));
        //GỌI calculateSalary() chứ không in thẳng field salary,
        //nếu không thì override ở lớp con sẽ không bao giờ có tác dụng
        System.out.println("Total salary: " + String.format("%,.0f", calculateSalary()));
        System.out.println("Detail      : " + describeSalary());
    }

    //Lớp con override để giải thích tổng lương được ghép từ đâu
    public String describeSalary() {
        return "base " + String.format("%,.0f", salary);
    }

    public String getPosition() {
        return "Employee";
    }

    public String getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public double getSalary() {
        return salary;
    }

}
