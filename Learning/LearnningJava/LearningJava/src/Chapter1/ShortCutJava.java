/*• Java thừa hưởng nhiều đặc điểm từ C và C++.
• Java lấy cú pháp của nó từ C.
• Nhiều tính năng hướng đối tượng của Java chịu ảnh hưởng từ C++



==== Web là động lực chính cho thành công của Java ====
• Sự xuất hiện của Web: Vào cuối thập niên 1980 và đầu thập niên 1990
• Nhu cầu về tính di động (Portability): Môi trường Internet đòi hỏi các 
    chương trình phải có tính di động (portable) cao.
• Chuyển đổi trọng tâm của Java


Java đã thay đổi Internet bằng cách:
• Đơn giản hóa lập trình Web: Java đơn giản hóa lập trình web nói chung.
• Giới thiệu Applet: Java tạo ra một loại chương trình mạng mới gọi là applet. 
    Applet là các chương trình nhỏ, được thiết kế để truyền qua Internet 
    và tự động thực thi bởi một trình duyệt web tương thích với Java.
• Giải quyết vấn đề bảo mật và tính di động: Java giải quyết hai vấn đề nan giải 
    nhất liên quan đến Internet: tính di động và bảo mật. Khả năng tải xuống applet 
    mà không lo bị vi phạm bảo mật được coi là khía cạnh sáng tạo nhất của Java.
• Giới thiệu Servlet: Sau đó, với sự ra đời của servlet, Java đã mở rộng sang cả 
    phía máy chủ (server side) của kết nối client/server, giúp tạo ra nội dung 
    được tạo động hiệu quả hơn so với CGI


                            ==== Tiến Hóa ===
I. Giai đoạn ban đầu (Trước Java 2)
    • Tốc độ đổi mới
    • Java 1.1: ava 1.1 đã bổ sung nhiều yếu tố thư viện mới, định nghĩa lại 
        cách xử lý sự kiện, và khai tử (deprecated) một số tính năng ban đầu 
        của Java 1.0
II. Kỷ nguyên Hiện đại (Java 2 trở đi)
    • Java 2 (Phiên bản 1.2): Sự ra đời của Java 2 là một sự kiện bước ngoặt, 
        đánh dấu sự khởi đầu của "kỷ nguyên hiện đại" của Java
        Phiên bản này được Sun đổi tên thành J2SE (Java 2 Platform Standard Edition)
         - Java 2 đã bổ sung nhiều tính năng quan trọng:
            bao gồm Swing và Khung Tập hợp (Collections Framework)
        Nó cũng khai tử các phương thức suspend(), resume(), và stop() trong lớp Thread
    • J2SE 5 (Thực sự mang tính cách mạng)
        ◦ Các tính năng mới chính bao gồm Generics, Annotations (Metadata), 
            Autoboxing và auto-unboxing, Enumerations, vòng lặp for kiểu "for-each" nâng cao, 
            đối số có độ dài biến đổi (varargs), static import, I/O được định dạng, 
            và tiện ích đồng thời (Concurrency utilities)
    • Java SE 6: Đây là bản phát hành mới nhất được đề cập trong nguồn
        ◦ Phiên bản này không thêm các tính năng lớn vào bản thân ngôn ngữ Java, 
            mà thay vào đó tăng cường các thư viện API hiện có và cung cấp các 
            cải tiến gia tăng cho thời gian chạy (run time)


                ==== Tính năng Bảo mật (Confining applet) ====
Java đã giải quyết vấn đề này bằng cách giam giữ (confining) applet trong 
môi trường thực thi Java và không cho phép nó truy cập vào các phần khác của máy tính

• Cơ chế liên quan: Cơ chế giúp đảm bảo an toàn cho applet có liên hệ mật thiết 
    với cơ chế Bytecode và Máy ảo Java (JVM). Vì JVM kiểm soát quá trình thực thi, 
    nó có thể chứa chương trình và ngăn chương trình tạo ra các tác dụng phụ bên ngoài hệ thống
*/
