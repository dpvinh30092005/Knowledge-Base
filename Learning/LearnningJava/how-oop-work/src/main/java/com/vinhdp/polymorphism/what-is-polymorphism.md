# Tính Đa Hình (Polymorphism) trong OOP

## 1. Khái niệm

**Đa hình (Polymorphism)** là tính chất thứ tư trong bốn tính chất cơ bản của OOP. Từ này bắt nguồn từ tiếng Hy Lạp: *poly* (nhiều) + *morph* (hình dạng) — nghĩa đen là **"nhiều hình dạng"**.

Trong lập trình, đa hình là khả năng **một hành động (cùng một tên phương thức) có thể được thực hiện theo nhiều cách khác nhau**, tùy thuộc vào đối tượng thực sự đang gọi nó.

Ví dụ đời thực: động từ **"kêu"**. Cùng một từ, nhưng:

- Chó kêu → "Gâu gâu"
- Mèo kêu → "Meo meo"
- Bò kêu → "Ò ó o"

Người ra lệnh chỉ cần nói *"kêu đi!"* — không cần biết đó là con gì, mỗi con tự biết cách kêu của mình. Đó chính là đa hình.

Trong code, điều này thể hiện qua việc: một biến kiểu lớp cha có thể tham chiếu tới đối tượng của bất kỳ lớp con nào, và khi gọi phương thức, chương trình sẽ **tự động chọn đúng phiên bản của lớp con đó**.

## 2. Hai loại đa hình

| | **Đa hình tĩnh** (Static / Compile-time) | **Đa hình động** (Dynamic / Runtime) |
|---|---|---|
| Tên gọi khác | Nạp chồng — **Overloading** | Ghi đè — **Overriding** |
| Xác định khi nào | Lúc **biên dịch** (compile time) | Lúc **chạy** (runtime) |
| Cơ chế | Early binding (liên kết sớm) | Late binding / Dynamic dispatch |
| Điều kiện | Cùng tên, **khác** danh sách tham số | Cùng tên, **cùng** danh sách tham số, ở lớp con |
| Cần kế thừa không | Không | **Có** — bắt buộc |
| Ví dụ | `tinh(int, int)` và `tinh(double, double)` | `Cho.keu()` override `DongVat.keu()` |

> **Lưu ý thi cử:** Nhiều người chỉ nhớ Overriding mà quên Overloading cũng là đa hình. Khi được hỏi "có mấy loại đa hình", câu trả lời đầy đủ là **hai**.

### a) Đa hình tĩnh — Overloading (Nạp chồng)

Trong cùng một lớp, định nghĩa nhiều phương thức **cùng tên** nhưng **khác nhau về danh sách tham số** (khác số lượng, khác kiểu, hoặc khác thứ tự kiểu).

```java
public class MayTinh {
    public int cong(int a, int b) {
        return a + b;
    }

    public double cong(double a, double b) {         // khác KIỂU tham số
        return a + b;
    }

    public int cong(int a, int b, int c) {           // khác SỐ LƯỢNG tham số
        return a + b + c;
    }

    public String cong(String a, String b) {         // khác kiểu hoàn toàn
        return a + " " + b;
    }
}

// Sử dụng:
MayTinh mt = new MayTinh();
System.out.println(mt.cong(2, 3));            // 5      -> gọi bản int
System.out.println(mt.cong(2.5, 3.5));        // 6.0    -> gọi bản double
System.out.println(mt.cong(1, 2, 3));         // 6      -> gọi bản 3 tham số
System.out.println(mt.cong("Xin", "chào"));   // Xin chào
```

**Quan trọng:** Chỉ khác **kiểu trả về** thì KHÔNG được coi là overloading — sẽ báo lỗi biên dịch:

```java
public int tinh(int a) { return a; }
public double tinh(int a) { return a; }   // LỖI! Trùng chữ ký phương thức
```

### b) Đa hình động — Overriding (Ghi đè)

Lớp con định nghĩa lại phương thức của lớp cha với **chữ ký hoàn toàn giống nhau**. Đây mới là dạng đa hình "kinh điển" mà OOP nhắm tới.

```java
class DongVat {
    public void keu() {
        System.out.println("Động vật kêu...");
    }
}

class Cho extends DongVat {
    @Override
    public void keu() {
        System.out.println("Gâu gâu!");
    }
}

class Meo extends DongVat {
    @Override
    public void keu() {
        System.out.println("Meo meo!");
    }
}

// Sử dụng:
DongVat dv = new Cho();   // Biến kiểu CHA, đối tượng kiểu CON (upcasting)
dv.keu();                 // In ra "Gâu gâu!" -> chọn theo ĐỐI TƯỢNG, không theo BIẾN
```

Đây chính là **điểm cốt lõi**: Java quyết định gọi phương thức nào dựa vào **kiểu thực của đối tượng lúc chạy**, chứ không phải kiểu khai báo của biến. Cơ chế này gọi là **Dynamic Method Dispatch**.

## 3. Upcasting và Downcasting

**Upcasting** — ép kiểu lên (con → cha), **tự động**, luôn an toàn:

```java
DongVat dv = new Cho();          // upcasting ngầm định
```

Sau khi upcast, biến `dv` **chỉ nhìn thấy** những phương thức có trong `DongVat`. Nếu `Cho` có phương thức riêng `giuNha()` thì `dv.giuNha()` sẽ báo lỗi biên dịch.

**Downcasting** — ép kiểu xuống (cha → con), phải viết **tường minh**, có thể gây lỗi lúc chạy:

```java
DongVat dv = new Cho();
Cho c = (Cho) dv;                // downcasting - OK vì dv thực sự là Cho
c.giuNha();                      // giờ mới gọi được phương thức riêng

DongVat dv2 = new Meo();
Cho c2 = (Cho) dv2;              // ClassCastException lúc chạy!
```

Để an toàn, luôn kiểm tra bằng `instanceof` trước:

```java
if (dv instanceof Cho) {
    Cho c = (Cho) dv;
    c.giuNha();
}

// Java 16+ có cú pháp gọn hơn (pattern matching):
if (dv instanceof Cho c) {
    c.giuNha();
}
```


Python **không hỗ trợ overloading** theo kiểu Java (định nghĩa lại sẽ ghi đè hàm cũ). Thay vào đó dùng tham số mặc định, `*args`, hoặc `@singledispatch`.

## 7. Lưu ý quan trọng

- **Thuộc tính KHÔNG có tính đa hình.** Nếu lớp cha và lớp con cùng có thuộc tính `ten`, thì `dv.ten` sẽ lấy theo **kiểu của biến** (lớp cha), không phải theo đối tượng. Đa hình chỉ áp dụng cho **phương thức**.
- **Phương thức `static` không override được.** Nếu lớp con khai báo một `static` method trùng tên, đó là **method hiding** (che giấu), không phải overriding — và nó chọn theo kiểu biến, không phải kiểu đối tượng.
- **Không override được `private` và `final` method.** `private` không nhìn thấy được từ lớp con; `final` bị cấm rõ ràng.
- **Quy tắc khi override:** phạm vi truy cập của phương thức ghi đè **không được hẹp hơn** phương thức gốc (cha là `public` thì con không thể là `protected`). Kiểu trả về có thể là kiểu con của kiểu trả về gốc (**covariant return type**).
- **Luôn dùng `@Override`.** Annotation này giúp trình biên dịch phát hiện lỗi khi bạn viết sai tên hoặc sai tham số — nếu không có nó, Java sẽ hiểu nhầm thành một phương thức mới hoàn toàn và bug này rất khó tìm.

## 8. Mối liên hệ với 3 tính chất còn lại

Đa hình không đứng một mình — nó là **kết quả tổng hợp** của ba tính chất kia:

- **Kế thừa** tạo ra quan hệ cha-con → điều kiện tiên quyết để có upcasting và overriding.
- **Trừu tượng** định nghĩa "hợp đồng" chung (`tinhDienTich()` phải tồn tại) → đảm bảo mọi lớp con đều gọi được.
- **Đóng gói** giữ chi tiết cài đặt riêng của mỗi lớp con → mỗi hình tự tính diện tích theo dữ liệu nội bộ của nó mà bên ngoài không can thiệp.

## 9. Tóm tắt

| Đặc điểm | Mô tả |
|---|---|
| Nghĩa đen | "Nhiều hình dạng" — một tên gọi, nhiều cách thực hiện |
| Hai loại | Tĩnh (**Overloading**, compile-time) và Động (**Overriding**, runtime) |
| Điều kiện đa hình động | Phải có kế thừa + override + upcasting |
| Cơ chế | Dynamic Method Dispatch — chọn theo **kiểu đối tượng**, không theo kiểu biến |
| Từ khóa liên quan | `@Override`, `extends`, `implements`, `instanceof`, `super` |
| Lợi ích | Code linh hoạt, loại bỏ `if-else` kiểm tra kiểu, dễ mở rộng (Open/Closed) |
| Không áp dụng cho | Thuộc tính, phương thức `static`, `private`, `final` |
| Ví dụ đời thực | Ra lệnh "kêu đi!" — mỗi con vật tự kêu theo cách của nó |