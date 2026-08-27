package com.vinhdp.ui.jvm;

import java.util.List;

/**
 * Ảnh chụp trạng thái JVM tại một bước bytecode.
 * Mỗi bước là một snapshot BẤT BIẾN, nên Step tới / Step lui chỉ là đổi chỉ số.
 */
public final class VmModel {

    private VmModel() {
    }

    /** Một ô local variable trong frame. */
    public record Local(int slot, String name, String declaredType, String ref) {
    }

    /**
     * Một ô field bên trong object.
     * owner = class KHAI BÁO field đó, nhờ vậy vẽ được phần của cha và phần của con.
     */
    public record FieldSlot(String owner, String name, String value, boolean justWritten) {
    }

    /** Một object nằm trong Heap. */
    public record HeapObject(String id, String className, List<FieldSlot> fields,
                             boolean initialised) {
    }

    /** Metadata của class trong Method Area, kèm vtable đã phân giải. */
    public record ClassInfo(String name, String superName, List<VtableEntry> vtable) {
    }

    /**
     * Một dòng vtable: tên method và class thực sự sở hữu bản code được trỏ tới.
     * owner khác name của class chứa nó => slot này là KẾ THỪA, không override.
     */
    public record VtableEntry(String method, String owner) {
    }

    /** Một dòng bytecode hiển thị ở cột trái. */
    public record BytecodeLine(int offset, String opcode, String operand, String comment) {
    }

    /** Trạng thái đầy đủ của máy ảo tại một bước. */
    public record Snapshot(
            int bytecodeLine,
            List<String> frames,
            List<Local> locals,
            List<String> operands,
            List<HeapObject> heap,
            List<ClassInfo> classes,
            List<String> stdout,
            String headline,
            String note,
            String highlightHeapId,
            String highlightClass,
            String highlightVtable,
            List<String> lookupPath,
            /** Class được gọi thẳng bằng invokespecial (super/constructor) — bỏ qua vtable. */
            String specialTarget) {
    }
}
