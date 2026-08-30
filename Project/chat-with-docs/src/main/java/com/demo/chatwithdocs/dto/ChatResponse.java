package com.demo.chatwithdocs.dto;

import java.util.List;

public record ChatResponse(String answer, List<SourceReference> sources) {

    /**
     * One retrieved passage. {@code index} is the 1-based citation number the
     * answer refers to with [n]; {@code pageNumber} is null for formats that
     * don't carry pages (DOCX, TXT); {@code text} is the exact passage used.
     */
    public record SourceReference(int index, String fileName, Integer pageNumber, String text) {
    }
}
