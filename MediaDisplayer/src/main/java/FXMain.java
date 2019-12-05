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

import java.util.Properties;
import java.util.Vector;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class FXMain extends Application {
    private final ImageView imageView = new ImageView();
    private final MediaView mediaView = new MediaView();

    private int CurrentMedium = 0;
    private SQLFiles sqlFiles;

    private Configuration configuration;
    private MqttClient mqttClient;
    private Thread displayThread;

    private MediaPlayer mediaPlayer;

    private volatile Vector<Medium> media;


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
                    if (msg.equals("DN")) {
                        ServerInteractor.DownloadNewFiles(configuration);
                        // Update SQL Files List
                        sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
                        media = sqlFiles.Load();
                    }
                    // Update Signal Received
                    if (msg.equals("UE")) {
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
                    if (media.isEmpty()) {
                        this.imageView.setVisible(false);
                        this.mediaView.setVisible(false);
                        TimeUnit.SECONDS.sleep(5);
                        continue;
                    }
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

                            TimeUnit.SECONDS.sleep(medium.ShowTime);
                            break;
                        case VIDEO:
                            mediaPlayer = new MediaPlayer(medium.Video);
                            imageView.setImage(null);

                            imageView.fitWidthProperty().unbind();
                            imageView.fitHeightProperty().unbind();
                            imageView.setFitWidth(0);
                            imageView.setFitHeight(0);

                            // Do this to Ensure that Video plays in Same Size as
                            // MediaView Object
                            mediaView.fitWidthProperty().bind(stage.widthProperty());
                            mediaView.fitHeightProperty().bind(stage.heightProperty());

                            mediaView.setMediaPlayer(mediaPlayer);
                            mediaPlayer.play();

                            imageView.setVisible(false);
                            mediaView.setVisible(true);

                            CountDownLatch latch = new CountDownLatch(1);
                            mediaPlayer.setOnEndOfMedia(() -> {
                                latch.countDown();
                            });
                            // Halt till Latch Complete
                            latch.await();
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
                ServerInteractor.DownloadNewFiles(configuration);
                // Update SQL Files List
                sqlFiles.ClearAndInsert(ServerInteractor.GetFileDownloadList(configuration));
                this.media = sqlFiles.Load();
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
