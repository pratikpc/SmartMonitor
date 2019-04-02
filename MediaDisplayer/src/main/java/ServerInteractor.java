import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Form;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.HttpClientBuilder;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.List;
import java.util.Properties;

public class ServerInteractor {
    private static final HttpClient client = HttpClientBuilder.create()
            .disableCookieManagement()
            .build();
    private static final Executor executor = Executor.newInstance(client);

    private static void GetDownload(Configuration configuration, int fileId, String fileName) throws Exception {

        List<NameValuePair> form = Form.form()
                .add("id", Integer.toString(configuration.Id))
                .add("key", configuration.IdentifierKey)
                .add("file", Integer.toString(fileId))
                .build();

        executor.execute(Request.Post(configuration.GetURL("files/download/file"))
                .connectTimeout(1000)
                .body(new UrlEncodedFormEntity(form, "UTF-8"))
                .socketTimeout(1000))
                .saveContent(new File(Utils.GetAbsolutePath(configuration.StoragePath, fileName)));
        System.out.println("Hello " + " "  + " ");
    }

    private static boolean DeleteDownload(Configuration configuration, int fileId) throws Exception {
        final URIBuilder ub = new URIBuilder(configuration.GetURL("files/download/file"))
                .addParameter("id", Integer.toString(configuration.Id))
                .addParameter("key", configuration.IdentifierKey)
                .addParameter("file", Integer.toString(fileId));
        final String url = ub.toString();

        final String json = executor.execute(Request.Delete(url)
                .connectTimeout(1000)
                .socketTimeout(1000))
                .returnContent().asString();
        return new JSONObject(json).optBoolean("success", false);
    }

    public static boolean DeleteDisplay(Configuration configuration) throws Exception {
        final URIBuilder ub = new URIBuilder(configuration.GetURL("display"))
                .addParameter("id", Integer.toString(configuration.Id))
                .addParameter("key", configuration.IdentifierKey);
        final String url = ub.toString();

        final String json = executor.execute(Request.Delete(url)
                .connectTimeout(1000)
                .socketTimeout(1000))
                .returnContent().asString();
        return new JSONObject(json).optBoolean("success", false);
    }

    public static void DownloadNewFiles(Configuration configuration) throws Exception {
        List<NameValuePair> form = Form.form()
                .add("id", Integer.toString(configuration.Id))
                .add("key", configuration.IdentifierKey)
                .build();

        final String json = executor.execute(Request.Post(configuration.GetURL("files/download/list"))
                .connectTimeout(1000)
                .body(new UrlEncodedFormEntity(form, "UTF-8"))
                .socketTimeout(1000))
                .returnContent().asString();
        JSONObject obj = new JSONObject(json);
        if (!obj.optBoolean("success", false))
            return;
        JSONArray files = obj.getJSONArray("data");
        for (int i = 0; i < files.length(); ++i) {
            final JSONObject file = files.getJSONObject(i);

            final int id = file.getInt("id");
            final String name = file.getString("Name");
            final String extension = file.getString("Extension");
            final String fileName = name + "." + extension;

            GetDownload(configuration, id, fileName);
            DeleteDownload(configuration, id);
        }
    }

    public static JSONArray GetFileDownloadList(Configuration configuration) throws Exception {
        List<NameValuePair> form = Form.form()
                .add("id", Integer.toString(configuration.Id))
                .add("key", configuration.IdentifierKey)
                .build();

        final String json = executor.execute(Request.Post(configuration.GetURL("files/list/filesFX"))
                .connectTimeout(1000)
                .body(new UrlEncodedFormEntity(form, "UTF-8"))
                .socketTimeout(1000))
                .returnContent().asString();

        System.out.println(json);
        JSONObject obj = new JSONObject(json);
        if (obj == null || !obj.optBoolean("success", false) || obj.isNull("data"))
            return null;
        System.out.println("Hello " + json);
        return obj.getJSONArray("data");
    }

    public static boolean CreateNewRasPi(final String name, final String pass, final String location, final String Url, final String StoragePath) throws Exception {
        final List<NameValuePair> form = Form.form()
                .add("name", name)
                .add("pass", pass)
                .add("displayname", location)
                .build();

        final String url = "http://" + Url + ":8000/display/add";

        Executor executor = Executor.newInstance();
        final String json = executor.execute(Request.Post(url)
                .connectTimeout(1000)
                .body(new UrlEncodedFormEntity(form, "UTF-8"))
                .socketTimeout(1000))
                .returnContent().asString();
        JSONObject jsonObject = new JSONObject(json);
        boolean success = jsonObject.optBoolean("success", false) || jsonObject.isNull("data");
        if (!success)
            return false;
        JSONObject data = jsonObject.getJSONObject("data");

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
