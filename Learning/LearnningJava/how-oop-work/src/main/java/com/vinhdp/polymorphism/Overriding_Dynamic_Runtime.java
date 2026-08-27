package com.vinhdp.polymorphism;

public class Overriding_Dynamic_Runtime {

    public static void main(String[] args) {

        //Upcasting: Variable kiểu CHA, Object kiểu CON
        Animal cat = new Cat();
        Animal dog = new Dog();

        //Dynamic Method Dispatch
        //:: Java quyết định gọi phương thức nào dựa vào KIỂU THỰC CỦA ĐỐI TƯỢNG LÚC CHẠY
        //:: chứ không phải kiểu khai báo biến.
        cat.bark(); // -> Meo Meo....        (Cat.bark)
        dog.bark(); // -> Gâu Gâu Gruuuu.... (Dog.bark)

        //Đối chiếu: lớp con KHÔNG override thì vẫn dùng bản của lớp cha
        Animal fish = new Fish();
        fish.bark(); // -> Animal bark (Fish không có bark riêng)

    }

    public static class Animal {

        public void bark() {
            System.out.println("Animal bark");
        }

    }

    public static class Dog extends Animal {

        @Override
        public void bark() {
            System.out.println("Gâu Gâu Gruuuu....");
        }

        //Method RIÊNG của Dog -> biến kiểu Animal không nhìn thấy, phải downcast
        public void sleep() {
            System.out.println("Dog sleep");
        }

    }

    public static class Cat extends Animal {

        @Override
        public void bark() {
            System.out.println("Meo Meo....");
        }

    }

    //Kế thừa nhưng KHÔNG override -> không có gì để dispatch, chạy luôn Animal.bark()
    public static class Fish extends Animal {

    }

}
