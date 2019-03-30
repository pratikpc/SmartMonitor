import javafx.application.Application;
import javafx.event.EventHandler;
import javafx.scene.Scene;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.HBox;
import javafx.scene.media.MediaPlayer;
import javafx.scene.media.MediaView;
import javafx.stage.Stage;
import org.eclipse.paho.client.mqttv3.*;

import java.io.File;
import java.util.Properties;
import java.util.Vector;
import java.util.concurrent.TimeUnit;

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
    MediaView mediaView = new MediaView();
    Vector<Pair> images = new Vector<>();

    Configuraion configuraion;
    MqttClient mqttClient;
    Thread repeatThread;

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
                AddMediaLink(file.getAbsolutePath());
        }
    }

    void SetupConfiguration() throws Exception {
        configuraion = new Configuraion(new PropertiesDeal().loadProperties());
    }

    void SetupMQTT() throws MqttException {
        mqttClient = new MqttClient(configuraion.GetMqttLink(), MqttAsyncClient.generateClientId());
        mqttClient.connect();
        mqttClient.subscribe("/display/" + configuraion.Id);
        mqttClient.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable throwable) {

            }

            @Override
            public void messageArrived(String topic, MqttMessage mqttMessage) {
                final String msg = mqttMessage.toString();
                try {
                    // Download Signal Received
                    if (msg.equals("DN")) {
                        ServerInteractor.GetList(configuraion);
                        GetListFromConfig();
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {

            }
        });
    }

    public void AddMediaLink(String path) throws Exception {
        images.add(new Pair(path));
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
            RegisterDisplayDialog registerDisplayDialog = new RegisterDisplayDialog();
            registerDisplayDialog.Build();
            registerDisplayDialog.Assign(props);
            if (registerDisplayDialog.Show())
                break;
        }
    }

    @Override
    public void start(Stage stage) {
        try {
            RunFXLoginSetup();
            SetupConfiguration();
            SetupMQTT();
            ServerInteractor.GetList(configuraion);
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            GetListFromConfig();
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        repeatThread = new Thread(() -> {
            try {
                while (true) {
                    if (Thread.currentThread().isInterrupted())
                        return;
                    if (images.size() == 0)
                        return;
                    CurrentImage = (CurrentImage + 1) % images.size();
                    Pair element = images.elementAt(CurrentImage);
                    switch (element.Type) {
                        case IMAGE:
                            imageView.setImage(element.Image);
                            imageView.setVisible(true);
                            mediaView.setVisible(false);
                            mediaView.fitWidthProperty().unbind();
                            mediaView.fitHeightProperty().unbind();
                            mediaView.setFitWidth(0);
                            mediaView.setFitHeight(0);
                            imageView.fitWidthProperty().bind(stage.widthProperty());
                            imageView.fitHeightProperty().bind(stage.heightProperty());
                            TimeUnit.SECONDS.sleep(1);
                            imageView.setImage(null);
                            break;
                        case VIDEO:
                            MediaPlayer mediaPlayer = new MediaPlayer(element.Video);
                            imageView.setImage(null);
                            imageView.fitWidthProperty().unbind();
                            imageView.fitHeightProperty().unbind();
                            imageView.setFitWidth(0);
                            imageView.setFitHeight(0);
                            mediaView.fitWidthProperty().bind(stage.widthProperty());
                            mediaView.fitHeightProperty().bind(stage.heightProperty());
                            imageView.setVisible(false);
                            mediaView.setVisible(true);
                            mediaPlayer.play();
                            mediaPlayer.setAutoPlay(true);
                            mediaPlayer.setMute(true);
                            mediaView.setMediaPlayer(mediaPlayer);
                            Thread.sleep(500);
                            Thread.sleep((long) element.Video.getDuration().toMillis());
                            mediaPlayer.stop();
                            break;
                        default:
                            imageView.setVisible(false);
                            mediaView.setVisible(false);
                            break;
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        });
        repeatThread.start();

        imageView.setVisible(false);
        mediaView.setVisible(false);

        // Create the HBox
        HBox root = new HBox();
        // Add Children to the HBox
        root.getChildren().add(imageView);
        root.getChildren().add(mediaView);

        // Set the size of the HBox
        root.setPrefSize(300, 300);

        // Create the Scene
        Scene scene = new Scene(root);

        scene.setOnKeyReleased(new EventHandler<KeyEvent>() {
            public void handle(KeyEvent keyEvent) {
                final KeyCode keyCode = keyEvent.getCode();
                // Pressing R Button will Reset the Entire Process
                if (keyCode == KeyCode.R) {
                    if (!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Reset?"))
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
                    if (!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Exit?"))
                        return;
                    stage.close();
                }
            }
        });

        // Add the scene to the Stage
        stage.setScene(scene);
        stage.setResizable(false);
        // Disable Full Screen during Debugging
        // stage.setFullScreen(true);
        stage.setMaximized(true);
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
        repeatThread.interrupt();
        mqttClient.disconnectForcibly();
        mqttClient.close(true);
        Utils.Terminate();
    }
}
