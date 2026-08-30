package com.demo.chatwithdocs.service;

import java.io.IOException;
import java.util.List;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.demo.chatwithdocs.dto.DocumentUploadResponse;

@Service
public class DocumentIngestionService {

    public static final String METADATA_FILE_NAME = "file_name";
    // Set by PagePdfDocumentReader; absent for non-PDF formats.
    public static final String METADATA_PAGE_NUMBER = "page_number";

    private final VectorStore vectorStore;
    private final TokenTextSplitter textSplitter = new TokenTextSplitter();

    public DocumentIngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public DocumentUploadResponse ingest(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();

        // Tika detects the format (PDF, DOCX, TXT, ...) from the filename, so it must be preserved
        Resource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        // For PDFs, read page-by-page so each chunk keeps its page number for citations.
        // Other formats fall back to Tika (no page information available).
        List<Document> documents = isPdf(fileName)
                ? new PagePdfDocumentReader(resource, PdfDocumentReaderConfig.defaultConfig()).get()
                : new TikaDocumentReader(resource).get();

        List<Document> chunks = textSplitter.apply(documents).stream()
                .filter(chunk -> isMeaningful(chunk.getText()))
                .toList();

        chunks.forEach(chunk -> chunk.getMetadata().put(METADATA_FILE_NAME, fileName));

        if (!chunks.isEmpty()) {
            vectorStore.add(chunks);
        }

        return new DocumentUploadResponse(fileName, chunks.size());
    }

    private boolean isPdf(String fileName) {
        return fileName != null && fileName.toLowerCase().endsWith(".pdf");
    }

    /**
     * Drops boilerplate chunks that pollute citations — table-of-contents pages
     * (mostly dot leaders) and index pages (term ... page-number ... repeated) —
     * while keeping prose and code, which have a high letter ratio and few numbers.
     */
    private boolean isMeaningful(String text) {
        if (text == null) {
            return false;
        }
        String trimmed = text.strip();
        if (trimmed.length() < 40) {
            return false;
        }

        long letters = trimmed.chars().filter(Character::isLetter).count();
        long nonSpace = trimmed.chars().filter(c -> !Character.isWhitespace(c)).count();
        double letterRatio = nonSpace == 0 ? 0 : (double) letters / nonSpace;
        if (letterRatio < 0.5) {
            return false; // dot-leader tables of contents, rule/separator lines
        }

        String[] tokens = trimmed.split("\\s+");
        int numericTokens = 0;
        for (String token : tokens) {
            if (containsDigit(token)) {
                numericTokens++;
            }
        }
        double numericFraction = tokens.length == 0 ? 0 : (double) numericTokens / tokens.length;
        return numericFraction <= 0.35; // index pages are dense with page numbers
    }

    private boolean containsDigit(String token) {
        for (int i = 0; i < token.length(); i++) {
            if (Character.isDigit(token.charAt(i))) {
                return true;
            }
        }
        return false;
    }
}
