package com.vinhdp.inheritance;

/**
 * Hai dòng lệnh ngắn nhất mà vẫn dựng đủ câu chuyện kế thừa:
 * chuỗi constructor chạy từ cha xuống con, rồi showDetails() của lớp CHA
 * lại gọi ngược xuống calculateSalary() của lớp CON.
 *
 * App JvmInheritanceApp mô phỏng đúng bytecode của method main() này —
 * xem bằng: javap -c -p target/classes/com/vinhdp/inheritance/DemoManagerRun.class
 */
public class DemoManagerRun {

    public static void main(String[] args) {
        Employee ref = new Manager("EM3", "Le Thi B", 15_000_000, 5_000_000, 8);
        ref.showDetails();
    }

}
