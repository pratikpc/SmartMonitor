import org.apache.http.client.HttpClient;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.HttpClientBuilder;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.nio.file.Paths;
import java.util.Properties;

public class ServerInteractor {
    private static final HttpClient client = HttpClientBuilder.create()
            .disableCookieManagement()
            .build();
    private static final Executor executor = Executor.newInstance(client);

    private static void GetDownload(Configuraion configuraion, int fileId, String fileName) throws Exception {
        URIBuilder ub = new URIBuilder(configuraion.GetURL("files/download/file"));
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey)
                .addParameter("file", Integer.toString(fileId));
        String url = ub.toString();

        executor.execute(Request.Get(url))
                .saveContent(new File(Paths.get(configuraion.StoragePath, fileName).toAbsolutePath().toString()));
        System.out.println("Hello " + " " + url + " ");
    }

    private static void DeleteDownload(Configuraion configuraion, int fileId) throws Exception {
        URIBuilder ub = new URIBuilder(configuraion.GetURL("files/download/file"));
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey)
                .addParameter("file", Integer.toString(fileId));
        String url = ub.toString();

        final String json = executor.execute(Request.Delete(url))
                .returnContent().asString();
    }

    public static void DeleteDisplay(Configuraion configuraion) throws Exception {
        URIBuilder ub = new URIBuilder(configuraion.GetURL("display"));
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey);
        String url = ub.toString();

        final String json = executor.execute(Request.Delete(url))
                .returnContent().asString();
    }

    public static void GetList(Configuraion configuraion) throws Exception {
        URIBuilder ub = new URIBuilder(configuraion.GetURL("files/download/list"));
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey);
        String url = ub.toString();

        final String json = executor.execute(Request.Get(url)
                .connectTimeout(1000)
                .socketTimeout(1000))
                .returnContent().asString();
        JSONObject obj = new JSONObject(json);
        if (!obj.getBoolean("success"))
            return;
        JSONArray files = obj.getJSONArray("data");
        for (int i = 0; i < files.length(); ++i) {
            final JSONObject file = files.getJSONObject(i);

            final int id = file.getInt("id");
            final String name = file.getString("Name");
            final String extension = file.getString("Extension");
            final String fileName = name + "." + extension;

            GetDownload(configuraion, id, fileName);
            DeleteDownload(configuraion, id);
        }
    }

    public static boolean CreateNewRasPi(final String name, final String pass, final String location, final String Url, final String StoragePath) throws Exception {
        URIBuilder ub = new URIBuilder("http://" + Url + ":8000/display/add")
                .addParameter("name", name)
                .addParameter("pass", pass)
                .addParameter("displayname", location);
        String url = ub.toString();

        Executor executor = Executor.newInstance();
        String json = executor.execute(Request.Get(url).useExpectContinue()).returnContent().asString();
        JSONObject object = new JSONObject(json);
        boolean success = object.getBoolean("success");
        if (!success)
            return false;
        JSONObject data = object.getJSONObject("data");

        int id = data.getInt("id");
        String Name = data.getString("Name");
        String Identifier = data.getString("IdentifierKey");

        Properties props = new Properties();
        props.setProperty("id", String.valueOf(id));
        props.setProperty("Name", Name);
        props.setProperty("IdentifierKey", Identifier);
        props.setProperty("URLWeb", Url);
        props.setProperty("StoragePath", StoragePath);

        PropertiesDeal propertiesDeal = new PropertiesDeal();
        propertiesDeal.saveProperties(props);
        return true;
    }


}
