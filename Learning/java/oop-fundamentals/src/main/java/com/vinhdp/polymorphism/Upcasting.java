package com.vinhdp.polymorphism;

public class Upcasting {

    public static void main(String[] args) {

    //  Ép kiểu từ CON -> CHA, tự động, an toàn
    //  Sau khi upcast biến animal chỉ thấy được các method có trong Animal Class
        Animal animal = new Dog(); //Upcasting Ngầm: Ép kiểu ngầm
//        animal.sleep(); // > Error Compile



    }

    static class Animal {

        public void bark() {
            System.out.println("Animal bark");
        }

    }

    static class Dog extends Animal {

        public void bark() {
            System.out.println("Gâu Gâu Gruuuu....");
        }

        public void sleep() {
            System.out.println("Dog sleep");
        }

    }

}
