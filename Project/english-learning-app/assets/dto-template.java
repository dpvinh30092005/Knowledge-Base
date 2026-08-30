import java.util.List;

public class {{Entity}}DTO {

private final String word;
private final String meaning;
private final List<String> sentences;

public {{DTO}}(String word, String meaning, List<String> sentences) {
        this.word = word;
        this.meaning = meaning;
        this.sentences = sentences;
    }

public String getWord() {
    return word;
}

public String getMeaning() {
    return meaning;
}

public List<String> getSentences() {
    return sentences;
}
}