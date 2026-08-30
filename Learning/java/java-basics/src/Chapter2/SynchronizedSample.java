/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter2;

/**
 *
 * @author Dinh Dinh
 */
//Vấn đề nếu KHÔNG dùng synchronized
class Counter {

    int count = 0;

    void increase() {
        count++;   // không an toàn
    }
    //2 thread cùng gọi increase() ⇒
    //❌ Kết quả có thể bị sai
}

public class SynchronizedSample {

    /*synchronized trong Java là gì?
        synchronized là từ khóa dùng để đồng bộ hóa trong môi trường đa luồng (multithreading).
        👉 Mục đích chính:
            Chỉ cho 1 thread truy cập tài nguyên tại 1 thời điểm
            Tránh race condition
            Đảm bảo dữ liệu luôn đúng
    synchronized hoạt động như thế nào?
        Mỗi object có 1 intrinsic lock (monitor)
        Thread phải giữ lock thì mới vào được block/method
        Thread khác phải đợi
    
    synchronized đảm bảo điều gì?
        ✔ Atomicity
        ✔ Visibility (như volatile)
        ✔ Ordering
     */
    int count = 0;

    synchronized void increase() {
        count++;
    }

    //OR
    void increase2() { 
        synchronized (this) {
            count++;
        }
    } //✔ Chỉ khóa đoạn cần thiết → nhanh hơn

    static synchronized void print() {
    } //🔒 Lock trên Class object (Counter.class)

    private final Object lock = new Object();

    void increase3() { 
        synchronized (lock) {
            count++;
        }
    } //✔ Tránh bị lock ngoài ý muốn
}
