
import java.io.File;
import java.util.Random;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.utils.URIBuilder;
import org.eclipse.paho.client.mqttv3.*;
import org.json.JSONArray;
import org.json.JSONObject;

class Configuraion
{
    String IdentifierKey;
    int Id;
    String Location;
}

class PerformRequest
{
    public static void GetDownload(Configuraion configuraion, int fileId, String fileName) throws Exception
    {
        URIBuilder ub = new URIBuilder("http://localhost:8000/files/download/file");
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey)
        .addParameter("file", Integer.toString(fileId));
        String url = ub.toString();

        System.out.println("Hello " + fileName + " " + url);
        Executor executor = Executor.newInstance();
        executor.execute(Request.Get(url))
                .saveContent(new File(configuraion.Location + "/" + fileName));
        System.out.println("2Hello " + fileName + " " + url);
    }

    public static void DeleteDownload(Configuraion configuraion, int fileId) throws Exception
    {
        URIBuilder ub = new URIBuilder("http://localhost:8000/files/download/file");
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey)
                .addParameter("file", Integer.toString(fileId));
        String url = ub.toString();

        Executor executor = Executor.newInstance();
        executor.execute(Request.Delete(url))
                .returnResponse();
    }

    public static String GetList(Configuraion configuraion) throws Exception
    {
        URIBuilder ub = new URIBuilder("http://localhost:8000/files/download/list");
        ub.addParameter("id", Integer.toString(configuraion.Id))
                .addParameter("key", configuraion.IdentifierKey);
        String url = ub.toString();

        String json = Request.Get(url)
                .connectTimeout(1000)
                .socketTimeout(1000)
                .execute().returnContent().asString();
        JSONObject obj = new JSONObject(json);
        if(obj.getBoolean("success")){
            JSONArray files = obj.getJSONArray("data");
            for(int i = 0; i < files.length(); ++i)
            {
                JSONObject file = files.getJSONObject(i);
                int id = file.getInt("id");
                String name = file.getString("Name");
                String extension = file.getString("Extension");
                String fileName = name + "." + extension;

                System.out.print(file.toString());
                GetDownload(configuraion, id, fileName);
                DeleteDownload(configuraion, id);
            }
            System.out.println(files.toString());
        }
        return json;
    }
}

public class FXMain extends Application {

    public static void main(String[] args) {
        Application.launch(args);
    }

    int CurrentImage = 0;
    ImageView imageView = new ImageView();
    //  Timeline timeline = new Timeline();
    Vector<Image> images = new Vector<Image>();

    Configuraion configuraion;
    MqttClient mqttClient;

    public void GetListFromConfig() throws Exception
    {
        File folder = new File(configuraion.Location);
        if(!folder.isDirectory())
            return;
        File[] list = folder.listFiles();
        images.clear();
        for(int i = 0; i < list.length; ++i)
        {
            System.out.println();
            File file = list[i];
            if(file.isFile())
                AddImage("file://" + file.toURI().toURL().getPath());

        }
    }

    void RunSetup() throws Exception
    {
        configuraion = new Configuraion();
        configuraion.Id = 1;
        configuraion.IdentifierKey = "ad83df8e5b8ddc719225f66a856f85afc235d9b3";
        configuraion.Location = "d:\\list";

        mqttClient = new MqttClient("tcp://localhost:1883", MqttAsyncClient.generateClientId());
        mqttClient.connect();
        mqttClient.subscribe("/display/" + configuraion.Id);
        mqttClient.setCallback(new MqttCallback() {
            public void connectionLost(Throwable throwable) {

            }

            public void messageArrived(String topic, MqttMessage mqttMessage) throws Exception {
                PerformRequest.GetList(configuraion);
                GetListFromConfig();
            }

            public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {

            }
        });
    }

    public void AddImage(String path) {
        System.out.println(path);
        images.add(new Image(path));

    }

    public void start(Stage stage) {
        try {
            RunSetup();
            GetListFromConfig();
        }catch (Exception e){e.printStackTrace();}
 //       AddImage("file:///C:/Users/Mahesh/Desktop/wat/WhatsApp Image 2019-02-16 at 10.59.13 PM (2).jpeg");
//        AddImage("file:///C:/Users/Mahesh/Desktop/wat/WhatsApp Image 2019-02-16 at 11.55.41 PM.jpeg");
        // Create the ImageView
        //imageView.setImage(image);

        Timer t = new Timer();
        t.schedule(new TimerTask() {
            @Override
            public void run() {
                CurrentImage = (CurrentImage + 1)%images.size();
                imageView.setImage(images.elementAt(CurrentImage));
            }
        }, 0, 6000);
        imageView.fitWidthProperty().bind(stage.widthProperty());
        imageView.fitHeightProperty().bind(stage.heightProperty());

        // Create the HBox
        HBox root = new HBox();
        // Add Children to the HBox
        root.getChildren().add(imageView);

        // Set the size of the HBox
        root.setPrefSize(300, 300);

        // Create the Scene
        Scene scene = new Scene(root);
        // Add the scene to the Stage
        stage.setScene(scene);
        stage.setResizable(false);
        stage.setFullScreen(true);
//        stage.setMaximized(true);
        // Set the title of the Stage
        stage.setTitle("Displaying an Image");
        // Display the Stage
        stage.show();
    }
}
