package com.vinhdp.ui;

import com.vinhdp.ui.jvm.InheritanceScript;
import com.vinhdp.ui.jvm.JvmStepperApp;
import com.vinhdp.ui.jvm.VmModel.BytecodeLine;
import com.vinhdp.ui.jvm.VmModel.Snapshot;

import java.util.List;

/** DemoManagerRun.main() chạy từng lệnh một: dựng object và gọi method xuyên hai tầng kế thừa. */
public class JvmInheritanceApp extends JvmStepperApp {

    @Override
    protected String title() {
        return "Inside the JVM — kế thừa Employee / Manager";
    }

    @Override
    protected String subtitle() {
        return "Employee ref = new Manager(...);  ref.showDetails();  —  một object mang field "
                + "của cả hai tầng, constructor dựng từ cha xuống con, rồi lớp cha gọi ngược "
                + "xuống lớp con.";
    }

    @Override
    protected List<Snapshot> steps() {
        return InheritanceScript.build();
    }

    @Override
    protected List<BytecodeLine> bytecode() {
        return InheritanceScript.BYTECODE;
    }

    @Override
    protected String bytecodeTitle() {
        return "javap -c  (5 method liên quan)";
    }

    @Override
    protected String bytecodeHint() {
        return "So sánh hai lệnh: dòng 76 trong showDetails là invokevirtual nên nhảy XUỐNG "
                + "Manager, còn dòng 1 trong Manager.calculateSalary là invokespecial nên đi "
                + "THẲNG lên Employee.";
    }

    public static void main(String[] args) {
        launch(args);
    }
}
