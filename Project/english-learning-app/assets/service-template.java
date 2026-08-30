import java.util.List;
import java.util.stream.Collectors;

public class {{Entity}}ServiceImpl implements {{Entity}}Service {

    private final {{Entity}}DAO dao = new {{Entity}}DAO();

    @Override
    public List<{{DTO}}> getAll() {
        List<{{Entity}}> entities = dao.findAll();

        return entities.stream()
                .map(e -> toDTO(e))
                .collect(Collectors.toList());
    }

    @Override
    public void add({{DTO}} dto) {
        {{Entity}} entity = toEntity(dto);
        dao.insert(entity);
    }

    private {{DTO}} toDTO({{Entity}} e) {
        return new {{DTO}}(
                // e.getWord(),
                // e.getMeaning(),
                null
        );
    }

    private {{Entity}} toEntity({{DTO}} dto) {
        {{Entity}} e = new {{Entity}}();

        // e.setWord(dto.getWord());
        // e.setMeaning(dto.getMeaning());

        return e;
    }
}