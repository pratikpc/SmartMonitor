
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;
import javafx.animation.KeyFrame;
import javafx.animation.KeyValue;
import javafx.animation.Timeline;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import javafx.util.Duration;

public class FXMain extends Application {

    public static void main(String[] args) {
        Application.launch(args);
    }

    int CurrentImage = 0;
    ImageView imageView = new ImageView();
    //  Timeline timeline = new Timeline();
    Vector<Image> images = new Vector<Image>();

    public void AddImage(String path) {
        images.add(new Image(path));
    }

    public void start(Stage stage) {
        AddImage("file:///C:/Users/Mahesh/Desktop/wat/WhatsApp Image 2019-02-16 at 10.59.13 PM (2).jpeg");
        AddImage("file:///C:/Users/Mahesh/Desktop/wat/WhatsApp Image 2019-02-16 at 11.55.41 PM.jpeg");
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

        //    timeline.play();
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
        stage.setMaximized(true);
        // Set the title of the Stage
        stage.setTitle("Displaying an Image");
        // Display the Stage
        stage.show();
    }
}
