import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.HBox;
import javafx.scene.media.MediaPlayer;
import javafx.scene.media.MediaView;
import javafx.stage.Stage;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.Vector;
import java.util.concurrent.TimeUnit;

class Configuration {
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
        Utils.CreateDirectoryIfNotExists(this.GetRelativePathFromStorage("database"));
        Utils.CreateDirectoryIfNotExists(this.GetRelativePathFromStorage("paho"));
    }

    public String GetURL(String Name) {
        return "http://" + URL + ":8000/" + Name;
    }

    public String GetMqttLink() {
        return "tcp://" + URL + ":1883";
    }

    public String GetRelativePathAsUriFromStorage(final String... names) throws Exception {
        return Utils.ToUri(GetRelativePathFromStorage(names));
    }

    public String GetRelativePathFromStorage(final String... names) {
        return Utils.GetAbsolutePath(this.StoragePath, names);
    }

    public Connection GetSQLDBConnection() throws SQLException {
        return DriverManager.getConnection("jdbc:sqlite:" + this.GetRelativePathFromStorage("database", "files.db"));
    }

    public MqttDefaultFilePersistence GetMqttDefaultStorageLocation() {
        return new MqttDefaultFilePersistence(this.GetRelativePathFromStorage("paho"));
    }
}

public class FXMain extends Application {
    final ImageView imageView = new ImageView();
    final MediaView mediaView = new MediaView();
    int CurrentMedium = 0;
    SQLFiles sqlFiles;

    Configuration configuration;
    MqttClient mqttClient;
    Thread displayThread;

    void SetupConfiguration() throws Exception {
        configuration = new Configuration(new PropertiesDeal().loadProperties());
    }

    void SetupMQTT() throws MqttException {
        mqttClient = new MqttClient(configuration.GetMqttLink(), MqttAsyncClient.generateClientId(), configuration.GetMqttDefaultStorageLocation());
        mqttClient.connect();
        mqttClient.subscribe("/display/" + configuration.Id);
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
                        ServerInteractor.DownloadNewFiles(configuration);
                        // Update SQL Files List
                        sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
                    }
                    // Update Signal Received
                    if (msg.equals("UE")) {
                        // Update SQL Files List
                        sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
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

    void RunFXLoginSetup() throws Exception {
        RunFXLoginSetup(null);
    }

    void RunFXLoginSetup(final Properties props) throws Exception {
        final PropertiesDeal propertiesDeal = new PropertiesDeal();
        while (true) {
            final Properties p = propertiesDeal.loadProperties();
            if (p.containsKey("id"))
                break;
            RegisterDisplayDialog registerDisplayDialog = new RegisterDisplayDialog();
            registerDisplayDialog.Build();
            registerDisplayDialog.Assign(props);
            if (registerDisplayDialog.Show())
                break;
        }
    }

    void SetupDisplayThread(final Stage stage) {
        displayThread = new Thread(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    final Vector<Medium> media = sqlFiles.Load();
                    if (media.isEmpty())
                        continue;
                    // Use this to Iterate over positions
                    if (CurrentMedium >= media.size())
                        CurrentMedium = 0;
                    else
                        CurrentMedium = (CurrentMedium + 1) % media.size();
                    final Medium medium = media.elementAt(CurrentMedium);
                    switch (medium.Type) {
                        case IMAGE:
                            imageView.setImage(medium.Image);
                            imageView.setVisible(true);
                            mediaView.setVisible(false);
                            mediaView.fitWidthProperty().unbind();
                            mediaView.fitHeightProperty().unbind();
                            mediaView.setFitWidth(0);
                            mediaView.setFitHeight(0);
                            imageView.fitWidthProperty().bind(stage.widthProperty());
                            imageView.fitHeightProperty().bind(stage.heightProperty());

                            medium.DelayTillMediumShowDone();
                            break;
                        case VIDEO:
                            final MediaPlayer mediaPlayer = new MediaPlayer(medium.Video);
                            imageView.setImage(null);
                            imageView.fitWidthProperty().unbind();
                            imageView.fitHeightProperty().unbind();
                            imageView.setFitWidth(0);
                            imageView.setFitHeight(0);
                            mediaView.fitWidthProperty().bind(stage.widthProperty());
                            mediaView.fitHeightProperty().bind(stage.heightProperty());
                            imageView.setVisible(false);
                            mediaView.setVisible(true);
                            mediaView.setMediaPlayer(mediaPlayer);
                            mediaPlayer.play();
                            mediaPlayer.setAutoPlay(true);
                            mediaPlayer.setMute(true);

                            // Delay for sometime till it can load Medium Details
                            TimeUnit.MILLISECONDS.sleep(500);
                            medium.DelayTillMediumShowDone();
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
    }


    @Override
    public void start(Stage stage) {
        try {
            RunFXLoginSetup();
            SetupConfiguration();
            SetupMQTT();
            ServerInteractor.DownloadNewFiles(configuration);
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            sqlFiles = new SQLFiles(configuration);
            // Update SQL Files List
            sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
            SetupDisplayThread(stage);
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        imageView.setVisible(false);
        mediaView.setVisible(false);

        // Create the HBox
        HBox root = new HBox();
        // Add Children to the HBox
        root.getChildren().add(imageView);
        root.getChildren().add(mediaView);

        // Set the size of the HBox
        root.setPrefSize(640, 480);

        // Create the Scene
        Scene scene = new Scene(root);

        scene.setOnKeyReleased(keyEvent -> {
            final KeyCode keyCode = keyEvent.getCode();
            // Pressing R Button will Reset the Entire Process
            if (keyCode == KeyCode.R) {
                if (!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Reset?"))
                    return;
                try {
                    ServerInteractor.DeleteDisplay(configuration);
                    Utils.ClearDirectory(configuration.StoragePath);
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
        });

        // Add the scene to the Stage
        stage.setScene(scene);
        stage.setResizable(false);
        // Disable Full Screen during Debugging
//        stage.setFullScreen(true);
        stage.setMaximized(true);
        // Set the title of the Stage
        stage.setTitle(Constants.AppName);
        // Display the Stage
        stage.show();

        stage.setOnCloseRequest((event) -> {
            stage.close();
        });

        displayThread.start();
    }

    @Override
    public void stop() throws Exception {
        super.stop();
        this.sqlFiles.Close();
        mqttClient.disconnect();
        mqttClient.close(true);
        // Stop the Display Loop
        displayThread.interrupt();
        displayThread.join();
        Utils.Terminate();
    }
}
