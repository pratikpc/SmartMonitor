import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.HBox;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import javafx.scene.media.MediaView;
import javafx.stage.Stage;
import org.eclipse.paho.client.mqttv3.*;

import java.util.Properties;
import java.util.Vector;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class FXMain extends Application {
    private MediaView mediaView = new MediaView();

    private int CurrentMedium = 0;
    private SQLFiles sqlFiles;

    private Configuration configuration;
    private MqttClient mqttClient;
    private Thread displayThread;

    private MediaPlayer mediaPlayer;

    private volatile Vector<String> media;


    public static void main(String[] args) {
        launch(args);
    }

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
                    // Update Signal Received
                    if (msg.equals("DN") || msg.equals("UE")) {
                        // Update SQL Files List
                        sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
                        media = sqlFiles.Load();
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
                    this.media = sqlFiles.Load();
                    if (media.isEmpty()) {
                        TimeUnit.SECONDS.sleep(5);
                        continue;
                    }
                    String mediumUrl = media.elementAt(CurrentMedium);
                    Media medium = new Media(mediumUrl);
                    this.mediaPlayer = new MediaPlayer(medium);
                    mediaView.setMediaPlayer(this.mediaPlayer);
                    this.mediaPlayer.play();

                    System.out.println("333 " + mediumUrl);

                    CountDownLatch latch = new CountDownLatch(1);
                    this.mediaPlayer.setOnEndOfMedia(() -> {
                        System.out.println("33322");
                        latch.countDown();
                    });
                    // Halt till Latch Complete
                    latch.await();

                    // Use this to Iterate over positions
                    if (CurrentMedium >= media.size())
                        CurrentMedium = 0;
                    else
                        CurrentMedium = (CurrentMedium + 1) % media.size();
                }
                if (this.mediaPlayer != null) {
                    this.mediaPlayer.stop();
                    this.mediaPlayer.dispose();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); // restore interrupted status
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        });
    }

    @Override
    public void start(Stage stage) {
        // Any Error in High Priority Actions indicates Need to Terminate Stage
        try {
            RunFXLoginSetup();
            SetupConfiguration();
            SetupMQTT();
            sqlFiles = new SQLFiles(configuration);
            if (ServerInteractor.ValidateDisplay(configuration)) {
                // Update SQL Files List
                sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
            } else {
                this.configuration.Delete();
                throw new Exception("No such display exists");
            }
            SetupDisplayThread(stage);
        } catch (Exception ex) {
            ex.printStackTrace();
            stage.close();
            Platform.exit();
            return;
        }

        // Do this to Ensure that Video plays in Same Size as
        // MediaView Object
        mediaView.fitWidthProperty().bind(stage.widthProperty());
        mediaView.fitHeightProperty().bind(stage.heightProperty());

        mediaView.setVisible(true);

        // Create the HBox
        HBox root = new HBox();
        // Add Children to the HBox
        root.getChildren().add(mediaView);

        // Set the size of the HBox
        root.setPrefSize(640, 480);

        // Create the Scene
        Scene scene = new Scene(root);

        scene.setOnKeyReleased(keyEvent -> {
            final KeyCode keyCode = keyEvent.getCode();
            if (keyCode == KeyCode.X || keyCode == KeyCode.ESCAPE) {
                if (!Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Exit?"))
                    return;
                stage.close();
                Platform.exit();
            }
        });

        // Add the scene to the Stage
        stage.setScene(scene);
        stage.setResizable(false);
        // Disable Full Screen during Debugging
        // stage.setFullScreen(true);
        // stage.setMaximized(true);
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
        if (this.mediaPlayer != null) {
            this.mediaPlayer.stop();
            this.mediaPlayer.dispose();
        }
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
        try {
            // Stop the Display Loop
            if (this.displayThread != null) {
                this.displayThread.interrupt();
                this.displayThread.join();
            }
            CloseConnections();
            Utils.Terminate();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
