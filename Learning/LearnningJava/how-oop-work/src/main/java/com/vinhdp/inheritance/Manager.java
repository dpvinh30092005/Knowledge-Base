package com.vinhdp.inheritance;

public class Manager extends Employee {

    //employeeNumber là SỐ NGƯỜI quản lý, phải nhân với đơn giá mới ra tiền
    private static final double BONUS_PER_HEAD = 500_000;

    private final double positionAllowance;
    private final int employeeNumber;

    public Manager(String id, String fullName, double salary, double positionAllowance, int employeeNumber) {
        super(id, fullName, salary);
        this.positionAllowance = positionAllowance;
        this.employeeNumber = employeeNumber;
    }

    @Override
    public double calculateSalary() {
        return super.calculateSalary() + positionAllowance + employeeNumber * BONUS_PER_HEAD;
    }

    @Override
    public String describeSalary() {
        return super.describeSalary()
                + " + allowance " + String.format("%,.0f", positionAllowance)
                + " + " + employeeNumber + " staff x " + String.format("%,.0f", BONUS_PER_HEAD);
    }

    @Override
    public String getPosition() {
        return "Manager";
    }

    public void approveLeave(Employee employee) {
        System.out.println(fullName + " is approving leave for " + employee.fullName);
    }

    public double getPositionAllowance() {
        return positionAllowance;
    }

    public int getEmployeeNumber() {
        return employeeNumber;
    }
}
