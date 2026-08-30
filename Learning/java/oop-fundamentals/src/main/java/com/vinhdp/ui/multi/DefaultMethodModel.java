package com.vinhdp.ui.multi;

import java.util.List;
import java.util.Set;

/**
 * Bốn kịch bản đa kế thừa interface trong package com.vinhdp.abstraction.multi.
 *
 * Mọi kết quả ở đây đều lấy từ việc CHẠY THẬT:
 *   java -cp target/classes com.vinhdp.abstraction.multi.Main
 * và thông báo lỗi ở kịch bản MultiAlert là output thật của javac.
 */
public final class DefaultMethodModel {

    public enum Kind {
        INTERFACE, CLASS, TARGET
    }

    public enum EdgeKind {
        EXTENDS_CLASS("extends", false),
        EXTENDS_INTERFACE("extends", true),
        IMPLEMENTS("implements", true);

        public final String label;
        public final boolean dashed;

        EdgeKind(String label, boolean dashed) {
            this.label = label;
            this.dashed = dashed;
        }
    }

    /** Một hộp trên sơ đồ. body rỗng nghĩa là type đó không khai báo send(). */
    public record TypeNode(String name, Kind kind, String body,
                           double x, double y, double w, double h) {
    }

    public record Edge(String from, String to, EdgeKind kind) {
    }

    /**
     * Một bước giải thích: ai đang là ứng viên, ai vừa bị loại, ai thắng.
     */
    public record Step(String headline, String note,
                       Set<String> candidates, Set<String> eliminated, String winner) {
    }

    public record Scenario(String className, String declaration, String rule,
                           List<TypeNode> nodes, List<Edge> edges, List<Step> steps,
                           String runtimeOutput) {
    }

    private DefaultMethodModel() {
    }

    private static final String SEND = "default String send()";
    private static final String SEND_CLASS = "public String send()";

    public static final List<Scenario> SCENARIOS = List.of(
            plainAlert(), emailAlert(), legacyAlert(), multiAlert());

    // ---------------------------------------------------------------- 1
    private static Scenario plainAlert() {
        return new Scenario(
                "PlainAlert",
                "class PlainAlert implements Notifier",
                "Chỉ có một ứng viên",
                List.of(
                        new TypeNode("Notifier", Kind.INTERFACE,
                                SEND + " -> \"Notifier.send()\"", 225, 30, 240, 76),
                        new TypeNode("PlainAlert", Kind.TARGET, "", 225, 250, 240, 66)),
                List.of(new Edge("PlainAlert", "Notifier", EdgeKind.IMPLEMENTS)),
                List.of(
                        new Step("Bước 1 — gom ứng viên", """
                                Đi ngược lên toàn bộ cây cha. Chỉ tìm thấy đúng một bản send(): \
                                default method của Notifier.""",
                                Set.of("Notifier"), Set.of(), null),
                        new Step("Bước 2 — không có gì để tranh", """
                                PlainAlert dùng thẳng bản đó mà không cần viết một dòng nào. \
                                Đây chính là lý do default method ra đời ở Java 8: thêm method mới vào \
                                interface mà hàng nghìn class đang implements nó không bị vỡ.""",
                                Set.of(), Set.of(), "Notifier")),
                "PlainAlert  -> Notifier.send()");
    }

    // ---------------------------------------------------------------- 2
    private static Scenario emailAlert() {
        return new Scenario(
                "EmailAlert",
                "class EmailAlert implements Notifier, EmailNotifier",
                "Interface cụ thể hơn thắng",
                List.of(
                        new TypeNode("Notifier", Kind.INTERFACE,
                                SEND + " -> \"Notifier.send()\"", 40, 24, 240, 76),
                        new TypeNode("EmailNotifier", Kind.INTERFACE,
                                SEND + " -> \"EmailNotifier.send()\"", 40, 150, 240, 76),
                        new TypeNode("EmailAlert", Kind.TARGET, "", 350, 258, 250, 66)),
                List.of(
                        new Edge("EmailNotifier", "Notifier", EdgeKind.EXTENDS_INTERFACE),
                        new Edge("EmailAlert", "EmailNotifier", EdgeKind.IMPLEMENTS),
                        new Edge("EmailAlert", "Notifier", EdgeKind.IMPLEMENTS)),
                List.of(
                        new Step("Bước 1 — gom ứng viên", """
                                Hai bản send() cùng với tới được: một của Notifier, một của EmailNotifier.""",
                                Set.of("Notifier", "EmailNotifier"), Set.of(), null),
                        new Step("Bước 2 — so độ cụ thể", """
                                EmailNotifier extends Notifier, tức là nó NẰM DƯỚI trong cây. \
                                Java chọn bản cụ thể nhất, nên bản của Notifier bị loại.""",
                                Set.of("EmailNotifier"), Set.of("Notifier"), null),
                        new Step("Bước 3 — chốt", """
                                EmailNotifier.send() thắng, không cần override. \
                                Để ý dòng khai báo: viết implements Notifier là thừa, \
                                EmailNotifier đã kéo theo Notifier rồi.""",
                                Set.of(), Set.of("Notifier"), "EmailNotifier")),
                "EmailAlert  -> EmailNotifier.send()");
    }

    // ---------------------------------------------------------------- 3
    private static Scenario legacyAlert() {
        return new Scenario(
                "LegacyAlert",
                "class LegacyAlert extends BaseNotifier implements Notifier",
                "Class thắng interface",
                List.of(
                        new TypeNode("BaseNotifier", Kind.CLASS,
                                SEND_CLASS + " -> \"BaseNotifier.send()\"", 30, 24, 250, 76),
                        new TypeNode("Notifier", Kind.INTERFACE,
                                SEND + " -> \"Notifier.send()\"", 370, 24, 250, 76),
                        new TypeNode("LegacyAlert", Kind.TARGET, "", 200, 260, 250, 66)),
                List.of(
                        new Edge("LegacyAlert", "BaseNotifier", EdgeKind.EXTENDS_CLASS),
                        new Edge("LegacyAlert", "Notifier", EdgeKind.IMPLEMENTS)),
                List.of(
                        new Step("Bước 1 — gom ứng viên", """
                                Một bản đến từ class cha BaseNotifier, một bản là default method \
                                của Notifier. Hai bản này không họ hàng gì nhau.""",
                                Set.of("BaseNotifier", "Notifier"), Set.of(), null),
                        new Step("Bước 2 — luật class wins", """
                                Không cần so độ cụ thể: hễ có một method thật từ class thì nó thắng \
                                mọi default method, kể cả khi interface nằm sát hơn trong cây.""",
                                Set.of("BaseNotifier"), Set.of("Notifier"), null),
                        new Step("Bước 3 — vì sao luật này tồn tại", """
                                Java 8 thêm default method vào những interface đã có sẵn hàng chục năm. \
                                Nếu default method mà thắng được class, mọi class cũ sẽ đổi hành vi \
                                chỉ vì thư viện nâng cấp. Luật này giữ cho code cũ không vỡ.""",
                                Set.of(), Set.of("Notifier"), "BaseNotifier")),
                "LegacyAlert -> BaseNotifier.send()");
    }

    // ---------------------------------------------------------------- 4
    private static Scenario multiAlert() {
        return new Scenario(
                "MultiAlert",
                "class MultiAlert implements EmailNotifier, SmsNotifier",
                "Xung đột — buộc phải override",
                List.of(
                        new TypeNode("Notifier", Kind.INTERFACE,
                                SEND + " -> \"Notifier.send()\"", 20, 18, 230, 70),
                        new TypeNode("EmailNotifier", Kind.INTERFACE,
                                SEND + " -> \"EmailNotifier.send()\"", 20, 136, 230, 70),
                        new TypeNode("SmsNotifier", Kind.INTERFACE,
                                SEND + " -> \"SmsNotifier.send()\"", 400, 136, 230, 70),
                        new TypeNode("MultiAlert", Kind.TARGET,
                                "@Override public String send()", 190, 268, 270, 78)),
                List.of(
                        new Edge("EmailNotifier", "Notifier", EdgeKind.EXTENDS_INTERFACE),
                        new Edge("MultiAlert", "EmailNotifier", EdgeKind.IMPLEMENTS),
                        new Edge("MultiAlert", "SmsNotifier", EdgeKind.IMPLEMENTS)),
                List.of(
                        new Step("Bước 1 — gom ứng viên", """
                                EmailNotifier.send() và SmsNotifier.send(). Bản của Notifier đã bị \
                                EmailNotifier che mất từ trước nên không còn là ứng viên.""",
                                Set.of("EmailNotifier", "SmsNotifier"), Set.of("Notifier"), null),
                        new Step("Bước 2 — thử luật cụ thể hơn", """
                                Luật này chỉ chạy khi một interface là con cháu của interface kia. \
                                EmailNotifier và SmsNotifier chẳng liên quan gì nhau, nên không có \
                                cái nào cụ thể hơn cái nào. Cũng không có class cha nào để viện tới.""",
                                Set.of("EmailNotifier", "SmsNotifier"), Set.of("Notifier"), null),
                        new Step("Bước 3 — compiler bó tay", """
                                javac từ chối biên dịch, nguyên văn: "class BrokenAlert inherits \
                                unrelated defaults for send() from types EmailNotifier and SmsNotifier". \
                                Java không âm thầm chọn bừa như đa kế thừa của C++ — nó bắt bạn tự quyết.""",
                                Set.of(), Set.of("Notifier", "EmailNotifier", "SmsNotifier"), null),
                        new Step("Bước 4 — cách thoát", """
                                Override send() trong MultiAlert. Muốn gọi lại bản của interface nào \
                                thì dùng cú pháp X.super.send() — đây là chỗ duy nhất trong Java \
                                dùng được cú pháp đó.""",
                                Set.of("EmailNotifier", "SmsNotifier"), Set.of("Notifier"), "MultiAlert")),
                "MultiAlert  -> EmailNotifier.send() + SmsNotifier.send()");
    }

    /** Đoạn code hiện ở panel dưới cùng cho từng kịch bản. */
    public static String code(Scenario scenario) {
        return switch (scenario.className()) {
            case "PlainAlert" -> """
                    class PlainAlert implements Notifier {
                    }
                    // không viết gì cả, vẫn có send()""";
            case "EmailAlert" -> """
                    class EmailAlert implements Notifier, EmailNotifier {
                    }
                    // "implements Notifier" là thừa, EmailNotifier đã kéo theo rồi""";
            case "LegacyAlert" -> """
                    class LegacyAlert extends BaseNotifier implements Notifier {
                    }
                    // default method của Notifier bị bỏ qua hoàn toàn""";
            default -> """
                    class MultiAlert implements EmailNotifier, SmsNotifier {
                        @Override
                        public String send() {
                            return EmailNotifier.super.send()
                                 + " + " + SmsNotifier.super.send();
                        }
                    }""";
        };
    }
}
