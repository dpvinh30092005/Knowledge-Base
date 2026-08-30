package Chapter2;

/*
instanceof trong Java là gì?
    instanceof là toán tử dùng để kiểm tra một object có thuộc về một class / interface nào đó không.
    👉 Kết quả trả về: true hoặc false

  Cú pháp   [object] instanceof [ClassOrInterface]

Khi nào nên dùng instanceof?
    ✔ Khi xử lý đa hình
    ✔ Khi cần phân loại object trong collection
    ✔ Khi ép kiểu an toàn

Khi nào KHÔNG nên lạm dụng?
    ❌ Lạm dụng → code khó bảo trì
    ❌ Vi phạm OOP (nên dùng polymorphism)
 */
interface Flyable {
}

public class InstanceofSample {

    public static void main(String[] args) {
        String s = "Learn instanceOf";
        System.out.println(s instanceof String);
        System.out.println(s instanceof Object);
        //👉 Vì String kế thừa Object

        //Inheritance
        class Animal {

            void bark() {
                System.out.println("Gau Gau");
            }
        }
        class Dog extends Animal {
        }
        Animal aki = new Dog();

        System.out.println(aki instanceof Animal);
        System.out.println(aki instanceof Dog);

        //Interface
        class Bird implements Flyable {
        }
        Bird bird = new Bird();
        System.out.println(bird instanceof Bird);

        //Dùng instanceof để ép kiểu an toàn
        //❌ Sai (có thể lỗi runtime):
//        Animal a = new Dog();
//          Cat  = (Cat) a; // ClassCastException
        //✔ Đúng:
//        if (a instanceof Dog) {
//            Dog d = (Dog) a;
//        }
        //Java mới (Java 16+): Pattern Matching
//        if (aki instanceof Dog d) {
//            d.bark();
//        }
        if (aki instanceof Dog) {
            aki.bark();
        }
        /*
        ✔ Không cần cast tay
        ✔ Code gọn hơn
         */
    }
}
