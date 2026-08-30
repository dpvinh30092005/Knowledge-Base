package com.vinhdp.polymorphism;

public class Downcasting {

    public static void main(String[] args) {

        //Downcast từ CHA -> CON, phải viết tường minh, có thể throw lỗi lúc runtime
        Animal animal = new Dog();

        Dog dog = (Dog) animal;  //Downcasting - OK vì animal thực sự là Dog()
        dog.sleep();             //Giờ mới gọi được method không có trong lớp cha

//        Animal animal2 = new Cat();
//        Dog cat = (Dog) animal2; //ClassCastException lúc chạy

        //!! ĐỂ AN TOÀN THÌ NÊN DÙNG instanceof trước

        if (animal instanceof Dog) {
            Dog dog2 = (Dog) animal;
            dog2.sleep();
        }

        // Java 16+ có cú pháp gọn hơn (pattern matching)

        if (animal instanceof Dog dog3) {
            dog3.sleep();
        }

        //Cast hỏng: bắt được ClassCastException lúc RUNTIME, compiler không chặn
        Animal aCat = new Cat();
        try {
            Dog notADog = (Dog) aCat;
            notADog.sleep();
        } catch (ClassCastException e) {
            System.out.println("ClassCastException: " + e.getMessage());
        }

    }

    static class Animal {

        public void bark() {
            System.out.println("Animal bark");
        }

    }

    static class Dog extends Animal {

        @Override
        public void bark() {
            System.out.println("Gâu Gâu Gruuuu....");
        }

        public void sleep() {
            System.out.println("Dog sleep");
        }

    }

    static class Cat extends Animal {

        @Override
        public void bark() {
            System.out.println("Meo Meo....");
        }

    }

}
