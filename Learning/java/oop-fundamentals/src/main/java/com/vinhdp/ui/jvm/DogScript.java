package com.vinhdp.ui.jvm;

import com.vinhdp.ui.jvm.VmModel.BytecodeLine;
import com.vinhdp.ui.jvm.VmModel.ClassInfo;
import com.vinhdp.ui.jvm.VmModel.HeapObject;
import com.vinhdp.ui.jvm.VmModel.Local;
import com.vinhdp.ui.jvm.VmModel.Snapshot;
import com.vinhdp.ui.jvm.VmModel.VtableEntry;

import java.util.ArrayList;
import java.util.List;

/**
 * Dựng lại từng bước của Overriding_Dynamic_Runtime.main().
 *
 * Danh sách bytecode dưới đây KHÔNG phải bịa: nó lấy nguyên từ
 *   javap -c -p target/classes/com/vinhdp/polymorphism/Overriding_Dynamic_Runtime.class
 * Điểm đáng chú ý: cả ba lời gọi bark() đều là CÙNG một lệnh
 * invokevirtual #13 // Animal.bark:()V
 */
public final class DogScript {

    public static final List<BytecodeLine> BYTECODE = List.of(
            new BytecodeLine(0, "new", "#7", "class ...$Cat"),
            new BytecodeLine(3, "dup", "", ""),
            new BytecodeLine(4, "invokespecial", "#9", "Cat.\"<init>\":()V"),
            new BytecodeLine(7, "astore_1", "", "cat"),
            new BytecodeLine(8, "new", "#10", "class ...$Dog"),
            new BytecodeLine(11, "dup", "", ""),
            new BytecodeLine(12, "invokespecial", "#12", "Dog.\"<init>\":()V"),
            new BytecodeLine(15, "astore_2", "", "dog"),
            new BytecodeLine(16, "aload_1", "", "cat"),
            new BytecodeLine(17, "invokevirtual", "#13", "Animal.bark:()V"),
            new BytecodeLine(20, "aload_2", "", "dog"),
            new BytecodeLine(21, "invokevirtual", "#13", "Animal.bark:()V"),
            new BytecodeLine(24, "new", "#18", "class ...$Fish"),
            new BytecodeLine(27, "dup", "", ""),
            new BytecodeLine(28, "invokespecial", "#20", "Fish.\"<init>\":()V"),
            new BytecodeLine(31, "astore_3", "", "fish"),
            new BytecodeLine(32, "aload_3", "", "fish"),
            new BytecodeLine(33, "invokevirtual", "#13", "Animal.bark:()V"),
            new BytecodeLine(36, "return", "", ""));

    private static final List<ClassInfo> CLASSES = List.of(
            new ClassInfo("Animal", "Object", List.of(
                    new VtableEntry("bark()", "Animal"))),
            new ClassInfo("Cat", "Animal", List.of(
                    new VtableEntry("bark()", "Cat"))),
            new ClassInfo("Dog", "Animal", List.of(
                    new VtableEntry("bark()", "Dog"),
                    new VtableEntry("sleep()", "Dog"))),
            new ClassInfo("Fish", "Animal", List.of(
                    new VtableEntry("bark()", "Animal"))));

    private DogScript() {
    }

    // ------------------------------------------------------------ trạng thái tạm
    private final List<Snapshot> steps = new ArrayList<>();
    private final List<String> frames = new ArrayList<>(List.of("main(String[])"));
    private final List<Local> locals = new ArrayList<>(List.of(
            new Local(0, "args", "String[]", null),
            new Local(1, "cat", "Animal", null),
            new Local(2, "dog", "Animal", null),
            new Local(3, "fish", "Animal", null)));
    private final List<String> operands = new ArrayList<>();
    private final List<HeapObject> heap = new ArrayList<>();
    private final List<String> stdout = new ArrayList<>();

    private int line;
    private String heapHighlight;
    private String classHighlight;
    private String vtableHighlight;
    private List<String> lookupPath = List.of();

    public static List<Snapshot> build() {
        return new DogScript().run();
    }

    private List<Snapshot> run() {

        snap("Trước khi chạy", """
                Frame của main() đã được tạo: một mảng local variables và một operand stack rỗng. \
                Heap chưa có object nào. Method Area đã nạp sẵn metadata của 4 class.""");

        allocate("Cat", 0);
        construct("Cat", 2, """
                invokespecial là lời gọi TĨNH: constructor, private, super — JVM không tra vtable, \
                địa chỉ đã chốt lúc biên dịch. Cat.<init>() gọi tiếp Animal.<init>() rồi Object.<init>().""");
        store(3, 1, "cat", """
                astore_1 lấy reference ra khỏi operand stack, cất vào ô local số 1. \
                Ô nhớ này CHỈ chứa một reference. Kiểu khai báo Animal chỉ tồn tại trong bảng \
                LocalVariableTable để compiler kiểm tra — JVM lúc chạy không dùng nó để chọn method.""");

        allocate("Dog", 4);
        construct("Dog", 6, "Lặp lại y hệt Cat: cấp phát trước, chạy constructor sau.");
        store(7, 2, "dog", "Ô local số 2 giờ trỏ tới Dog trong Heap.");

        load(8, 1, "cat");
        dispatch(9, "Cat", "Cat", "Meo Meo....", """
                Vtable của Cat có bark() của riêng nó, tra phát trúng ngay. \
                Đây chính là dynamic dispatch: cùng một lệnh bytecode, khác object thì khác code chạy.""");

        load(10, 2, "dog");
        dispatch(11, "Dog", "Dog", "Gâu Gâu Gruuuu....", """
                Vẫn là lệnh invokevirtual #13 giống hệt lần trước — bytecode không đổi một byte nào. \
                Chỉ vì klass pointer trỏ sang Dog nên lần này Dog.bark() chạy.""");

        allocate("Fish", 12);
        construct("Fish", 14, "Fish không khai báo constructor nên compiler tự sinh một cái rỗng gọi super().");
        store(15, 3, "fish", "Ô local số 3 trỏ tới Fish.");

        load(16, 3, "fish");
        dispatchInherited();

        line = 18;
        frames.clear();
        frames.add("main(String[])");
        clearHighlights();
        snap("36: return", """
                main() kết thúc, frame bị pop. Ba object vẫn nằm trong Heap cho tới khi \
                không còn reference nào trỏ tới và GC dọn đi.""");

        return List.copyOf(steps);
    }

    // ------------------------------------------------------------ các bước con
    private void allocate(String className, int atLine) {
        line = atLine;
        clearHighlights();
        heap.add(new HeapObject(className + "@" + (heap.size() + 1), className, List.of(), false));
        String id = heap.get(heap.size() - 1).id();
        operands.add("ref -> " + id);
        heapHighlight = id;
        classHighlight = className;
        snap(BYTECODE.get(atLine).offset() + ": new " + className, """
                new chỉ làm hai việc: xin một vùng nhớ trong Heap và ghi KLASS POINTER trỏ về \
                metadata của class trong Method Area. Object vẫn chưa được khởi tạo, \
                và reference vừa tạo đang nằm trên operand stack.""");

        line = atLine + 1;
        operands.add(operands.get(operands.size() - 1));
        snap(BYTECODE.get(atLine + 1).offset() + ": dup", """
                dup nhân đôi reference, vì lệnh invokespecial ngay sau sẽ tiêu thụ mất một bản \
                để làm this cho constructor. Bản còn lại mới là thứ được gán vào biến.""");
    }

    private void construct(String className, int atLine, String note) {
        line = atLine;
        operands.remove(operands.size() - 1);
        frames.add(className + ".<init>()");
        snap(BYTECODE.get(atLine).offset() + ": invokespecial " + className + ".<init>", note);

        frames.remove(frames.size() - 1);
        int index = indexOfHeap(className);
        heap.set(index, new HeapObject(heap.get(index).id(), className, List.of(), true));
        snap("  constructor trả về", """
                Chuỗi constructor chạy xong từ Object xuống dưới, object đã khởi tạo đầy đủ. \
                Frame của <init> bị pop, quay lại main().""");
    }

    private void store(int atLine, int slot, String name, String note) {
        line = atLine;
        String ref = operands.remove(operands.size() - 1).replace("ref -> ", "");
        locals.set(slot, new Local(slot, name, "Animal", ref));
        heapHighlight = ref;
        snap(BYTECODE.get(atLine).offset() + ": astore_" + slot, note);
    }

    private void load(int atLine, int slot, String name) {
        line = atLine;
        clearHighlights();
        String ref = locals.get(slot).ref();
        operands.add("ref -> " + ref);
        heapHighlight = ref;
        snap(BYTECODE.get(atLine).offset() + ": aload_" + slot, """
                Đẩy reference trong ô local số """ + slot + " lên operand stack. Nó sẽ đóng vai this "
                + "(receiver) cho lời gọi method ngay sau đây.");
    }

    /** invokevirtual với subclass có override — tra một phát là trúng. */
    private void dispatch(int atLine, String runtimeClass, String owner, String printed, String note) {
        line = atLine;

        classHighlight = "Animal";
        vtableHighlight = "Animal#bark()";
        lookupPath = List.of();
        snap(BYTECODE.get(atLine).offset() + ": invokevirtual #13 — bước 1/3", """
                Compiler chỉ nhìn KIỂU KHAI BÁO của biến, mà biến khai báo là Animal, \
                nên nó ghi vào constant pool là Animal.bark:()V. \
                Đây là toàn bộ những gì javac biết — nó không hề biết object thật là gì.""");

        classHighlight = runtimeClass;
        lookupPath = List.of(runtimeClass);
        vtableHighlight = null;
        snap(BYTECODE.get(atLine).offset() + ": invokevirtual #13 — bước 2/3", """
                JVM lấy reference đang nằm trên operand stack, đọc KLASS POINTER trong header của \
                object đó và ra được class thật: """ + runtimeClass + """
                . Kiểu khai báo Animal bị bỏ qua hoàn toàn ở bước này.""");

        vtableHighlight = runtimeClass + "#bark()";
        operands.remove(operands.size() - 1);
        frames.add(owner + ".bark()");
        stdout.add(printed);
        snap(BYTECODE.get(atLine).offset() + ": invokevirtual #13 — bước 3/3", note);

        frames.remove(frames.size() - 1);
        snap("  bark() trả về", "Frame của " + owner + ".bark() bị pop, main() chạy tiếp.");
    }

    /** invokevirtual với subclass KHÔNG override — phải đi ngược lên lớp cha. */
    private void dispatchInherited() {
        line = 17;

        classHighlight = "Animal";
        vtableHighlight = "Animal#bark()";
        lookupPath = List.of();
        snap("33: invokevirtual #13 — bước 1/3", """
                Vẫn đúng lệnh đó, vẫn constant pool #13. Ba lần gọi bark() trong main() \
                dùng chung một entry — bytecode hoàn toàn không phân biệt được Cat, Dog hay Fish.""");

        classHighlight = "Fish";
        lookupPath = List.of("Fish");
        vtableHighlight = null;
        snap("33: invokevirtual #13 — bước 2/3",
                "Klass pointer trỏ tới Fish. JVM mở vtable của Fish ra tra bark().");

        lookupPath = List.of("Fish", "Animal");
        vtableHighlight = "Fish#bark()";
        operands.remove(operands.size() - 1);
        frames.add("Animal.bark()");
        stdout.add("Animal bark");
        snap("33: invokevirtual #13 — bước 3/3", """
                Fish không override bark(), nên slot bark() trong vtable của Fish vẫn trỏ ngược \
                lên bản của Animal — vtable được sao chép từ lớp cha lúc nạp class. \
                Kết quả: Animal.bark() chạy. Không override thì chẳng có gì để dispatch.""");

        frames.remove(frames.size() - 1);
        snap("  bark() trả về", "Frame pop, quay lại main().");
    }

    // ------------------------------------------------------------ tiện ích
    private int indexOfHeap(String className) {
        for (int i = heap.size() - 1; i >= 0; i--) {
            if (heap.get(i).className().equals(className)) {
                return i;
            }
        }
        return heap.size() - 1;
    }

    private void clearHighlights() {
        heapHighlight = null;
        classHighlight = null;
        vtableHighlight = null;
        lookupPath = List.of();
    }

    private void snap(String headline, String note) {
        steps.add(new Snapshot(
                line,
                List.copyOf(frames),
                List.copyOf(locals),
                List.copyOf(operands),
                List.copyOf(heap),
                CLASSES,
                List.copyOf(stdout),
                headline,
                note.replaceAll("\\s+", " ").trim(),
                heapHighlight,
                classHighlight,
                vtableHighlight,
                List.copyOf(lookupPath),
                null));
    }
}
