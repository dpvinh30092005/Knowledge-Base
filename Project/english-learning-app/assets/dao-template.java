import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class {{Entity}}DAO {

    public List<{{Entity}}> findAll() {
        List<{{Entity}}> list = new ArrayList<>();

        String sql = "SELECT * FROM {{table}}";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                {{Entity}} entity = new {{Entity}}();

                // map fields here
                // entity.setId(rs.getInt("id"));

                list.add(entity);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    public void insert({{Entity}} entity) {
        String sql = "INSERT INTO {{table}} (word, meaning) VALUES (?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            // ps.setString(1, entity.getWord());
            // ps.setString(2, entity.getMeaning());

            ps.executeUpdate();

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}