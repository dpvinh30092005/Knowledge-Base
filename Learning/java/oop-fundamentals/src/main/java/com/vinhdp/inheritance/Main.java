package com.vinhdp.inheritance;

public class Main {

    public static void main(String[] args) {

        Employee employeeSt1 = new Employee( "EM1", "Đặng Phước Vinh", 8_000_000);

        SalesStaff salesStaffSt1 = new SalesStaff("EM2", "Đặng Văn Đ", 10_000_000, 100_000_000, 0.2);

        Manager managerSt1 = new Manager("EM3", "Lê Thị B", 15_000_000, 5_000_000, 8);

        //Nhờ inheritance nên có thể coi là Employee
        Employee[] listEmployees = {employeeSt1, salesStaffSt1, managerSt1};
        for (Employee employee : listEmployees) {
            employee.showDetails();
            System.out.println();
        }



        managerSt1.approveLeave(salesStaffSt1);



    }

}
