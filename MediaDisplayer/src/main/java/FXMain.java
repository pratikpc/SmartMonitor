import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.HBox;
import javafx.scene.media.MediaPlayer;
import javafx.scene.media.MediaView;
import javafx.stage.Stage;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

import java.io.File;
import java.io.PrintStream;
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
        Utils.CreateDirectoryIfNotExists(this.GetAbsolutePathFromStorage("database"));
        Utils.CreateDirectoryIfNotExists(this.GetAbsolutePathFromStorage("paho"));
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
}

public class FXMain extends Application {
    private final ImageView imageView = new ImageView();
    private final MediaView mediaView = new MediaView();
    private PrintStream errorStream;
    private int CurrentMedium = 0;
    private SQLFiles sqlFiles;

    private Configuration configuration;
    private MqttClient mqttClient;
    private Thread displayThread;

    private MediaPlayer mediaPlayer;

    private void SetupConfiguration() throws Exception {
        configuration = new Configuration(new PropertiesDeal().loadProperties());
    }

    private void SetupMQTT() throws MqttException {
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
                    ex.printStackTrace(errorStream);
                }
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {

            }
        });
    }

    private void RunFXLoginSetup() throws Exception {
        RunFXLoginSetup(null);
    }

    private void RunFXLoginSetup(final Properties props) throws Exception {
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

    private void SetupDisplayThread(final Stage stage) {
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
                            mediaPlayer = new MediaPlayer(medium.Video);
                            imageView.setImage(null);
                            imageView.fitWidthProperty().unbind();
                            imageView.fitHeightProperty().unbind();
                            imageView.setFitWidth(0);
                            imageView.setFitHeight(0);
                            mediaView.fitWidthProperty().bind(stage.widthProperty());
                            mediaView.fitHeightProperty().bind(stage.heightProperty());
                            // Do this to Ensure that Video plays in Same Size as
                            // MediaView Object
                            mediaView.setMediaPlayer(mediaPlayer);
                            mediaPlayer.play();
                            imageView.setVisible(false);
                            mediaView.setVisible(true);

                            // Delay for sometime till it can load Medium Details
                            TimeUnit.MILLISECONDS.sleep(200);
                            medium.DelayTillMediumShowDone();
                            mediaPlayer.stop();
                            break;
                        default:
                            imageView.setVisible(false);
                            mediaView.setVisible(false);
                            break;
                    }
                }
                if (this.mediaPlayer != null) {
                    this.mediaPlayer.stop();
                    this.mediaPlayer.dispose();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); // restore interrupted status
            } catch (Exception ex) {
                ex.printStackTrace(errorStream);
            }
        });
    }


    @Override
    public void start(Stage stage) {
        // Any Error in High Priority Actions indicates Need to Terminate Stage
        try {
            errorStream = new PrintStream(new File("error.txt"));
            RunFXLoginSetup();
            SetupConfiguration();
            SetupMQTT();
            ServerInteractor.DownloadNewFiles(configuration);
            sqlFiles = new SQLFiles(configuration);
            // Update SQL Files List
            sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
            SetupDisplayThread(stage);
        } catch (Exception ex) {
            ex.printStackTrace(errorStream);
            stage.close();
            Platform.exit();
            return;
        }

        imageView.setVisible(false);
        mediaView.setVisible(false);
        mediaView.setPreserveRatio(false);

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
                    CloseConnections();
                    // Stop the Media Player to Ensure Media Files get Cleaned too
                    this.mediaPlayer.stop();
                    this.mediaPlayer.dispose();
                    Utils.ClearDirectory(configuration.StoragePath);
                    PropertiesDeal propertiesDeal = new PropertiesDeal();
                    propertiesDeal.deleteProperties();
                    stage.close();
                } catch (Exception ex) {
                    ex.printStackTrace(errorStream);
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
        stage.setFullScreen(true);
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

    private void CloseConnections() throws Exception {
        if (this.mediaPlayer != null)
            this.mediaPlayer.dispose();
        if (this.sqlFiles != null)
            this.sqlFiles.Close();
        if (this.mqttClient != null && this.mqttClient.isConnected()) {
            this.mqttClient.disconnect();
            this.mqttClient.close(true);
        }
    }

    @Override
    public void stop() throws Exception {
        super.stop();
        // Stop the Display Loop
        if (this.displayThread != null) {
            this.displayThread.interrupt();
            this.displayThread.join();
        }
        CloseConnections();
        Utils.Terminate();
        errorStream.close();
    }
}
