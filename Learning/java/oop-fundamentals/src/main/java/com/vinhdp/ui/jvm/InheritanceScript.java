package com.vinhdp.ui.jvm;

import com.vinhdp.ui.jvm.VmModel.BytecodeLine;
import com.vinhdp.ui.jvm.VmModel.ClassInfo;
import com.vinhdp.ui.jvm.VmModel.FieldSlot;
import com.vinhdp.ui.jvm.VmModel.HeapObject;
import com.vinhdp.ui.jvm.VmModel.Local;
import com.vinhdp.ui.jvm.VmModel.Snapshot;
import com.vinhdp.ui.jvm.VmModel.VtableEntry;

import java.util.ArrayList;
import java.util.List;

/**
 * Dựng lại từng bước của DemoManagerRun.main():
 *
 *   Employee ref = new Manager("EM3", "Le Thi B", 15_000_000, 5_000_000, 8);
 *   ref.showDetails();
 *
 * Toàn bộ offset lấy từ javap -c -p trên các class đã biên dịch, không bịa số.
 * Hai điểm đáng xem nhất:
 *   - constructor chạy NGƯỢC từ cha xuống con, field của con vẫn là 0 khi cha đang chạy
 *   - showDetails() nằm trong Employee nhưng invokevirtual vẫn nhảy XUỐNG Manager,
 *     trong khi super.calculateSalary() lại là invokespecial nên đi THẲNG lên Employee
 */
public final class InheritanceScript {

    private static final int HEADER = -1;

    public static final List<BytecodeLine> BYTECODE = List.of(
            /* 0  */ new BytecodeLine(HEADER, "DemoManagerRun.main(String[])", "", ""),
            /* 1  */ new BytecodeLine(0, "new", "#7", "class Manager"),
            /* 2  */ new BytecodeLine(3, "dup", "", ""),
            /* 3  */ new BytecodeLine(4, "ldc", "#9", "String EM3"),
            /* 4  */ new BytecodeLine(6, "ldc", "#11", "String Le Thi B"),
            /* 5  */ new BytecodeLine(8, "ldc2_w", "#13", "double 1.5E7"),
            /* 6  */ new BytecodeLine(11, "ldc2_w", "#15", "double 5000000.0"),
            /* 7  */ new BytecodeLine(14, "bipush", "8", ""),
            /* 8  */ new BytecodeLine(16, "invokespecial", "#17", "Manager.\"<init>\""),
            /* 9  */ new BytecodeLine(19, "astore_1", "", "ref"),
            /* 10 */ new BytecodeLine(20, "aload_1", "", "ref"),
            /* 11 */ new BytecodeLine(21, "invokevirtual", "#20", "Employee.showDetails:()V"),
            /* 12 */ new BytecodeLine(24, "return", "", ""),

            /* 13 */ new BytecodeLine(HEADER, "Manager.<init>(String,String,double,double,int)", "", ""),
            /* 14 */ new BytecodeLine(0, "aload_0", "", "this"),
            /* 15 */ new BytecodeLine(1, "aload_1", "", ""),
            /* 16 */ new BytecodeLine(2, "aload_2", "", ""),
            /* 17 */ new BytecodeLine(3, "dload_3", "", ""),
            /* 18 */ new BytecodeLine(4, "invokespecial", "#1", "Employee.\"<init>\""),
            /* 19 */ new BytecodeLine(7, "aload_0", "", "this"),
            /* 20 */ new BytecodeLine(8, "dload", "5", ""),
            /* 21 */ new BytecodeLine(10, "putfield", "#7", "positionAllowance:D"),
            /* 22 */ new BytecodeLine(13, "aload_0", "", "this"),
            /* 23 */ new BytecodeLine(14, "iload", "7", ""),
            /* 24 */ new BytecodeLine(16, "putfield", "#13", "employeeNumber:I"),
            /* 25 */ new BytecodeLine(19, "return", "", ""),

            /* 26 */ new BytecodeLine(HEADER, "Employee.<init>(String,String,double)", "", ""),
            /* 27 */ new BytecodeLine(0, "aload_0", "", "this"),
            /* 28 */ new BytecodeLine(1, "invokespecial", "#1", "Object.\"<init>\""),
            /* 29 */ new BytecodeLine(4, "aload_0", "", ""),
            /* 30 */ new BytecodeLine(5, "aload_1", "", ""),
            /* 31 */ new BytecodeLine(6, "putfield", "#7", "id:String"),
            /* 32 */ new BytecodeLine(9, "aload_0", "", ""),
            /* 33 */ new BytecodeLine(10, "aload_2", "", ""),
            /* 34 */ new BytecodeLine(11, "putfield", "#13", "fullName:String"),
            /* 35 */ new BytecodeLine(14, "aload_0", "", ""),
            /* 36 */ new BytecodeLine(15, "dload_3", "", ""),
            /* 37 */ new BytecodeLine(16, "putfield", "#16", "salary:D"),
            /* 38 */ new BytecodeLine(19, "return", "", ""),

            /* 39 */ new BytecodeLine(HEADER, "Employee.showDetails()   (rút gọn)", "", ""),
            /* 40 */ new BytecodeLine(23, "invokevirtual", "#36", "getPosition:()"),
            /* 41 */ new BytecodeLine(76, "invokevirtual", "#58", "calculateSalary:()D"),
            /* 42 */ new BytecodeLine(98, "invokevirtual", "#63", "describeSalary:()"),
            /* 43 */ new BytecodeLine(109, "return", "", ""),

            /* 44 */ new BytecodeLine(HEADER, "Manager.calculateSalary()", "", ""),
            /* 45 */ new BytecodeLine(0, "aload_0", "", "this"),
            /* 46 */ new BytecodeLine(1, "invokespecial", "#17", "Employee.calculateSalary"),
            /* 47 */ new BytecodeLine(4, "aload_0", "", ""),
            /* 48 */ new BytecodeLine(5, "getfield", "#7", "positionAllowance:D"),
            /* 49 */ new BytecodeLine(8, "dadd", "", ""),
            /* 50 */ new BytecodeLine(9, "aload_0", "", ""),
            /* 51 */ new BytecodeLine(10, "getfield", "#13", "employeeNumber:I"),
            /* 52 */ new BytecodeLine(13, "i2d", "", ""),
            /* 53 */ new BytecodeLine(14, "ldc2_w", "#21", "double 500000.0"),
            /* 54 */ new BytecodeLine(17, "dmul", "", ""),
            /* 55 */ new BytecodeLine(18, "dadd", "", ""),
            /* 56 */ new BytecodeLine(19, "dreturn", "", ""),

            /* 57 */ new BytecodeLine(HEADER, "Employee.calculateSalary()", "", ""),
            /* 58 */ new BytecodeLine(0, "aload_0", "", "this"),
            /* 59 */ new BytecodeLine(1, "getfield", "#16", "salary:D"),
            /* 60 */ new BytecodeLine(4, "dreturn", "", ""));

    private static final List<ClassInfo> CLASSES = List.of(
            new ClassInfo("Object", "", List.of()),
            new ClassInfo("Employee", "Object", List.of(
                    new VtableEntry("calculateSalary()", "Employee"),
                    new VtableEntry("showDetails()", "Employee"),
                    new VtableEntry("getPosition()", "Employee"),
                    new VtableEntry("describeSalary()", "Employee"))),
            new ClassInfo("Manager", "Employee", List.of(
                    new VtableEntry("calculateSalary()", "Manager"),
                    new VtableEntry("showDetails()", "Employee"),
                    new VtableEntry("getPosition()", "Manager"),
                    new VtableEntry("describeSalary()", "Manager"))));

    private static final String OBJECT_ID = "Manager@1";

    private InheritanceScript() {
    }

    // ------------------------------------------------------------ trạng thái tạm
    private final List<Snapshot> steps = new ArrayList<>();
    private final List<String> frames = new ArrayList<>(List.of("main(String[])"));
    private final List<String> operands = new ArrayList<>();
    private final List<String> stdout = new ArrayList<>();
    private final List<FieldSlot> fields = new ArrayList<>(List.of(
            new FieldSlot("Employee", "id", "null", false),
            new FieldSlot("Employee", "fullName", "null", false),
            new FieldSlot("Employee", "salary", "0.0", false),
            new FieldSlot("Manager", "positionAllowance", "0.0", false),
            new FieldSlot("Manager", "employeeNumber", "0", false)));

    private List<Local> locals = mainLocals(null);
    private boolean allocated;
    private boolean initialised;

    private int line;
    private String heapHighlight;
    private String classHighlight;
    private String vtableHighlight;
    private String specialTarget;
    private List<String> lookupPath = List.of();

    public static List<Snapshot> build() {
        return new InheritanceScript().run();
    }

    private static List<Local> mainLocals(String ref) {
        return List.of(
                new Local(0, "args", "String[]", null),
                new Local(1, "ref", "Employee", ref));
    }

    private List<Snapshot> run() {
        buildObject();
        buildShowDetails();
        return List.copyOf(steps);
    }

    // ============================================================ phần 1: dựng object
    private void buildObject() {
        line = 1;
        snap("Trước khi chạy", """
                Biến ref khai báo kiểu Employee nhưng sắp trỏ tới một Manager. \
                Method Area đã nạp Object, Employee, Manager cùng vtable của chúng.""");

        line = 1;
        allocated = true;
        heapHighlight = OBJECT_ID;
        classHighlight = "Manager";
        operands.add("ref -> " + OBJECT_ID);
        snap("0: new Manager", """
                Đây là chỗ hay bị hiểu nhầm: JVM cấp phát chỗ cho CẢ 5 field ngay lập tức — \
                3 field thừa kế từ Employee nằm TRƯỚC, 2 field riêng của Manager nằm SAU. \
                Tất cả đang mang giá trị mặc định null / 0, chưa constructor nào chạy.""");

        line = 2;
        operands.add("ref -> " + OBJECT_ID);
        snap("3: dup", "Nhân đôi reference: một bản cho constructor làm this, một bản để gán vào ref.");

        line = 7;
        clearHighlights();
        operands.add("\"EM3\", \"Le Thi B\", 1.5E7, 5000000.0, 8");
        snap("4-14: ldc / bipush", "Đẩy 5 tham số lên operand stack theo đúng thứ tự khai báo.");

        line = 8;
        operands.clear();
        operands.add("ref -> " + OBJECT_ID);
        frames.add("Manager.<init>()");
        locals = constructorLocals("Manager", "\"EM3\", \"Le Thi B\", 1.5E7, 5000000.0, 8");
        classHighlight = "Manager";
        snap("16: invokespecial Manager.<init>", """
                invokespecial chứ không phải invokevirtual: constructor không bao giờ được dispatch \
                theo vtable, địa chỉ đã chốt từ lúc biên dịch.""");

        line = 18;
        clearHighlights();
        snap("Manager.<init> — 4: invokespecial Employee.<init>", """
                Lệnh ĐẦU TIÊN có ý nghĩa trong mọi constructor là gọi constructor của lớp cha. \
                Không viết super(...) thì compiler tự chèn. Vì thế phần của cha luôn được dựng trước.""");

        frames.add("Employee.<init>()");
        locals = constructorLocals("Employee", "\"EM3\", \"Le Thi B\", 1.5E7");
        line = 27;
        classHighlight = "Employee";
        specialTarget = null;
        snap("Vào Employee.<init>", """
                Chú ý ô this: vẫn đúng object Manager@1 đó, không hề có object Employee riêng nào \
                được tạo ra. Chỉ có MỘT object, đang được dựng dần từng tầng.""");

        line = 28;
        frames.add("Object.<init>()");
        classHighlight = "Object";
        snap("Employee.<init> — 1: invokespecial Object.<init>", """
                Lên tới đỉnh chuỗi. Object.<init> gần như không làm gì, rồi trả về ngay.""");
        frames.remove(frames.size() - 1);

        setField(31, 0, "\"EM3\"", "6: putfield id", """
                Bây giờ mới thực sự ghi vào object. putfield nhận reference từ operand stack \
                và ghi vào đúng ô field bên trong Heap.""");
        setField(34, 1, "\"Le Thi B\"", "11: putfield fullName", "Ghi tiếp field thứ hai của phần Employee.");
        setField(37, 2, "1.5E7", "16: putfield salary", "Phần của Employee đã đầy đủ.");

        line = 38;
        clearHighlights();
        frames.remove(frames.size() - 1);
        locals = constructorLocals("Manager", "\"EM3\", \"Le Thi B\", 1.5E7, 5000000.0, 8");
        snap("Employee.<init> — 19: return", """
                Quay về Manager.<init>. Nhìn kỹ Heap: hai field của Manager VẪN đang là 0. \
                Đây chính là lý do không được gọi method có thể bị override từ trong constructor — \
                lúc đó lớp con còn chưa kịp khởi tạo gì cả.""");

        setField(21, 3, "5000000.0", "10: putfield positionAllowance", "Giờ mới tới lượt phần của Manager.");
        setField(24, 4, "8", "16: putfield employeeNumber", "Field cuối cùng đã có giá trị.");

        line = 25;
        clearHighlights();
        initialised = true;
        frames.remove(frames.size() - 1);
        locals = mainLocals(null);
        heapHighlight = OBJECT_ID;
        snap("Manager.<init> — 19: return", """
                Chuỗi constructor kết thúc. Object đã hoàn chỉnh: 3 field của Employee \
                cộng 2 field của Manager, nằm trong cùng một khối nhớ.""");

        line = 9;
        operands.clear();
        locals = mainLocals(OBJECT_ID);
        snap("19: astore_1", """
                Cất reference vào ô local ref. Kiểu khai báo là Employee, object thật là Manager — \
                từ đây trở đi mọi lời gọi method đều diễn ra dưới sự căng thẳng giữa hai điều đó.""");
    }

    // ============================================================ phần 2: gọi method
    private void buildShowDetails() {
        line = 10;
        operands.add("ref -> " + OBJECT_ID);
        heapHighlight = OBJECT_ID;
        snap("20: aload_1", "Đẩy reference lên operand stack làm receiver.");

        line = 11;
        classHighlight = "Employee";
        vtableHighlight = "Employee#showDetails()";
        snap("21: invokevirtual Employee.showDetails — bước 1/3", """
                Compiler ghi Employee.showDetails vì biến ref khai báo kiểu Employee. \
                Vẫn là invokevirtual, nên quyền quyết định thuộc về runtime.""");

        classHighlight = "Manager";
        vtableHighlight = "Manager#showDetails()";
        lookupPath = List.of("Manager", "Employee");
        snap("21: invokevirtual — bước 2/3", """
                Klass pointer trỏ tới Manager, JVM mở vtable của Manager. \
                Manager KHÔNG override showDetails, nên slot đó vẫn trỏ ngược lên Employee.""");

        clearHighlights();
        operands.clear();
        frames.add("Employee.showDetails()");
        locals = List.of(new Local(0, "this", "Employee", OBJECT_ID));
        line = 40;
        snap("21: invokevirtual — bước 3/3", """
                Code sắp chạy là code của LỚP CHA, nhưng this vẫn trỏ tới object Manager. \
                Giữ chặt ý này, hai bước sau sống nhờ nó.""");

        // getPosition
        line = 40;
        classHighlight = "Manager";
        vtableHighlight = "Manager#getPosition()";
        frames.add("Manager.getPosition()");
        snap("showDetails — 23: invokevirtual getPosition()", """
                Lệnh này nằm trong file Employee.java, nhưng vtable của Manager có bản riêng \
                nên nó nhảy XUỐNG Manager.getPosition().""");
        frames.remove(frames.size() - 1);
        stdout.add("Position    : Manager");
        clearHighlights();
        snap("  trả về \"Manager\"", "Lớp cha vừa gọi phải code của lớp con. Đó là polymorphism nhìn từ trong ruột.");

        // calculateSalary
        line = 41;
        classHighlight = "Manager";
        vtableHighlight = "Manager#calculateSalary()";
        snap("showDetails — 76: invokevirtual calculateSalary()", """
                Đây đúng là chỗ bản code cũ bị hỏng: nếu showDetails in thẳng field salary \
                thì lệnh invokevirtual này không bao giờ tồn tại, và mọi override thành vô nghĩa.""");

        frames.add("Manager.calculateSalary()");
        locals = List.of(new Local(0, "this", "Manager", OBJECT_ID));
        line = 45;
        clearHighlights();
        snap("Vào Manager.calculateSalary()", "Vtable dẫn tới bản của Manager.");

        line = 46;
        classHighlight = "Manager";
        specialTarget = "Employee";
        snap("Manager.calculateSalary — 1: invokespecial", """
                Đây mới là điểm khác biệt lớn nhất so với ví dụ con chó: super.calculateSalary() \
                biên dịch thành INVOKESPECIAL, không phải invokevirtual. Nó đi thẳng tới \
                Employee.calculateSalary, bỏ qua vtable hoàn toàn.""");

        specialTarget = null;
        classHighlight = null;
        frames.add("Employee.calculateSalary()");
        locals = List.of(new Local(0, "this", "Employee", OBJECT_ID));
        line = 58;
        snap("Vào Employee.calculateSalary()", """
                Nếu lệnh vừa rồi là invokevirtual thì vtable của Manager sẽ lại trỏ về \
                Manager.calculateSalary, và bạn có một vòng đệ quy vô tận cho tới StackOverflowError. \
                invokespecial chính là thứ giữ cho super. hoạt động được.""");

        line = 59;
        operands.add("15000000.0");
        heapHighlight = OBJECT_ID;
        snap("1: getfield salary", "Đọc field salary từ object trong Heap: 15,000,000.");

        line = 60;
        frames.remove(frames.size() - 1);
        locals = List.of(new Local(0, "this", "Manager", OBJECT_ID));
        clearHighlights();
        snap("4: dreturn", "Trả 15,000,000 về cho Manager.calculateSalary().");

        line = 49;
        operands.clear();
        operands.add("20000000.0");
        snap("5-8: getfield positionAllowance, dadd", "15,000,000 + 5,000,000 = 20,000,000.");

        line = 55;
        operands.clear();
        operands.add("24000000.0");
        snap("10-18: employeeNumber x 500000, dadd", """
                8 nhân 500,000 bằng 4,000,000, cộng vào thành 24,000,000. \
                Đây là công thức đã sửa — bản cũ cộng thẳng số 8 vào tiền lương.""");

        line = 56;
        frames.remove(frames.size() - 1);
        locals = List.of(new Local(0, "this", "Employee", OBJECT_ID));
        stdout.add("Base salary : 15,000,000");
        stdout.add("Total salary: 24,000,000");
        snap("19: dreturn", "Trả 24,000,000 về cho showDetails() để in ra.");

        // describeSalary
        line = 42;
        classHighlight = "Manager";
        vtableHighlight = "Manager#describeSalary()";
        stdout.add("Detail      : base + allowance...");
        snap("showDetails — 98: invokevirtual describeSalary()", """
                Lần thứ ba lớp cha gọi xuống lớp con. describeSalary() của Manager cũng \
                gọi super.describeSalary() bằng invokespecial y như trên.""");

        line = 43;
        clearHighlights();
        frames.remove(frames.size() - 1);
        locals = mainLocals(OBJECT_ID);
        snap("showDetails — 109: return", "showDetails() kết thúc, frame pop, quay về main().");

        line = 12;
        snap("24: return", """
                Tổng kết: một object duy nhất mang field của cả hai tầng; constructor dựng từ \
                cha xuống con; invokevirtual nhảy xuống lớp con theo vtable; invokespecial đi \
                thẳng lên lớp cha bỏ qua vtable.""");
    }

    // ------------------------------------------------------------ tiện ích
    private List<Local> constructorLocals(String type, String args) {
        return List.of(
                new Local(0, "this", type, OBJECT_ID),
                new Local(1, "args", "", args));
    }

    private void setField(int atLine, int index, String value, String headline, String note) {
        line = atLine;
        FieldSlot old = fields.get(index);
        fields.set(index, new FieldSlot(old.owner(), old.name(), value, true));
        heapHighlight = OBJECT_ID;
        classHighlight = null;
        snap(headline, note);
        fields.set(index, new FieldSlot(old.owner(), old.name(), value, false));
    }

    private void clearHighlights() {
        heapHighlight = null;
        classHighlight = null;
        vtableHighlight = null;
        specialTarget = null;
        lookupPath = List.of();
    }

    private void snap(String headline, String note) {
        List<HeapObject> heap = allocated
                ? List.of(new HeapObject(OBJECT_ID, "Manager", List.copyOf(fields), initialised))
                : List.of();
        steps.add(new Snapshot(
                line,
                List.copyOf(frames),
                locals,
                List.copyOf(operands),
                heap,
                CLASSES,
                List.copyOf(stdout),
                headline,
                note.replaceAll("\\s+", " ").trim(),
                heapHighlight,
                classHighlight,
                vtableHighlight,
                List.copyOf(lookupPath),
                specialTarget));
    }
}
