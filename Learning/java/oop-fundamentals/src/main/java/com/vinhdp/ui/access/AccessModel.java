package com.vinhdp.ui.access;

import java.util.List;

/**
 * Bảng thành viên của TheATM và luật truy cập của Java.
 *
 * Danh sách member lấy nguyên từ:
 *   javap -p target/classes/com/vinhdp/encapsulation/bankst/TheATM.class
 */
public final class AccessModel {

    public enum Level {
        PRIVATE("private", "#dc2626"),
        PACKAGE("(package-private)", "#d97706"),
        PROTECTED("protected", "#7c3aed"),
        PUBLIC("public", "#16a34a");

        public final String label;
        public final String color;

        Level(String label, String color) {
            this.label = label;
            this.color = color;
        }
    }

    public enum Verdict {
        YES("Truy cập được", "#16a34a", "#dcfce7"),
        THIS_ONLY("Chỉ qua this", "#b45309", "#fef3c7"),
        NO("Bị chặn", "#b91c1c", "#fee2e2");

        public final String label;
        public final String color;
        public final String fill;

        Verdict(String label, String color, String fill) {
            this.label = label;
            this.color = color;
            this.fill = fill;
        }
    }

    public record Member(Level level, String signature, boolean isStatic, boolean isField) {
    }

    /**
     * Lớp đang muốn truy cập vào TheATM.
     * sameClass = chính TheATM, samePackage = cùng package bankst, subclass = kế thừa TheATM.
     */
    public record Viewer(String name, String packageName,
                         boolean sameClass, boolean samePackage, boolean subclass,
                         String role) {
    }

    public static final String TARGET = "TheATM";
    public static final String TARGET_PACKAGE = "com.vinhdp.encapsulation.bankst";

    public static final List<Member> MEMBERS = List.of(
            new Member(Level.PRIVATE, "static final int MAX_PIN_ATTEMPTS", true, true),
            new Member(Level.PRIVATE, "final int pinCode", false, true),
            new Member(Level.PRIVATE, "double balance", false, true),
            new Member(Level.PRIVATE, "int numberError", false, true),
            new Member(Level.PRIVATE, "boolean locked", false, true),
            new Member(Level.PRIVATE, "final List<String> historyTransactions", false, true),
            new Member(Level.PROTECTED, "double withdrawLimit", false, true),
            new Member(Level.PUBLIC, "TheATM(int, double)", false, false),
            new Member(Level.PUBLIC, "boolean verifyPinCode(int)", false, false),
            new Member(Level.PUBLIC, "void withDraw(double)", false, false),
            new Member(Level.PUBLIC, "void deposit(double)", false, false),
            new Member(Level.PUBLIC, "List<String> getHistoryTransactions()", false, false),
            new Member(Level.PUBLIC, "double getBalance()", false, false),
            new Member(Level.PUBLIC, "double getWithdrawLimit()", false, false),
            new Member(Level.PUBLIC, "boolean isLocked()", false, false),
            new Member(Level.PACKAGE, "void lock()", false, false),
            new Member(Level.PACKAGE, "void unlock()", false, false),
            new Member(Level.PROTECTED, "void saveLog(String)", false, false),
            new Member(Level.PROTECTED, "static String format(double)", true, false));

    public static final List<Viewer> VIEWERS = List.of(
            new Viewer("TheATM", TARGET_PACKAGE, true, true, false,
                    "Chính nó — nhìn thấy tất cả, kể cả private"),
            new Viewer("BankEmployee", TARGET_PACKAGE, false, true, false,
                    "Cùng package bankst, KHÔNG kế thừa"),
            new Viewer("TheATMVIP", TARGET_PACKAGE + ".vip", false, false, true,
                    "Khác package, có kế thừa TheATM"),
            new Viewer("Main", "com.vinhdp.encapsulation", false, false, false,
                    "Khác package, không kế thừa — người dùng bình thường"),
            new Viewer("EncapsulationApp", "com.vinhdp.ui", false, false, false,
                    "Tầng giao diện, hoàn toàn ở ngoài"));

    private AccessModel() {
    }

    public static Verdict check(Member member, Viewer viewer) {
        return switch (member.level()) {
            case PUBLIC -> Verdict.YES;
            case PRIVATE -> viewer.sameClass() ? Verdict.YES : Verdict.NO;
            case PACKAGE -> viewer.samePackage() ? Verdict.YES : Verdict.NO;
            case PROTECTED -> {
                if (viewer.samePackage()) {
                    yield Verdict.YES;
                }
                if (!viewer.subclass()) {
                    yield Verdict.NO;
                }
                //JLS 6.6.2.1: lớp con khác package chỉ với tới member INSTANCE thông qua
                //chính nó (this / kiểu lớp con), còn member static thì không bị ràng buộc đó.
                yield member.isStatic() ? Verdict.YES : Verdict.THIS_ONLY;
            }
        };
    }

    /** Vì sao lại ra kết quả đó — câu này hiện ngay cạnh mỗi dòng. */
    public static String reason(Member member, Viewer viewer) {
        Verdict verdict = check(member, viewer);
        return switch (member.level()) {
            case PUBLIC -> "public thì ở đâu cũng gọi được";
            case PRIVATE -> verdict == Verdict.YES
                    ? "cùng một class nên đọc thẳng được"
                    : "private chỉ sống trong TheATM.java";
            case PACKAGE -> verdict == Verdict.YES
                    ? "cùng package " + shortPackage(viewer.packageName())
                    : "khác package — kế thừa cũng không cứu được";
            case PROTECTED -> switch (verdict) {
                case YES -> member.isStatic() && !viewer.samePackage()
                        ? "member static, lớp con gọi thẳng được"
                        : "cùng package nên protected mở";
                case THIS_ONLY -> "chỉ dùng được trên this, không dùng trên một TheATM bất kỳ";
                case NO -> "không cùng package, cũng không kế thừa";
            };
        };
    }

    /** Ví dụ code tương ứng với dòng đang chọn. */
    public static String snippet(Member member, Viewer viewer) {
        String owner = viewer.sameClass() ? "this"
                : viewer.subclass() ? "this"
                : "atm";
        String name = memberName(member);
        String call = member.isField() ? owner + "." + name : owner + "." + name + "...";
        return switch (check(member, viewer)) {
            case YES -> call + ";   // OK";
            case THIS_ONLY -> "this." + name + ";   // OK\n"
                    + "otherAtm." + name + ";   // KHÔNG compile";
            case NO -> call + ";   // KHÔNG compile";
        };
    }

    private static String memberName(Member member) {
        String signature = member.signature();
        int paren = signature.indexOf('(');
        String head = paren < 0 ? signature : signature.substring(0, paren);
        String[] parts = head.trim().split("\\s+");
        return parts[parts.length - 1];
    }

    private static String shortPackage(String packageName) {
        int dot = packageName.lastIndexOf('.');
        return dot < 0 ? packageName : packageName.substring(dot + 1);
    }
}
