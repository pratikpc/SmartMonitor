import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Vector;

class SQLInteractor {
    protected Connection connection = null;

    protected boolean ExecuteSQLStatement(final String sql) throws SQLException {
        return connection.createStatement().execute(sql);
    }

    protected int ExecuteSQLUpdate(final String sql) throws SQLException {
        return connection.createStatement().executeUpdate(sql);
    }

    public void Close() throws SQLException {
        if (!this.connection.isClosed())
            this.connection.close();
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        this.Close();
    }
}

public class SQLFiles extends SQLInteractor {
    private Configuration configuration;

    public SQLFiles(final Configuration configuration) throws SQLException, ClassNotFoundException {
        this.configuration = configuration;
        Class.forName("org.sqlite.JDBC");
        this.connection = this.configuration.GetSQLDBConnection();

        final String tableNew = "CREATE TABLE IF NOT EXISTS " + Constants.DB.FileT + "("
                + "id INTEGER PRIMARY KEY,"
                + "start INTEGER NOT NULL,"
                + "end INTEGER NOT NULL,"
                + "display BOOLEAN NOT NULL"
                + ");";
        ExecuteSQLStatement(tableNew);
    }

    public Vector<String> Load() throws Exception {
        Vector<String> media = new Vector<>();
        final String select = "SELECT id from " + Constants.DB.FileT + " WHERE display=? AND (start = end OR (start < ? AND end > ?)) ORDER BY id";
        final PreparedStatement preparedStatement = this.connection.prepareStatement(select);
        preparedStatement.setBoolean(1, true);
        final int time = Utils.GetCurrentHourAndMinuteAsInteger();
        preparedStatement.setInt(2, time);
        preparedStatement.setInt(3, time);
        final ResultSet resultSet = preparedStatement.executeQuery();
        while (resultSet.next()) {
            final int fileId = resultSet.getInt("id");
            final String medium = this.configuration.GetStreamToFileUrl(fileId);
            media.add(medium);
        }
        preparedStatement.close();
        return media;
    }

    public int Clear() throws SQLException {
        final String sql = "DELETE FROM " + Constants.DB.FileT;
        return ExecuteSQLUpdate(sql);
    }

    public void ClearAndInsert(final JSONArray jsonArray) throws Exception {
        if (jsonArray == null) return;
        Clear();
        Insert(jsonArray);
    }

    public void Insert(final JSONArray jsonArray) throws Exception {
        for (int i = 0; i < jsonArray.length(); i++) {
            final JSONObject jsonObject = jsonArray.getJSONObject(i);
            Insert(jsonObject);
        }
    }

    public int Insert(final JSONObject jsonObject) throws Exception {
        final int id = jsonObject.getInt("file");
        final int start = jsonObject.getInt("Start");
        final int end = jsonObject.getInt("End");
        final boolean display = jsonObject.optBoolean("OnDisplay", false);
        return Insert(id, start, end, display);
    }

    public int Insert(int id, int start, int end, boolean display) throws SQLException {
        final String sql = "INSERT OR REPLACE INTO " + Constants.DB.FileT + " VALUES(?,?,?,?)";
        final PreparedStatement stmt = connection.prepareStatement(sql);
        stmt.setInt(1, id);
        stmt.setInt(2, start);
        stmt.setInt(3, end);
        stmt.setBoolean(4, display);
        int modified = stmt.executeUpdate();
        stmt.close();
        return modified;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
    }
}