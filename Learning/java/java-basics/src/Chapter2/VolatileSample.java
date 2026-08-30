/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter2;

/**
 *
 * @author Dinh Dinh
 */
public class VolatileSample {

    /*
    volatile đảm bảo điều gì?
        1️⃣ Visibility (tính nhìn thấy)
        Khi 1 thread ghi, các thread khác đọc được ngay
        2️⃣ Ordering (thứ tự lệnh)
        Ngăn JVM / CPU đổi thứ tự lệnh nguy hiểm
    
    volatile KHÔNG đảm bảo điều gì?
        ❌ KHÔNG đảm bảo tính nguyên tử (atomic)

        Ví dụ ❌:
            volatile int count = 0;
            count++; // KHÔNG an toàn
            👉 count++ = 3 bước:
            đọc
            tăng
            ghi
        ➡ Có thể bị race condition

    Khi nào nên dùng volatile?
        ✔ Biến được ghi bởi 1 thread
        ✔ Biến được đọc bởi nhiều thread
        ✔ Không cần phép toán phức tạp
        Ví dụ thường gặp:
        cờ dừng thread
        trạng thái hệ thống
        flag boolean

    Khi nào KHÔNG nên dùng volatile?
    ❌ Cần tăng/giảm biến
    ❌ Cần đồng bộ nhiều biến
    ❌ Cần logic phức tạp

    👉 Khi đó dùng:
        synchronized
        AtomicInteger
        Lock 
    */
    volatile boolean running = true;

    void stop() {
        running = false;
    }

    void run() {
        while (running) {

        }
    }
}
