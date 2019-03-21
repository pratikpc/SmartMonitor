import javafx.application.Application;
import javafx.application.Platform;
import javafx.event.EventHandler;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import org.eclipse.paho.client.mqttv3.*;

import java.io.File;
import java.security.Key;
import java.util.Properties;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;

class Configuraion {
    public final String IdentifierKey;
    public final int Id;
    public final String URL;
    public final String StoragePath;
    public final String Location;

    public Configuraion(Properties props) {
        this.Id = Integer.parseInt(props.getProperty("id"));
        this.IdentifierKey = props.getProperty("IdentifierKey");
        this.StoragePath = props.getProperty("StoragePath");
        this.Location = props.getProperty("Name");
        this.URL = props.getProperty("URLWeb");
        Utils.CreateDirectoryIfNotExists(this.StoragePath);
    }

    public String GetURL(String Name) {
        return "http://" + URL + ":8000/" + Name;
    }

    public String GetMqttLink() {
        return "tcp://" + URL + ":1883";
    }
}

public class FXMain extends Application {
    int CurrentImage = 0;
    ImageView imageView = new ImageView();
    //  Timeline timeline = new Timeline();
    Vector<Image> images = new Vector<Image>();

    Configuraion configuraion;
    MqttClient mqttClient;

    public void GetListFromConfig() throws Exception {
        File folder = new File(configuraion.StoragePath);
        System.out.println(folder.getAbsolutePath() + folder.isDirectory());
        if (!folder.isDirectory())
            return;
        File[] list = folder.listFiles();
        images.clear();
        for (File file : list) {
            System.out.println(file.getAbsolutePath() + "/" + file.isFile());
            if (file.isFile())
                AddImage("file://" + file.toURI().toURL().getPath());
        }
    }

    void RunSetup() throws Exception {
        configuraion = new Configuraion(new PropertiesDeal().loadProperties());

        mqttClient = new MqttClient(configuraion.GetMqttLink(), MqttAsyncClient.generateClientId());
        mqttClient.connect();
        mqttClient.subscribe("/display/" + configuraion.Id);
        mqttClient.setCallback(new MqttCallback() {
            public void connectionLost(Throwable throwable) {

            }

            public void messageArrived(String topic, MqttMessage mqttMessage) throws Exception {
                final String msg = mqttMessage.toString();
                // Download Signal Received
                if (msg == "DN") {
                    ServerInteractor.GetList(configuraion);
                    GetListFromConfig();
                }
            }

            public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {

            }
        });
    }

    public void AddImage(String path) {
        System.out.println(path);
        images.add(new Image(path));

    }

    void RunFXLoginSetup() throws Exception {
        RunFXLoginSetup(null);
    }

    void RunFXLoginSetup(Properties props) throws Exception {
        PropertiesDeal propertiesDeal = new PropertiesDeal();
        while (true) {
            Properties p = propertiesDeal.loadProperties();
            if (p.containsKey("id"))
                break;
            SignUpDialog signUpDialog = new SignUpDialog();
            signUpDialog.Build();
            signUpDialog.Assign(props);
            if (signUpDialog.Show())
                break;
        }
    }

    public void start(Stage stage) {
        try {
            RunFXLoginSetup();
            RunSetup();
            GetListFromConfig();
        } catch (Exception e) {
            e.printStackTrace();
        }

        Timer t = new Timer();
        t.schedule(new TimerTask() {
            @Override
            public void run() {
                System.out.println("He;o" + CurrentImage + images.size());
                if (images.size() == 0)
                    return;
                CurrentImage = (CurrentImage + 1) % images.size();
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

        scene.setOnKeyReleased(new EventHandler<KeyEvent>() {
            public void handle(KeyEvent keyEvent) {
                final KeyCode keyCode = keyEvent.getCode();
                // Pressing R Button will Reset the Entire Process
                if (keyCode == KeyCode.R) {
                    if(!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Reset?"))
                        return;
                    try {
                        ServerInteractor.DeleteDisplay(configuraion);
                        Utils.ClearDirectory(configuraion.StoragePath);
                        PropertiesDeal propertiesDeal = new PropertiesDeal();
                        propertiesDeal.deleteProperties();
                        stage.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                        return;
                    }
                }
                if (keyCode == KeyCode.X || keyCode == KeyCode.ESCAPE) {
                    if(!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Exit?"))
                        return;
                    stage.close();
                }
            }
        });

        // Add the scene to the Stage
        stage.setScene(scene);
        stage.setResizable(false);
        stage.setFullScreen(true);
//        stage.setMaximized(true);
        // Set the title of the Stage
        stage.setTitle("Displaying an Image");
        // Display the Stage
        stage.show();

        stage.setOnCloseRequest((event) -> {
            stage.close();
        });
    }

    @Override
    public void stop() throws Exception {
        super.stop();
        mqttClient.disconnectForcibly();
        mqttClient.close(true);
        Platform.exit();
        System.exit(0);
    }
}
