import javafx.application.Application;

public class MainClass {

    public static void main(final String[] args) {
        if (args.length == 1 && args[0] == "reset") {
            PropertiesDeal props = new PropertiesDeal();
            props.deleteProperties();
        }
        Application.launch(FXMain.class, args);
    }
}
