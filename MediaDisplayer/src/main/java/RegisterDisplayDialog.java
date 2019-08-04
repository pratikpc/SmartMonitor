import javafx.beans.binding.Bindings;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.GridPane;
import javafx.stage.DirectoryChooser;

import javax.swing.filechooser.FileSystemView;
import java.io.File;
import java.util.Properties;


public class RegisterDisplayDialog {

    private final TextField username = new TextField();
    private final PasswordField password = new PasswordField();
    private final TextField server = new TextField();
    private final TextArea location = new TextArea();
    private final TextField storageDir = new TextField();
    private final Dialog<Boolean> dialog = new Dialog<>();
    private boolean Done = false;

    private String GetDefaultStorageDirectory() {
        final String homeDir = FileSystemView.getFileSystemView().getDefaultDirectory().getPath();
        return Utils.GetAbsolutePath(homeDir, Constants.AppName);
    }

    private String CreateFileChooser(final String title, final String defaultPath) {

        Utils.CreateDirectoryIfNotExists(defaultPath);
        final DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle(title);
        directoryChooser.setInitialDirectory(new File(defaultPath));
        final File file = directoryChooser.showDialog(null);
        if (file == null)
            return null;
        final String path = file.getAbsolutePath();

        try {
            if (!Utils.IsDirectoryEmpty(path))
                return null;
        } catch (Exception ex) {
            //ex.printStackTrace();
            return null;
        }
        return path;
    }

    private boolean IsTextInputEmpty(final TextInputControl field) {
        return field.getText().trim().isEmpty();
    }

    public void ShowDirSelector() {
        String storageSelected = CreateFileChooser("Select Storage", storageDir.getText());
        if (storageSelected != null)
            storageDir.setText(storageSelected);
    }

    public void Build() {
        dialog.setTitle(Constants.AppName);
        dialog.setHeaderText("Register New Raspberry Pi");

        // Set the icon (must be included in the project).
        //dialog.setGraphic(new ImageView(this.getClass().getResource("login.png").toString()));

        // Set the button types.
        final ButtonType loginButtonType = new ButtonType("Register", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(loginButtonType);

        // Create the username and password labels and fields.
        final GridPane grid = new GridPane();
        grid.setHgap(5);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 80, 10, 10));

        grid.add(new Label("Username:"), 0, 0);
        this.username.setPrefColumnCount(10);
        this.username.setPromptText("Username");
        grid.add(this.username, 1, 0);

        grid.add(new Label("Password:"), 0, 1);
        this.password.setPrefColumnCount(10);
        this.password.setPromptText("Password");
        grid.add(this.password, 1, 1);

        grid.add(new Label("Server:"), 0, 2);
        this.server.setPrefColumnCount(10);
        this.server.setPromptText("Server IP");
        grid.add(this.server, 1, 2);

        grid.add(new Label("Location:"), 0, 3);
        this.location.setPrefRowCount(2);
        this.location.setPrefColumnCount(10);
        this.location.setPromptText("Location");
        grid.add(this.location, 1, 3);

        final Label storageSelect = new Label("Select Storage");
        grid.add(storageSelect, 0, 4);
        this.storageDir.setPrefColumnCount(10);
        this.storageDir.setPromptText("Storage Default");
        this.storageDir.setText(GetDefaultStorageDirectory());
        grid.add(storageDir, 1, 4);
        storageDir.setOnMouseClicked((event) -> ShowDirSelector());
        storageSelect.setOnMouseClicked((event) -> ShowDirSelector());

        final Label errorLabel = new Label("");
        errorLabel.setVisible(false);
        grid.add(errorLabel, 0, 5);

        final Node loginButton = dialog.getDialogPane().lookupButton(loginButtonType);
        loginButton.setDisable(true);
        // Enable/Disable login button depending on whether a username was entered.
        loginButton.disableProperty().bind(Bindings.createBooleanBinding(() ->
                        IsTextInputEmpty(this.username) || IsTextInputEmpty(this.password) || IsTextInputEmpty(this.server) || IsTextInputEmpty(this.location) || IsTextInputEmpty(this.storageDir)
                , this.username.textProperty(), this.password.textProperty(), this.location.textProperty(), this.server.textProperty(), this.storageDir.textProperty()));

        // Update Properties when Login Clicked
        loginButton.addEventFilter(
                ActionEvent.ACTION,
                event -> {
                    // Check whether some conditions are fulfilled
                    if (!loginButton.isDisabled()) {
                        final String Name = this.username.getText().trim();
                        final String Password = this.password.getText().trim();
                        final String Server = this.server.getText().trim();
                        final String Location = this.location.getText().trim();
                        final String StoragePath = this.storageDir.getText().trim();
                        try {
                            Utils.CreateDirectoryIfNotExists(StoragePath);
                            if (!Utils.IsDirectoryEmpty(StoragePath)) {
                                errorLabel.setVisible(true);
                                errorLabel.setText("Error Occurred. Folder Not Empty");
                            } else {
                                errorLabel.setVisible(false);
                                this.Done = ServerInteractor.CreateNewRasPi(Name, Password, Location, Server, StoragePath);
                                return;
                            }
                        } catch (Exception ex) {
                            // ex.printStackTrace();
                        }
                    }
                    this.Done = false;
                    errorLabel.setVisible(true);
                    errorLabel.setText("Error Occurred");

                    // The conditions are not fulfilled so we consume the event
                    // to prevent the dialog to close
                    event.consume();
                }
        );

        dialog.setOnCloseRequest(
                (dialogEvent) -> {
                    if (!this.Done && Utils.CreateConfirmationDialog(Constants.AppName, "Are you sure you want to Terminate")) {
                        dialog.close();
                        Utils.Terminate();
                    }
                }
        );

        dialog.getDialogPane().setContent(grid);

        // Update Properties when Login Clicked
        dialog.setResultConverter(dialogButton -> Done);
    }

    public void Assign(Properties props) {
        if (props == null)
            return;

        String StoragePath = props.getProperty("StoragePath");
        String Location = props.getProperty("Name");
        String server = props.getProperty("URLWeb");

        this.storageDir.setText(StoragePath);
        this.location.setText(Location);
        this.server.setText(server);
    }

    // Returns True on Success
    public boolean Show() {
        return dialog.showAndWait().orElse(false);
    }
}