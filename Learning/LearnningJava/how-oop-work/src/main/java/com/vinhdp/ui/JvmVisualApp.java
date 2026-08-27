package com.vinhdp.ui;

import com.vinhdp.ui.jvm.DogScript;
import com.vinhdp.ui.jvm.JvmStepperApp;
import com.vinhdp.ui.jvm.VmModel.BytecodeLine;
import com.vinhdp.ui.jvm.VmModel.Snapshot;

import java.util.List;

/** Overriding_Dynamic_Runtime.main() chạy từng lệnh một. */
public class JvmVisualApp extends JvmStepperApp {

    @Override
    protected String title() {
        return "Inside the JVM — dynamic dispatch";
    }

    @Override
    protected String subtitle() {
        return "Animal cat = new Cat();  cat.bark();  —  từng lệnh bytecode một, "
                + "xem JVM thật sự chọn method nào và chọn bằng cách nào.";
    }

    @Override
    protected List<Snapshot> steps() {
        return DogScript.build();
    }

    @Override
    protected List<BytecodeLine> bytecode() {
        return DogScript.BYTECODE;
    }

    @Override
    protected String bytecodeTitle() {
        return "javap -c  main(String[])";
    }

    @Override
    protected String bytecodeHint() {
        return "Cả ba lời gọi bark() đều là cùng một lệnh invokevirtual #13. "
                + "Bytecode không phân biệt Cat, Dog hay Fish.";
    }

    public static void main(String[] args) {
        launch(args);
    }
}
