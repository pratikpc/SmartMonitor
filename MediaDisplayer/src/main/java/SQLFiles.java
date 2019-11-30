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
                + "path STRING NOT NULL UNIQUE,"
                + "start INTEGER NOT NULL,"
                + "end INTEGER NOT NULL,"
                + "showtime INTEGER NOT NULL,"
                + "display BOOLEAN NOT NULL"
                + ");";
        ExecuteSQLStatement(tableNew);
    }

    public Vector<Medium> Load() throws Exception {
        Vector<Medium> media = new Vector<>();
        final String select = "SELECT path , showtime from " + Constants.DB.FileT + " WHERE display=? AND (start = end OR (start < ? AND end > ?)) ORDER BY id";
        final PreparedStatement preparedStatement = this.connection.prepareStatement(select);
        preparedStatement.setBoolean(1, true);
        final int time = Utils.GetCurrentHourAndMinuteAsInteger();
        preparedStatement.setInt(2, time);
        preparedStatement.setInt(3, time);
        final ResultSet resultSet = preparedStatement.executeQuery();
        while (resultSet.next()) {
            final String path = resultSet.getString("path");
            final int showTime = resultSet.getInt("showtime");
            final Medium medium = new Medium(path, showTime);
            // Ensure only proper media files get added
            if (medium.Type == Utils.FileType.UNKNOWN)
                continue;
            media.add(medium);
        }
        preparedStatement.close();
        return media;
    }

    public boolean IDExists(int id) throws Exception {
        Vector<Medium> media = new Vector<>();
        final String select = "SELECT COUNT(id) from " + Constants.DB.FileT + " WHERE id=?";
        final PreparedStatement preparedStatement = this.connection.prepareStatement(select);
        preparedStatement.setInt(1, id);

        final ResultSet resultSet = preparedStatement.executeQuery();
        final int count = resultSet.getInt(1);

        preparedStatement.close();
        return count != 0;
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
        final String path = configuration.GetAbsolutePathAsUriFromStorage(jsonObject.getString("Path"));
        final int start = jsonObject.getInt("Start");
        final int end = jsonObject.getInt("End");
        final boolean display = jsonObject.optBoolean("OnDisplay", false);
        final int showTime = jsonObject.optInt("ShowTime", 0);
        return Insert(id, path, start, end, showTime, display);
    }

    public int Insert(int id, String path, int start, int end, int showTime, boolean display) throws SQLException {
        final String sql = "INSERT OR REPLACE INTO " + Constants.DB.FileT + " VALUES(?,?,?,?,?,?)";
        final PreparedStatement stmt = connection.prepareStatement(sql);
        stmt.setInt(1, id);
        stmt.setString(2, path);
        stmt.setInt(3, start);
        stmt.setInt(4, end);
        int showTimeValidated = Math.max(showTime, 0);
        stmt.setInt(5, showTimeValidated);
        stmt.setBoolean(6, display);
        int modified = stmt.executeUpdate();
        stmt.close();
        return modified;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
    }
}