# how-oop-work

Ghi chú và ví dụ chạy được về 4 tính chất của OOP trong Java.
Mỗi khái niệm có **hai cách xem**: bản console và bản JavaFX có giao diện.

## Yêu cầu

- JDK 21 (Maven đang chạy trên JDK 21)
- JavaFX 21.0.6 — khai báo sẵn trong `pom.xml`, Maven tự lo

## Chạy bản JavaFX

Mỗi khái niệm là một app riêng, gọi theo id của execution:

```bash
mvn -o javafx:run@encapsulation
```

```bash
mvn -o javafx:run@inheritance
```

```bash
mvn -o javafx:run@polymorphism
```

```bash
mvn -o javafx:run@abstraction
```

```bash
mvn -o javafx:run@jvm
```

```bash
mvn -o javafx:run@jvm-inheritance
```

```bash
mvn -o javafx:run@encapsulation-map
```

```bash
mvn -o javafx:run@interface-tree
```

Cả 4 app dùng chung khung ở `com.vinhdp.ui.common`: header, vùng nội dung,
và **panel Call log** bên phải ghi lại từng method được gọi cùng kết quả trả về.

| App | Xem được gì |
|---|---|
| Encapsulation | Máy ATM: nhập PIN, rút/nạp tiền, thẻ tự khoá sau 3 lần sai, nhân viên ngân hàng mở khoá. Kèm danh sách những dòng code `private` chặn không cho viết. |
| Inheritance | Bảng lương: thêm `Employee` / `SalesStaff` / `Manager` vào cùng một `Employee[]`, cột `calculateSalary()` cho ra ba kết quả khác nhau. |
| Polymorphism | 3 tab: overriding (runtime), overloading (compile time), upcast/downcast kèm nút ép kiểu hỏng để thấy `ClassCastException`. |
| Abstraction | Canvas vẽ 3 hình qua interface `Drawable`, diện tích tính qua abstract method `Shape.area()`, kèm bảng so sánh abstract class vs interface. |
| **JVM** | Mô phỏng từng lệnh bytecode của `Overriding_Dynamic_Runtime.main()`: Stack, Heap (có vẽ con chó/mèo/cá thật), Method Area và vtable, kèm mũi tên reference và klass pointer. |
| **JVM — kế thừa** | Mô phỏng `DemoManagerRun.main()`: layout field của một object `Manager` (phần Employee trước, phần Manager sau), chuỗi constructor chạy từ cha xuống con, và đối chiếu `invokevirtual` vs `invokespecial`. |
| **Encapsulation — bản đồ** | Sơ đồ package lồng nhau; bấm vào một class để xem nó với tới được bao nhiêu trong 19 member của `TheATM`, kèm lý do và đoạn code compile được hay không. |
| **Cây interface** | Bốn tình huống đa kế thừa interface trong `abstraction.multi`: interface cụ thể hơn thắng, class thắng interface, và xung đột buộc phải override bằng `X.super.send()`. |

## Chạy bản console

```bash
mvn -o compile
```

```bash
java -Dfile.encoding=UTF-8 -cp target/classes com.vinhdp.inheritance.Main
```

Đổi class cuối thành `com.vinhdp.encapsulation.Main`,
`com.vinhdp.polymorphism.Overriding_Dynamic_Runtime`,
hoặc `com.vinhdp.polymorphism.Downcasting`.

> Nếu tiếng Việt bị vỡ trong terminal Windows, chạy `chcp 65001` trước.
> Bản JavaFX không bị lỗi này.

## Cấu trúc

```
com.vinhdp
├── abstraction        NameClass / InterfaceClass + package shapes (Shape, Drawable, 3 hình)
├── encapsulation      TheATM, TheATMVIP, BankEmployee
├── inheritance        Employee, SalesStaff, Manager
├── polymorphism       Upcasting, Downcasting, Overloading, Overriding
└── ui                 4 app JavaFX + common (DemoApp, LogPanel, UiKit)
```

Ghi chú lý thuyết nằm trong các file `what-is-*.md` ở từng package.
