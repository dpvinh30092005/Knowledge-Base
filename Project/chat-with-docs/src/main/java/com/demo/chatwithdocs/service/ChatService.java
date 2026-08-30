package com.demo.chatwithdocs.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;

import com.demo.chatwithdocs.dto.ChatRequest;
import com.demo.chatwithdocs.dto.ChatResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final int TOP_K = 8;
    // Drops clearly-unrelated chunks from the LLM context; the frontend additionally
    // only displays the sources the answer actually cites. Lower = more permissive.
    private static final double SIMILARITY_THRESHOLD = 0.25;
    private static final int PASSAGE_LENGTH = 500;
    // How many prior turns to keep as context; caps token usage on long chats.
    private static final int MAX_HISTORY_TURNS = 8;

    // Shown to the browser; the real cause is logged server-side, never sent to the client.
    private static final String GENERIC_ERROR_MESSAGE =
            "Something went wrong while generating the answer. Please try again.";

    private static final String SYSTEM_PROMPT = """
            You are a helpful assistant that answers questions based ONLY on the numbered sources below.
            Give a thorough, well-structured answer: synthesize the information across all relevant
            sources, explain the key points in enough depth to be genuinely useful, and use short
            paragraphs, headings, or bullet points when they make the answer easier to read. Do not
            invent details or add information that is not supported by the sources.
            Cite every claim inline with the source number in square brackets, e.g. [1] or [2][3],
            placed right after the sentence it supports. Only cite sources that actually contain the
            information. If the answer cannot be found in the sources, say that you don't know based on
            the uploaded documents. Answer in the same language as the user's question.

            Sources:
            %s
            """;

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ObjectMapper objectMapper;

    public ChatService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.vectorStore = vectorStore;
        this.objectMapper = objectMapper;
    }

    /**
     * Non-streaming: returns the full answer plus sources in one response.
     */
    public ChatResponse chat(ChatRequest request) {
        List<Document> relevantChunks = retrieve(retrievalQuery(request));
        String answer = chatClient.prompt()
                .system(SYSTEM_PROMPT.formatted(buildContext(relevantChunks)))
                .messages(historyMessages(request))
                .user(request.question())
                .call()
                .content();
        return new ChatResponse(answer, toSources(relevantChunks));
    }

    /**
     * Streaming: emits a "sources" event first, then one "token" event per chunk
     * of the answer as the model generates it, and a "done" event at the end.
     */
    public Flux<ServerSentEvent<String>> chatStream(ChatRequest request) {
        return Flux.defer(() -> {
            List<Document> relevantChunks = retrieve(retrievalQuery(request));

            ServerSentEvent<String> sourcesEvent =
                    event("sources", toJson(toSources(relevantChunks)));

            Flux<ServerSentEvent<String>> tokens = chatClient.prompt()
                    .system(SYSTEM_PROMPT.formatted(buildContext(relevantChunks)))
                    .messages(historyMessages(request))
                    .user(request.question())
                    .stream()
                    .content()
                    // Wrap each token in JSON so leading spaces and newlines survive SSE encoding
                    .map(token -> event("token", toJson(Map.of("t", token))));

            return Flux.concat(Flux.just(sourcesEvent), tokens, Flux.just(event("done", "{}")));
        }).onErrorResume(e -> {
            log.error("Chat streaming failed", e);
            return Flux.just(event("error", toJson(Map.of("message", GENERIC_ERROR_MESSAGE))));
        });
    }

    private List<Document> retrieve(String query) {
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build());
    }

    /**
     * Builds the vector-search query. A follow-up like "what does it say?" has no
     * useful terms on its own, so we prepend the previous user turn to give the
     * similarity search enough context to retrieve the right passages.
     */
    private String retrievalQuery(ChatRequest request) {
        String previousUserTurn = lastUserContent(request.history());
        return previousUserTurn == null
                ? request.question()
                : previousUserTurn + "\n" + request.question();
    }

    private String lastUserContent(List<ChatRequest.Turn> history) {
        if (history == null) {
            return null;
        }
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatRequest.Turn turn = history.get(i);
            if (isUser(turn.role())) {
                return turn.content();
            }
        }
        return null;
    }

    /**
     * Converts the prior conversation into Spring AI messages so the model can
     * resolve references like "it" or "that". Only the last {@code MAX_HISTORY_TURNS}
     * turns are kept to bound token usage.
     */
    private List<Message> historyMessages(ChatRequest request) {
        List<ChatRequest.Turn> history = request.history();
        List<Message> messages = new ArrayList<>();
        if (history == null || history.isEmpty()) {
            return messages;
        }
        int start = Math.max(0, history.size() - MAX_HISTORY_TURNS);
        for (int i = start; i < history.size(); i++) {
            ChatRequest.Turn turn = history.get(i);
            if (turn.content() == null || turn.content().isBlank()) {
                continue;
            }
            messages.add(isUser(turn.role())
                    ? new UserMessage(turn.content())
                    : new AssistantMessage(turn.content()));
        }
        return messages;
    }

    private boolean isUser(String role) {
        return "user".equalsIgnoreCase(role);
    }

    /**
     * Numbers each chunk so the model can cite it as [n], and includes the file
     * name and page so citations are traceable.
     */
    private String buildContext(List<Document> chunks) {
        StringBuilder context = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            Document chunk = chunks.get(i);
            context.append('[').append(i + 1).append("] ")
                    .append(location(chunk)).append('\n')
                    .append(chunk.getText()).append("\n\n");
        }
        return context.toString();
    }

    private String location(Document chunk) {
        String fileName = String.valueOf(chunk.getMetadata().get(DocumentIngestionService.METADATA_FILE_NAME));
        Object page = chunk.getMetadata().get(DocumentIngestionService.METADATA_PAGE_NUMBER);
        return page == null ? "(" + fileName + ")" : "(" + fileName + ", page " + page + ")";
    }

    private List<ChatResponse.SourceReference> toSources(List<Document> chunks) {
        List<ChatResponse.SourceReference> sources = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            Document chunk = chunks.get(i);
            Object page = chunk.getMetadata().get(DocumentIngestionService.METADATA_PAGE_NUMBER);
            sources.add(new ChatResponse.SourceReference(
                    i + 1,
                    String.valueOf(chunk.getMetadata().get(DocumentIngestionService.METADATA_FILE_NAME)),
                    page == null ? null : ((Number) page).intValue(),
                    passage(chunk.getText())));
        }
        return sources;
    }

    private ServerSentEvent<String> event(String name, String data) {
        return ServerSentEvent.builder(data).event(name).build();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize SSE payload", e);
        }
    }

    private String passage(String text) {
        if (text == null) {
            return "";
        }
        String normalized = text.strip().replaceAll("\\s+", " ");
        return normalized.length() <= PASSAGE_LENGTH
                ? normalized
                : normalized.substring(0, PASSAGE_LENGTH) + "...";
    }
}
