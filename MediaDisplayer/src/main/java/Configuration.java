import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class Configuration {
    public final String IdentifierKey;
    public final int Id;
    public final String URL;
    public final String StoragePath;
    public final String Location;

    public Configuration(final Properties props) {
        this.Id = Integer.parseInt(props.getProperty("id"));
        this.IdentifierKey = props.getProperty("IdentifierKey");
        this.StoragePath = props.getProperty("StoragePath");
        this.Location = props.getProperty("Name");
        this.URL = props.getProperty("URLWeb");
        Utils.CreateDirectoryIfNotExists(this.StoragePath);
        Utils.CreateDirectoryIfNotExists(this.GetAbsolutePathFromStorage("database"));
        Utils.CreateDirectoryIfNotExists(this.GetAbsolutePathFromStorage("paho"));
    }

    public void Delete() {
        Utils.ClearFile(this.StoragePath);
        Utils.ClearFile(this.GetAbsolutePathFromStorage("database"));
        Utils.ClearFile(this.GetAbsolutePathFromStorage("paho"));
        PropertiesDeal propertiesDeal = new PropertiesDeal();
        propertiesDeal.deleteProperties();
    }

    public String GetURL(String Name) {
        return "http://" + URL + ":8000/" + Name;
    }

    public String GetMqttLink() {
        return "tcp://" + URL + ":1883";
    }

    public String GetAbsolutePathAsUriFromStorage(final String... names) throws Exception {
        return Utils.ToUri(GetAbsolutePathFromStorage(names));
    }

    public String GetAbsolutePathFromStorage(final String... names) {
        return Utils.GetAbsolutePath(this.StoragePath, names);
    }

    public Connection GetSQLDBConnection() throws SQLException, ClassNotFoundException {
        Class.forName("org.sqlite.JDBC");
        return DriverManager.getConnection("jdbc:sqlite:" + this.GetAbsolutePathFromStorage("database", "files.db"));
    }

    public MqttDefaultFilePersistence GetMqttDefaultStorageLocation() {
        return new MqttDefaultFilePersistence(this.GetAbsolutePathFromStorage("paho"));
    }

    public String GetStreamToFileUrl(final int fileId) {
        String url = GetURL("files/stream/" + this.Id + "/" + fileId);
        System.out.println(url);
        return url;
    }
}
