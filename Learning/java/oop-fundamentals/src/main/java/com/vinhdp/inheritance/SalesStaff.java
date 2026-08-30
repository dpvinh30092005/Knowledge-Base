package com.vinhdp.inheritance;

public class SalesStaff extends Employee {

    private final double sales;
    private final double commissionRate;

    public SalesStaff(String id, String fullName, double salary, double sales, double commissionRate) {
        super(id, fullName, salary); //Call constructor lớp cha
        this.sales = sales;
        this.commissionRate = commissionRate;
    }

    @Override
    public double calculateSalary() {
        return super.calculateSalary() + sales * commissionRate;
    }

    @Override
    public String describeSalary() {
        return super.describeSalary()
                + " + commission " + String.format("%,.0f", sales)
                + " x " + commissionRate;
    }

    @Override
    public String getPosition() {
        return "Sales Staff";
    }

    public double getSales() {
        return sales;
    }

    public double getCommissionRate() {
        return commissionRate;
    }
}
